# Expenses Fase 0 — Backend NestJS + Prisma + Postgres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la API Go por NestJS + Prisma + PostgreSQL en el mismo repositorio, con paridad funcional y migración completa de datos de Mongo.

**Architecture:** Backend NestJS modular (`accounts`, `transactions`, `categories`, `persons`, `prisma`, `health`) sobre PostgreSQL vía Prisma. El saldo de cada cuenta lo calcula el backend. El frontend conserva su contrato REST y deja de ajustar saldos en cliente.

**Tech Stack:** Node.js 22, pnpm, NestJS 10, Prisma 5, PostgreSQL 16, Jest + Supertest, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-18-expenses-fase0-fase1-design.md`

## Global Constraints

- Mobile-first en todo lo visual (regla no negociable).
- Backend en `/Users/mauriciojesushernndezdiaz/Documents/projects/express/expenses-api` (in-place; eliminar Go).
- Prefijo global `/api/v1`. Sin autenticación, un solo espacio de pareja.
- Dinero `numeric(12,2)` en Postgres, serializado como número en JSON.
- IDs UUID. `legacyMongoId` en `Account` y `Transaction`.
- Personas sembradas: **Mauricio** y **Maria**. Monto semanal por defecto **$300 MXN**. Semana inicia **domingo**.
- Formas JSON de Fase 0 idénticas a las actuales: `Account {id,name,balance}` y `Transaction {id,accountId,amount,category,date,description,type}`.
- **Paridad de contrato:** el parámetro `month` es **0-indexado** (0 = enero), igual que el frontend y el backend Go. La API expone `type` en **minúsculas** (`"income" | "expense"`), aunque Prisma lo almacene en mayúsculas.
- El frontend sólo cambia la URL base y deja de enviar saldos calculados.

---

### Task 1: Preservar Go y scaffold NestJS con health check

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `.gitignore`, `.env`, `.env.example`
- Create: `src/main.ts`, `src/app.module.ts`, `src/health/health.controller.ts`, `src/health/health.module.ts`
- Create: `test/health.e2e-spec.ts`, `test/jest-e2e.json`
- Delete: `cmd/`, `config/`, `db/`, `handlers/`, `service/`, `services/`, `types.go`, `go.mod`, `go.sum`, `Makefile`, `mongoQueries.txt`, `old_docker-compose.yml`, `pgdata/`

**Interfaces:**
- Consumes: nothing.
- Produces: `AppModule` bootstrapped on port 3000 with global prefix `api/v1`; `GET /api/v1/health` → `{ "status": "ok" }`.

- [ ] **Step 1: Preservar el estado Go**

```bash
cd /Users/mauriciojesushernndezdiaz/Documents/projects/express/expenses-api
git tag backup-go-mongo-2026-09-18
git checkout -b feat/nestjs-migration
```

Expected: tag creado y rama nueva activa.

- [ ] **Step 2: Inicializar el proyecto NestJS**

```bash
pnpm init
pnpm add @nestjs/common@^10 @nestjs/core@^10 @nestjs/platform-express@^10 reflect-metadata rxjs
pnpm add -D @nestjs/cli@^10 @nestjs/testing@^10 typescript ts-node @types/node @types/jest jest ts-jest supertest @types/supertest
```

- [ ] **Step 3: Escribir el e2e de health (falla primero)**

`test/health.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });
  afterAll(() => app.close());

  it('GET /api/v1/health', () =>
    request(app.getHttpServer()).get('/api/v1/health').expect(200).expect({ status: 'ok' }));
});
```

- [ ] **Step 4: Correr el test y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json`
Expected: FAIL (AppModule no existe).

- [ ] **Step 5: Implementar el scaffold**

`src/health/health.controller.ts`:
```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```
`src/health/health.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```
`src/app.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({ imports: [HealthModule] })
export class AppModule {}
```
`src/main.ts`:
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true });
  await app.listen(3000);
}
bootstrap();
```
`test/jest-e2e.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

