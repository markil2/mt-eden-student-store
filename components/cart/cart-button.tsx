"use client";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { selectCount, useCart } from "@/lib/store/cart";

export function CartButton() {
  const count = useCart(selectCount);
  const tick = useCart((s) => s.addedTick);
  const setOpen = useCart((s) => s.setOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="press relative grid size-11 place-items-center rounded-full text-navy transition-colors hover:bg-navy/[0.06]"
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      {/* Re-keyed on every add so the bag gives a small bump */}
      <motion.span
        key={tick}
        initial={tick > 0 ? { scale: 1, rotate: 0 } : false}
        animate={tick > 0 ? { scale: [1, 1.2, 1], rotate: [0, -8, 0] } : undefined}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="grid place-items-center"
      >
        <ShoppingBag className="size-5" strokeWidth={1.8} />
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[0.68rem] font-bold text-ink tabular-nums"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
