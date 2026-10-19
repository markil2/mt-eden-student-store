import { Overview } from "@/components/admin/overview";

// Staff-only, session-dependent page (see the dashboard layout).
export const instant = false;

export default function AdminHome() {
  return <Overview />;
}
