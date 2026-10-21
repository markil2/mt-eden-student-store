import type { Availability } from "@/lib/types";
import { products } from "./menu";

/** Default stock state. Staff will toggle this from /admin; Phase 2 moves it to Supabase. */
export const defaultAvailability: Availability = {
  ...Object.fromEntries(products.map((p) => [p.id, true])),
  "chai-latte": false, // "OOS" on the printed menu
  "energy-drink": false, // confirmed sold out
};
