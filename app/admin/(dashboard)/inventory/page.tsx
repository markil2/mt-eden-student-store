import type { Metadata } from "next";
import { InventoryManager } from "@/components/admin/inventory-manager";

// Staff-only, session-dependent page (see the dashboard layout).
export const instant = false;

export const metadata: Metadata = { title: "Inventory" };

/** Any staff can update counts; managers can add ingredients and link them (also enforced by the database). */
export default function Page() {
  return <InventoryManager />;
}
