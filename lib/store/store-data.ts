"use client";

import { create } from "zustand";
import type { Availability, Category, Product, StoreSettings } from "@/lib/types";
import type { PublicStoreData } from "@/lib/data/catalog-mapper";
import { applyInventory, type Ingredient, type IngredientUse } from "@/lib/inventory";
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
  /** Effective availability (staff switch AND ingredients). */
  availability: Availability;
  /** Staff's per-item switch only. */
  manualAvailability: Availability;
  settings: StoreSettings;
  ingredients: Ingredient[];
  ingredientUses: IngredientUse[];
  setData: (data: PublicStoreData) => void;
  /** Optimistic local update while a staff inventory change is saving */
  setIngredientLocal: (id: string, patch: Partial<Ingredient>) => void;
  /** Optimistic local update while a staff change is saving */
  setAvailableLocal: (productId: string, available: boolean) => void;
}

export const useStoreData = create<StoreDataState>()((set) => ({
  categories: localCategories,
  products: localProducts,
  availability: defaultAvailability,
  manualAvailability: defaultAvailability,
  settings: defaultSettings,
  ingredients: [],
  ingredientUses: [],
  setData: (data) => set(data),
  setAvailableLocal: (productId, available) =>
    set((s) => {
      const manualAvailability = { ...s.manualAvailability, [productId]: available };
      return { manualAvailability, ...applyInventory(s.products, manualAvailability, s.ingredients, s.ingredientUses) };
    }),
  setIngredientLocal: (id, patch) =>
    set((s) => {
      const ingredients = s.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i));
      // Re-derive from clean options so a restocked choice un-greys immediately.
      const clean = s.products.map((p) => ({
        ...p,
        optionGroups: p.optionGroups.map((g) => ({ ...g, options: g.options.map(({ soldOut, ...o }) => (void soldOut, o)) })),
      }));
      return { ingredients, ...applyInventory(clean, s.manualAvailability, ingredients, s.ingredientUses) };
    }),
}));
