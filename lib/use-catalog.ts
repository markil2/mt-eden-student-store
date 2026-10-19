"use client";

import { useMemo } from "react";
import type { Catalog, Product } from "@/lib/types";
import { useStoreData } from "@/lib/store/store-data";

/** The live menu (from Supabase, or the built-in menu until it's connected). */
export function useCatalog(): { products: Product[]; catalog: Catalog } {
  const products = useStoreData((s) => s.products);
  return useMemo(() => ({ products, catalog: Object.fromEntries(products.map((p) => [p.id, p])) }), [products]);
}
