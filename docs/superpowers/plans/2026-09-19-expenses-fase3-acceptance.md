# Aceptación Fase 3 — Inversiones y tipo de cambio USD

Fecha: 2026-09-19

## Suites

| Suite | Resultado |
|---|---|
| Backend `pnpm test` | 49/49 ✅ (8 suites) |
| Backend `pnpm test:e2e` | 109/109 ✅ (14 suites, 3 corridas) |
| Backend `pnpm build` | ✅ |
| Frontend `pnpm test` (Vitest) | 10/10 ✅ (`accountTotals`) |
| Frontend `pnpm build` | ✅ |
| Frontend `pnpm lint` | 0 errores (3 warnings preexistentes) |

## API verificada en vivo

```
GET http://localhost:3001/api/v1/fx/rate?base=USD&quote=MXN
{"base":"USD","quote":"MXN","rate":17.212115,"fetchedAt":"2026-09-19T19:12:50.416Z","stale":false}
```

- Proveedor primario `open.er-api.com`; fallback `fawazahmed0/currency-api`.
- Caché en `ExchangeRate` con TTL (`FX_CACHE_MS`, por defecto 6 h); ante fallo de
  ambas APIs se sirve la caché marcada `stale`.

## Criterios

| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `GET /fx/rate` devuelve tasa numérica con `stale` | **PASS** | curl en vivo + e2e `test/fx.e2e-spec.ts` |
| 2 | Refresco tras TTL; fallback a caché si ambas APIs fallan | **PASS** | unit `src/fx/fx.spec.ts` (primaria/fallback/stale/sin caché) |
| 3 | Inicio: total en MXN, inversiones y tasa | **PASS** (estático) | `HomePage.tsx` + `useFxRate`; verificación de runtime pendiente |
| 4 | Cuentas USD muestran equivalente en MXN | **PASS** (estático) | `AccountList.tsx` (`≈ MXN` para USD con tasa) |
| 5 | Suites y builds en verde | **PASS** | tabla de suites |

**Resumen: 5 PASS, 0 FAIL** (dos criterios verificados estáticamente por falta de
navegador).

## Follow-ups

- Validación visual a 375px en navegador (patrón de fases previas).
- Histórico de tipos de cambio (valuación por fecha) — no incluido.
- Dashboard completo de Fase 5 (deuda, presupuesto mensual).
