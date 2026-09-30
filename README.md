# FinTrack

A personal finance dashboard: track income and expenses by hand, and follow a stock portfolio valued at live Yahoo Finance quotes.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 + shadcn/ui · SQLite via Prisma 6 · `yahoo-finance2` (no API key) · Recharts

## Getting started

```bash
npm install          # also runs `prisma generate`
npm run db:migrate   # creates prisma/dev.db
npm run db:seed      # optional: six months of sample data + 4 holdings (wipes existing data)
npm run dev          # http://localhost:3000
```

> npm 11.19+ blocks dependency install scripts unless they're allowlisted. The ones this project needs (Prisma engines, esbuild, unrs-resolver) are listed under `allowScripts` in `package.json`.

## Pages

| Route | What it does |
|---|---|
| `/` | Net worth (tracked cash + portfolio), this month's income/expenses/net, 12-month cash-flow chart, spending by category, portfolio allocation, recent transactions |
| `/transactions` | Full list filterable by type, category, and month; add, edit, and delete |
| `/portfolio` | Holdings with live price, day change, market value, and weight; add (adding an existing ticker adds to its shares), edit shares, remove, refresh prices |

## Notes

- **Quotes** are fetched server-side in one batched request and cached in memory for 5 minutes (`src/lib/quotes.ts`). "Refresh prices" bypasses the cache. Tickers are checked against Yahoo before they're saved. If Yahoo is unreachable, the page still renders and unpriced holdings are left out of totals.
- **Dates** are stored at 12:00 UTC on the chosen day, so a transaction shows up on the same calendar day in any timezone.
- **Currency** is displayed as USD. Holdings quoted in another currency show prices in that currency, but totals add them up without converting.
- **Mutations** use server actions (`src/app/actions/`) with zod validation.

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `db:migrate` · `db:seed` · `db:studio`
