"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { CART_STORAGE_KEY, shouldSyncCartFromOtherTab, useCart } from "@/lib/store/cart";
import { useStoreData } from "@/lib/store/store-data";
import { fetchPublicStoreData, type PublicStoreData } from "@/lib/data/catalog-mapper";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const LIVE_TABLES = ["products", "product_availability", "store_settings", "fulfillment_windows"];

export function Providers({ initialData, children }: { initialData: PublicStoreData; children: React.ReactNode }) {
  // Seed the store with server data before the first render so the menu is in the HTML.
  // (Runs once per mount; the data is the same public menu for every visitor.)
  useState(() => {
    useStoreData.setState(initialData);
    return true;
  });

  useEffect(() => {
    // Cart lives in localStorage; load it after mount so server and client markup match.
    useCart.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && shouldSyncCartFromOtherTab(e.newValue)) useCart.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Live menu: when staff change stock, prices or settings, every open page updates.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          useStoreData.getState().setData(await fetchPublicStoreData(supabase));
        } catch {
          // Keep showing the last good data; the next change or focus will retry.
        }
      }, 300);
    };

    const channel = supabase.channel("public-store-data");
    for (const table of LIVE_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    }
    channel.subscribe();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}>
      {children}
      <Toaster
        position="bottom-center"
        offset={20}
        mobileOffset={{ bottom: 88 }}
        toastOptions={{
          classNames: {
            toast:
              "bg-ink! text-cream! border-0! rounded-full! px-5! py-3! shadow-lg! font-sans! gap-3! w-auto! min-w-0!",
            title: "text-sm! font-semibold!",
            actionButton: "bg-gold! text-ink! rounded-full! font-bold! px-3!",
          },
        }}
      />
    </MotionConfig>
  );
}
