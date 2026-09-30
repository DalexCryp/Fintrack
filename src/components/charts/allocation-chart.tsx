import { BarListChart } from "@/components/charts/bar-list-chart";
import { formatPercent } from "@/lib/format";
import type { Holding } from "@/lib/portfolio";

const MAX_ROWS = 8;

/** Holdings by portfolio weight; the tail past eight rows folds into "Other". */
export function AllocationChart({ holdings }: { holdings: Holding[] }) {
  const weighted = holdings.filter((h) => h.weight != null && h.weight > 0);
  if (weighted.length === 0) {
    return <p className="text-sm text-muted-foreground">No priced holdings to chart.</p>;
  }

  const rows = weighted.slice(0, MAX_ROWS).map((h) => ({ label: h.ticker, value: h.weight! }));
  const rest = weighted.slice(MAX_ROWS).reduce((sum, h) => sum + h.weight!, 0);
  if (rest > 0) rows.push({ label: "Other", value: rest });

  return (
    <BarListChart
      seriesName="Weight"
      data={rows.map((r) => ({ ...r, display: formatPercent(r.value) }))}
    />
  );
}
