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
import { addHolding, updateHoldingShares } from "@/app/actions/portfolio";

type Props = {
  /** When set, the dialog edits this holding's share count instead of adding a new one. */
  holding?: { id: string; ticker: string; shares: number };
  trigger: React.ReactNode;
};

export function HoldingFormDialog({ holding, trigger }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{holding ? `Edit ${holding.ticker}` : "Add holding"}</DialogTitle>
          <DialogDescription>
            {holding
              ? "Set the total number of shares you own."
              : "Adding a ticker you already hold adds to its share count."}
          </DialogDescription>
        </DialogHeader>
        {open && <HoldingForm holding={holding} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function HoldingForm({ holding, onDone }: { holding?: Props["holding"]; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [ticker, setTicker] = useState(holding?.ticker ?? "");
  const [shares, setShares] = useState(holding ? String(holding.shares) : "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = holding
        ? await updateHoldingShares(holding.id, shares)
        : await addHolding({ ticker, shares });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(holding ? `${holding.ticker} updated` : `${ticker.trim().toUpperCase()} added`);
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="holding-ticker">Ticker</Label>
          <Input
            id="holding-ticker"
            required
            autoFocus={!holding}
            disabled={!!holding}
            placeholder="AAPL"
            autoCapitalize="characters"
            autoComplete="off"
            className="uppercase"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="holding-shares">Shares</Label>
          <Input
            id="holding-shares"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            autoFocus={!!holding}
            placeholder="10"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (holding ? "Saving…" : "Looking up…") : holding ? "Save" : "Add holding"}
        </Button>
      </DialogFooter>
    </form>
  );
}
