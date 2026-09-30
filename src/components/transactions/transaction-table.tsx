"use client";

import { useTransition } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { deleteTransaction } from "@/app/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { TransactionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TransactionTable({ transactions }: { transactions: TransactionDTO[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-32">Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-20">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </TableBody>
    </Table>
  );
}

function TransactionRow({ transaction: t }: { transaction: TransactionDTO }) {
  const [pending, startTransition] = useTransition();
  const income = t.type === "INCOME";

  function remove() {
    if (!confirm(`Delete this ${formatCurrency(t.amount)} ${t.category} transaction?`)) return;
    startTransition(async () => {
      const result = await deleteTransaction(t.id);
      if (result.ok) toast.success("Transaction deleted");
      else toast.error(result.error);
    });
  }

  return (
    <TableRow className={cn(pending && "opacity-50")}>
      <TableCell className="text-muted-foreground tabular-nums">{formatDate(new Date(t.date))}</TableCell>
      <TableCell className="max-w-64">
        <div className="truncate">{t.description || t.category}</div>
        <div className="text-xs text-muted-foreground sm:hidden">{t.category}</div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="secondary">{t.category}</Badge>
      </TableCell>
      <TableCell
        className={cn("text-right font-medium tabular-nums", income ? "text-positive" : "text-foreground")}
      >
        {income ? "+" : "−"}
        {formatCurrency(t.amount)}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-0.5">
          <TransactionFormDialog
            transaction={t}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Edit transaction">
                <PencilIcon />
              </Button>
            }
          />
          <Button variant="ghost" size="icon-sm" aria-label="Delete transaction" onClick={remove} disabled={pending}>
            <Trash2Icon />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
