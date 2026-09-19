# Expenses — Diseño Fase 0 + Fase 1

Fecha: 2026-09-18
Estado: Aprobado para implementación

## 1. Contexto y objetivo

`expenses-v2` es una app mobile-first para llevar el control de gastos de un
matrimonio. Hoy permite agregar, modificar y eliminar movimientos sobre cuentas
sembradas en MongoDB, sin autenticación. El objetivo es convertirla en un sistema
de finanzas de pareja completo: cuentas con tipos, presupuesto personal,
recurrentes, inversiones, deudas y un dashboard.

El frontend actual está en React 19 + Vite + react-router v7 + React Query v3 +
zustand + shadcn + Chart.js.

El backend actual (`express/expenses-api`) es una API en **Go + Chi + MongoDB
Atlas** (a pesar del nombre de la carpeta). Solo tiene CRUD de `accounts` y
`transactions`, sin usuarios reales (todo filtrado por el literal `"PENDING"`),
sin índices, sin tests, y con una capa Postgres/gorilla-mux muerta.

**Decisión:** reescribir el backend como **NestJS + Prisma + PostgreSQL** **en el
mismo repositorio** (`express/expenses-api`), reemplazando el código Go,
manteniendo el mismo contrato REST para que el frontend solo cambie la URL base.
Antes de reemplazar, preservar el estado actual en una rama/tag de git como
respaldo.

## 2. Alcance

### Incluye (este ciclo)
- **Fase 0 — Fundación:** proyecto NestJS + Prisma + PostgreSQL, paridad
  funcional con las rutas actuales de cuentas y movimientos, migración completa
  de datos de Mongo a Postgres, y despliegue en Docker sobre el VPS.
- **Fase 1 — Núcleo del dominio:** cuentas con tipos/moneda/crédito y borrado
  suave; categorías dinámicas; personas y presupuesto personal semanal
  acumulable; transferencias y botón "Pagar tarjeta"; cálculo de saldos en el
  backend; y `scope` conjunto/personal en los movimientos.

### No incluye (ciclos posteriores)
- **Fase 2:** motor de pagos programados — suscripciones, ingresos recurrentes
  (salario), intereses por tramos/tasas y compras a meses (MSI).
- **Fase 3:** cuentas de inversión en otra divisa y obtención del tipo de cambio
  USD desde una API pública.
- **Fase 4:** cuentas por cobrar (préstamos otorgados) y cuentas por pagar
  (deudas propias), con o sin fecha fija.
- **Fase 5:** dashboard/pantalla principal (dinero total, deuda actual, dinero en
  inversiones, categorías con más gasto, últimos movimientos, presupuesto
  mensual y consumido).

## 3. Decisiones confirmadas

1. Enfoque **B**: capas/repositorios/servicios limpios desde el inicio.
2. Backend nuevo **NestJS + Prisma + PostgreSQL**; mismo contrato REST.
3. Postgres **self-hosted en Docker** en el VPS, con volumen persistente y backup.
4. **Sin autenticación** por ahora; un único "espacio" de pareja.
5. Migración **completa** de datos Mongo → Postgres.
6. **Mobile-first** como regla de diseño no negociable.
7. Design system generado con la skill **`ui-ux-pro-max`**, con **rosa `#F8359B`
   como color primario**.
8. **Tipografía:** una fuente global para UI general y una fuente por sección
   cuando aporte valor; máximo 3 familias en total.
9. Dinero con precisión exacta (`numeric(12,2)`), expuesto como número en JSON.
10. Las cuentas se **archivan** (soft delete); las categorías también.

## 4. Nota importante: mobile-first

> **Todo el diseño debe enfocarse a mobile.** Navegación inferior, acciones al
> alcance del pulgar, listas verticales en lugar de tablas anchas, selectores en
> bottom-sheet (vaul), formularios de una columna, gráficas dimensionadas para
> pantallas chicas y uso PWA. Ninguna decisión de UI puede asumir escritorio.

Criterio base de validación: sin scroll horizontal a 375px, y todo control
operable con una mano.

## 5. Arquitectura

