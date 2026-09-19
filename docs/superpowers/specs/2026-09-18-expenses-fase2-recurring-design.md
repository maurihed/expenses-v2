# Expenses — Diseño Fase 2: Motor de recurrentes, intereses y MSI

Fecha: 2026-09-18
Estado: Aprobado para implementación (instrucción explícita del usuario de
implementar sin gate de confirmación)

## 1. Objetivo

Automatizar los movimientos que ocurren periódicamente y manejar el crédito a
meses:

1. **Suscripciones** que se descuentan automáticamente al llegar su fecha.
2. **Ingresos recurrentes** (p. ej. salario).
3. **Intereses** que genera una cuenta por tener saldo, con tramos y tasas
   distintas por tramo.
4. **Compras a meses (MSI)** en tarjetas de crédito: la deuda total se reconoce
   al momento, pero solo una parte vence cada periodo.

## 2. Decisiones de diseño

- **Motor determinista + scheduler ligero.** El núcleo es
  `RecurringService.runDue(asOf: Date)`: materializa los movimientos vencidos
  hasta `asOf` de forma **idempotente**. Un `RecurringScheduler` ligero
  (`setInterval` cada 60 min, sin dependencia nueva) llama `runDue(new Date())`
  al arrancar y periódicamente. Se expone `POST /recurring/run` para disparo
  manual/pruebas.
- **Idempotencia** con `RecurringOccurrence` y unique `(ruleId, date)`. Re-ejecutar
  no duplica.
- **Intereses por tramos marginales**: el saldo de la cuenta se reparte en
  tramos `{ upTo, annualRate }`; el interés del periodo es
  `Σ porciónDelTramo × (annualRate / 12)` redondeado a 2 decimales. Los tramos
  son marginales (como ISR): el primer tramo cubre hasta `upTo`, el siguiente
  el excedente, y el último (`upTo: null`) el resto.
- **MSI**: una compra a `n` meses es **un** movimiento EXPENSE en la cuenta de
  crédito por el total (la deuda sube completa). Además se crea un
  `InstallmentPlan` con `n` `Installment` (fechas y montos). El
  `credit-summary` calcula `periodPayment` sumando cargos normales del periodo
  **más las mensualidades MSI que vencen en el periodo**, y expone
  `msiCommitted` (mensualidades futuras). La deuda total ya incluye el MSI.
- **Sin nuevas dependencias backend** salvo las ya presentes.
- **Mobile-first** en todo lo visual (regla no negociable de fases previas).
- **Zona horaria**: fechas como días calendario en `America/Mexico_City`
  (misma convención que Fase 0/1). El scheduler opera con `asOf` y el core
  normaliza a día calendario.

## 3. Modelo de datos (Prisma)

```prisma
enum RecurringType { SUBSCRIPTION INCOME INTEREST }
enum RecurringFrequency { WEEKLY BIWEEKLY MONTHLY }

model RecurringRule {
  id             String             @id @default(uuid())
  name           String
  type           RecurringType
  accountId      String
  account        Account            @relation(fields: [accountId], references: [id])
  categoryId     String?
  category       Category?          @relation(fields: [categoryId], references: [id])
  scope          Scope              @default(JOINT)
  personId       String?
  person         Person?            @relation(fields: [personId], references: [id])
  amount         Decimal?           @db.Decimal(12, 2) // subscription/income
  frequency      RecurringFrequency @default(MONTHLY)
  dayOfMonth     Int?               // MONTHLY (1-31, clampeado)
  dayOfWeek      Int?               // WEEKLY/BIWEEKLY (0=domingo)
  startDate      DateTime           @db.Date
  endDate        DateTime?          @db.Date
  nextRunDate    DateTime           @db.Date
  lastRunDate    DateTime?          @db.Date
  interestTiers  Json?              // [{ upTo: number|null, annualRate: number }]
  active         Boolean            @default(true)
  occurrences    RecurringOccurrence[]
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  @@index([active, nextRunDate])
}

model RecurringOccurrence {
  id            String        @id @default(uuid())
  ruleId        String
  rule          RecurringRule @relation(fields: [ruleId], references: [id])
  date          DateTime      @db.Date
  amount        Decimal       @db.Decimal(12, 2)
  transactionId String?
  transaction   Transaction?  @relation(fields: [transactionId], references: [id])
  createdAt     DateTime      @default(now())
  @@unique([ruleId, date])
}

model InstallmentPlan {
  id            String        @id @default(uuid())
  accountId     String
  account       Account       @relation(fields: [accountId], references: [id])
  transactionId String        @unique
  transaction   Transaction   @relation(fields: [transactionId], references: [id])
  totalAmount   Decimal       @db.Decimal(12, 2)
  installments  Int
  startDate     DateTime      @db.Date
  installments_ Installment[]
  createdAt     DateTime      @default(now())
}

model Installment {
  id      String          @id @default(uuid())
  planId  String
  plan    InstallmentPlan @relation(fields: [planId], references: [id])
  number  Int
  dueDate DateTime        @db.Date
  amount  Decimal         @db.Decimal(12, 2)
  @@unique([planId, number])
}
```

Cambios a modelos existentes:
- `Transaction`: `installments Int?` (solo EXPENSE en CREDIT) y relación
  inversa con `InstallmentPlan` y `RecurringOccurrence`.
- `Account`, `Category`, `Person`: relaciones inversas de `RecurringRule`.
- `Account`: relación inversa de `InstallmentPlan`.

