import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { findOrderByNumberAndName, toCustomerOrder } from "@/lib/orders/server";
import { isRateLimited } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

/**
 * "Track an order" by number + first name. The same "not found" answer is
 * returned whether the number or the name is wrong, so it can't be used to
 * probe which order numbers exist.
 */
export async function POST(req: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "not_configured" }, { status: 503, headers: noStore });
  // Slows down anyone trying to guess number + name pairs. (Tracked pages re-check every 10s.)
  if (await isRateLimited("order-lookup", 120, 300)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: noStore });
  }
  let body: { number?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400, headers: noStore });
  }
  try {
    const order = await findOrderByNumberAndName(String(body.number ?? ""), String(body.name ?? ""));
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
    return NextResponse.json({ order: toCustomerOrder(order) }, { headers: noStore });
  } catch (err) {
    console.error("order lookup failed", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: noStore });
  }
}
