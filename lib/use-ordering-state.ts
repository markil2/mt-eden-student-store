"use client";

import { useEffect, useState } from "react";
import { useStoreData } from "@/lib/store/store-data";
import { orderingState, type OrderingState } from "./ordering";

/** Current time, refreshed every 30s. null during server render/hydration so markup matches. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useOrderingState(): OrderingState {
  const settings = useStoreData((s) => s.settings);
  return orderingState(settings, useNow());
}
