import type { Account, Category } from "@/types";

const STORAGE_KEY = "expenses_capture_prefs";

export type CapturePreferences = {
  accountId?: string | null;
  category?: string | null;
};

export const getCapturePreferences = (): CapturePreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CapturePreferences) : {};
  } catch {
    return {};
  }
};

export const setCapturePreferences = (prefs: CapturePreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* noop */
  }
};

/**
 * Cuenta por defecto: la preferida si sigue existiendo; si no, la cuenta
 * llamada "Billetera"; si no, la primera.
 */
export const resolveDefaultAccountId = (
  prefs: CapturePreferences,
  accounts: Account[]
): string => {
  if (prefs.accountId && accounts.some((account) => account.id === prefs.accountId)) {
    return prefs.accountId;
  }
  const wallet = accounts.find((account) => account.name.toLowerCase() === "billetera");
  return wallet?.id ?? accounts[0]?.id ?? "";
};

/**
 * Categoría por defecto: la preferida si sigue existiendo; si no,
 * "Supermercado"; si no, la primera.
 */
export const resolveDefaultCategory = (
  prefs: CapturePreferences,
  categories: Category[]
): string => {
  if (prefs.category && categories.some((category) => category.name === prefs.category)) {
    return prefs.category;
  }
  const grocery = categories.find(
    (category) => category.name.toLowerCase() === "supermercado"
  );
  return grocery?.name ?? categories[0]?.name ?? "";
};
