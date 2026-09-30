import type { Metadata } from "next";
import { connection } from "next/server";
import { PlusIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { ChangeText } from "@/components/change-text";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { HoldingFormDialog } from "@/components/portfolio/holding-form-dialog";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { RefreshQuotesButton } from "@/components/portfolio/refresh-quotes-button";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getPortfolio } from "@/lib/portfolio";

export const metadata: Metadata = { title: "Portfolio · FinTrack" };

export default async function PortfolioPage() {
  await connection();
  const portfolio = await getPortfolio();
  const { holdings, totalValue, dayChange, dayChangePercent, unpricedCount, asOf } = portfolio;

  const addButton = (
    <HoldingFormDialog
      trigger={
        <Button>
          <PlusIcon />
          Add holding
        </Button>
      }
    />
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Portfolio"
        description="Your stock holdings, valued at the latest Yahoo Finance quotes."
        action={
          holdings.length > 0 && (
            <div className="flex gap-2">
              <RefreshQuotesButton />
              {addButton}
            </div>
          )
        }
      />

      {holdings.length === 0 ? (
        <EmptyState
          title="No holdings yet"
          description="Add a ticker like AAPL or VOO and the number of shares you own. Fractional shares are fine."
          action={addButton}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Total value</p>
              <p className="text-4xl font-semibold tracking-tight">{formatCurrency(totalValue)}</p>
            </div>
            <p className="pb-1 text-sm">
              <ChangeText value={dayChange}>
                {formatCurrency(dayChange, undefined, { signDisplay: "exceptZero" })}
                {dayChangePercent != null && ` (${formatPercent(dayChangePercent, { signed: true })})`}
              </ChangeText>{" "}
              <span className="text-muted-foreground">today</span>
            </p>
            <p className="ml-auto pb-1 text-xs text-muted-foreground">
              Prices as of {asOf.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · cached up to
              5 min
            </p>
          </div>

          {unpricedCount > 0 && (
            <p className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
              <TriangleAlertIcon className="size-4 shrink-0" />
              {unpricedCount === 1 ? "1 holding has" : `${unpricedCount} holdings have`} no available quote and{" "}
              {unpricedCount === 1 ? "is" : "are"} excluded from totals.
            </p>
          )}

          <Card className="py-0">
            <CardContent className="px-2">
              <HoldingsTable holdings={holdings} totalValue={totalValue} dayChange={dayChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocation</CardTitle>
              <CardDescription>Share of total portfolio value by holding.</CardDescription>
            </CardHeader>
            <CardContent>
              <AllocationChart holdings={holdings} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
