"use client";

import { AnimatePresence, motion } from "motion/react";
import { selectCount, useCart } from "@/lib/store/cart";
import { subtotalCents } from "@/lib/pricing";
import { formatCents } from "@/lib/format";
import { useCatalog } from "@/lib/use-catalog";

/** Sticky "View order" bar on phones so the cart is always one tap away while browsing. */
export function MobileCartBar() {
  const count = useCart(selectCount);
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const { catalog } = useCatalog();

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "120%" }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="press flex h-14 w-full items-center justify-between rounded-full bg-navy px-6 text-cream shadow-[0_12px_32px_-8px_rgb(10_52_115/0.55)]"
          >
            <span className="flex items-center gap-3 font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-gold text-sm font-bold text-ink tabular-nums">{count}</span>
              View order
            </span>
            <span className="font-semibold tabular-nums">{formatCents(subtotalCents(lines, catalog))}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