- [ ] **Step 6: Correr el test y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json`
Expected: PASS.

- [ ] **Step 7: Eliminar el código Go**

```bash
git rm -r cmd config db handlers service services pgdata
git rm types.go go.mod go.sum Makefile mongoQueries.txt old_docker-compose.yml
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: replace Go backend with NestJS scaffold and health check"
```

---

### Task 2: Prisma + PostgreSQL (esquema completo y migración)

**Files:**
- Create: `prisma/schema.prisma`, `src/prisma/prisma.service.ts`, `src/prisma/prisma.module.ts`, `prisma/seed.ts`
- Modify: `src/app.module.ts` (importar `PrismaModule`)
- Create: `docker-compose.yml`, `test/prisma.e2e-spec.ts`

**Interfaces:**
- Consumes: `AppModule`.
- Produces: `PrismaService` (extiende `PrismaClient`, `onModuleInit` conecta), `PrismaModule` global; base `expenses` migrada y sembrada con dos `Person`.

- [ ] **Step 1: Escribir el test de conexión (falla primero)**

`test/prisma.e2e-spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('PrismaService (e2e)', () => {
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PrismaModule] }).compile();
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
  });
  afterAll(() => prisma.$disconnect());

  it('conecta y cuenta personas', async () => {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Person"`;
    expect(Number(rows[0].count)).toBe(2);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json test/prisma.e2e-spec.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Levantar Postgres local**

`docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: expenses
      POSTGRES_PASSWORD: expenses
      POSTGRES_DB: expenses
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata: {}
```
`.env`:
```
DATABASE_URL="postgresql://expenses:expenses@localhost:5432/expenses?schema=public"
```
Run: `docker compose up -d postgres`

- [ ] **Step 4: Definir el esquema Prisma**

`prisma/schema.prisma`:
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum AccountType { CASH DEBIT CREDIT INVESTMENT }
enum Currency { MXN USD }
enum TxType { INCOME EXPENSE TRANSFER }
enum Scope { JOINT PERSONAL }

model Person {
  id                 String               @id @default(uuid())
  name               String
  weeklyAllowance    Decimal              @default(300) @db.Decimal(12, 2)
  allowanceStartDate DateTime             @db.Date
  active             Boolean              @default(true)
  transactions       Transaction[]
  adjustments        PersonalAdjustment[]
  createdAt          DateTime             @default(now())
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
  id                  String        @id @default(uuid())
  name                String
  type                AccountType   @default(CASH)
  currency            Currency      @default(MXN)
  openingBalance      Decimal       @default(0) @db.Decimal(12, 2)
  balance             Decimal       @default(0) @db.Decimal(12, 2)
  creditLimit         Decimal?      @db.Decimal(12, 2)
  statementClosingDay Int?
  paymentDueDay       Int?
  archived            Boolean       @default(false)
  legacyMongoId       String?       @unique
  transactions        Transaction[]
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}

model Transaction {
  id            String    @id @default(uuid())
  accountId     String
  account       Account   @relation(fields: [accountId], references: [id])
  amount        Decimal   @db.Decimal(12, 2)
  type          TxType
  categoryId    String?
  category      Category? @relation(fields: [categoryId], references: [id])
  date          DateTime  @db.Date
  description   String
  scope         Scope     @default(JOINT)
  personId      String?
  person        Person?   @relation(fields: [personId], references: [id])
  toAccountId   String?
  legacyMongoId String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@index([accountId, date])
  @@index([date])
}

model PersonalAdjustment {
  id        String   @id @default(uuid())
  personId  String
  person    Person   @relation(fields: [personId], references: [id])
  amount    Decimal  @db.Decimal(12, 2)
  reason    String
  date      DateTime @db.Date
  createdAt DateTime @default(now())
}
```

- [ ] **Step 5: Generar cliente, migrar y sembrar**

```bash
pnpm add @prisma/client && pnpm add -D prisma
pnpm prisma migrate dev --name init
pnpm prisma generate
```
`prisma/seed.ts` (IDs UUID fijos, coherentes con el constraint de IDs):
```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PERSONS = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Mauricio' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Maria' },
];

