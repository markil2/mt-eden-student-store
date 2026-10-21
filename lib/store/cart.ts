"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine, Selections } from "@/lib/types";
import { lineKey } from "@/lib/pricing";

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  /** Bumps on every add so the cart icon can animate. */
  addedTick: number;
  add: (productId: string, selections: Selections, quantity?: number) => void;
  /** Replace a line's selections/quantity (edit from cart). Merges if it now matches another line. */
  replace: (key: string, selections: Selections, quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

function upsert(lines: CartLine[], productId: string, selections: Selections, quantity: number): CartLine[] {
  const key = lineKey(productId, selections);
  const existing = lines.find((l) => l.key === key);
  if (existing) {
    return lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.quantity + quantity, 20) } : l));
  }
  return [...lines, { key, productId, selections, quantity }];
}

/** Bump when cart line format changes; older saved carts are cleared on load. */
export const CART_STORAGE_KEY = "mteden-cart";
export const CART_VERSION = 4;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      addedTick: 0,
      add: (productId, selections, quantity = 1) =>
        set((s) => ({ lines: upsert(s.lines, productId, selections, quantity), addedTick: s.addedTick + 1 })),
      replace: (key, selections, quantity) =>
        set((s) => {
          const line = s.lines.find((l) => l.key === key);
          if (!line) return s;
          const without = s.lines.filter((l) => l.key !== key);
          return { lines: upsert(without, line.productId, selections, quantity) };
        }),
      setQuantity: (key, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(quantity, 20) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_VERSION,
      // v2–v4: sandwich, bagel, chips and coffee options changed. Old carts are cleared.
      migrate: () => ({ lines: [] }),
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      skipHydration: true,
    },
  ),
);

export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);

/**
 * Should this tab pick up a cart saved by another tab? Only if it was saved by
 * the same version of the site. Otherwise an old tab (open across a deploy) and
 * a new tab would keep clearing and re-saving each other's cart in a loop.
 */
export function shouldSyncCartFromOtherTab(newValue: string | null): boolean {
  if (!newValue) return false;
  try {
    return (JSON.parse(newValue) as { version?: number }).version === CART_VERSION;
  } catch {
    return false;
  }
}
