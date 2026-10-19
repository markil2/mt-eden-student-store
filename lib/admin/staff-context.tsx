"use client";

import { createContext, use } from "react";
import type { StaffMember } from "@/lib/types";

const StaffContext = createContext<StaffMember | null>(null);

export function StaffProvider({ staff, children }: { staff: StaffMember; children: React.ReactNode }) {
  return <StaffContext value={staff}>{children}</StaffContext>;
}

/** The signed-in staff member (verified on the server by the dashboard layout). */
export function useStaff(): StaffMember {
  const staff = use(StaffContext);
  if (!staff) throw new Error("useStaff must be used inside the admin dashboard");
  return staff;
}
