"use server";

import { updateTag } from "next/cache";
import type { StoreSettings } from "@/lib/types";
import { NotAuthorized, requireStaff } from "@/lib/auth/staff";
import { STORE_DATA_TAG } from "@/lib/data/public-data";
import { getServiceSupabase } from "@/lib/supabase/server";

/**
 * Staff/manager mutations. Each one:
 *   1. verifies the signed-in user and role on the server (requireStaff),
 *   2. writes with that user's session so database RLS checks it again,
 *   3. refreshes the cached public menu so customers see the change.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (err instanceof NotAuthorized) return { ok: false, error: err.message };
    console.error("admin action failed", err);
    const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Something went wrong.";
    return { ok: false, error: message };
  }
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const cents = (v: unknown, max: number) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0 || n > max) throw new Error("Please enter a valid amount.");
  return n;
};

/* ── Menu ──────────────────────────────────────────────────────────── */

export async function setAvailabilityAction(productId: string, available: boolean): Promise<ActionResult> {
  return run(async () => {
    const { supabase, staff } = await requireStaff("staff");
    const { error } = await supabase
      .from("product_availability")
      .update({ is_available: Boolean(available), updated_at: new Date().toISOString(), updated_by: staff.userId })
      .eq("product_id", productId);
    if (error) throw error;
    updateTag(STORE_DATA_TAG);
  });
}

export interface ProductInput {
  name: string;
  description: string;
  priceCents: number;
  categoryId: string;
  popular: boolean;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

function productRow(input: ProductInput) {
  const name = text(input.name, 80);
  if (!name) throw new Error("Name can't be empty.");
  return {
    name,
    description: text(input.description, 200) || null,
    price_cents: cents(input.priceCents, 10000),
    category_id: text(input.categoryId, 40),
    popular: Boolean(input.popular),
    updated_at: new Date().toISOString(),
    ...(input.imageUrl !== undefined
      ? {
          image_url: input.imageUrl ? text(input.imageUrl, 500) : null,
          image_alt: input.imageAlt ? text(input.imageAlt, 200) : name,
          // A photo uploaded by staff is a real cafe photo, not a stock placeholder.
          image_is_placeholder: false,
        }
      : {}),
  };
}

export async function updateProductAction(productId: string, input: ProductInput): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaff("manager");
    const { error } = await supabase.from("products").update(productRow(input)).eq("id", productId);
    if (error) throw error;
    updateTag(STORE_DATA_TAG);
  });
}

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaff("manager");
    const row = productRow(input);
    const base = row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
    const id = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: last } = await supabase.from("products").select("sort").order("sort", { ascending: false }).limit(1);
    const { error } = await supabase.from("products").insert({ id, ...row, sort: (last?.[0]?.sort ?? 0) + 1 });
    if (error) throw error;
    const { error: stockError } = await supabase.from("product_availability").insert({ product_id: id, is_available: true });
    if (stockError) throw stockError;
    updateTag(STORE_DATA_TAG);
  });
}

/** Hides an item from the menu without deleting it (past orders keep their snapshot either way). */
export async function archiveProductAction(productId: string): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaff("manager");
    const { error } = await supabase.from("products").update({ archived: true }).eq("id", productId);
    if (error) throw error;
    updateTag(STORE_DATA_TAG);
  });
}

/* ── Store settings ────────────────────────────────────────────────── */

