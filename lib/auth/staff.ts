import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffMember } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Data access layer for staff auth. Every admin page and server action goes
 * through here; the database (RLS + is_staff/is_manager) enforces the same rules again.
 */
export async function getCurrentStaff(): Promise<{ staff: StaffMember; supabase: SupabaseClient } | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await getServerSupabase();
  // getUser() verifies the session with Supabase Auth (cookies alone aren't trusted).
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: row } = await supabase
    .from("staff")
    .select("user_id, display_name, email, role, active")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!row || !row.active) return null;
  return {
    supabase,
    staff: {
      userId: row.user_id,
      email: row.email || auth.user.email || "",
      displayName: row.display_name,
      role: row.role === "manager" ? "manager" : "staff",
    },
  };
}

export class NotAuthorized extends Error {}

/** For server actions: returns the signed-in staff member or throws. */
export async function requireStaff(role: "staff" | "manager" = "staff") {
  const current = await getCurrentStaff();
  if (!current) throw new NotAuthorized("Please sign in again.");
  if (role === "manager" && current.staff.role !== "manager") throw new NotAuthorized("Only managers can do that.");
  return current;
}

/** For manager-only pages: sends regular staff back to the overview. */
export async function requireManagerPage(): Promise<StaffMember> {
  const current = await getCurrentStaff();
  if (!current) redirect("/admin/login");
  if (current.staff.role !== "manager") redirect("/admin");
  return current.staff;
}
