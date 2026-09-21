// Smoke check for the radio "chip" groups (recurring rule form + account form).
// Requires the dev server running (pnpm dev) and Google Chrome installed.
// Usage: node scripts/ui-chips-check.mjs

import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
let failures = 0;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => {
  console.log("pageerror:", e.message);
  failures++;
});

const checkedOf = (prefix) =>
  page.evaluate((p) => {
    const r = [...document.querySelectorAll(`[role="radio"]`)].find(
      (x) => x.id.startsWith(p) && x.getAttribute("aria-checked") === "true"
    );
    return r ? r.id : null;
  }, prefix);

const clickLabel = async (forId) => {
  await page.locator(`label[for="${forId}"]`).click();
  await page.waitForTimeout(120);
};

const expectChecked = async (prefix, expected, label) => {
  const got = await checkedOf(prefix);
  const ok = got === expected;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} -> ${got}`);
};

// ---------- Recurring rule form ----------
await page.goto(`${BASE}/recurrentes`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Agregar recurrente" }).first().click();
await page.waitForSelector("#recurring-type-subscription", { timeout: 15000 });
console.log("\n[Recurrentes]");

await expectChecked("recurring-type", "recurring-type-subscription", "tipo inicial");
await clickLabel("recurring-type-income");
await expectChecked("recurring-type", "recurring-type-income", "tipo -> Ingreso");
await clickLabel("recurring-type-subscription");
await expectChecked("recurring-type", "recurring-type-subscription", "tipo -> Suscripción (volver)");
await clickLabel("recurring-type-interest");
await expectChecked("recurring-type", "recurring-type-interest", "tipo -> Interés");
await clickLabel("recurring-type-income");
await expectChecked("recurring-type", "recurring-type-income", "tipo -> Ingreso (volver)");

await clickLabel("recurring-scope-personal");
await expectChecked("recurring-scope", "recurring-scope-personal", "alcance -> Personal");
await clickLabel("recurring-scope-joint");
await expectChecked("recurring-scope", "recurring-scope-joint", "alcance -> Conjunto (volver)");

await clickLabel("recurring-frequency-daily");
await expectChecked("recurring-frequency", "recurring-frequency-daily", "frec -> Diario");
await clickLabel("recurring-frequency-monthly");
await expectChecked("recurring-frequency", "recurring-frequency-monthly", "frec -> Mensual");
await clickLabel("recurring-frequency-weekly");
await expectChecked("recurring-frequency", "recurring-frequency-weekly", "frec -> Semanal");
await clickLabel("recurring-frequency-biweekly");
await expectChecked("recurring-frequency", "recurring-frequency-biweekly", "frec -> Quincenal");
await clickLabel("recurring-frequency-daily");
await expectChecked("recurring-frequency", "recurring-frequency-daily", "frec -> Diario (volver)");

await clickLabel("recurring-type-interest");
await expectChecked("recurring-frequency", "recurring-frequency-daily", "interés conserva Diario");
await clickLabel("recurring-frequency-monthly");
await expectChecked("recurring-frequency", "recurring-frequency-monthly", "interés -> Mensual");
await clickLabel("recurring-frequency-daily");
await expectChecked("recurring-frequency", "recurring-frequency-daily", "interés -> Diario (volver)");

// ---------- Account form ----------
await page.goto(`${BASE}/cuentas`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Agregar cuenta" }).first().click();
await page.waitForSelector("#account-type-CASH", { timeout: 15000 });
console.log("\n[Cuentas]");

await expectChecked("account-type", "account-type-CASH", "tipo inicial");
await clickLabel("account-type-CREDIT");
await expectChecked("account-type", "account-type-CREDIT", "tipo -> Crédito");
await clickLabel("account-type-CASH");
await expectChecked("account-type", "account-type-CASH", "tipo -> Efectivo (volver)");
await clickLabel("account-type-INVESTMENT");
await expectChecked("account-type", "account-type-INVESTMENT", "tipo -> Inversión");
await clickLabel("account-type-DEBIT");
await expectChecked("account-type", "account-type-DEBIT", "tipo -> Débito (volver)");

await clickLabel("account-currency-USD");
await expectChecked("account-currency", "account-currency-USD", "moneda -> USD");
await clickLabel("account-currency-MXN");
await expectChecked("account-currency", "account-currency-MXN", "moneda -> MXN (volver)");

await browser.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
