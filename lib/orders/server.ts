import "server-only";

import { createHash, createHmac } from "node:crypto";
import type { CartLine, FulfillmentMethod, Order } from "@/lib/types";
import { fetchPublicStoreData } from "@/lib/data/catalog-mapper";
import { isLineAvailable, missingRequiredGroup, unitPriceCents } from "@/lib/pricing";
import { orderingState } from "@/lib/ordering";
import { zonedNow } from "@/lib/time";
import { getServiceSupabase } from "@/lib/supabase/server";
import { ORDER_SELECT, mapOrder, type OrderRow } from "./mapper";

/**
 * Trusted order logic. Runs only on the server with the service role:
 * the browser sends *what* it wants; prices, stock, cutoff and windows are
 * all decided here from fresh database data.
 */

export interface PlaceOrderInput {
  idempotencyKey: string;
  lines: CartLine[];
  customerName: string;
  method: FulfillmentMethod;
  windowId: string;
  room: string | null;
  notes: string | null;
}

export type PlaceOrderResult = { ok: true; token: string; number: string } | { ok: false; error: string };

class OrderRejected extends Error {}

/**
 * The private link token is derived from the browser's random idempotency key,
 * so a retried submit gets the same link back. Only its hash is stored.
 */
function linkTokenFor(idempotencyKey: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", secret).update(`order-link:${idempotencyKey}`).digest("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export async function placeOrder(raw: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    const supabase = getServiceSupabase();

    // ── Validate the request shape ──
    const idempotencyKey = clean(raw.idempotencyKey, 64);
    if (!/^[A-Za-z0-9-]{16,64}$/.test(idempotencyKey)) throw new OrderRejected("Something went wrong. Please refresh and try again.");
    if (!Array.isArray(raw.lines) || raw.lines.length === 0) throw new OrderRejected("Your cart is empty.");
    if (raw.lines.length > 30) throw new OrderRejected("That's a lot of items! Please split it into smaller orders.");
    const method: FulfillmentMethod = raw.method === "delivery" ? "delivery" : "pickup";
    const customerName = clean(raw.customerName, 60);
    if (!customerName) throw new OrderRejected("Please enter your name.");
    const room = clean(raw.room, 20) || null;
    const notes = clean(raw.notes, 200) || null;

    // ── Fresh store data (never the cached copy) ──
    const store = await fetchPublicStoreData(supabase);
    const { settings, availability, products } = store;
    const catalog = Object.fromEntries(products.map((p) => [p.id, p]));
    const now = new Date();

    const ordering = orderingState(settings, now);
    if (!ordering.open) throw new OrderRejected(ordering.message);

    const methodOn = method === "pickup" ? settings.pickup.enabled : settings.delivery.enabled;
    if (!methodOn) throw new OrderRejected(method === "pickup" ? "Pickup isn't available right now." : "Classroom delivery isn't available right now.");
    if (method === "delivery" && settings.delivery.requireRoom && !room) throw new OrderRejected("Please enter your room number.");

    const window = settings.windows.find((w) => w.id === raw.windowId && w[method]);
    if (!window) throw new OrderRejected("Please choose when you'd like your order.");
    const serviceDate = zonedNow(settings.timezone, now).date;
    if (window.capacity !== null) {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("service_date", serviceDate)
        .eq("window_id", window.id)
        .neq("status", "canceled");
      if (error) throw error;
      if ((count ?? 0) >= window.capacity) throw new OrderRejected(`${window.label} is full today. Please choose another time.`);
    }

    // ── Re-price every line from the database ──
    const items = raw.lines.map((line) => {
      const product = catalog[line?.productId];
      const selections = line?.selections && typeof line.selections === "object" ? line.selections : {};
      const safeLine = { ...line, selections };
      if (!product || !isLineAvailable(safeLine, availability, catalog)) {
        throw new OrderRejected(`${product?.name ?? "An item in your cart"} just sold out. Please remove it and try again.`);
      }
      if (missingRequiredGroup(product, selections)) throw new OrderRejected(`Please finish choosing options for ${product.name}.`);
      // Only accept options that exist, within each group's limit.
      for (const group of product.optionGroups) {
        const chosen = selections[group.id] ?? [];
        if (chosen.length > group.max || chosen.some((id) => !group.options.some((o) => o.id === id))) {
          throw new OrderRejected(`Please re-choose options for ${product.name}.`);
        }
      }
      const quantity = Math.floor(Number(line.quantity));
      if (!(quantity >= 1 && quantity <= 20)) throw new OrderRejected("Quantities must be between 1 and 20.");
      const options = product.optionGroups.flatMap((group) =>
        (selections[group.id] ?? []).map((id) => {
          const o = group.options.find((x) => x.id === id)!;
          return { group_label: group.label, option_label: o.label, price_delta_cents: o.priceDeltaCents };
        }),
      );
      return {
        product_id: product.id,
        name: product.name,
        unit_price_cents: unitPriceCents(product, selections),
        quantity,
        options,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
    const fee = method === "delivery" ? settings.delivery.feeCents : 0;
    const token = linkTokenFor(idempotencyKey);

    const { data, error } = await supabase.rpc("create_order", {
      p_order: {
        lookup_token_hash: hashToken(token),
        idempotency_key: idempotencyKey,
        service_date: serviceDate,
        customer_name: customerName,
        method,
        window_id: window.id,
        window_label: window.label,
        room: method === "delivery" ? room : null,
        notes,
        subtotal_cents: subtotal,
        delivery_fee_cents: fee,
        total_cents: subtotal + fee,
        // Customers pay cash or Zelle in person; the order starts unpaid (set by create_order).
      },
      p_items: items,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { out_number: number } | null;
    if (!row) throw new Error("create_order returned nothing");

    return { ok: true, token, number: String(row.out_number) };
  } catch (err) {
    if (err instanceof OrderRejected) return { ok: false, error: err.message };
    console.error("placeOrder failed", err);
    return { ok: false, error: "We couldn't place your order. Please try again in a moment." };
  }
}

/** Customer view of an order by its private link token. */
export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const { data, error } = await getServiceSupabase()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("lookup_token_hash", hashToken(token))
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as unknown as OrderRow) : null;
}

/** "Track an order": needs the order number AND the first name on it. */
export async function findOrderByNumberAndName(number: string, name: string): Promise<Order | null> {
  const n = Number(String(number).replace(/\D/g, ""));
  const first = clean(name, 60).toLowerCase().split(" ")[0];
  if (!Number.isSafeInteger(n) || n <= 0 || !first) return null;
  const { data, error } = await getServiceSupabase().from("orders").select(ORDER_SELECT).eq("number", n).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const order = mapOrder(data as unknown as OrderRow);
  return order.customerName.toLowerCase().split(" ")[0] === first ? order : null;
}

/** Removes fields customers don't need before sending an order to the browser. */
export function toCustomerOrder(order: Order): Omit<Order, "id"> {
  const { id, ...rest } = order;
  void id;
  return rest;
}
