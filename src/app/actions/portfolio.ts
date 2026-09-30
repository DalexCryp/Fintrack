"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getQuote, getQuotes, normalizeTicker } from "@/lib/quotes";
import type { ActionResult } from "./transactions";

const sharesSchema = z.coerce
  .number({ message: "Shares must be a number" })
  .positive("Shares must be greater than 0")
  .max(1_000_000_000, "Share count is too large");

const holdingSchema = z.object({
  ticker: z
    .string()
    .transform(normalizeTicker)
    .pipe(z.string().regex(/^[A-Z0-9.\-^=]{1,15}$/, "Enter a valid ticker symbol")),
  shares: sharesSchema,
});

function revalidate() {
  revalidatePath("/");
  revalidatePath("/portfolio");
}

/** Adds shares to a holding; buying a ticker you already hold merges into it. */
export async function addHolding(input: { ticker: string; shares: string | number }): Promise<ActionResult> {
  const result = holdingSchema.safeParse(input);
  if (!result.success) return { ok: false, error: result.error.issues[0]?.message ?? "Invalid input" };
  const { ticker, shares } = result.data;

  const existing = await prisma.portfolioItem.findFirst({ where: { ticker } });
  if (existing) {
    await prisma.portfolioItem.update({
      where: { id: existing.id },
      data: { shares: existing.shares + shares },
    });
  } else {
    const quote = await getQuote(ticker);
    if (!quote) return { ok: false, error: `Couldn't find a quote for "${ticker}"` };
    await prisma.portfolioItem.create({ data: { ticker, shares } });
  }

  revalidate();
  return { ok: true };
}

export async function updateHoldingShares(id: string, shares: string | number): Promise<ActionResult> {
  const result = sharesSchema.safeParse(shares);
  if (!result.success) return { ok: false, error: result.error.issues[0]?.message ?? "Invalid input" };
  const { count } = await prisma.portfolioItem.updateMany({ where: { id }, data: { shares: result.data } });
  if (count === 0) return { ok: false, error: "Holding not found" };
  revalidate();
  return { ok: true };
}

/** Bypasses the five-minute quote cache for every held ticker. */
export async function refreshQuotes(): Promise<ActionResult> {
  const items = await prisma.portfolioItem.findMany({ select: { ticker: true } });
  await getQuotes(
    items.map((i) => i.ticker),
    { force: true },
  );
  revalidate();
  return { ok: true };
}

export async function deleteHolding(id: string): Promise<ActionResult> {
  const { count } = await prisma.portfolioItem.deleteMany({ where: { id } });
  if (count === 0) return { ok: false, error: "Holding not found" };
  revalidate();
  return { ok: true };
}
