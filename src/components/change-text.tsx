import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Up/down value with an arrow icon, so direction never relies on color alone.
 * `invert` marks metrics where going up is bad (e.g. expenses).
 */
export function ChangeText({
  value,
  invert = false,
  children,
  className,
}: {
  value: number;
  invert?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = value > 0 ? ArrowUpRightIcon : value < 0 ? ArrowDownRightIcon : null;
  const good = invert ? value < 0 : value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5",
        value === 0 ? "text-muted-foreground" : good ? "text-positive" : "text-negative",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}
