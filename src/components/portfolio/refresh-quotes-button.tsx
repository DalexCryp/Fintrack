"use client";

import { useTransition } from "react";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { refreshQuotes } from "@/app/actions/portfolio";
import { cn } from "@/lib/utils";

export function RefreshQuotesButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await refreshQuotes();
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      <RefreshCwIcon className={cn(pending && "animate-spin")} />
      Refresh prices
    </Button>
  );
}
