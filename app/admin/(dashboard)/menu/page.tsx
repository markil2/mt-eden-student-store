import type { Metadata } from "next";
import { MenuManager } from "@/components/admin/menu-manager";

// Staff-only, session-dependent page (see the dashboard layout).
export const instant = false;

export const metadata: Metadata = { title: "Menu" };

export default function Page() {
  return <MenuManager />;
}
