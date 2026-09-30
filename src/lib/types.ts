import type { TransactionType } from "@/lib/categories";

/** Transaction shape passed from server to client components (dates serialized). */
export type TransactionDTO = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  date: string; // ISO string
};

export function toTransactionDTO(t: {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  date: Date;
}): TransactionDTO {
  return {
    id: t.id,
    type: t.type === "INCOME" ? "INCOME" : "EXPENSE",
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date.toISOString(),
  };
}
