import type { Account, Category } from "@/types";
import { describe, expect, it } from "vitest";
import { resolveDefaultAccountId, resolveDefaultCategory } from "./capturePreferences";

const account = (id: string, name: string): Account =>
  ({ id, name, balance: 0, type: "CASH", currency: "MXN" }) as Account;

const category = (name: string): Category =>
  ({ id: name, name, archived: false }) as Category;

describe("resolveDefaultAccountId", () => {
  const accounts = [account("1", "Efectivo"), account("2", "Billetera")];

  it("usa la cuenta preferida si existe", () => {
    expect(resolveDefaultAccountId({ accountId: "1" }, accounts)).toBe("1");
  });

  it("cae a Billetera si la preferida ya no existe", () => {
    expect(resolveDefaultAccountId({ accountId: "999" }, accounts)).toBe("2");
  });

  it("cae a la primera si no hay Billetera", () => {
    expect(resolveDefaultAccountId({}, [account("1", "Efectivo")])).toBe("1");
  });

  it("devuelve cadena vacía sin cuentas", () => {
    expect(resolveDefaultAccountId({ accountId: "1" }, [])).toBe("");
  });
});

describe("resolveDefaultCategory", () => {
  const categories = [category("Despensa"), category("Supermercado")];

  it("usa la categoría preferida si existe", () => {
    expect(resolveDefaultCategory({ category: "Despensa" }, categories)).toBe("Despensa");
  });

  it("cae a Supermercado si la preferida ya no existe", () => {
    expect(resolveDefaultCategory({ category: "Inexistente" }, categories)).toBe("Supermercado");
  });

  it("cae a la primera si no hay Supermercado", () => {
    expect(resolveDefaultCategory({}, [category("Otros")])).toBe("Otros");
  });

  it("devuelve cadena vacía sin categorías", () => {
    expect(resolveDefaultCategory({ category: "Despensa" }, [])).toBe("");
  });
});
