# Expenses — Diseño Fase 4: Deudas por cobrar y por pagar

Fecha: 2026-09-19
Estado: Aprobado para implementación (instrucción del usuario: continuar Fase 4)

## Objetivo

Registrar **deudas por cobrar** (dinero prestado a alguien) y **deudas por pagar**
(dinero que se debe), con pagos/abonos. La fecha de pago puede ser fija o no.

## Decisiones

- Una deuda tiene: tipo (`RECEIVABLE` por cobrar / `PAYABLE` por pagar),
  contraparte (nombre), monto, moneda (`MXN|USD`), fecha, **fecha límite
  opcional**, notas y estado archivado.
- **Abonos** (`DebtPayment`) reducen el saldo. `remaining = amount − Σ abonos`.
  El estado es derivado: `SETTLED` cuando `remaining <= 0`, si no `OPEN`.
- Si un abono indica una **cuenta**, se crea un movimiento ligado y se ajusta el
  saldo con `balanceDelta`: **EXPENSE** para deuda por pagar (sale dinero),
  **INCOME** para deuda por cobrar (entra dinero). Sin cuenta, solo se registra
  el abono (el usuario registra el movimiento aparte).
- Borrar un abono borra su movimiento ligado y revierte el saldo.
- No se permiten abonos que excedan el saldo pendiente (400).
- Moneda de la deuda puede ser USD; el frontend convierte a MXN con la tasa de
  Fase 3 para los totales.
- Deudas se **archivan**, no se borran físicamente.

## Modelo (Prisma)

```prisma
enum DebtType { RECEIVABLE PAYABLE }

model Debt {
  id           String        @id @default(uuid())
  type         DebtType
  counterparty String
  amount       Decimal       @db.Decimal(12, 2)
  currency     Currency      @default(MXN)
  date         DateTime      @db.Date
  dueDate      DateTime?     @db.Date
  notes        String?
  archived     Boolean       @default(false)
  payments     DebtPayment[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  @@index([type, archived])
}

model DebtPayment {
  id            String       @id @default(uuid())
  debtId        String
  debt          Debt         @relation(fields: [debtId], references: [id])
  amount        Decimal      @db.Decimal(12, 2)
  date          DateTime     @db.Date
  accountId     String?
  account       Account?     @relation(fields: [accountId], references: [id])
  transactionId String?      @unique
  transaction   Transaction? @relation(fields: [transactionId], references: [id])
  notes         String?
  createdAt     DateTime     @default(now())
  @@index([debtId])
}
```

Relaciones inversas en `Account.debtPayments` y `Transaction.debtPayment`.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/debts?includeArchived&type` | Lista con `paid`, `remaining`, `status` |
| POST | `/debts` | Crea deuda |
| PUT | `/debts/:id` | Edita deuda |
| DELETE | `/debts/:id` | Archiva |
| GET | `/debts/:id/payments` | Abonos de la deuda |
| POST | `/debts/:id/payments` | Registra abono (crea movimiento si hay cuenta) |
| DELETE | `/debts/:id/payments/:paymentId` | Elimina abono y su movimiento |

## Frontend (mobile-first)

- **Página Deudas** (`/deudas`), accesible desde **Más**:
  - Tabs/segmentos **Por cobrar / Por pagar**.
  - Tarjetas con contraparte, monto, saldo pendiente, fecha límite (si hay),
    progreso de pago y botón "Abonar".
  - Bottom-sheet para crear/editar deuda (tipo, contraparte, monto, moneda,
    fecha, fecha límite opcional, notas).
  - Bottom-sheet de abono (monto, fecha, cuenta opcional, notas).
- **Inicio**: tarjeta "Deudas por pagar" y "Por cobrar" (convertidas a MXN).
- Invalida `"debts"`, `"accounts"` y `["transactions", month, year]` tras mutar.

## Criterios de aceptación

1. CRUD de deudas con tipo, contraparte, monto, moneda, fecha y fecha límite
   opcional; archivar.
2. Abonos reducen `remaining` y derivan `SETTLED`; abono excedente → 400.
3. Abono con cuenta crea el movimiento ligado y ajusta el saldo; borrar lo
   revierte.
4. Página Deudas funcional y entrada en Más; totales en Inicio.
5. Suites y builds en verde.

## No incluye

- Intereses/morosidad sobre deudas.
- Recordatorios/notificaciones.
- Dashboard completo de Fase 5 (presupuesto mensual).
