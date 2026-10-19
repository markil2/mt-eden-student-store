"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Clock, DoorOpen, MessageSquareText, ShoppingBag } from "lucide-react";
import type { Order } from "@/lib/types";
import { advanceLabel, isOpen, nextStatus, statusLabel } from "@/lib/status";
import { changeOrderStatus, recordPayment } from "@/lib/admin/orders-store";
import { cn, formatCents } from "@/lib/format";

const statusTone: Record<Order["status"], string> = {
  received: "bg-gold text-ink",
  preparing: "bg-navy-soft text-navy",
  ready: "bg-[#e3f1e8] text-[#1f6b41]",
  out_for_delivery: "bg-[#e3f1e8] text-[#1f6b41]",
  completed: "bg-ink/[0.06] text-ink/60",
  delivered: "bg-ink/[0.06] text-ink/60",
  canceled: "bg-ink/[0.06] text-ink/60 line-through",
};

function useMinutesAgo(iso: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return "";
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} hr ago`;
}

export function OrderCard({ order, compact = false }: { order: Order; compact?: boolean }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const ago = useMinutesAgo(order.createdAt);
  const next = nextStatus(order);
  const open = isOpen(order);
  const isDelivery = order.method === "delivery";
  const isNew = order.status === "received";
  const verified = order.paymentStatus === "paid" || order.paymentStatus === "mock_paid";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", bounce: 0.1, duration: 0.45 }}
      className={cn(
        "flex flex-col rounded-2xl bg-white p-5 ring-1",
        isNew ? "ring-2 ring-gold" : "ring-line",
        !open && "opacity-75",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2">
            <span className="font-display text-2xl text-navy">#{order.number}</span>
            {isNew && <span className="rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-ink uppercase">New</span>}
          </p>
          <p className="mt-0.5 font-semibold">{order.customerName}</p>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", statusTone[order.status])}>
          {statusLabel(order.status, order.method)}
        </span>
      </header>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold",
            isDelivery ? "bg-navy text-cream" : "bg-navy-soft text-navy",
          )}
        >
          {isDelivery ? <DoorOpen className="size-4" /> : <ShoppingBag className="size-4" />}
          {isDelivery ? `Deliver · Room ${order.room}` : "Pickup"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink/[0.05] px-2.5 py-1.5 font-medium">
          <Clock className="size-4" /> {order.windowLabel}
        </span>
      </div>

      {!compact && (
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          {order.lines.map((line, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-bold text-navy tabular-nums">{line.quantity}×</span>
              <div className="min-w-0">
                <p className="font-semibold leading-snug">{line.name}</p>
                {line.options.length > 0 && <p className="text-sm text-ink-muted">{line.options.join(" · ")}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!compact && order.notes && (
        <p className="mt-3 flex gap-2 rounded-xl bg-gold-soft/70 p-3 text-sm">
          <MessageSquareText className="mt-0.5 size-4 shrink-0" />
          {order.notes}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-ink-muted">{ago}</span>
        <span className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold", verified ? "text-[#1f6b41]" : "text-[#a3361f]")}>
            {verified
              ? `Paid${order.paymentMethod ? ` · ${order.paymentMethod === "zelle" ? "Zelle" : "Cash"}` : ""}`
              : order.status === "canceled"
                ? "Not paid"
                : "Unpaid"}
          </span>
          <span className="font-semibold tabular-nums">{formatCents(order.totalCents)}</span>
        </span>
      </div>

      {/* Customers pay cash or Zelle in person; staff record it here. */}
      {order.status !== "canceled" &&
        (verified ? (
          order.paymentStatus === "paid" && (
            <button
              type="button"
              onClick={() => void recordPayment(order, null)}
              className="mt-2 self-end text-xs font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Undo paid
            </button>
          )
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold">Mark paid:</span>
            {(["cash", "zelle"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => void recordPayment(order, method)}
                className="press h-11 flex-1 rounded-xl bg-[#e3f1e8] px-3 text-sm font-bold text-[#1f6b41] hover:bg-[#d3ead9]"
              >
                {method === "cash" ? "Cash" : "Zelle"}
              </button>
            ))}
          </div>
        ))}

      {open && (
        <div className="mt-4 flex gap-2">
          {next && (
            <button
              type="button"
              onClick={() => {
                void changeOrderStatus(order, next);
                setConfirmCancel(false);
              }}
              className="press h-14 flex-1 rounded-xl bg-navy px-4 text-base font-bold whitespace-nowrap text-cream hover:bg-navy-deep"
            >
              {advanceLabel(order)}
            </button>
          )}
          {confirmCancel ? (
            <button
              type="button"
              onClick={() => void changeOrderStatus(order, "canceled")}
              className="press h-14 rounded-xl bg-[#a3361f] px-4 text-sm font-bold text-white"
            >
              Confirm cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="press h-14 rounded-xl px-4 text-sm font-semibold text-ink-muted ring-1 ring-line hover:text-ink"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </motion.article>
  );
}
