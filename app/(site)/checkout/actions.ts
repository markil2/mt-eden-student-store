"use server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/orders/server";
import { isRateLimited } from "@/lib/rate-limit";

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Online ordering isn't connected yet. (The cafe still needs to finish setting up Supabase.)" };
  }
  // Generous on purpose: a whole school often shares one public IP address.
  if (await isRateLimited("place-order", 60, 300)) {
    return { ok: false, error: "Lots of orders are coming in right now. Please wait a minute and try again." };
  }
  return placeOrder(input);
}