async function main() {
  const start = new Date('2026-01-04');
  for (const person of PERSONS) {
    await prisma.person.upsert({
      where: { id: person.id },
      update: {},
      create: { id: person.id, name: person.name, weeklyAllowance: 300, allowanceStartDate: start },
    });
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```
IDs de referencia: Mauricio `11111111-1111-4111-8111-111111111111`, Maria `22222222-2222-4222-8222-222222222222`.
Run: `pnpm ts-node prisma/seed.ts`

- [ ] **Step 6: Agregar PrismaService y PrismaModule**

`src/prisma/prisma.service.ts`:
```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```
`src/prisma/prisma.module.ts`:
```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```
Modificar `src/app.module.ts` para importar `PrismaModule`.

- [ ] **Step 7: Correr y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json test/prisma.e2e-spec.ts`
Expected: PASS (count = 2).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema, Postgres compose and seed persons"
```

---

### Task 3: Lógica pura de saldos

**Files:**
- Create: `src/domain/balance.ts`, `src/domain/balance.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `balanceDelta(input: { type: 'INCOME'|'EXPENSE'|'TRANSFER'; accountType: AccountType; role: 'SOURCE'|'DESTINATION' }): number` — variación con signo a aplicar al `balance` almacenado (deuda positiva en `CREDIT`).
  - `computeOpeningBalance(storedBalance: number, netEffect: number): number`.

- [ ] **Step 0: Configurar Jest para tests unitarios**

`package.json` → añadir bloque `"jest"` y ajustar el script `"test"`:
```json
"scripts": { "test": "jest" },
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node"
}
```
Run: `pnpm test -- --listTests` (tras crear el spec debe listar `src/domain/balance.spec.ts` y no el e2e).

- [ ] **Step 1: Escribir los tests (fallan primero)**

`src/domain/balance.spec.ts`:
```ts
import { balanceDelta, computeOpeningBalance } from './balance';

describe('balanceDelta', () => {
  it('expense en efectivo resta', () => {
    expect(balanceDelta({ type: 'EXPENSE', accountType: 'CASH', role: 'SOURCE', amount: 100 })).toBe(-100);
  });
  it('income en débito suma', () => {
    expect(balanceDelta({ type: 'INCOME', accountType: 'DEBIT', role: 'SOURCE', amount: 100 })).toBe(100);
  });
  it('expense en crédito aumenta la deuda', () => {
    expect(balanceDelta({ type: 'EXPENSE', accountType: 'CREDIT', role: 'SOURCE', amount: 100 })).toBe(100);
  });
  it('transfer saliente resta en origen no-crédito', () => {
    expect(balanceDelta({ type: 'TRANSFER', accountType: 'DEBIT', role: 'SOURCE', amount: 100 })).toBe(-100);
  });
  it('transfer entrante en crédito reduce la deuda', () => {
    expect(balanceDelta({ type: 'TRANSFER', accountType: 'CREDIT', role: 'DESTINATION', amount: 100 })).toBe(-100);
  });
});

describe('computeOpeningBalance', () => {
  it('descuenta el efecto neto del saldo almacenado', () => {
    expect(computeOpeningBalance(5000, -2000)).toBe(7000);
  });
});
```
- [ ] **Step 2: Correr y verificar que fallan**

Run: `pnpm jest src/domain/balance.spec.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar**

`src/domain/balance.ts`:
```ts
export type AccountType = 'CASH' | 'DEBIT' | 'CREDIT' | 'INVESTMENT';
export type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type Role = 'SOURCE' | 'DESTINATION';

export function balanceDelta(input: {
  type: TxType; accountType: AccountType; role: Role; amount: number;
}): number {
  const { type, accountType, role, amount } = input;
  const credit = accountType === 'CREDIT';
  if (type === 'INCOME') return credit ? -amount : amount;
  if (type === 'EXPENSE') return credit ? amount : -amount;
  // TRANSFER
  if (role === 'SOURCE') return credit ? amount : -amount;
  return credit ? -amount : amount;
}

export function computeOpeningBalance(storedBalance: number, netEffect: number): number {
  return storedBalance - netEffect;
}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `pnpm jest src/domain/balance.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat: add signed balance delta domain logic with tests"
```

---

### Task 4: Módulo Accounts (lectura y escritura, saldo derivado)

**Files:**
- Create: `src/accounts/accounts.module.ts`, `src/accounts/accounts.service.ts`, `src/accounts/accounts.controller.ts`, `src/accounts/dto/create-account.dto.ts`, `src/accounts/dto/update-account.dto.ts`
- Modify: `src/app.module.ts`
- Test: `test/accounts.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `computeOpeningBalance`.
- Produces:
  - `AccountsService.findAll(includeArchived = false): Promise<Account[]>`
  - `AccountsService.findOne(id: string): Promise<Account>`
  - `AccountsService.create(dto): Promise<Account>`
  - `AccountsService.update(id, dto): Promise<Account>`
  - Endpoints `GET /accounts`, `GET /accounts/:id`, `POST /accounts`, `PUT /accounts/:id`.
  - Respuesta mapeada a `{ id, name, balance }` (balance como número).

- [ ] **Step 1: Escribir el e2e (falla primero)**

`test/accounts.e2e-spec.ts`: cubre crear cuenta con `balance: 1500`, listarla y actualizar nombre. (Escribe los asserts con `expect.objectContaining`.)

- [ ] **Step 2: Correr y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json test/accounts.e2e-spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar DTOs, servicio y controlador**

`create-account.dto.ts`:
```ts
export class CreateAccountDto {
  name!: string;
  balance?: number;
}
```
`accounts.service.ts` (núcleo):
```ts
@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  private toJson(a: any) {
    return { id: a.id, name: a.name, balance: Number(a.balance) };
  }

  async findAll(includeArchived = false) {
    const rows = await this.prisma.account.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((a) => this.toJson(a));
  }

  async findOne(id: string) {
    const a = await this.prisma.account.findUniqueOrThrow({ where: { id } });
    return this.toJson(a);
  }

  async create(dto: CreateAccountDto) {
    const balance = dto.balance ?? 0;
    const a = await this.prisma.account.create({
      data: { name: dto.name, openingBalance: balance, balance },
    });
    return this.toJson(a);
  }

  async update(id: string, dto: UpdateAccountDto) {
    const current = await this.prisma.account.findUniqueOrThrow({ where: { id } });
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.balance !== undefined) {
      const netEffect = Number(current.balance) - Number(current.openingBalance);
      data.openingBalance = computeOpeningBalance(dto.balance, netEffect);
      data.balance = dto.balance;
    }
    const a = await this.prisma.account.update({ where: { id }, data });
    return this.toJson(a);
  }
}
```
`accounts.controller.ts`: rutas `GET /accounts`, `GET /accounts/:id`, `POST /accounts`, `PUT /accounts/:id`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json test/accounts.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: accounts read/write endpoints with derived balance"
```

