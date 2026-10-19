"use client";

import { DoorOpen, ShoppingBag } from "lucide-react";
import { useStoreData } from "@/lib/store/store-data";
import { formatCutoff } from "@/lib/data/settings";
import { formatCents, cn } from "@/lib/format";
import { Reveal } from "@/components/ui/reveal";
import { useOrderingState } from "@/lib/use-ordering-state";

export function CafeInfo() {
  const settings = useStoreData((s) => s.settings);
  const { pickup, delivery } = settings;
  const ordering = useOrderingState();

  return (
    <section className="container-page grid gap-14 py-20 md:grid-cols-2 md:gap-20 md:py-28" aria-labelledby="info-title">
      <Reveal>
        <p className="eyebrow text-ink-muted">Visit the store</p>
        <h2 id="info-title" className="mt-3 font-display text-4xl text-navy md:text-5xl">
          Hours &amp; ordering
        </h2>

        <div className="mt-8 flex items-center gap-2.5">
          <span
            className={cn("size-2.5 rounded-full", !ordering.open ? "bg-gold" : "bg-[#2f8f5b]")}
            aria-hidden
          />
          <p className="font-semibold">
            {ordering.reason === "paused" ? "Online ordering is paused" : ordering.reason === "after_cutoff" ? "Closed for today" : "Online ordering is open"}
          </p>
        </div>
        <p className="mt-1 text-ink-muted">Last order of the day: {formatCutoff(settings.orderCutoff)}, for both before- and after-school orders</p>

        <dl className="mt-8 divide-y divide-line border-y border-line">
          {settings.hours.map((h) => (
            <div key={h.label} className="flex items-center justify-between gap-4 py-3.5">
              <dt className="font-medium whitespace-nowrap">{h.label}</dt>
              <dd className="text-right text-ink/75">{h.hours}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-muted">{settings.hoursNote}</p>
      </Reveal>

      <Reveal delay={0.1} className="flex flex-col gap-10 md:pt-24">
        <InfoBlock icon={<ShoppingBag className="size-5" />} title="Store pickup">
          {pickup.enabled ? (
            <>
              Choose before or after school at checkout, then grab your order at the store.
              <span className="mt-2 block">
                Pickup: <span className="font-semibold text-ink">{pickup.location}</span>
              </span>
            </>
          ) : (
            "Pickup isn't available right now."
          )}
        </InfoBlock>

        <InfoBlock icon={<DoorOpen className="size-5" />} title="Classroom delivery">
          {delivery.enabled ? (
            <>
              We&apos;ll bring your order to your classroom before or after school.
              {delivery.requireRoom && " Please include your room number."}
              <span className="mt-2 block font-semibold text-navy">
                {delivery.feeCents === 0 ? "No delivery fee." : `Delivery fee: ${formatCents(delivery.feeCents)}`}
              </span>
            </>
          ) : (
            "Classroom delivery isn't available right now."
          )}
        </InfoBlock>

      </Reveal>
    </section>
  );
}

function InfoBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-soft text-navy">{icon}</span>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1.5 leading-relaxed text-ink/75">{children}</p>
      </div>
    </div>
  );
}
