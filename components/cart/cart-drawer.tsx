"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useStoreData } from "@/lib/store/store-data";
import { isLineAvailable, subtotalCents } from "@/lib/pricing";
import { formatCents } from "@/lib/format";
import { Sheet } from "@/components/ui/sheet";
import { buttonClasses } from "@/components/ui/button";
import { CartLineItem } from "./cart-line";
import { useCatalog } from "@/lib/use-catalog";
import { useOrderingState } from "@/lib/use-ordering-state";

export function CartDrawer() {
  const lines = useCart((s) => s.lines);
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const availability = useStoreData((s) => s.availability);
  const ordering = useOrderingState();
  const paused = !ordering.open;
  const deliveryFee = useStoreData((s) => s.settings.delivery.feeCents);
  const { catalog } = useCatalog();

  // Clear "added" toasts so they don't cover the drawer's checkout button
  useEffect(() => {
    if (isOpen) toast.dismiss();
  }, [isOpen]);

  const subtotal = subtotalCents(lines, catalog);
  const hasUnavailable = lines.some((l) => !isLineAvailable(l, availability, catalog));
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const canCheckout = lines.length > 0 && !hasUnavailable && !paused;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setOpen}
      variant="side"
      title="Your order"
      description={count > 0 ? `${count} ${count === 1 ? "item" : "items"}` : undefined}
      footer={
        lines.length > 0 && (
          <div className="space-y-3">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatCents(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Classroom delivery</dt>
                <dd>{deliveryFee === 0 ? "Free" : `+${formatCents(deliveryFee)}`}</dd>
              </div>
            </dl>
            {hasUnavailable && (
              <p className="rounded-xl bg-gold-soft px-3 py-2 text-sm text-ink" role="alert">
                Something in your order just sold out. Remove it to continue.
              </p>
            )}
            {paused && (
              <p className="rounded-xl bg-gold-soft px-3 py-2 text-sm text-ink" role="alert">
                {ordering.message}
              </p>
            )}
            <Link
              href="/checkout"
              onClick={(e) => {
                if (!canCheckout) e.preventDefault();
                else setOpen(false);
              }}
              aria-disabled={!canCheckout}
              className={buttonClasses(
                "primary",
                "lg",
                `w-full justify-between px-6 ${canCheckout ? "" : "pointer-events-none opacity-45"}`,
              )}
            >
              <span>Checkout</span>
              <span className="tabular-nums">{formatCents(subtotal)}</span>
            </Link>
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-navy-soft text-navy">
            <ShoppingBag className="size-7" strokeWidth={1.5} />
          </div>
          <p className="mt-5 font-display text-2xl text-navy">Nothing here yet</p>
          <p className="mt-2 max-w-60 text-sm text-ink-muted">
            Breakfast sandwiches, cold brew, snacks — pick a favorite to get started.
          </p>
          <Link href="/menu" onClick={() => setOpen(false)} className={buttonClasses("secondary", "md", "mt-6")}>
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.li
                key={line.key}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.22 } }}
                className="overflow-hidden"
              >
                <CartLineItem line={line} available={isLineAvailable(line, availability, catalog)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Sheet>
  );
}
