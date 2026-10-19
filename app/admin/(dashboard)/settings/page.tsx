import type { Metadata } from "next";
import { requireManagerPage } from "@/lib/auth/staff";
import { SettingsPanel } from "@/components/admin/settings-form";

// Staff-only, session-dependent page (see the dashboard layout).
export const instant = false;

export const metadata: Metadata = { title: "Settings" };

/** Managers only (also enforced by database policies). */
export default async function Page() {
  await requireManagerPage();
  return <SettingsPanel />;
}
