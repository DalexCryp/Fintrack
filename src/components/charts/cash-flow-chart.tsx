"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export type CashFlowPoint = { month: string; label: string; income: number; expenses: number };

const SERIES = [
  { key: "income", name: "Income", color: "var(--chart-1)" },
  { key: "expenses", name: "Expenses", color: "var(--chart-2)" },
] as const;

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <div className="grid gap-3">
      <ul className="flex gap-4 text-xs text-muted-foreground" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
            {s.name}
          </li>
        ))}
      </ul>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            barGap={2}
            barCategoryGap="28%"
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickMargin={8}
              interval="preserveStartEnd"
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickFormatter={(v: number) => formatCompactCurrency(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  label={props.payload?.[0]?.payload?.month}
                  payload={props.payload}
                  formatValue={(v) => formatCurrency(v)}
                />
              )}
            />
            {SERIES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
