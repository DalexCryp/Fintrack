"use client";

import { useTransition } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HoldingFormDialog } from "@/components/portfolio/holding-form-dialog";
import { ChangeText } from "@/components/change-text";
import { deleteHolding } from "@/app/actions/portfolio";
import { formatCurrency, formatPercent, formatShares } from "@/lib/format";
import type { Holding } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export function HoldingsTable({
  holdings,
  totalValue,
  dayChange,
}: {
  holdings: Holding[];
  totalValue: number;
  dayChange: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Day</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Weight</TableHead>
          <TableHead className="w-20">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((h) => (
          <HoldingRow key={h.id} holding={h} />
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="font-medium">
            Total
          </TableCell>
          <TableCell className="text-right tabular-nums">
            <ChangeText value={dayChange}>{formatCurrency(dayChange, undefined, { signDisplay: "exceptZero" })}</ChangeText>
          </TableCell>
          <TableCell className="text-right font-medium tabular-nums">{formatCurrency(totalValue)}</TableCell>
          <TableCell className="hidden sm:table-cell" />
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function HoldingRow({ holding: h }: { holding: Holding }) {
  const [pending, startTransition] = useTransition();
  const currency = h.quote?.currency;

  function remove() {
    if (!confirm(`Remove ${h.ticker} from your portfolio?`)) return;
    startTransition(async () => {
      const result = await deleteHolding(h.id);
      if (result.ok) toast.success(`${h.ticker} removed`);
      else toast.error(result.error);
    });
  }

  return (
    <TableRow className={cn(pending && "opacity-50")}>
      <TableCell>
        <div className="font-medium">{h.ticker}</div>
        <div className="max-w-48 truncate text-xs text-muted-foreground">
          {h.quote?.name ?? "Quote unavailable"}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatShares(h.shares)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {h.quote ? formatCurrency(h.quote.price, currency) : "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {h.quote?.changePercent != null ? (
          <ChangeText value={h.quote.changePercent}>{formatPercent(h.quote.changePercent, { signed: true })}</ChangeText>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {h.marketValue != null ? formatCurrency(h.marketValue, currency) : "—"}
      </TableCell>
      <TableCell className="hidden text-right text-muted-foreground tabular-nums sm:table-cell">
        {h.weight != null ? formatPercent(h.weight) : "—"}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-0.5">
          <HoldingFormDialog
            holding={{ id: h.id, ticker: h.ticker, shares: h.shares }}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${h.ticker}`}>
                <PencilIcon />
              </Button>
            }
          />
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${h.ticker}`} onClick={remove} disabled={pending}>
            <Trash2Icon />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