---

### Task 5: Categorías (resolución por nombre) y creación de movimientos

**Files:**
- Create: `src/categories/categories.service.ts` (resolución por nombre)
- Create: `src/transactions/transactions.module.ts`, `src/transactions/transactions.service.ts`, `src/transactions/transactions.controller.ts`, `src/transactions/dto/create-transaction.dto.ts`
- Modify: `src/app.module.ts`
- Test: `test/transactions-create.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `balanceDelta`.
- Produces:
  - `CategoriesService.resolveByName(name: string): Promise<string>` (id).
  - `TransactionsService.create(dto): Promise<{ id: string }>` que crea el movimiento y ajusta el `balance` de la cuenta en una `$transaction`.
  - `POST /transactions` acepta `{ type, accountId, amount, description, date, category }` y devuelve `{ id }`.

- [ ] **Step 1: Escribir el e2e (falla primero)**

Crea una cuenta con balance 1000, luego `POST /transactions` con `{ type: 'expense', amount: 250, category: 'Despensa', ... }`; verifica que `GET /accounts/:id` devuelve `balance: 750`.

- [ ] **Step 2: Correr y verificar que falla**

Run: `pnpm jest --config test/jest-e2e.json test/transactions-create.e2e-spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`categories.service.ts`:
```ts
@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
  async resolveByName(name: string) {
    if (!name) return null;
    const existing = await this.prisma.category.findUnique({ where: { name } });
    if (existing) return existing.id;
    const created = await this.prisma.category.create({ data: { name } });
    return created.id;
  }
}
```
`transactions.service.ts` (create):
```ts
async create(dto: CreateTransactionDto) {
  const categoryId = await this.categories.resolveByName(dto.category);
  const account = await this.prisma.account.findUniqueOrThrow({ where: { id: dto.accountId } });
  const delta = balanceDelta({
    type: dto.type.toUpperCase() as TxType,
    accountType: account.type,
    role: 'SOURCE',
    amount: dto.amount,
  });
  const tx = await this.prisma.$transaction(async (db) => {
    await db.account.update({
      where: { id: account.id },
      data: { balance: { increment: delta } },
    });
    return db.transaction.create({
      data: {
        accountId: account.id,
        amount: dto.amount,
        type: dto.type.toUpperCase() as TxType,
        categoryId,
        date: new Date(dto.date),
        description: dto.description,
      },
    });
  });
  return { id: tx.id };
}
```
`transactions.controller.ts`: `POST /transactions`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `pnpm jest --config test/jest-e2e.json test/transactions-create.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: create transactions and adjust account balance server-side"
```

