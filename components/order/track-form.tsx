"use client";

import { useCallback, useId, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { OrderDetails, useLiveOrder } from "./order-view";

export function TrackForm() {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [query, setQuery] = useState<{ number: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const numberId = useId();
  const nameId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!number.trim() || !name.trim()) {
      setError("Enter your order number and first name.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await lookup(number, name);
      if (res.ok) setQuery({ number, name });
      // Same message whether the number or the name is wrong, so lookups can't be used to probe orders.
      else if (res.status === 404) setError("We couldn't find an order with that number and name. Check both and try again.");
      else setError("We can't look up orders right now. Please try again in a moment.");
    } catch {
      setError("We couldn't reach the cafe. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  if (query) return <TrackedOrder number={query.number} name={query.name} />;

  const input =
    "h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/15";

  return (
    <div className="container-page py-14 md:py-24">
      <p className="eyebrow text-ink-muted">Order status</p>
      <h1 className="mt-4 font-display text-5xl text-navy md:text-6xl">Track an order</h1>
      <p className="mt-4 max-w-md text-lg text-ink/70">
        Enter your order number and the first name you used at checkout. No account needed.
      </p>
      <form onSubmit={submit} className="mt-10 max-w-md space-y-5" noValidate>
        <div>
          <label htmlFor={numberId} className="text-sm font-semibold">
            Order number
          </label>
          <input
            id={numberId}
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 1042"
            className={`${input} mt-2`}
            required
          />
        </div>
        <div>
          <label htmlFor={nameId} className="text-sm font-semibold">
            First name on the order
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            className={`${input} mt-2`}
            required
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-[#a3361f]" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={checking} className={buttonClasses("primary", "lg", "w-full")}>
          {checking ? "Looking…" : "Find my order"}
        </button>
      </form>
    </div>
  );
}

function lookup(number: string, name: string) {
  return fetch("/api/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number, name }),
    cache: "no-store",
  });
}

function TrackedOrder({ number, name }: { number: string; name: string }) {
  const fetcher = useCallback(() => lookup(number, name), [number, name]);
  const state = useLiveOrder(fetcher);
  if (state.status !== "ready") return <div className="min-h-[40vh]" aria-busy="true" />;
  return <OrderDetails order={state.order} />;
}
