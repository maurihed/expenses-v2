# Expenses V2

An application which has three different apps within.

1. Expenses tracker
2. workout routine where the user can see his routine and mark the exercies he already did, the storage for this is local storage
3. bakary page where the user can create supplies and recepies, the idea is have all the receipes here and create a quote generator in the future.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Routing:** React Router 7
- **State Management:** Zustand (local), React Query (server)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Chart.js + react-chartjs-2
- **PWA:** vite-plugin-pwa

## Project Structure

```
src/
├── components/     # UI components and layouts
├── hooks/          # Custom React hooks
├── lib/            # Utilities (dates, categories, helpers)
├── pages/          # Route pages
│   ├── bakery/     # Bakery management
│   ├── expenses/   # Expense tracking
│   └── routines/   # Workout routines
├── services/       # API/data services (Accounts, Recipes, Transactions)
├── stores/         # Zustand stores
└── types/          # TypeScript type definitions
```

## Routes

| Path            | Description                  |
| --------------- | ---------------------------- |
| `/expenses`     | Main expenses page (default) |
| `/bakery`       | Bakery management            |
| `/workouts/:id` | Workout routines             |

## Commands

```bash
pnpm dev       # Start dev server
pnpm build     # Type check and build
pnpm lint      # Run ESLint
pnpm preview   # Preview production build
```

## Key Features

- PWA support with offline capabilities
- Dark/light theme with system preference detection
- Mobile-first responsive layout
- Path alias: `@/*` maps to `./src/*`