### Backend (in-place)
- Repositorio: `/Users/mauriciojesushernndezdiaz/Documents/projects/express/expenses-api`
  (convertido en sitio a NestJS; se elimina el código Go).
- NestJS (TypeScript) + Prisma + PostgreSQL.
- DTOs con `class-validator` / `class-transformer`.
- Configuración con `@nestjs/config`.
- Prefijo global `/api/v1`.
- CORS con los orígenes actuales:
  `https://expenses-peach.vercel.app`, `https://expenses-v2-jet.vercel.app`,
  `https://expenses.maurihed.com`, `http://localhost:5174`.
- Módulos: `prisma`, `health`, `accounts`, `transactions`, `categories`,
  `persons`.
- Transferencias dentro de `transactions` (`type = TRANSFER`).
- Serialización de `Decimal` a número (interceptor global).

### Frontend (sin reescritura)
- Cambiar `VITE_GO_BASE_URL` por `VITE_API_BASE_URL` apuntando al nuevo backend.
- Conservar React Query v3, zustand, shadcn y vaul.
- Añadir las pantallas y campos de Fase 1 siguiendo el design system.

### Regla de integridad
Los saldos (de cuenta y personal) se recalculan en la capa de servicio dentro de
`prisma.$transaction` en cada creación/edición/borrado de movimientos. El
frontend nunca envía saldos calculados.

## 6. Modelo de datos (Prisma)

```prisma
enum AccountType { CASH DEBIT CREDIT INVESTMENT }
enum Currency    { MXN USD }
enum TxType      { INCOME EXPENSE TRANSFER }
enum Scope       { JOINT PERSONAL }

model Person {
  id                String               @id @default(uuid())
  name              String
  weeklyAllowance   Decimal              @default(300) @db.Decimal(12, 2)
  allowanceStartDate DateTime            @db.Date
  active            Boolean              @default(true)
  transactions      Transaction[]
  adjustments       PersonalAdjustment[]
  createdAt         DateTime             @default(now())
}

model Category {
  id           String        @id @default(uuid())
  name         String        @unique
  icon         String?
  color        String?
  archived     Boolean       @default(false)
  transactions Transaction[]
}

model Account {
  id                  String       @id @default(uuid())
  name                String
  type                AccountType
  currency            Currency     @default(MXN)
  openingBalance      Decimal      @default(0) @db.Decimal(12, 2)
  balance             Decimal      @default(0) @db.Decimal(12, 2) // deuda actual si CREDIT
  creditLimit         Decimal?     @db.Decimal(12, 2)
  statementClosingDay Int?         // día de corte (1-31)
  paymentDueDay       Int?         // día límite de pago (1-31)
  archived            Boolean      @default(false)
  legacyMongoId       String?      @unique
  transactions        Transaction[]
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Transaction {
  id            String      @id @default(uuid())
  accountId     String
  account       Account     @relation(fields: [accountId], references: [id])
  amount        Decimal     @db.Decimal(12, 2)
  type          TxType
  categoryId    String?
  category      Category?   @relation(fields: [categoryId], references: [id])
  date          DateTime    @db.Date
  description   String
  scope         Scope       @default(JOINT)
  personId      String?
  person        Person?     @relation(fields: [personId], references: [id])
  toAccountId   String?     // sólo TRANSFER
  legacyMongoId String?     @unique
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([accountId, date])
  @@index([accountId])
  @@index([date])
}

model PersonalAdjustment {
  id        String   @id @default(uuid())
  personId  String
  person    Person   @relation(fields: [personId], references: [id])
  amount    Decimal  @db.Decimal(12, 2) // positivo suma, negativo resta
  reason    String
  date      DateTime @db.Date
  createdAt DateTime @default(now())
}
```

### Notas del modelo
- `Person` se siembra con dos registros: **Mauricio** y **Maria** (editables:
  nombre, monto semanal, fecha de inicio). Monto semanal por defecto: **$300
  MXN**. La semana inicia **domingo**.
