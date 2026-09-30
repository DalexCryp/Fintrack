"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { CATEGORIES, TRANSACTION_TYPES } from "@/lib/categories";
import { fromDateInputValue } from "@/lib/format";

export type ActionResult = { ok: true } | { ok: false; error: string };

const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amount: z.coerce
      .number({ message: "Amount must be a number" })
      .positive("Amount must be greater than 0")
      .max(1_000_000_000, "Amount is too large"),
    category: z.string().min(1, "Pick a category"),
    description: z.string().trim().max(200, "Description is too long").optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  })
  .refine((t) => CATEGORIES[t.type].includes(t.category), {
    message: "Category doesn't match the transaction type",
    path: ["category"],
  });

export type TransactionInput = z.input<typeof transactionSchema>;

function parse(input: TransactionInput) {
  const result = transactionSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Invalid input" };
  const { date, description, amount, ...rest } = result.data;
  return {
    data: {
      ...rest,
      amount: Math.round(amount * 100) / 100,
      description: description || null,
      date: fromDateInputValue(date),
    },
  };
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  const parsed = parse(input);
  if (!parsed.data) return { ok: false, error: parsed.error };
  await prisma.transaction.create({ data: parsed.data });
  revalidate();
  return { ok: true };
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<ActionResult> {
  const parsed = parse(input);
  if (!parsed.data) return { ok: false, error: parsed.error };
  const { count } = await prisma.transaction.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return { ok: false, error: "Transaction not found" };
  revalidate();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { count } = await prisma.transaction.deleteMany({ where: { id } });
  if (count === 0) return { ok: false, error: "Transaction not found" };
  revalidate();
  return { ok: true };
}
