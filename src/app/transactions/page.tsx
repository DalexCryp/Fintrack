import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { PlusIcon } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { toTransactionDTO } from "@/lib/types";

export const metadata: Metadata = { title: "Transactions · FinTrack" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  await connection();
  const params = await searchParams;
  const type = first(params.type);
  const category = first(params.category);
  const month = first(params.month);

  const where: Prisma.TransactionWhereInput = {};
  if (type === "INCOME" || type === "EXPENSE") where.type = type;
  if (category) where.category = category;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  }

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.transaction.count(),
  ]);

  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  const addButton = (
    <TransactionFormDialog
      trigger={
        <Button>
          <PlusIcon />
          Add transaction
        </Button>
      }
    />
  );

  return (
    <div className="grid gap-6">
      <PageHeader title="Transactions" description="Every income and expense you've recorded." action={addButton} />

      {totalCount === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first income or expense to start tracking your cash flow."
          action={addButton}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Suspense>
              <TransactionFilters />
            </Suspense>
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="text-muted-foreground">Income</dt>
                <dd className="font-medium text-positive">{formatCurrency(income)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expenses</dt>
                <dd className="font-medium">{formatCurrency(expenses)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Net</dt>
                <dd className="font-medium">{formatCurrency(income - expenses)}</dd>
              </div>
            </dl>
          </div>
          <Card className="py-0">
            <CardContent className="px-2">
              {transactions.length > 0 ? (
                <TransactionTable transactions={transactions.map(toTransactionDTO)} />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No transactions match these filters.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