- `Account.balance` representa: saldo disponible para `CASH`/`DEBIT`/`INVESTMENT`
  y **deuda actual** (positiva = se debe) para `CREDIT`. En `CREDIT`,
  `openingBalance` es la deuda inicial y `balance = openingBalance + compras −
  pagos/abonos`.
- `Transaction.toAccountId` sólo aplica a transferencias (`accountId` = origen).
- `legacyMongoId` conserva el `_id` original de Mongo para trazabilidad.

## 7. API

### Fase 0 — paridad (mismas formas JSON que hoy)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/accounts` | Lista de cuentas |
| GET | `/accounts/:id` | Cuenta por id |
| POST | `/accounts` | Crea cuenta |
| PUT | `/accounts/:id` | Actualiza cuenta |
| GET | `/transactions?month&year` | Movimientos del mes |
| POST | `/transactions` | Crea movimiento |
| PUT | `/transactions/:id` | Actualiza movimiento |
| DELETE | `/transactions/:id` | Elimina movimiento |

### Fase 1 — nuevo
- `GET/POST/PUT/DELETE /categories` (DELETE = archivar).
- `GET /persons`, `PUT /persons/:id` (nombre, monto semanal, fecha inicio).
- `GET /persons/:id/summary` → `{ accrued, adjustmentTotal, spent, balance }`.
- `POST /persons/:id/adjustments` → alta de ajuste manual.
- `DELETE /accounts/:id` (archiva, no borra físicamente).
- `GET /accounts?includeArchived=true`.
- `GET /accounts/:id/credit-summary` → `{ totalDebt, periodPayment, available }`.
- `POST /transactions` y `PUT /transactions/:id` aceptan `type = TRANSFER` con
  `toAccountId`, más `scope` y `personId`.

## 8. Lógica de negocio

### Saldo real de cuenta
- `CASH` / `DEBIT` / `INVESTMENT`:
  `balance = openingBalance + Σ income − Σ expense ± transferencias`.
- `CREDIT`: la deuda sube con compras y baja con pagos (transferencias entrantes
  o abonos). No hay `openingBalance` "negativo"; la deuda se expresa positiva.
- Transferencia: origen `−amount`; destino `+amount`, salvo destino `CREDIT`, que
  reduce deuda.
- Editar/eliminar un movimiento revierte su efecto y aplica el nuevo, dentro de
  la misma transacción de base de datos.

### Presupuesto personal
- `accrued = semanasTranscurridas(allowanceStartDate, hoy) × weeklyAllowance`.
- `spent = Σ gastos con scope = PERSONAL y personId`.
- `balance = accrued + Σ adjustments − spent`.
- Cálculo perezoso en lectura (sin job) durante Fase 1.

### Resumen de crédito
- `totalDebt = balance` (deuda actual completa, incluidos cargos futuros si los
  hubiera).
- `periodPayment`: monto del periodo según `statementClosingDay` (cargos hasta el
  corte menos pagos).
- `available = creditLimit − totalDebt` (si hay límite).

## 9. Design System y Frontend

### Design system
- Generar con la skill `ui-ux-pro-max`:
  `search.py "<personal finance mobile app couple shared budget>" --design-system --persist -p "Expenses"`.
- Persistir `design-system/MASTER.md` y overrides por página
  (`pages/cuentas.md`, `pages/movimientos.md`, `pages/personas.md`,
  `pages/categorias.md`, `pages/dashboard.md` en Fase 5).
- Búsquedas de apoyo: `--stack shadcn`, `--domain chart`, `--domain ux`.
- Aplicar tokens a Tailwind 4 y a las variables de shadcn (`--primary`, `--ring`,
  etc.), en claro y oscuro.

### Color
- **Primario rosa `#F8359B`** conservado, con escala completa y contraste WCAG AA
  en ambos temas.

### Tipografía
- **Global (MASTER):** una familia para navegación, etiquetas y texto general.
- **Por sección:** cada override de página puede elegir una fuente para títulos
  y/o cifras cuando aporte.
- Límite de **3 familias** en total; `font-display: swap`; `tabular-nums` en
  importes.

