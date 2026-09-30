import Link from "next/link";
import { connection } from "next/server";
import { format } from "date-fns";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { BarListChart } from "@/components/charts/bar-list-chart";
import { CashFlowChart, type CashFlowPoint } from "@/components/charts/cash-flow-chart";
import { ChangeText } from "@/components/change-text";
import { StatTile } from "@/components/stat-tile";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { prisma } from "@/lib/db";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getPortfolio } from "@/lib/portfolio";
import { toTransactionDTO } from "@/lib/types";

const MONTHS = 12;

/** Transactions sit at noon UTC on their calendar day, so bucket by UTC parts. */
function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function percentChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

export default async function DashboardPage() {
  await connection();

  const now = new Date();
  const months = Array.from({ length: MONTHS }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1));
  const windowStart = new Date(Date.UTC(months[0].getFullYear(), months[0].getMonth(), 1));

  const [recentWindow, totals, latest, portfolio] = await Promise.all([
    prisma.transaction.findMany({ where: { date: { gte: windowStart } } }),
    prisma.transaction.groupBy({ by: ["type"], _sum: { amount: true } }),
    prisma.transaction.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 6 }),
    getPortfolio(),
  ]);

  // Monthly cash flow for the chart and this/last month tiles.
  const byMonth = new Map<string, CashFlowPoint>(
    months.map((m) => {
      const key = format(m, "yyyy-MM");
      return [key, { month: format(m, "MMMM yyyy"), label: format(m, "MMM"), income: 0, expenses: 0 }];
    }),
  );
  for (const t of recentWindow) {
    const point = byMonth.get(monthKey(t.date));
    if (!point) continue;
    if (t.type === "INCOME") point.income += t.amount;
    else point.expenses += t.amount;
  }
  const cashFlow = [...byMonth.values()];
  const thisMonth = cashFlow[MONTHS - 1];
  const lastMonth = cashFlow[MONTHS - 2];
  const net = thisMonth.income - thisMonth.expenses;
  const savingsRate = thisMonth.income > 0 ? (net / thisMonth.income) * 100 : null;

  // Spending by category, current month.
  const currentKey = format(now, "yyyy-MM");
  const categoryTotals = new Map<string, number>();
  for (const t of recentWindow) {
    if (t.type !== "EXPENSE" || monthKey(t.date) !== currentKey) continue;
    categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.amount);
  }
  const spending = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, display: formatCurrency(value, undefined, { maximumFractionDigits: 0 }) }));

  // Net worth = all-time net cash flow + current portfolio value.
  const sum = (type: string) => totals.find((t) => t.type === type)?._sum.amount ?? 0;
  const cash = sum("INCOME") - sum("EXPENSE");
  const netWorth = cash + portfolio.totalValue;

  const incomeDelta = percentChange(thisMonth.income, lastMonth.income);
  const expenseDelta = percentChange(thisMonth.expenses, lastMonth.expenses);

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Net worth</p>
          <p className="text-5xl font-semibold tracking-tight">{formatCurrency(netWorth)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatCurrency(cash)} tracked cash + {formatCurrency(portfolio.totalValue)} in stocks
          </p>
        </div>
        <TransactionFormDialog
          trigger={
            <Button>
              <PlusIcon />
              Add transaction
            </Button>
          }
        />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={`${thisMonth.month} summary`}>
        <StatTile
          label={`Income · ${format(now, "MMMM")}`}
          value={formatCurrency(thisMonth.income)}
          footnote={
            incomeDelta != null && (
              <>
                <ChangeText value={incomeDelta}>{formatPercent(incomeDelta, { signed: true })}</ChangeText> vs last
                month
              </>
            )
          }
        />
        <StatTile
          label={`Expenses · ${format(now, "MMMM")}`}
          value={formatCurrency(thisMonth.expenses)}
          footnote={
            expenseDelta != null && (
              <>
                <ChangeText value={expenseDelta} invert>
                  {formatPercent(expenseDelta, { signed: true })}
                </ChangeText>{" "}
                vs last month
              </>
            )
          }
        />
        <StatTile
          label="Net cash flow"
          value={formatCurrency(net, undefined, { signDisplay: "exceptZero" })}
          footnote={savingsRate != null && `${formatPercent(savingsRate)} savings rate`}
        />
        <StatTile
          label="Portfolio"
          value={formatCurrency(portfolio.totalValue)}
          footnote={
            portfolio.holdings.length > 0 ? (
              <>
                <ChangeText value={portfolio.dayChange}>
                  {formatCurrency(portfolio.dayChange, undefined, { signDisplay: "exceptZero" })}
                </ChangeText>{" "}
                today
              </>
            ) : (
              "No holdings yet"
            )
          }
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cash flow</CardTitle>
          <CardDescription>Income and expenses over the last 12 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={cashFlow} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <CardDescription>{thisMonth.month}</CardDescription>
          </CardHeader>
          <CardContent>
            {spending.length > 0 ? (
              <BarListChart data={spending} seriesName="Spent" />
            ) : (
              <p className="text-sm text-muted-foreground">No expenses recorded this month.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Portfolio allocation</CardTitle>
            <CardDescription>Share of portfolio value by holding.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portfolio">
                  Manage <ArrowRightIcon />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {portfolio.holdings.length > 0 ? (
              <AllocationChart holdings={portfolio.holdings} />
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/portfolio" className="underline underline-offset-4">
                  Add your first holding
                </Link>{" "}
                to see your allocation.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">
                View all <ArrowRightIcon />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2">
          {latest.length > 0 ? (
            <TransactionTable transactions={latest.map(toTransactionDTO)} />
          ) : (
            <p className="px-2 text-sm text-muted-foreground">No transactions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