## 4. API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/recurring` | Lista reglas (`?active`, `?includeInactive`) |
| POST | `/recurring` | Crea regla |
| PUT | `/recurring/:id` | Actualiza regla |
| DELETE | `/recurring/:id` | Desactiva (`active=false`); no borra historial |
| POST | `/recurring/run` | Ejecuta `runDue(now)` y devuelve `{ created, skipped }` |

`GET /accounts/:id/credit-summary` se amplía con `msiCommitted`.

`POST /transactions` (EXPENSE en cuenta CREDIT) acepta `installments?: number`
(2–48). Crea el plan y sus mensualidades.

## 5. Lógica

### Materialización (`runDue(asOf)`)
Para cada regla `active` con `nextRunDate <= asOf` y (`endDate` nulo o
`nextRunDate <= endDate`), mientras `nextRunDate <= asOf`:
- **SUBSCRIPTION**: crea Transaction EXPENSE con `amount` en `accountId`,
  `categoryId`, `scope`/`personId`, `date = nextRunDate`. Ajusta el saldo con
  `balanceDelta` (restando en la cuenta).
- **INCOME**: crea Transaction INCOME con `amount`. Ajusta saldo sumando.
- **INTEREST**: calcula `computeInterest(account.balance, tiers)`; si `> 0`,
  crea Transaction INCOME con ese monto y actualiza saldo. Interés solo MONTHLY.
- Registra `RecurringOccurrence(ruleId, date, amount, transactionId)`.
- Avanza `nextRunDate` a la siguiente ocurrencia y actualiza `lastRunDate`.

Todo dentro de `prisma.$transaction`. Idempotencia: si ya existe la ocurrencia
`(ruleId, date)`, se salta (no duplica ni recalcula).

### Interés por tramos
`computeInterest(balance, tiers)`:
- Ordena tramos por `upTo` ascendente (el `null`/último al final).
- `prev = 0`; para cada tramo: `cap = upTo ?? Infinity`;
  `portion = max(0, min(balance, cap) - prev)`; `interest += portion * rate/12`;
  `prev = cap`; corta si `balance <= prev`.
- Redondea a 2 decimales. Si no hay tramos, interés 0.

### MSI
- Validar `installments >= 2` y `type=expense` y `account.type=CREDIT`.
- El movimiento guarda el **total** como `amount`; la deuda sube completa.
- Genera `n` mensualidades mensuales desde `startDate` (día = de la fecha de
  compra): `base = round(total/n, 2)`; las primeras `n-1` con `base` y la
  última `total - base*(n-1)`.
- Editar/borrar el movimiento MSI elimina el plan y regenera.

### credit-summary con MSI
- `periodPayment` = (cargos EXPENSE no-MSI en el periodo) + (mensualidades MSI
  con `dueDate` en el periodo) − (pagos en el periodo), mínimo 0.
- `msiCommitted` = suma de mensualidades con `dueDate` posterior al corte actual.
- `totalDebt = balance` (ya incluye el total MSI).

## 6. Frontend (mobile-first)

- **Sección/página "Recurrentes"** en `/expenses`: lista de reglas con tipo,
  cuenta, monto, frecuencia, próxima fecha y estado; alta/edición en
  bottom-sheet; activar/desactivar; botón "Ejecutar ahora".
- **Suscripciones e ingresos**: monto fijo, cuenta, categoría (suscripción),
  alcance conjunto/personal, frecuencia y fechas.
- **Intereses**: editor de tramos (monto/`null` + tasa anual), cuenta y
  frecuencia mensual; vista previa del interés estimado con el saldo actual.
- **Modal de movimiento**: para gasto en cuenta de crédito, selector
  "Meses sin intereses" (1 = normal, 2–48). Muestra la mensualidad estimada.
- **Resumen de crédito**: muestra `periodPayment`, `totalDebt`, `available` y
  `msiCommitted`.
- Se reutilizan servicios/hooks/patrones de Fase 1 (`parseJsonResponse`,
  React Query v3, `DrawerSelector`, design system).

## 7. Testing

- **Backend (TDD)**: unit para `nextOccurrence`/`computeInterest`/reparto MSI;
  e2e para CRUD de recurrentes, `runDue` idempotente (segunda corrida no
  duplica), interés por tramos, MSI (plan + `credit-summary`), y desactivación.
- **Frontend**: build + lint (sin runner), revisión estática 375px.

## 8. Alcance

### Incluye
Motor de recurrentes (suscripciones, ingresos, intereses), MSI, endpoints,
scheduler ligero, y UI mobile-first de ambas cosas.

### No incluye
- Inversiones multi-divisa y tipo de cambio USD (Fase 3).
- Deudas por cobrar/pagar (Fase 4).
- Dashboard y presupuesto mensual (Fase 5).
- Edición retroactiva de ocurrencias ya materializadas (se manejan como
  movimientos normales).

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Duplicar movimientos al re-ejecutar | unique `(ruleId, date)` + test idempotente |
| Scheduler no corre (VPS) | `runDue` al arrancar + `POST /recurring/run` manual |
| Interés mal calculado en tramos | unit tests con tramos y bordes |
| MSI y `periodPayment` inconsistente | e2e de `credit-summary` con MSI |
| Timezone en fechas | día calendario `America/Mexico_City`, mismo criterio que Fase 0 |
