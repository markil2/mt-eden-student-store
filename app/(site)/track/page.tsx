import type { Metadata } from "next";
import { TrackForm } from "@/components/order/track-form";

export const metadata: Metadata = { title: "Track an order", robots: { index: false } };

export default function TrackPage() {
  return <TrackForm />;
}