### Pantallas de Fase 1
- **Cuentas:** lista de tarjetas verticales; bottom-sheet de crear/editar (tipo,
  moneda, límite, día de corte, día de pago); tarjeta de crédito con deuda total,
  pago del periodo y disponible, más botón **"Pagar tarjeta"** que abre un
  bottom-sheet para elegir la cuenta origen.
- **Categorías:** lista + bottom-sheet de crear/editar/archivar.
- **Personas:** dos tarjetas con monto semanal, disponible y gastado; botón de
  ajuste.
- **Movimientos:** el modal agrega el toggle **Conjunto / Personal de X** y el
  tipo transferencia; las categorías provienen de la API.

## 10. Migración de datos (Mongo → Postgres)

- Script TypeScript único que usa el driver de MongoDB y Prisma.
- Migra: cuentas, categorías (derivadas de los valores existentes), dos personas
  sembradas y todos los movimientos históricos.
- Para cada cuenta: `openingBalance = saldoActual − efectoNeto(movimientos
  migrados)` para que el recálculo en backend no duplique.
- Guarda `legacyMongoId` en cuentas y movimientos.
- Convierte fechas `YYYY-MM-DD` a `date`.
- Valida conteos y suma de saldos antes de dar la migración por buena.

## 11. Infraestructura y despliegue

- `docker-compose.yml` con servicios `api` (NestJS) y `postgres` (volumen
  persistente).
- Backup periódico de Postgres (`pg_dump` programado).
- Secrets por `.env` fuera del control de versiones.
- El frontend en Vercel sólo cambia la base URL.

## 12. Testing

- **Backend (TDD):** tests unitarios Jest para saldos de cuenta, presupuesto
  personal y resumen de crédito; tests e2e de endpoints contra un Postgres de
  prueba en Docker.
- **Frontend:** hoy no hay runner. Se propone Vitest + Testing Library como
  mejora aparte (no bloquea Fase 0/1).

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Diferencia de precisión (`int`/`float` en Mongo → `numeric`) | Tests unitarios y validación de conteos en la migración |
| Cálculo de `openingBalance` incorrecto | Validar que saldo migrado == saldo recalculado |
| Pago de tarjeta cambia el modelo de saldos | Pruebas e2e de transferencias y crédito |
| Tipografía por sección afecta performance | Límite de 3 familias + `font-display: swap` |
| Regresión visual en el front | Checklist mobile de la skill a 375px |

## 14. Roadmap de fases

- **Fase 0:** fundación NestJS + Prisma + Postgres, paridad, migración, deploy.
- **Fase 1:** núcleo del dominio (este documento).
- **Fase 2:** recurrentes, intereses y MSI.
- **Fase 3:** inversiones + tipo de cambio USD.
- **Fase 4:** deudas por cobrar y por pagar.
- **Fase 5:** dashboard y presupuesto mensual.

## 15. Criterios de aceptación — Fase 0

1. El frontend actual funciona contra el backend NestJS cambiando la URL base y
   quitando el ajuste de saldo en cliente (el backend pasa a calcular el saldo).
2. Cuentas y movimientos migrados; los saldos coinciden con Mongo.
3. CRUD de cuentas y movimientos con las mismas formas JSON.
4. Levanta con `docker compose up` en el VPS.
5. Tests de paridad en verde.

## 16. Criterios de aceptación — Fase 1

1. CRUD de cuentas con tipo, moneda y campos de crédito; archivar en vez de
   borrar.
2. Categorías dinámicas con archivar; los movimientos existentes conservan su
   categoría.
3. Dos personas con presupuesto semanal acumulable, ajustes e historial.
4. Transferencias y botón "Pagar tarjeta" funcionando, con saldos correctos.
5. Los movimientos distinguen conjunto vs. personal.
6. Design system persistido aplicado con rosa primario y tipografía por sección.
7. Todo validado a 375px sin scroll horizontal.

## 17. Parámetros resueltos

- Backend: repositorio `express/expenses-api`, conversión in-place a NestJS.
- Personas: **Mauricio** y **Maria**.
- Inicio de semana: **domingo**.
- Monto semanal por defecto: **$300 MXN**.
