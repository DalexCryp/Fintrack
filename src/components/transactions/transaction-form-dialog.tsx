"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { CATEGORIES, type TransactionType } from "@/lib/categories";
import { toDateInputValue } from "@/lib/format";
import type { TransactionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  transaction?: TransactionDTO;
  trigger: React.ReactNode;
};

export function TransactionFormDialog({ transaction, trigger }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>Record money coming in or going out.</DialogDescription>
        </DialogHeader>
        {/* Remount on open so the form resets to the latest values. */}
        {open && <TransactionForm transaction={transaction} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({ transaction, onDone }: { transaction?: TransactionDTO; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "EXPENSE");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [date, setDate] = useState(toDateInputValue(transaction ? new Date(transaction.date) : new Date()));
  const [description, setDescription] = useState(transaction?.description ?? "");

  function changeType(next: TransactionType) {
    setType(next);
    if (!CATEGORIES[next].includes(category)) setCategory("");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const input = { type, category, amount, date, description };
    startTransition(async () => {
      const result = transaction
        ? await updateTransaction(transaction.id, input)
        : await createTransaction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(transaction ? "Transaction updated" : "Transaction added");
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Type">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => changeType(t)}
            className={cn(
              "rounded-md py-1.5 text-sm font-medium text-muted-foreground transition-colors",
              type === t && "bg-background text-foreground shadow-sm",
            )}
          >
            {t === "EXPENSE" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="tx-amount">Amount</Label>
          <Input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tx-date">Date</Label>
          <Input id="tx-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="tx-category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="tx-category" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent position="popper">
            {CATEGORIES[type].map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="tx-description">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="tx-description"
          rows={2}
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
        </Button>
      </DialogFooter>
    </form>
  );
}
