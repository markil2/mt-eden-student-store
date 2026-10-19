import type { Order, OrderStatus, PaymentMethod, PaymentStatus, FulfillmentMethod } from "@/lib/types";

/** Columns needed to show an order (staff dashboard and customer status page). */
export const ORDER_SELECT =
  "id, number, created_at, customer_name, method, window_id, window_label, room, notes, subtotal_cents, delivery_fee_cents, total_cents, status, payment_status, payment_method, order_items(product_id, name, unit_price_cents, quantity, sort, order_item_options(option_label, sort)), order_status_history(status, created_at)";

export interface OrderRow {
  id: string;
  number: number;
  created_at: string;
  customer_name: string;
  method: FulfillmentMethod;
  window_id: string;
  window_label: string;
  room: string | null;
  notes: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  order_items: {
    product_id: string;
    name: string;
    unit_price_cents: number;
    quantity: number;
    sort: number;
    order_item_options: { option_label: string; sort: number }[];
  }[];
  order_status_history: { status: OrderStatus; created_at: string }[];
}

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: String(row.number),
    createdAt: row.created_at,
    customerName: row.customer_name,
    method: row.method,
    windowId: row.window_id,
    windowLabel: row.window_label,
    room: row.room,
    notes: row.notes,
    subtotalCents: row.subtotal_cents,
    deliveryFeeCents: row.delivery_fee_cents,
    totalCents: row.total_cents,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method ?? null,
    lines: [...(row.order_items ?? [])].sort(bySort).map((item) => ({
      productId: item.product_id,
      name: item.name,
      unitPriceCents: item.unit_price_cents,
      quantity: item.quantity,
      options: [...(item.order_item_options ?? [])].sort(bySort).map((o) => o.option_label),
    })),
    statusHistory: [...(row.order_status_history ?? [])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((h) => ({ status: h.status, at: h.created_at })),
  };
}
