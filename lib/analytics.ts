import type { Order } from "@/lib/types";

/** Only money staff actually collected counts as a sale ("mock_paid" = early test orders). */
export function isVerifiedSale(order: Order): boolean {
  return (order.paymentStatus === "paid" || order.paymentStatus === "mock_paid") && order.status !== "canceled";
}

export function summarize(orders: Order[]) {
  const sales = orders.filter(isVerifiedSale);
  const revenueCents = sales.reduce((s, o) => s + o.totalCents, 0);

  const itemCounts = new Map<string, { name: string; quantity: number; revenueCents: number }>();
  for (const order of sales) {
    for (const line of order.lines) {
      const entry = itemCounts.get(line.productId) ?? { name: line.name, quantity: 0, revenueCents: 0 };
      entry.quantity += line.quantity;
      entry.revenueCents += line.unitPriceCents * line.quantity;
      itemCounts.set(line.productId, entry);
    }
  }

  return {
    totalOrders: orders.length,
    openOrders: orders.filter((o) => !["completed", "delivered", "canceled"].includes(o.status)).length,
    completedOrders: orders.filter((o) => o.status === "completed" || o.status === "delivered").length,
    canceledOrders: orders.filter((o) => o.status === "canceled").length,
    unverifiedOrders: orders.filter((o) => !isVerifiedSale(o)).length,
    revenueCents,
    averageCents: sales.length ? Math.round(revenueCents / sales.length) : 0,
    pickupCount: orders.filter((o) => o.method === "pickup" && o.status !== "canceled").length,
    deliveryCount: orders.filter((o) => o.method === "delivery" && o.status !== "canceled").length,
    popularItems: [...itemCounts.values()].sort((a, b) => b.quantity - a.quantity),
  };
}

/** Verified sales per day for the last `days` days (oldest first), keyed by local date. */
export function dailySales(orders: Order[], days = 7, now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const result: { key: string; label: string; revenueCents: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({ key: d.toDateString(), label: i === 0 ? "Today" : fmt.format(d), revenueCents: 0, orders: 0 });
  }
  for (const order of orders.filter(isVerifiedSale)) {
    const day = result.find((r) => r.key === new Date(order.createdAt).toDateString());
    if (day) {
      day.revenueCents += order.totalCents;
      day.orders += 1;
    }
  }
  return result;
}
