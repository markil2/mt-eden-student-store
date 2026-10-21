import { describe, expect, it } from "vitest";
import type { Order } from "@/lib/types";
import { advanceLabel, nextStatus, statusFlow, statusLabel } from "@/lib/status";
import { isPastCutoff, orderingState } from "@/lib/ordering";
import { zonedNow } from "@/lib/time";
import { defaultSettings } from "@/lib/data/settings";
import { isVerifiedSale, summarize } from "@/lib/analytics";
import { CART_VERSION, shouldSyncCartFromOtherTab } from "@/lib/store/cart";

const order = (patch: Partial<Order>): Order => ({
  id: "1",
  number: "1001",
  createdAt: "2026-10-19T15:00:00Z",
  customerName: "Test",
  method: "pickup",
  windowId: "before-school",
  windowLabel: "Before school",
  room: null,
  notes: null,
  lines: [{ productId: "water", name: "Water", options: [], unitPriceCents: 100, quantity: 2 }],
  subtotalCents: 200,
  deliveryFeeCents: 0,
  totalCents: 200,
  paymentStatus: "pending",
  paymentMethod: null,
  status: "received",
  statusHistory: [],
  ...patch,
});

describe("order workflow", () => {
  it("pickup and delivery have the right steps", () => {
    expect(statusFlow.pickup).toEqual(["received", "preparing", "ready", "completed"]);
    expect(statusFlow.delivery).toEqual(["received", "preparing", "ready", "out_for_delivery", "delivered"]);
  });

  it("moves one step at a time and stops at the end", () => {
    expect(nextStatus(order({ status: "ready" }))).toBe("completed");
    expect(nextStatus(order({ method: "delivery", status: "ready" }))).toBe("out_for_delivery");
    expect(nextStatus(order({ status: "completed" }))).toBeNull();
    expect(nextStatus(order({ status: "canceled" }))).toBeNull();
  });

  it("labels ready differently for pickup vs delivery", () => {
    expect(statusLabel("ready", "pickup")).toBe("Ready for pickup");
    expect(statusLabel("ready", "delivery")).toBe("Ready for delivery");
    expect(advanceLabel(order({ method: "delivery", status: "out_for_delivery" }))).toBe("Mark delivered");
  });
});

describe("last-order cutoff (school time zone)", () => {
  const tz = "America/Los_Angeles";
  // 15:30 UTC = 8:30 AM Pacific (daylight time in October)
  const after = new Date("2026-10-19T15:30:00Z");
  const before = new Date("2026-10-19T14:30:00Z");

  it("reads wall-clock time in the school's time zone", () => {
    expect(zonedNow(tz, after)).toEqual({ hours: 8, minutes: 30, date: "2026-10-19" });
  });

  it("closes ordering at 8 AM, for after-school orders too", () => {
    expect(isPastCutoff("08:00", after, tz)).toBe(true);
    expect(isPastCutoff("08:00", before, tz)).toBe(false);
    expect(orderingState(defaultSettings, after).reason).toBe("after_cutoff");
    expect(orderingState(defaultSettings, before).open).toBe(true);
  });

  it("lets staff switch the cutoff off, and pausing always wins", () => {
    expect(orderingState({ ...defaultSettings, enforceCutoff: false }, after).open).toBe(true);
    expect(orderingState({ ...defaultSettings, orderingPaused: true }, before).reason).toBe("paused");
  });
});

describe("sales numbers only count money collected", () => {
  it("counts paid orders and skips unpaid or canceled ones", () => {
    const orders = [
      order({ paymentStatus: "paid", paymentMethod: "cash", totalCents: 500 }),
      order({ paymentStatus: "paid", paymentMethod: "zelle", totalCents: 300, method: "delivery" }),
      order({ paymentStatus: "pending", totalCents: 900 }),
      order({ paymentStatus: "paid", status: "canceled", totalCents: 700 }),
    ];
    expect(orders.map(isVerifiedSale)).toEqual([true, true, false, false]);
    const s = summarize(orders);
    expect(s.revenueCents).toBe(800);
    expect(s.pickupCount).toBe(2);
    expect(s.deliveryCount).toBe(1);
  });
});

describe("cart sync between tabs", () => {
  it("only syncs carts saved by the same version, so old and new tabs can't loop", () => {
    expect(shouldSyncCartFromOtherTab(JSON.stringify({ state: { lines: [] }, version: CART_VERSION }))).toBe(true);
    expect(shouldSyncCartFromOtherTab(JSON.stringify({ state: { lines: [] }, version: CART_VERSION - 1 }))).toBe(false);
    expect(shouldSyncCartFromOtherTab(null)).toBe(false);
    expect(shouldSyncCartFromOtherTab("not json")).toBe(false);
  });
});
