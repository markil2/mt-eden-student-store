"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { toast } from "sonner";
import type { Order, OrderStatus, PaymentMethod } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { ORDER_SELECT, mapOrder, type OrderRow } from "@/lib/orders/mapper";

/** How far back the dashboard loads orders (open orders always load). */
const HISTORY_DAYS = 30;

interface AdminOrdersState {
  orders: Order[];
  loaded: boolean;
  error: string | null;
  setOrders: (orders: Order[]) => void;
  setError: (error: string | null) => void;
  patchStatus: (orderId: string, status: OrderStatus) => void;
  patchPayment: (orderId: string, method: PaymentMethod | null) => void;
}

export const useAdminOrders = create<AdminOrdersState>()((set) => ({
  orders: [],
  loaded: false,
  error: null,
  setOrders: (orders) => set({ orders, loaded: true, error: null }),
  setError: (error) => set({ error, loaded: true }),
  patchPayment: (orderId, method) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, paymentStatus: method ? "paid" : "pending", paymentMethod: method } : o,
      ),
    })),
  patchStatus: (orderId, status) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, status, statusHistory: [...o.statusHistory, { status, at: new Date().toISOString() }] } : o,
      ),
    })),
}));

async function fetchOrders(): Promise<Order[]> {
  const supabase = getBrowserSupabase();
  if (!supabase) return [];
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .or(`created_at.gte.${since},status.in.(received,preparing,ready,out_for_delivery)`)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as unknown as OrderRow[]).map(mapOrder);
}

/** A short two-note chime so staff notice new orders at a busy counter. */
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.32);
    });
  } catch {
    // Sound is a nice-to-have; browsers may block it until the page is clicked.
  }
}

/** Mounted once in the admin shell: loads orders and keeps them live via Supabase realtime. */
export function useAdminOrdersSync() {
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async (announce: boolean) => {
      try {
        const orders = await fetchOrders();
        if (cancelled) return;
        if (announce) {
          const known = new Set(useAdminOrders.getState().orders.map((o) => o.id));
          const fresh = orders.filter((o) => !known.has(o.id) && o.status === "received");
          if (fresh.length > 0) {
            chime();
            for (const o of fresh) toast(`New order #${o.number} · ${o.method === "delivery" ? `Room ${o.room}` : "Pickup"}`);
          }
        }
        useAdminOrders.getState().setOrders(orders);
      } catch (err) {
        if (!cancelled) useAdminOrders.getState().setError(err instanceof Error ? err.message : "Couldn't load orders");
      }
    };
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(true), 400);
    };

    void load(false);
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .subscribe();
    // Safety net in case the realtime connection drops.
    const poll = setInterval(refresh, 60_000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, []);
}

/** Moves an order forward (or cancels it). The database checks staff + valid workflow. */
export async function changeOrderStatus(order: Order, status: OrderStatus): Promise<boolean> {
  const supabase = getBrowserSupabase();
  if (!supabase) return false;
  const store = useAdminOrders.getState();
  const previous = store.orders;
  store.patchStatus(order.id, status);
  const { error } = await supabase.rpc("set_order_status", { p_order_id: order.id, p_status: status });
  if (error) {
    useAdminOrders.setState({ orders: previous });
    toast(`Couldn't update #${order.number}: ${error.message}`);
    return false;
  }
  return true;
}

/** Records that the customer paid in person (or undoes it with null). Staff only, checked by the database. */
export async function recordPayment(order: Order, method: PaymentMethod | null): Promise<boolean> {
  const supabase = getBrowserSupabase();
  if (!supabase) return false;
  const store = useAdminOrders.getState();
  const previous = store.orders;
  store.patchPayment(order.id, method);
  const { error } = await supabase.rpc("set_order_payment", { p_order_id: order.id, p_method: method });
  if (error) {
    useAdminOrders.setState({ orders: previous });
    toast(`Couldn't update payment for #${order.number}: ${error.message}`);
    return false;
  }
  return true;
}
