"use client";

import { useAdminOrders } from "@/lib/admin/orders-store";
import { dailySales, summarize } from "@/lib/analytics";
import { formatCents } from "@/lib/format";
import { StatTile } from "./stat-tile";

export function AnalyticsView() {
  const ready = useAdminOrders((s) => s.loaded);
  const orders = useAdminOrders((s) => s.orders);
  if (!ready) return <div className="min-h-[50vh]" aria-busy="true" />;

  const stats = summarize(orders);
  const days = dailySales(orders);
  const maxDay = Math.max(1, ...days.map((d) => d.revenueCents));
  const topItems = stats.popularItems.slice(0, 6);
  const maxItem = Math.max(1, ...topItems.map((i) => i.quantity));
  const fulfilled = stats.pickupCount + stats.deliveryCount;
  const pickupShare = fulfilled ? Math.round((stats.pickupCount / fulfilled) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-navy">Analytics</h1>
        <p className="mt-1 text-ink-muted">
          Sales only count orders staff marked as paid (cash or Zelle). Unpaid and canceled orders are left out
          {stats.unverifiedOrders > 0 && ` (${stats.unverifiedOrders} not counted)`}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile accent label="Collected sales" value={formatCents(stats.revenueCents)} note="Cash + Zelle marked paid" />
        <StatTile label="Total orders" value={stats.totalOrders} />
        <StatTile label="Completed" value={stats.completedOrders} />
        <StatTile label="Average order" value={formatCents(stats.averageCents)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Daily sales" subtitle="Last 7 days">
          <div className="flex h-48 items-end gap-2" role="img" aria-label={days.map((d) => `${d.label}: ${formatCents(d.revenueCents)}`).join(", ")}>
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-ink-muted">{d.revenueCents > 0 ? formatCents(d.revenueCents) : ""}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-navy transition-[height] duration-500"
                    style={{ height: `${Math.max(d.revenueCents > 0 ? 4 : 1, (d.revenueCents / maxDay) * 100)}%`, opacity: d.revenueCents > 0 ? 1 : 0.15 }}
                  />
                </div>
                <span className="text-xs font-medium text-ink-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pickup vs. delivery" subtitle={`${fulfilled} orders (not counting canceled)`}>
          <div className="flex h-4 overflow-hidden rounded-full bg-gold" role="img" aria-label={`Pickup ${stats.pickupCount}, delivery ${stats.deliveryCount}`}>
            <div className="h-full bg-navy" style={{ width: `${pickupShare}%` }} />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <Legend color="bg-navy" label="Pickup" value={stats.pickupCount} />
            <Legend color="bg-gold" label="Classroom delivery" value={stats.deliveryCount} />
          </dl>
        </Panel>
      </div>

      <Panel title="Popular items" subtitle="By quantity sold (verified sales)">
        {topItems.length === 0 ? (
          <p className="text-ink-muted">No sales yet.</p>
        ) : (
          <ul className="space-y-3">
            {topItems.map((item) => (
              <li key={item.name} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[14rem_1fr_auto]">
                <span className="truncate font-semibold">{item.name}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-navy-soft">
                  <span className="block h-full rounded-full bg-navy" style={{ width: `${(item.quantity / maxItem) * 100}%` }} />
                </span>
                <span className="w-20 text-right tabular-nums text-ink-muted">
                  {item.quantity} sold
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-sm text-ink-muted">
        <span className={`size-2.5 rounded-full ${color}`} />
        {label}
      </dt>
      <dd className="mt-1 font-display text-3xl text-navy tabular-nums">{value}</dd>
    </div>
  );
}