---

### Task 6: Listar, editar y borrar movimientos

**Files:**
- Modify: `src/transactions/transactions.service.ts`, `src/transactions/transactions.controller.ts`
- Test: `test/transactions-crud.e2e-spec.ts`

**Interfaces:**
- Consumes: Task 5.
- Produces:
  - `TransactionsService.findByMonth(month: number, year: number)` → array con `{ id, accountId, amount, category, date, description, type }` (categoría como nombre, `type` en minúsculas).
  - `TransactionsService.update(id, dto)` y `remove(id)` revirtiendo/aplicando deltas de saldo.
  - `GET /transactions?month&year` (**month 0-indexado**), `PUT /transactions/:id`, `DELETE /transactions/:id`.

- [ ] **Step 1: Escribir los e2e (fallan primero)**

Cubre: lista del mes filtra por rango y devuelve `category` como string; editar importe 250→100 deja el saldo en 900; borrar deja el saldo en 1000.

- [ ] **Step 2: Correr y verificar que fallan**

Run: `pnpm jest --config test/jest-e2e.json test/transactions-crud.e2e-spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar listado con rango y reversión**

`findByMonth` recibe `month` 0-indexado: `inicio = Date.UTC(year, month, 1)` y `fin = Date.UTC(year, month + 1, 1)`; filtra `date >= inicio && date < fin`, incluye categoría y mapea a `{ ..., category: tx.category?.name ?? '', type: tx.type.toLowerCase() }`.
`update` y `remove` cargan el movimiento, calculan el delta inverso con `balanceDelta` (negando `amount`) y lo aplican junto con el cambio en la misma `$transaction`.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `pnpm jest --config test/jest-e2e.json test/transactions-crud.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: list, update and delete transactions with balance reversal"
```

---

### Task 7: Script de migración Mongo → Postgres

**Files:**
- Create: `scripts/migrate-from-mongo.ts`, `scripts/migrate.test.ts`
- Modify: `package.json` (script `migrate:mongo`)

**Interfaces:**
- Consumes: `computeOpeningBalance`, `PrismaClient`.
- Produces: script idempotente que migra cuentas, categorías, movimientos y personas, con `legacyMongoId`.

- [ ] **Step 1: Escribir el test unitario del cálculo (falla primero)**

`scripts/migrate.test.ts`:
```ts
import { computeOpeningBalance } from '../src/domain/balance';
test('opening balance compensa el efecto neto', () => {
  expect(computeOpeningBalance(750, -250)).toBe(1000);
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `pnpm jest scripts/migrate.test.ts`
Expected: FAIL si aún no se exporta (o PASS si Task 3 ya lo hizo; en ese caso continúa).

- [ ] **Step 3: Implementar el script**

`scripts/migrate-from-mongo.ts`:
- Conecta a Mongo con `MONGO_DB_HOST/USERNAME/PASSWORD` (driver `mongodb`).
- Migra `accounts`: `upsert` por `legacyMongoId`; `openingBalance = computeOpeningBalance(saldo, efectoNeto)`; `balance = saldo`.
- Migra `transactions`: resuelve categoría por nombre, convierte `date` a `Date`, `upsert` por `legacyMongoId`.
- Sembrado de personas si no existen.
- Al final imprime conteos y compara `Σ balance` con Mongo; falla (exit 1) si difiere.

Añade `pnpm add -D mongodb` y `"migrate:mongo": "ts-node scripts/migrate-from-mongo.ts"`.

- [ ] **Step 4: Correr migración contra base vacía**

Run: `pnpm migrate:mongo`
Expected: conteos coinciden; sin errores.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate accounts and transactions from Mongo to Postgres"
```

---

### Task 8: Frontend a la nueva API sin cálculo de saldo en cliente

**Files:**
- Modify: `/Users/.../react/expenses-v2/.env` (`VITE_GO_BASE_URL` → `VITE_API_BASE_URL`)
- Modify: `src/services/TransactionService.ts`, `src/services/AccountService.ts`
- Modify: `src/types/expenses.ts` (si hace falta)

**Interfaces:**
- Consumes: endpoints de Tasks 4–6.
- Produces: frontend que sólo lee saldos y deja que el backend los ajuste.

- [ ] **Step 1: Cambiar la variable de entorno**

`VITE_API_BASE_URL=https://api.expenses.maurihed.com/api/v1` y actualizar las referencias en ambos services.

- [ ] **Step 2: Quitar el ajuste de saldo en cliente**

Eliminar las llamadas a `AccountService.updateAccountBalance` dentro de `addTransaction`, `editTransaction` y `deleteTransaction`; dejar sólo las llamadas a `/transactions` y refrescar cuentas con `refreshAccounts()`.

- [ ] **Step 2b: Tratar la fecha como date-only (evitar desfase de zona)**

El backend expone `date` como `YYYY-MM-DD`. El frontend NO debe hacer `new Date(transaction.date)` (eso interpreta UTC y puede mostrar el día anterior en `America/Mexico_City`). Parsear como fecha local date-only:
```ts
const parseDateOnly = (value: string): Date => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};
```
Usar `parseDateOnly` en `TransactionService.getTransactions` (en vez de `new Date(transaction.date)`) y en los `defaultValues` del formulario. Al enviar, serializar la fecha con `formatDate` local (ya existente en `DateUtils`), no `toISOString()`. Añadir un test/verificación de que una transacción del día 15 sigue mostrándose el 15.

- [ ] **Step 3: Verificar build y lint**

Run: `pnpm build && pnpm lint`
Expected: PASS sin errores.

- [ ] **Step 4: Verificación manual de paridad**

Levantar front y backend; comprobar crear/editar/borrar un movimiento y que el saldo mostrado corresponde al backend.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: point frontend to NestJS API and drop client-side balance updates"
```

---

### Task 9: Despliegue Docker + backup

**Files:**
- Create: `Dockerfile`, `docker-compose.prod.yml`, `scripts/backup.sh`, `.env.example` (actualizado)
- Modify: `README.md`

**Interfaces:**
- Consumes: build de NestJS.
- Produces: `docker compose -f docker-compose.prod.yml up -d` con `api` + `postgres`, y backup diario por cron.

- [ ] **Step 1: Dockerfile multi-stage**

Build con `pnpm` (`pnpm install`, `pnpm build`, `pnpm prisma generate`) y runtime `node:22-alpine` corriendo `node dist/main.js` en el puerto 3000.

- [ ] **Step 2: Compose de producción**

`docker-compose.prod.yml` con `api` (depends_on postgres, `DATABASE_URL` desde `.env`) y `postgres:16` con volumen persistente y healthcheck.

- [ ] **Step 3: Script de backup**

`scripts/backup.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U expenses expenses | gzip > "backups/expenses-$(date +%F).sql.gz"
```
Documenta en el README el cron diario.

- [ ] **Step 4: Validar arranque local**

Run: `docker compose -f docker-compose.prod.yml up -d --build && curl http://localhost:3000/api/v1/health`
Expected: `{"status":"ok"}`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: production Docker images, compose and backup script"
```

---

## Self-Review (Fase 0)

- **Cobertura del spec:** Fase 0 cubre scaffold NestJS, Prisma/Postgres, paridad de cuentas y movimientos, saldo en backend, migración y deploy (secciones 5–8, 10, 11, 15 del spec).
- **Placeholders:** sin TBD; las tareas con UI de tests extensos referencian los asserts esperados explícitamente.
- **Consistencia de tipos:** `balanceDelta` y `computeOpeningBalance` usados en Tasks 3–7 con las mismas firmas; `Account` mapeado a `{id,name,balance}` en Task 4.
- **Pendiente para Fase 1:** tipos de cuenta, crédito, categorías CRUD, personas, presupuesto personal y transferencias se implementan en el plan de Fase 1.
