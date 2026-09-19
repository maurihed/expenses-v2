# Cuentas — Page Overrides

> **PROJECT:** Expenses
> **Page Type:** Accounts / cards list
> ⚠️ Rules here **override** `design-system/MASTER.md`. Everything not listed
> here follows the Master.

---

## Typography override

- **Section font:** `font-display` (**Sora**) for page title and account names
  only. Balances and labels stay **Inter**.
- **Balances:** always `tabular-nums`, weight 600, right-aligned in the row.

## Layout

- Mobile-first single column, `w-full`, `gap-3` (`--space-sm`/`md`).
- Account cards: `--card` surface, `border-border`, `--radius-lg`, `shadow-sm`.
- Card header: account name + type badge; body: balance (Inter) + last 4 digits.
- No fixed pixel widths; never exceed viewport. Desktop: optional 2-column grid
  at `md:` with `max-w-3xl` centered (no wider).

## Color / semantic

- Positive available balance: `--foreground`.
- Debt / negative: `--destructive` with an icon (no color-only signal).
- Credit card badge uses `--color-primary-100` bg + `--color-primary-700` text.
- Primary CTA ("Agregar cuenta") uses `.btn-primary` (pink bg, dark text).

## Components

- **Type badge:** pill, `text-xs`, uppercase tracking-wide.
- **Empty state:** icon (Lucide `Wallet`), title in Sora, one-line Inter copy,
  primary CTA.

## Recommendations

- Keep hover subtle (`shadow-sm` → `shadow-md`), `cursor-pointer` on rows.
- Totals row (if any) sticky under header with `tabular-nums`.
