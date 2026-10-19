import type { StoreSettings } from "@/lib/types";
import { formatCutoff } from "@/lib/data/settings";
import { zonedNow } from "@/lib/time";

export interface OrderingState {
  open: boolean;
  reason: "paused" | "after_cutoff" | null;
  /** Short line for banners and buttons */
  message: string;
}

/** True when `now` is at or after the "HH:MM" last-order time, in the school's time zone. */
export function isPastCutoff(cutoff: string, now: Date, timeZone: string): boolean {
  const [h, m] = cutoff.split(":").map(Number);
  const t = zonedNow(timeZone, now);
  return t.hours * 60 + t.minutes >= h * 60 + m;
}

/**
 * Whether customers can order right now. The last-order time applies to every
 * order, including after-school pickup/delivery (confirmed by the cafe).
 * The server runs the same check when an order is placed.
 */
export function orderingState(settings: StoreSettings, now: Date | null): OrderingState {
  if (settings.orderingPaused) return { open: false, reason: "paused", message: settings.pauseMessage };
  if (settings.enforceCutoff && now && isPastCutoff(settings.orderCutoff, now, settings.timezone)) {
    return {
      open: false,
      reason: "after_cutoff",
      message: `Online ordering is closed for today. Last orders are at ${formatCutoff(settings.orderCutoff)}.`,
    };
  }
  return { open: true, reason: null, message: "" };
}
