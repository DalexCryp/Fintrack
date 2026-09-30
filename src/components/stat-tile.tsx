import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  footnote,
}: {
  label: string;
  value: string;
  footnote?: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {footnote && <div className="text-xs text-muted-foreground">{footnote}</div>}
      </CardContent>
    </Card>
  );
}
