"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Banknote } from "lucide-react";
import type { FulfillmentMethod } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { useStoreData } from "@/lib/store/store-data";
import { placeOrderAction } from "@/app/(site)/checkout/actions";
import { useCatalog } from "@/lib/use-catalog";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrderingState } from "@/lib/use-ordering-state";
import { describeSelections, isLineAvailable, lineTotalCents, subtotalCents } from "@/lib/pricing";
import { cn, formatCents } from "@/lib/format";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { ChoiceCards, methodOptions, windowOptions } from "./fulfillment-choice";
import { OrderSummary } from "./order-summary";

export function CheckoutView() {
  const router = useRouter();
  const cartReady = useHydrated(useCart);
  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const settings = useStoreData((s) => s.settings);
  const availability = useStoreData((s) => s.availability);
  const { catalog } = useCatalog();
  const ordering = useOrderingState();

  const [method, setMethod] = useState<FulfillmentMethod | null>(null);
  const [windowId, setWindowId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per checkout visit (created on first submit): a double tap or retry can't create two orders.
  const idempotencyKey = useRef<string | null>(null);
  const ids = { name: useId(), room: useId(), notes: useId() };

  if (!cartReady) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (placing && lines.length === 0) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center" role="status">
        <p className="font-display text-3xl text-navy">Placing your order…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex flex-col items-start py-20 md:py-28">
        <p className="eyebrow text-ink-muted">Checkout</p>
        <h1 className="mt-4 font-display text-5xl text-navy">Your cart is empty.</h1>
        <p className="mt-4 text-lg text-ink/70">Add something from the menu to get started.</p>
        <ButtonLink href="/menu" size="lg" className="mt-8">
          Browse the menu
        </ButtonLink>
      </div>
    );
  }

  const subtotal = subtotalCents(lines, catalog);
  const feeCents = settings.delivery.feeCents;
  const isDelivery = method === "delivery";
  const total = subtotal + (isDelivery ? feeCents : 0);
  const unavailable = lines.some((l) => !isLineAvailable(l, availability, catalog));
  const windowStillValid = windowId && method ? settings.windows.some((w) => w.id === windowId && w[method]) : false;

  const errors = {
    method: !method ? "Choose pickup or classroom delivery." : null,
    window: !windowStillValid ? "Choose before or after school." : null,
    name: !name.trim() ? "Enter your name so we know whose order it is." : null,
    room: isDelivery && settings.delivery.requireRoom && !room.trim() ? "Enter your room number." : null,
  };
  const firstError = Object.values(errors).find(Boolean) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (firstError || !method || !windowId || placing) return;
    setPlacing(true);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      // The server re-prices everything and checks stock, cutoff and windows.
      const result = await placeOrderAction({
        idempotencyKey: idempotencyKey.current,
        lines,
        customerName: name,
        method,
        windowId,
        room: isDelivery ? room : null,
        notes,
      });
      if (!result.ok) {
        setPlacing(false);
        setError(result.error);
        return;
      }
      router.push(`/order/${result.token}`);
      clearCart();
    } catch {
      setPlacing(false);
      setError("We couldn't reach the cafe. Check your connection and try again.");
    }
  }

  const summaryLines = lines.map((l) => {
    const product = catalog[l.productId];
    return {
      key: l.key,
      name: product?.name ?? "Unavailable item",
      options: product ? describeSelections(product, l.selections) : [],
      quantity: l.quantity,
      totalCents: lineTotalCents(l, catalog),
      unavailable: !isLineAvailable(l, availability, catalog),
    };
  });

  return (
    <form onSubmit={submit} noValidate className="container-page grid gap-10 pt-8 pb-32 md:pt-12 lg:grid-cols-[1fr_24rem] lg:gap-16 lg:pb-20">
      <div>
        <Link href="/menu" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
          <ArrowLeft className="size-4" /> Keep browsing
        </Link>
        <h1 className="mt-4 font-display text-5xl text-navy md:text-6xl">Checkout</h1>

        {!ordering.open && (
          <p className="mt-6 rounded-2xl bg-gold-soft px-5 py-4 font-medium" role="alert">
            {ordering.message}
          </p>
        )}

        <Step n={1} title="How would you like it?" error={submitted ? errors.method : null}>
          <ChoiceCards
            name="method"
            legend="Pickup or delivery"
            value={method}
            onChange={(m) => setMethod(m)}
            options={methodOptions({
              pickupEnabled: settings.pickup.enabled,
              deliveryEnabled: settings.delivery.enabled,
              pickupLocation: settings.pickup.location,
              deliveryFeeLabel: feeCents === 0 ? "free" : formatCents(feeCents),
            })}
          />
        </Step>

        <Step n={2} title="When?" error={submitted ? errors.window : null}>
          <ChoiceCards
            name="window"
            legend="Pickup or delivery time"
            value={windowStillValid ? windowId : null}
            onChange={setWindowId}
            options={windowOptions(settings.windows, method)}
          />
        </Step>

        <Step n={3} title="Your details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={ids.name} label="Name" error={submitted ? errors.name : null} hint="First name and last initial is fine.">
              <input
                id={ids.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
                maxLength={60}
                className={inputClass(submitted && !!errors.name)}
              />
            </Field>
            <AnimatePresence initial={false}>
              {isDelivery && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Field id={ids.room} label="Room number" error={submitted ? errors.room : null} hint="Where should we bring it?">
                    <input
                      id={ids.room}
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. B12"
                      maxLength={20}
                      autoComplete="off"
                      className={inputClass(submitted && !!errors.room)}
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="sm:col-span-2">
              <Field id={ids.notes} label="Notes for the cafe" optional>
                <textarea
                  id={ids.notes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Anything we should know?"
                  className={cn(inputClass(false), "h-auto resize-none py-3")}
                />
              </Field>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-muted">No account needed. We only ask for what we need to get your order to you.</p>
        </Step>

        <Step n={4} title="Payment">
          <div className="flex gap-3 rounded-2xl bg-navy-soft/60 p-5">
            <Banknote className="mt-0.5 size-5 shrink-0 text-navy" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-navy">Pay when you get your order</p>
              <p className="mt-1 text-ink/75">
                We take <span className="font-semibold text-ink">cash or Zelle</span> at pickup or when we deliver to your
                classroom. Nothing is charged online.
              </p>
            </div>
          </div>
        </Step>
      </div>

      {/* Summary: sticky sidebar on desktop, inline on phones */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <div className="rounded-[1.75rem] bg-white/70 p-6 ring-1 ring-line">
          <h2 className="font-display text-2xl text-navy">Your order</h2>
          <div className="mt-2">
            <OrderSummary lines={summaryLines} subtotalCents={subtotal} deliveryFeeCents={feeCents} showDelivery={isDelivery} />
          </div>

          <AnimatePresence>
            {(error || unavailable || (submitted && firstError)) && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 text-sm font-medium text-[#a3361f]"
                role="alert"
              >
                {error ?? (unavailable ? "Something in your cart just sold out. Remove it from your cart to continue." : firstError)}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={placing || unavailable || !ordering.open}
            className={buttonClasses("primary", "lg", "mt-5 hidden w-full justify-between px-6 lg:flex")}
          >
            <span>{placing ? "Placing order…" : "Place order"}</span>
            <span className="tabular-nums">{formatCents(total)}</span>
          </button>
        </div>
      </aside>

      {/* Sticky submit bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <button
          type="submit"
          disabled={placing || unavailable || !ordering.open}
          className={buttonClasses("primary", "lg", "w-full justify-between px-6")}
        >
          <span>{placing ? "Placing order…" : "Place order"}</span>
          <span className="tabular-nums">{formatCents(total)}</span>
        </button>
      </div>
    </form>
  );
}

function Step({ n, title, error, children }: { n: number; title: string; error?: string | null; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-line pt-8 first-of-type:mt-8">
      <h2 className="flex items-baseline gap-3 text-xl font-semibold">
        <span className="font-display text-2xl text-gold italic">{n}</span>
        {title}
      </h2>
      {error && (
        <p className="mt-2 text-sm font-medium text-[#a3361f]" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-ink-muted">Optional</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-[#a3361f]">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "h-12 w-full rounded-xl border bg-white px-4 text-base outline-none transition-colors placeholder:text-ink-muted/70",
    "focus:border-navy focus:ring-2 focus:ring-navy/15",
    invalid ? "border-[#a3361f]" : "border-line",
  );
}
