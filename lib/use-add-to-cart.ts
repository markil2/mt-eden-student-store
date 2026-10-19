"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { useStoreData } from "@/lib/store/store-data";
import { useUI } from "@/lib/store/ui";
import { useOrderingState } from "@/lib/use-ordering-state";

/** One entry point for "add": customizable items open the options sheet, simple items go straight in. */
export function useAddToCart() {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const openCustomize = useUI((s) => s.openCustomize);
  const availability = useStoreData((s) => s.availability);
  const ordering = useOrderingState();

  return useCallback(
    (product: Product) => {
      if (availability[product.id] === false || product.priceCents <= 0) {
        toast(`${product.name} is sold out right now`);
        return;
      }
      if (!ordering.open) {
        toast(ordering.message);
        return;
      }
      if (product.optionGroups.length > 0) {
        openCustomize({ productId: product.id });
        return;
      }
      add(product.id, {});
      notifyAdded(product.name, () => setOpen(true));
    },
    [add, availability, openCustomize, ordering.open, ordering.message, setOpen],
  );
}

export function notifyAdded(name: string, onView: () => void) {
  toast(`${name} added`, {
    action: { label: "View order", onClick: onView },
    duration: 2600,
  });
}
