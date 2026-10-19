"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import type { Order } from "@/lib/types";
import { useAdminOrders } from "@/lib/admin/orders-store";
import { isOpen } from "@/lib/status";
import { cn } from "@/lib/format";
import { OrderCard } from "./order-card";

const filters: { id: string; label: string; test: (o: Order) => boolean }[] = [
  { id: "active", label: "Active", test: isOpen },
  { id: "new", label: "New", test: (o) => o.status === "received" },
  { id: "preparing", label: "Preparing", test: (o) => o.status === "preparing" },
  { id: "ready", label: "Ready", test: (o) => o.status === "ready" || o.status === "out_for_delivery" },
  { id: "pickup", label: "Pickup", test: (o) => o.method === "pickup" && isOpen(o) },
  { id: "delivery", label: "Delivery", test: (o) => o.method === "delivery" && isOpen(o) },
  { id: "completed", label: "Completed", test: (o) => o.status === "completed" || o.status === "delivered" },
  { id: "all", label: "All", test: () => true },
];

export function OrdersBoard() {
  const ready = useAdminOrders((s) => s.loaded);
  const orders = useAdminOrders((s) => s.orders);
  const loadError = useAdminOrders((s) => s.error);
  const [filter, setFilter] = useState("active");
  const active = filters.find((f) => f.id === filter) ?? filters[0];

  // Open orders oldest-first (a queue); finished orders newest-first.
  const shown = orders
    .filter(active.test)
    .sort((a, b) =>
      isOpen(a) && isOpen(b)
        ? a.createdAt.localeCompare(b.createdAt)
        : isOpen(a) !== isOpen(b)
          ? Number(isOpen(b)) - Number(isOpen(a))
          : b.createdAt.localeCompare(a.createdAt),
    );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-navy">Orders</h1>
          <p className="mt-1 text-ink-muted">New orders appear here automatically. Tap the big button to move an order forward.</p>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Filter orders">
        {filters.map((f) => {
          const count = ready ? orders.filter(f.test).length : 0;
          const selected = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(f.id)}
              className={cn(
                "press flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                selected ? "bg-navy text-cream" : "bg-white text-ink/75 ring-1 ring-line hover:text-navy",
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", selected ? "bg-cream/20" : "bg-ink/[0.06]")}>{count}</span>
            </button>
          );
        })}
      </div>

      {loadError && (
        <p className="mt-6 rounded-xl bg-gold-soft px-4 py-3 text-sm" role="alert">
          Couldn&apos;t load orders: {loadError}
        </p>
      )}

      {ready && shown.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-3xl text-navy">All caught up.</p>
          <p className="mt-2 text-ink-muted">No orders in “{active.label}”.</p>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
