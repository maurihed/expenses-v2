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
