"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_CATEGORIES, CATEGORIES, type TransactionType } from "@/lib/categories";

const ALL = "all";

export function TransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const type = params.get("type") ?? ALL;
  const category = params.get("category") ?? ALL;
  const month = params.get("month") ?? "";
  const categories = type === ALL ? ALL_CATEGORIES : CATEGORIES[type as TransactionType] ?? ALL_CATEGORIES;

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === ALL) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const hasFilters = type !== ALL || category !== ALL || month !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={type}
        onValueChange={(value) => {
          const keepCategory = value === ALL || CATEGORIES[value as TransactionType].includes(category);
          update({ type: value, category: keepCategory ? category : ALL });
        }}
      >
        <SelectTrigger className="w-36" aria-label="Filter by type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All types</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
          <SelectItem value="EXPENSE">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={(value) => update({ category: value })}>
        <SelectTrigger className="w-44" aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="month"
        aria-label="Filter by month"
        className="w-44"
        value={month}
        onChange={(e) => update({ month: e.target.value })}
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.replace(pathname, { scroll: false })}>
          <XIcon />
          Clear
        </Button>
      )}
    </div>
  );
}
