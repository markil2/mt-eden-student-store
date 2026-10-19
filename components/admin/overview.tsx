"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminOrders } from "@/lib/admin/orders-store";
import { useStaff } from "@/lib/admin/staff-context";
import { useStoreData } from "@/lib/store/store-data";
import { zonedNow } from "@/lib/time";
import { setOrderingPausedAction } from "@/app/admin/actions";
import { summarize } from "@/lib/analytics";
import { isOpen } from "@/lib/status";
import { formatCents } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { StatTile } from "./stat-tile";
import { OrderCard } from "./order-card";

export function Overview() {
  const ready = useAdminOrders((s) => s.loaded);
  const orders = useAdminOrders((s) => s.orders);
  const settings = useStoreData((s) => s.settings);
  const staff = useStaff();
  const [saving, setSaving] = useState(false);
  // Today's numbers, in the school's time zone.
  const today = zonedNow(settings.timezone).date;
  const todays = orders.filter((o) => zonedNow(settings.timezone, new Date(o.createdAt)).date === today);
  const stats = summarize(todays);

  async function togglePaused(on: boolean) {
    setSaving(true);
    const result = await setOrderingPausedAction(!on);
    setSaving(false);
    if (!result.ok) toast(result.error);
  }
  const queue = orders.filter(isOpen).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 4);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-navy">Store overview</h1>
          <p className="mt-1 text-ink-muted">Here&apos;s how the store is doing right now.</p>
        </div>
        {staff.role === "manager" && (
          <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
            <span className="text-sm font-semibold">{saving ? "Saving…" : "Online ordering on"}</span>
            <Switch checked={!settings.orderingPaused} onCheckedChange={togglePaused} label="Online ordering on" />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile accent label="Open orders" value={ready ? orders.filter(isOpen).length : "–"} note="Need attention" />
        <StatTile label="Collected today" value={ready ? formatCents(stats.revenueCents) : "–"} note="Orders marked paid" />
        <StatTile label="Completed today" value={ready ? stats.completedOrders : "–"} />
        <StatTile label="Pickup / delivery today" value={ready ? `${stats.pickupCount} / ${stats.deliveryCount}` : "–"} />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Up next</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-navy">
            All orders <ArrowRight className="size-4" />
          </Link>
        </div>
        {ready && queue.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink-muted ring-1 ring-line">No open orders. Nice work!</p>
        ) : (
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            {queue.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
