# Freedom360

A private, local-first retirement planning tool inspired by Empower's Retirement
Planner — but built around what people on r/personalfinance and r/financialindependence
actually ask for that Empower doesn't do well.

**Everything runs in your browser. Nothing is uploaded, and no real bank accounts
are ever linked** — that was a deliberate choice, since the most common complaint
about Empower's free planner is that using it gets you a sales call.

## What's here

- **Monte Carlo retirement projection** — a fan chart of outcomes across
  simulated markets (not just a single "confidence score"), plus a
  deterministic expected-return path and a net-worth-by-account-type view.
- **Editable assumptions** — your own expected returns, inflation, and life
  expectancy, not a black box.
- **Tax-aware withdrawals** — a simplified federal tax model, required
  minimum distributions from age 73, and three selectable withdrawal
  strategies: fixed real spending (the "4% rule"), Guyton-Klinger guardrails,
  and a variable/amortization-based approach.
- **Roth conversion planner** — compares lifetime taxes and ending balance
  with vs. without a conversion strategy, plus a tax-bracket-fill suggestion
  table.
- **FIRE tools** — Coast FIRE and Barista FIRE calculators for retiring
  before a traditional retirement age.
- **Life events** — spending goals (wedding, home purchase, education, ...)
  and income events (inheritance, rental income, work during retirement, ...)
  tied to any stage of life, one-time or recurring, each actually modeled
  into your projection rather than just noted down.
- **Scenario comparison** — duplicate your plan and try "retire at 60" or
  "spend $10k more" side by side.
- **Your data, portable** — export/import a JSON backup; reset any time.

See `PLANNING_NOTES.md` for the modeling assumptions and known simplifications.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — unit tests for the calculation engine (Vitest)

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Zustand (with localStorage
persistence) for state, Recharts for charts. No backend, no database, no
account linking.
