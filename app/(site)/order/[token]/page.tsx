import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "@/components/order/order-view";

export const metadata: Metadata = {
  title: "Your order",
  // Private order links should never be indexed.
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <OrderView />
    </Suspense>
  );
}
