import type { Metadata } from "next";
import { requireManagerPage } from "@/lib/auth/staff";
import { StaffManager } from "@/components/admin/staff-manager";

// Staff-only, session-dependent page (see the dashboard layout).
export const instant = false;

export const metadata: Metadata = { title: "Staff" };

/** Managers only (also enforced by database policies). */
export default async function Page() {
  await requireManagerPage();
  return <StaffManager />;
}
