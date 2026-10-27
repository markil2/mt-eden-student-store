"use server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/orders/server";
import { isRateLimited } from "@/lib/rate-limit";
import { updateTag } from "next/cache";
import { STORE_DATA_TAG } from "@/lib/data/public-data";

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Online ordering isn't connected yet. (The cafe still needs to finish setting up Supabase.)" };
  }
  // Generous on purpose: a whole school often shares one public IP address.
  if (await isRateLimited("place-order", 60, 300)) {
    return { ok: false, error: "Lots of orders are coming in right now. Please wait a minute and try again." };
  }
  const result = await placeOrder(input);
  // Counts changed: refresh the cached menu so the next visitor sees what's left.
  if (result.ok) updateTag(STORE_DATA_TAG);
  return result;
}
