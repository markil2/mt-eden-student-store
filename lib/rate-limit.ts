import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/server";

/**
 * Per-visitor rate limit for public endpoints, stored in Postgres so it works
 * across serverless instances. Visitors are identified by a hash of their IP
 * (the raw IP is never stored). Fails open if the limiter itself errors, so a
 * database hiccup never blocks a real order.
 */
export async function isRateLimited(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    const key = `${bucket}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
    const { data, error } = await getServiceSupabase().rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === false;
  } catch (err) {
    console.error("rate limit check failed", err);
    return false;
  }
}
