import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/staff";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AdminShell } from "@/components/admin/admin-shell";
import { SetupNotice } from "@/components/admin/setup-notice";

// Signed-in staff pages depend on the session, so they render per request (no instant-navigation prefetch).
// Each page also sets `instant = false`, since this gate may not render them.
export const instant = false;

/**
 * Every dashboard page is behind this gate: the session is verified with
 * Supabase Auth on the server and the user must be active staff.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f7f3ea]" aria-busy="true" />}>
      <StaffGate>{children}</StaffGate>
    </Suspense>
  );
}

async function StaffGate({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  const current = await getCurrentStaff();
  if (!current) redirect("/admin/login?error=not_staff");
  return <AdminShell staff={current.staff}>{children}</AdminShell>;
}
