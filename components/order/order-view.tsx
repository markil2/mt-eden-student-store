"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Clock, DoorOpen, Receipt, ShoppingBag } from "lucide-react";
import { useStoreData } from "@/lib/store/store-data";
import type { CustomerOrder } from "@/lib/types";
import { statusLabel } from "@/lib/status";
import { ButtonLink } from "@/components/ui/button";
import { OrderSummary } from "@/components/checkout/order-summary";
import { StatusTimeline } from "./status-timeline";

const headline: Record<string, string> = {
  received: "Thanks, {name}!",
  preparing: "We're making it now.",
  ready: "It's ready!",
  out_for_delivery: "On its way to you.",
  completed: "Enjoy, {name}!",
  delivered: "Delivered. Enjoy!",
  canceled: "Order canceled.",
};

/** Customer order page at /order/[token]: loads the order and keeps it updated. */
export function OrderView() {
  const { token } = useParams<{ token: string }>();
  const fetcher = useCallback(() => fetch(`/api/orders/${encodeURIComponent(token)}`, { cache: "no-store" }), [token]);
  const state = useLiveOrder(fetcher);

  if (state.status === "loading") return <div className="min-h-[60vh]" aria-busy="true" />;
  if (state.status === "error") return <OrderUnavailable />;
  if (state.status === "not_found") return <OrderNotFound />;
  return <OrderDetails order={state.order} />;
}

type LiveOrder =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error" }
  | { status: "ready"; order: CustomerOrder };

/** Fetches an order and refreshes it every 10s (and when the tab regains focus) while it's open. */
export function useLiveOrder(fetcher: () => Promise<Response>): LiveOrder {
  const [state, setState] = useState<LiveOrder>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetcher();
        if (cancelled) return;
        if (res.status === 404) return setState({ status: "not_found" });
        if (!res.ok) throw new Error(String(res.status));
        const { order } = (await res.json()) as { order: CustomerOrder };
        if (cancelled) return;
        setState({ status: "ready", order });
        const closed = ["completed", "delivered", "canceled"].includes(order.status);
        if (!closed) timer = setTimeout(load, 10_000);
      } catch {
        if (cancelled) return;
        setState((s) => (s.status === "ready" ? s : { status: "error" }));
        timer = setTimeout(load, 15_000);
      }
    }

    void load();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetcher]);

  return state;
}

function OrderNotFound() {
  return (
    <div className="container-page flex flex-col items-start py-20 md:py-28">
      <p className="eyebrow text-ink-muted">Order status</p>
      <h1 className="mt-4 font-display text-5xl text-navy">We couldn&apos;t find that order.</h1>
      <p className="mt-4 max-w-md text-lg text-ink/70">
        The link may be incomplete. You can look your order up with its number and your name.
      </p>
      <ButtonLink href="/track" size="lg" className="mt-8">
        Find my order
      </ButtonLink>
    </div>
  );
}

function OrderUnavailable() {
  return (
    <div className="container-page flex flex-col items-start py-20 md:py-28" role="alert">
      <p className="eyebrow text-ink-muted">Order status</p>
      <h1 className="mt-4 font-display text-5xl text-navy">We can&apos;t load your order right now.</h1>
      <p className="mt-4 max-w-md text-lg text-ink/70">Check your connection. This page will keep trying.</p>
    </div>
  );
}

export function OrderDetails({ order }: { order: CustomerOrder }) {
  const pickupLocation = useStoreData((s) => s.settings.pickup.location);
  const firstName = order.customerName.split(/\s+/)[0];
  const isDelivery = order.method === "delivery";

  return (
    <div className="container-page grid gap-12 py-10 md:py-16 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="eyebrow text-ink-muted">Order #{order.number}</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] text-navy md:text-6xl">
            {headline[order.status].replace("{name}", firstName)}
          </h1>
          <p className="mt-4 text-lg text-ink/70" aria-live="polite">
            Status: <span className="font-semibold text-ink">{statusLabel(order.status, order.method)}</span>
          </p>
        </motion.div>

        <dl className="mt-10 grid gap-6 border-y border-line py-6 sm:grid-cols-3">
          <Detail icon={isDelivery ? <DoorOpen className="size-4" /> : <ShoppingBag className="size-4" />} label={isDelivery ? "Classroom delivery" : "Store pickup"}>
            {isDelivery ? `Room ${order.room}` : pickupLocation}
          </Detail>
          <Detail icon={<Clock className="size-4" />} label="When">
            {order.windowLabel}
          </Detail>
          <Detail icon={<Receipt className="size-4" />} label="Payment">
            {order.paymentStatus === "paid" || order.paymentStatus === "mock_paid"
              ? `Paid${order.paymentMethod ? ` · ${order.paymentMethod === "zelle" ? "Zelle" : "Cash"}` : ""}`
              : order.status === "canceled"
                ? "Not charged"
                : "Pay cash or Zelle when you get it"}
          </Detail>
        </dl>

        <section className="mt-10" aria-labelledby="progress-title">
          <h2 id="progress-title" className="text-xl font-semibold">
            Progress
          </h2>
          <div className="mt-6">
            <StatusTimeline order={order} />
          </div>
        </section>

        <p className="mt-10 rounded-2xl bg-navy-soft/60 p-5 text-sm leading-relaxed text-ink/80">
          Bookmark this page. It&apos;s your private link to this order and updates as the cafe works on it. You can also
          find it any time from <Link href="/track" className="font-semibold text-navy underline underline-offset-4">Track an order</Link>{" "}
          with order #{order.number} and your first name.
        </p>
      </div>

      <aside className="lg:pt-2">
        <div className="rounded-[1.75rem] bg-white/70 p-6 ring-1 ring-line">
          <h2 className="font-display text-2xl text-navy">Receipt</h2>
          <div className="mt-2">
            <OrderSummary
              lines={order.lines.map((l, i) => ({
                key: `${l.productId}-${i}`,
                name: l.name,
                options: l.options,
                quantity: l.quantity,
                totalCents: l.unitPriceCents * l.quantity,
              }))}
              subtotalCents={order.subtotalCents}
              deliveryFeeCents={order.deliveryFeeCents}
              showDelivery={isDelivery}
            />
          </div>
          {order.notes && (
            <p className="mt-5 border-t border-line pt-4 text-sm text-ink-muted">
              <span className="font-semibold text-ink">Your note:</span> {order.notes}
            </p>
          )}
        </div>
        <ButtonLink href="/menu" variant="secondary" size="lg" className="mt-6 w-full">
          Order something else
        </ButtonLink>
      </aside>
    </div>
  );
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-sm text-ink-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}
