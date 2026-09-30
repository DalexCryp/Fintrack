"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";

export type BarListItem = {
  label: string;
  value: number;
  /** Preformatted value shown at the bar tip and in the tooltip. */
  display: string;
};

const ROW_HEIGHT = 36;

/** Ranked single-series horizontal bars with the value at each bar's tip. */
export function BarListChart({ data, seriesName }: { data: BarListItem[]; seriesName: string }) {
  const longestLabel = Math.max(...data.map((d) => d.label.length), 4);

  return (
    <div className="w-full" style={{ height: data.length * ROW_HEIGHT + 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 88, bottom: 4, left: 0 }}
          barCategoryGap={8}
          accessibilityLayer
        >
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={Math.min(longestLabel * 7.5 + 12, 140)}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-grid)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                label={props.payload?.[0]?.payload?.label}
                payload={props.payload}
                formatValue={(_, item) => String(item.payload?.display ?? "")}
              />
            )}
          />
          <Bar
            dataKey="value"
            name={seriesName}
            fill="var(--chart-1)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="display"
              position="right"
              offset={8}
              style={{ fill: "var(--foreground)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
