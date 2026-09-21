export type AccountType = "CASH" | "DEBIT" | "CREDIT" | "INVESTMENT";

export type Currency = "MXN" | "USD";

export type Account = {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  currency: Currency;
  creditLimit: number | null;
  statementClosingDay: number | null;
  paymentDueDay: number | null;
  archived: boolean;
  cashBalance?: number;
  positionsValue?: number | null;
  totalValue?: number | null;
  changePercent?: number | null;
  stale?: boolean;
};

export type AccountPayload = {
  name: string;
  balance?: number;
  type?: AccountType;
  currency?: Currency;
  creditLimit?: number;
  statementClosingDay?: number;
  paymentDueDay?: number;
};

export type CreditSummary = {
  totalDebt: number;
  periodPayment: number;
  available: number | null;
  msiCommitted: number;
};

export type TransferInput = {
  accountId: string;
  toAccountId: string;
  amount: number;
  date: Date;
  description?: string;
};

export type TransactionType = "income" | "expense" | "transfer";

export type TransactionScope = "joint" | "personal";

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  archived: boolean;
};

export type CategoryPayload = {
  name: string;
  icon?: string | null;
  color?: string | null;
};

export enum Categories {
  DESPENSA = "Despensa",
  GAEL = "Gael",
  CENAS = "Cenas",
  FAMILIA = "Familia",
  GASOLINA = "Gasolina",
  VIAJES = "Viajes",
  JUEGOS = "Juegos",
  PAPELERIA = "Papeleria",
  PASTELERIA = "Pasteleria",
  SUPERMERCADO = "Supermercado",
  RESTAURANTE = "Restaurante",
  TRANSPORTE = "Transporte",
  LIMPEZA = "Limpeza",
  ELECTRONICOS = "Electronicos",
  DIVERSION = "Diversion",
  MASCOTAS = "Mascotas",
  RECREACION = "Recreacion",
  ROPA = "Ropa",
  SALUD = "Salud",
  SERVICIO = "Servicio",
  VIAJE = "Viaje",
  VIVIENTE = "Vivienda",
  HORMIGA = "Hormiga",
  CARIDAD = "Caridad",
  OTROS = "Otros",
}

export type Transaction = {
  id: string;
  type: TransactionType;
  accountId: string;
  toAccountId?: string;
  amount: number;
  description: string;
  date: Date;
  category: Categories;
  scope?: TransactionScope;
  personId?: string | null;
  installments?: number | null;
};

export type Person = {
  id: string;
  name: string;
  weeklyAllowance: number;
  allowanceStartDate: string;
  balance: number;
  spent: number;
};

export type PersonSummary = {
  accrued: number;
  adjustmentTotal: number;
  spent: number;
  balance: number;
};

export type PersonAdjustmentPayload = {
  amount: number;
  reason: string;
  date: string;
};

export type PersonPayload = {
  name?: string;
  weeklyAllowance?: number;
  allowanceStartDate?: string;
};

export type RecurringType = "subscription" | "income" | "interest";

export type RecurringFrequency = "weekly" | "biweekly" | "monthly";

export type InterestTier = {
  upTo: number | null;
  annualRate: number;
};

export type RecurringRule = {
  id: string;
  name: string;
  type: RecurringType;
  accountId: string;
  categoryId: string | null;
  scope: TransactionScope;
  personId: string | null;
  amount: number | null;
  frequency: RecurringFrequency;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  lastRunDate: string | null;
  interestTiers: InterestTier[] | null;
  active: boolean;
};

export type RecurringRulePayload = {
  name: string;
  type: RecurringType;
  accountId: string;
  categoryId?: string | null;
  scope?: TransactionScope;
  personId?: string | null;
  amount?: number | null;
  frequency: RecurringFrequency;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  startDate: string;
  endDate?: string | null;
  interestTiers?: InterestTier[] | null;
  active?: boolean;
};

export type RecurringRunResult = {
  created: number;
  skipped: number;
  failed?: number;
};

export type DebtType = "receivable" | "payable";
export type DebtStatus = "OPEN" | "SETTLED";

export type Debt = {
  id: string;
  type: DebtType;
  counterparty: string;
  amount: number;
  currency: Currency;
  date: string;
  dueDate: string | null;
  notes: string | null;
  archived: boolean;
  paid: number;
  remaining: number;
  status: DebtStatus;
};

export type DebtPayment = {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  accountId: string | null;
  transactionId: string | null;
  notes: string | null;
};

export type DebtPayload = {
  type: DebtType;
  counterparty: string;
  amount: number;
  currency: Currency;
  date: string;
  dueDate?: string | null;
  notes?: string | null;
};

export type DebtPaymentPayload = {
  amount: number;
  date: string;
  accountId?: string | null;
  notes?: string | null;
};

export type Budget = {
  id: string;
  year: number;
  month: number;
  amount: number;
  currency: Currency;
};

export type BudgetPayload = {
  year: number;
  month: number;
  amount: number;
  currency?: Currency;
};

export type MarketQuote = {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  changePercent: number | null;
  currency: string;
  name: string | null;
  exchange: string | null;
  source: string | null;
  fetchedAt: string | null;
  stale: boolean;
};

export type MarketSearchResult = {
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string | null;
};

export type Holding = {
  id: string;
  symbol: string;
  name: string | null;
  quantity: number;
  price: number | null;
  previousClose: number | null;
  changePercent: number | null;
  currency: string;
  marketValue: number | null;
  marketValueAccountCurrency: number | null;
  fetchedAt: string | null;
  stale: boolean;
};

export type PortfolioSummary = {
  currency: Currency;
  cashBalance: number;
  positionsValue: number | null;
  totalValue: number | null;
  changePercent: number | null;
  stale: boolean;
  holdings: Holding[];
};

export type HoldingPayload = {
  symbol?: string;
  quantity?: number;
  deductFromCash?: boolean;
};
