import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getOrderByToken, toCustomerOrder } from "@/lib/orders/server";

const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

/** Customer order status by private link token. Polled by the order page. */
export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[token]">) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "not_configured" }, { status: 503, headers: noStore });
  const { token } = await ctx.params;
  try {
    const order = await getOrderByToken(token);
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
    return NextResponse.json({ order: toCustomerOrder(order) }, { headers: noStore });
  } catch (err) {
    console.error("order lookup failed", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: noStore });
  }
}
