"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import type { CustomerOrder } from "@/lib/types";
import { statusFlow, statusLabel } from "@/lib/status";
import { cn } from "@/lib/format";

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** Shows only the steps that apply to this order's method (pickup vs delivery). */
export function StatusTimeline({ order }: { order: CustomerOrder }) {
  if (order.status === "canceled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.04] p-5">
        <span className="grid size-9 place-items-center rounded-full bg-ink/10 text-ink">
          <X className="size-4" />
        </span>
        <div>
          <p className="font-semibold">This order was canceled</p>
          <p className="text-sm text-ink-muted">Questions? Text the cafe and include your order number.</p>
        </div>
      </div>
    );
  }

  const flow = statusFlow[order.method];
  const current = flow.indexOf(order.status);
  const reachedAt = (s: string) => order.statusHistory.findLast((h) => h.status === s)?.at;

  return (
    <ol className="relative">
      {flow.map((status, i) => {
        const done = i < current;
        const active = i === current;
        const at = reachedAt(status);
        return (
          <li key={status} className="relative flex gap-4 pb-7 last:pb-0">
            {i < flow.length - 1 && (
              <span className="absolute top-9 bottom-1 left-[1.05rem] w-0.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <motion.span
                  className="block w-full bg-navy"
                  initial={false}
                  animate={{ height: done ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            )}
            <span
              className={cn(
                "relative grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300",
                done && "border-navy bg-navy text-cream",
                active && "border-gold bg-gold text-ink",
                !done && !active && "border-line bg-cream text-ink/30",
              )}
            >
              {done ? <Check className="size-4" /> : <span className="text-sm font-bold">{i + 1}</span>}
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-gold"
                  animate={{ scale: [1, 1.45], opacity: [0.7, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  aria-hidden
                />
              )}
            </span>
            <div className="pt-1.5">
              <p className={cn("font-semibold", !done && !active && "text-ink/40")}>
                {statusLabel(status, order.method)}
                {active && <span className="sr-only"> (current status)</span>}
              </p>
              {(done || active) && at && <p className="text-sm text-ink-muted">{timeFmt.format(new Date(at))}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
