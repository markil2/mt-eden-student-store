import type { FulfillmentMethod, Order, OrderStatus } from "@/lib/types";

/** The happy path for each fulfillment method. "canceled" can happen from any open step. */
export const statusFlow: Record<FulfillmentMethod, OrderStatus[]> = {
  pickup: ["received", "preparing", "ready", "completed"],
  delivery: ["received", "preparing", "ready", "out_for_delivery", "delivered"],
};

export function statusLabel(status: OrderStatus, method: FulfillmentMethod): string {
  switch (status) {
    case "received":
      return "Order received";
    case "preparing":
      return "Preparing";
    case "ready":
      return method === "pickup" ? "Ready for pickup" : "Ready for delivery";
    case "out_for_delivery":
      return "Out for delivery";
    case "completed":
      return "Picked up";
    case "delivered":
      return "Delivered";
    case "canceled":
      return "Canceled";
  }
}

export function isOpen(order: Order): boolean {
  return !["completed", "delivered", "canceled"].includes(order.status);
}

export function nextStatus(order: Order): OrderStatus | null {
  const flow = statusFlow[order.method];
  const i = flow.indexOf(order.status);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

/** Button text staff see for moving an order forward. */
export function advanceLabel(order: Order): string | null {
  const next = nextStatus(order);
  if (!next) return null;
  switch (next) {
    case "preparing":
      return "Start preparing";
    case "ready":
      return order.method === "pickup" ? "Ready for pickup" : "Ready for delivery";
    case "out_for_delivery":
      return "Out for delivery";
    case "completed":
      return "Mark picked up";
    case "delivered":
      return "Mark delivered";
    default:
      return null;
  }
}
