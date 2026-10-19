import type { StoreSettings } from "@/lib/types";

/**
 * Store settings defaults (editable from /admin in a later step).
 * Values marked "printed menu" come from public/menu-reference.png;
 * values marked "confirmed" came from the cafe team.
 */
export const defaultSettings: StoreSettings = {
  orderingPaused: false,
  pauseMessage: "Online ordering is paused right now. Check back soon!",
  orderCutoff: "08:00", // printed menu: "Last order @ 8am"
  enforceCutoff: true, // confirmed: applies to after-school orders too
  timezone: "America/Los_Angeles",
  // Confirmed by the cafe: open around 30 minutes before and after school; exact times vary.
  hours: [
    { label: "Before school", hours: "About 30 minutes before" },
    { label: "After school", hours: "About 30 minutes after" },
  ],
  hoursNote: "Exact times vary day to day.",
  pickup: {
    enabled: true,
    location: "Resting room, E Hall", // confirmed
  },
  // Confirmed: customers pick before or after school; no limit on orders per window.
  windows: [
    { id: "before-school", label: "Before school", detail: "About 30 minutes before school", pickup: true, delivery: true, capacity: null },
    { id: "after-school", label: "After school", detail: "About 30 minutes after school", pickup: true, delivery: true, capacity: null },
  ],
  delivery: {
    enabled: true,
    feeCents: 0, // confirmed: no delivery fee
    requireRoom: true, // printed menu: "Please include room number"
    eligibleRooms: null,
  },
  contact: {
    phone: "415-506-8593", // printed menu
    instagram: "@MTEdenEntrepreneurs", // printed menu
    instagramUrl: "https://www.instagram.com/mtedenentrepreneurs/",
    email: null,
  },
};

export function formatCutoff(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}
