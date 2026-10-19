"use client";

import { create } from "zustand";
import type { Availability, Category, Product, StoreSettings } from "@/lib/types";
import type { PublicStoreData } from "@/lib/data/catalog-mapper";
import { categories as localCategories, products as localProducts } from "@/lib/data/menu";
import { defaultAvailability } from "@/lib/data/availability";
import { defaultSettings } from "@/lib/data/settings";

/**
 * Public store data (menu, stock, settings) shared by the whole UI.
 * Seeded from the server on first render and kept fresh by Supabase realtime
 * (see components/providers.tsx). Writes happen through admin server actions.
 */
interface StoreDataState {
  categories: Category[];
  products: Product[];
  availability: Availability;
  settings: StoreSettings;
  setData: (data: PublicStoreData) => void;
  /** Optimistic local update while a staff change is saving */
  setAvailableLocal: (productId: string, available: boolean) => void;
}

export const useStoreData = create<StoreDataState>()((set) => ({
  categories: localCategories,
  products: localProducts,
  availability: defaultAvailability,
  settings: defaultSettings,
  setData: (data) => set(data),
  setAvailableLocal: (productId, available) =>
    set((s) => ({ availability: { ...s.availability, [productId]: available } })),
}));
