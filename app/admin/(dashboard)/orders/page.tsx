import type { Metadata } from "next";
import { OrdersBoard } from "@/components/admin/orders-board";

// Staff-only, session-dependent page (see the dashboard layout).
export const instant = false;

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return <OrdersBoard />;
}
