"use client";

type TooltipItem = {
  name?: string | number;
  value?: unknown;
  color?: string;
  payload?: Record<string, unknown>;
};

/**
 * Shared Recharts tooltip body: series swatch beside ink-colored text, so the
 * value text never wears the series color.
 */
export function ChartTooltip({
  active,
  label,
  payload,
  formatValue,
}: {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipItem[];
  formatValue: (value: number, item: TooltipItem) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10">
      {label != null && label !== "" && <p className="mb-1.5 font-medium">{label}</p>}
      <ul className="grid gap-1">
        {payload.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} aria-hidden />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums">{formatValue(Number(item.value), item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
