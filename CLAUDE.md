# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

FinTrack: a personal finance dashboard. Income and expenses are entered by hand; a stock portfolio is valued at live Yahoo Finance quotes. Next.js 16 App Router + React 19, Tailwind CSS 4 + shadcn/ui (`radix-nova` style), SQLite via Prisma 6, `yahoo-finance2` (no API key), Recharts, zod 4.

## Commands

```bash
npm install          # runs `prisma generate` via postinstall
npm run db:migrate   # prisma migrate dev → creates/updates prisma/dev.db
npm run db:seed      # tsx prisma/seed.ts — WIPES existing data, then inserts 6 months of samples + 4 holdings
npm run dev          # http://localhost:3000
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run build
npm run db:studio
```

There is no test framework; verify changes with `typecheck`, `lint`, and by running the app.

npm 11.19+ blocks dependency install scripts unless allowlisted — the ones this project needs (Prisma engines, esbuild, unrs-resolver) are pinned by version under `allowScripts` in `package.json`. Bumping those packages means updating that list.

After editing `prisma/schema.prisma`, run `npm run db:migrate` (which regenerates the client).

## Architecture

**Data flow.** Pages in `src/app/` are async Server Components that query Prisma directly (`src/lib/db.ts` exports a singleton client stored on `globalThis` to survive hot reload). Pages that read live data call `await connection()` from `next/server` to opt into dynamic rendering. Rows are converted to serializable DTOs (`src/lib/types.ts`, e.g. `toTransactionDTO` turns `Date` into ISO strings) before being passed to client components.

**Mutations** are server actions in `src/app/actions/` (`"use server"`). Each validates input with zod, returns `ActionResult` (`{ ok: true } | { ok: false; error }`) instead of throwing, and calls `revalidatePath` for every route that shows the affected data (`/` plus `/transactions` or `/portfolio`). Client form dialogs call these actions and surface errors via `sonner` toasts. Updates/deletes use `updateMany`/`deleteMany` so a missing id yields a count of 0 rather than an exception.

**Quotes** (`src/lib/quotes.ts`, `server-only`): `getQuotes` batches all tickers into one Yahoo request and caches results in an in-memory `Map` on `globalThis` for 5 minutes; `force: true` bypasses it ("Refresh prices"). Unknown tickers map to `null`; network failures fall back to stale cache or `null` and never throw — callers must handle unpriced holdings. `src/lib/portfolio.ts#getPortfolio` joins DB holdings with quotes and computes market value, day change, and weights; unpriced holdings are excluded from totals and counted in `unpricedCount`. `addHolding` validates a new ticker against Yahoo before saving and merges shares into an existing holding with the same ticker. Tickers are always stored via `normalizeTicker` (trimmed, uppercased).

**Domain conventions.**
- `Transaction.type` is a plain string (SQLite has no enums); valid values and the per-type category lists live in `src/lib/categories.ts`, and the action schema rejects a category that doesn't belong to the type.
- Transaction dates are stored at **12:00 UTC** on the chosen calendar day (`fromDateInputValue` in `src/lib/format.ts`) so they render on the same day in any timezone. Group/bucket by UTC date parts (see `monthKey` in `src/app/page.tsx`).
- Amounts are rounded to cents on write. Everything is displayed as USD; holdings quoted in other currencies show their native price but are summed without conversion.
- Use the formatters in `src/lib/format.ts` (`formatCurrency`, `formatPercent`, `formatShares`, `formatDate`) rather than ad-hoc formatting.

**Transactions filtering** is URL-driven: `transaction-filters.tsx` writes `type`, `category`, and `month` search params with `router.replace`, and `src/app/transactions/page.tsx` reads them server-side to build the Prisma query. Note the Next 16 page signature: props are typed with the global `PageProps<"/route">` helper and `searchParams` is a Promise that must be awaited.

**UI.** `src/components/ui/` holds shadcn-generated primitives (add more with the shadcn CLI, configured in `components.json`); feature components live in `src/components/{transactions,portfolio,charts}/`. Theme colors are CSS variables in `src/app/globals.css`, including app-specific `--positive`/`--negative` (gains/losses) and `--chart-*` tokens used by the Recharts components; dark mode is handled by `next-themes`.
