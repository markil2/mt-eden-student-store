"use client";

import { useStoreData } from "@/lib/store/store-data";
import { useOrderingState } from "@/lib/use-ordering-state";
import { formatCutoff } from "@/lib/data/settings";
import { cn } from "@/lib/format";

export function OrderingStatusBar() {
  const settings = useStoreData((s) => s.settings);
  const ordering = useOrderingState();
  const paused = !ordering.open;

  return (
    <div
      className={cn(
        "text-center text-[0.72rem] font-semibold tracking-wide sm:text-xs",
        paused ? "bg-gold text-ink" : "bg-navy text-cream",
      )}
      role="status"
    >
      <p className="container-page py-2">
        {paused ? (
          ordering.message
        ) : (
          <>
            <span className="sm:hidden">Order ahead</span>
            <span className="hidden sm:inline">Order ahead for pickup or classroom delivery</span>
            <span className="mx-2 text-gold" aria-hidden>
              ·
            </span>
            Last order {formatCutoff(settings.orderCutoff)}
          </>
        )}
      </p>
    </div>
  );
}
