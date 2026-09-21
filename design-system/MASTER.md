# Expenses — Design System (2026) · "Lumina Finance"

Fuente de verdad del diseño. Reemplaza el sistema anterior (rosa). Generado con
`ui-ux-pro-max` y ajustado a la app.

## 1. Dirección

- **Estilo:** Financial Dashboard + Soft UI Evolution — dark-first, tarjetas con
  superficie elevada/glass, radios grandes, micro-interacciones, números grandes.
- **Mood:** moderno, confiable, financiero, aireado pero denso en datos.
- **Mobile-first** no negociable (375px, sin scroll horizontal, targets ≥44px).

## 2. Color

| Rol | Token | Light | Dark |
|---|---|---|---|
| Fondo | `--background` | `#F6F7FB` | `#0A0A0F` |
| Superficie | `--card` | `#FFFFFF` | `#14141C` |
| Texto | `--foreground` | `#0B0B12` | `#F4F4F7` |
| Texto muted | `--muted-foreground` | `#6B7280` | `#9CA3AF` |
| Primario | `--primary` | `#4F46E5` | `#6366F1` |
| Positivo | `--positive` | `#059669` | `#34D399` |
| Negativo | `--negative` | `#E11D48` | `#FB7185` |
| Borde | `--border` | `#E4E6EF` | `rgba(255,255,255,.08)` |
| Ring | `--ring` | `#6366F1` | `#818CF8` |

- **Marca:** escala indigo `--color-primary-50…950` (500 `#6366F1`, 600 `#4F46E5`).
- **Acento:** gradiente de marca `#6366F1 → #8B5CF6 → #A855F7` (clase
  `.brand-gradient`) para hero/CTA, con `.brand-glow`.
- **Gráficas:** `--chart-1..5` = indigo, violeta, esmeralda, ámbar, cielo.
- **Signos:** ingreso = `text-positive`; gasto = `text-negative`; transferencia =
  `text-muted-foreground`.

## 3. Tipografía (2 familias)

| Rol | Familia | Uso |
|---|---|---|
| Global / body / importes | **Inter** | Navegación, labels, texto y cifras (`tabular-nums`) |
| Display / títulos | **Outfit** | Títulos de sección, cifras grandes, hero (`font-display`) |

- Cargadas con `display=swap`. Importes siempre `tabular-nums`.

## 4. Superficies, radios y sombras

- **Radios:** `--radius: 1rem`; tarjetas `rounded-2xl`, botones `rounded-xl`.
- **Clases utilitarias:**
  - `.surface` — tarjeta base (fondo `--card`, borde, sombra suave).
  - `.glass` — barra inferior y overlays (blur + translúcido).
  - `.brand-gradient`, `.brand-glow`.
- **Sombras:** suaves y difusas; nada de neumorfismo duro.

## 5. Movimiento

- Transiciones 150–250ms; `hover` y `active:scale-*` en botones; `prefers-reduced-motion`
  respetado globalmente.

## 6. Reglas de contraste

- Texto normal ≥ 4.5:1. Blanco sobre `--primary` (indigo-600) ≈ 5.6:1 ✔.
- En dark, texto claro sobre `#0A0A0F`/`#14141C` ✔.
- No usar color como único indicador (signos + etiquetas).

## 7. Anti-patrones

- ❌ Emojis como íconos (usar Lucide SVG).
- ❌ Elementos clicables sin `cursor-pointer`.
- ❌ Radios pequeños (≤8px) o sombras duras.
- ❌ Fondos claros planos sin jerarquía en dark.

## 8. Checklist antes de entregar

- [ ] 375px sin scroll horizontal, targets ≥44px, `gap` ≥8px entre controles.
- [ ] `cursor-pointer`, transiciones 150–250ms, foco visible.
- [ ] Contraste AA en light y dark; `prefers-reduced-motion`.
- [ ] Importes `tabular-nums`; íconos Lucide consistentes (24x24).