export async function saveSettingsAction(settings: StoreSettings): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaff("manager");
    if (!/^[0-2]\d:[0-5]\d$/.test(settings.orderCutoff)) throw new Error("Enter a valid last-order time.");
    if (!settings.windows.length) throw new Error("Add at least one pickup/delivery time.");

    const { error } = await supabase
      .from("store_settings")
      .update({
        ordering_paused: Boolean(settings.orderingPaused),
        pause_message: text(settings.pauseMessage, 200) || "Online ordering is paused right now.",
        order_cutoff: settings.orderCutoff,
        enforce_cutoff: Boolean(settings.enforceCutoff),
        pickup_enabled: Boolean(settings.pickup.enabled),
        pickup_location: text(settings.pickup.location, 100),
        delivery_enabled: Boolean(settings.delivery.enabled),
        delivery_fee_cents: cents(settings.delivery.feeCents, 2000),
        require_room: Boolean(settings.delivery.requireRoom),
        hours: settings.hours.slice(0, 10).map((h) => ({ label: text(h.label, 40), hours: text(h.hours, 80) })),
        hours_note: text(settings.hoursNote, 200),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw error;

    // Upsert the windows that remain; deactivate the ones that were removed.
    const rows = settings.windows.map((w, i) => {
      const label = text(w.label, 40);
      if (!label) throw new Error("Every pickup/delivery time needs a name.");
      return {
        id: text(w.id, 60) || `window-${i}`,
        label,
        detail: text(w.detail, 100),
        pickup: Boolean(w.pickup),
        delivery: Boolean(w.delivery),
        capacity: w.capacity && w.capacity > 0 ? Math.floor(w.capacity) : null,
        sort: i,
        active: true,
      };
    });
    const { error: upsertError } = await supabase.from("fulfillment_windows").upsert(rows);
    if (upsertError) throw upsertError;
    const keep = rows.map((r) => r.id);
    const { error: deactivateError } = await supabase
      .from("fulfillment_windows")
      .update({ active: false })
      .not("id", "in", `(${keep.map((id) => `"${id}"`).join(",")})`);
    if (deactivateError) throw deactivateError;

    updateTag(STORE_DATA_TAG);
  });
}

/** Quick pause/resume from the overview page. */
export async function setOrderingPausedAction(paused: boolean): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaff("manager");
    const { error } = await supabase.from("store_settings").update({ ordering_paused: Boolean(paused) }).eq("id", 1);
    if (error) throw error;
    updateTag(STORE_DATA_TAG);
  });
}

/* ── Staff accounts (managers only) ────────────────────────────────── */

export async function createStaffAction(input: {
  displayName: string;
  email: string;
  password: string;
  role: "staff" | "manager";
}): Promise<ActionResult> {
  return run(async () => {
    await requireStaff("manager");
    const email = text(input.email, 120).toLowerCase();
    const displayName = text(input.displayName, 60);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email.");
    if (!displayName) throw new Error("Enter a name.");
    if (typeof input.password !== "string" || input.password.length < 8) throw new Error("Passwords need at least 8 characters.");

    // Creating auth users needs the service role; this runs only after the manager check above.
    const admin = getServiceSupabase();
    const { data, error } = await admin.auth.admin.createUser({ email, password: input.password, email_confirm: true });
    if (error) throw error;
    const { error: staffError } = await admin.from("staff").insert({
      user_id: data.user.id,
      display_name: displayName,
      email,
      role: input.role === "manager" ? "manager" : "staff",
    });
    if (staffError) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw staffError;
    }
  });
}

export async function updateStaffAction(
  userId: string,
  patch: { role?: "staff" | "manager"; active?: boolean },
): Promise<ActionResult> {
  return run(async () => {
    const { supabase, staff } = await requireStaff("manager");
    if (userId === staff.userId) throw new Error("You can't change your own role or access.");
    const update: Record<string, unknown> = {};
    if (patch.role) update.role = patch.role === "manager" ? "manager" : "staff";
    if (patch.active !== undefined) update.active = Boolean(patch.active);
    const { error } = await supabase.from("staff").update(update).eq("user_id", userId);
    if (error) throw error;
  });
}

export async function resetStaffPasswordAction(userId: string, password: string): Promise<ActionResult> {
  return run(async () => {
    await requireStaff("manager");
    if (typeof password !== "string" || password.length < 8) throw new Error("Passwords need at least 8 characters.");
    const { error } = await getServiceSupabase().auth.admin.updateUserById(userId, { password });
    if (error) throw error;
  });
}
