import type { Availability, CartLine, Catalog, Product, Selections } from "@/lib/types";

/**
 * Pure pricing helpers. Written without browser dependencies so Phase 2 can
 * reuse them for server-side price calculation (never trust client totals).
 */

export function unitPriceCents(product: Product, selections: Selections): number {
  let total = product.priceCents;
  for (const group of product.optionGroups) {
    for (const optionId of selections[group.id] ?? []) {
      const option = group.options.find((o) => o.id === optionId);
      if (option) total += option.priceDeltaCents;
    }
  }
  return total;
}

export function lineTotalCents(line: CartLine, catalog: Catalog): number {
  const product = catalog[line.productId];
  return product ? unitPriceCents(product, line.selections) * line.quantity : 0;
}

export function subtotalCents(lines: CartLine[], catalog: Catalog): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line, catalog), 0);
}

/** Every group starts empty: customers make each choice themselves (no accidental defaults). */
export function emptySelections(product: Product): Selections {
  return Object.fromEntries(product.optionGroups.map((g) => [g.id, []]));
}

/** Returns the label of the first required group with no selection, or null if valid. */
export function missingRequiredGroup(product: Product, selections: Selections): string | null {
  const missing = product.optionGroups.find((g) => g.required && !(selections[g.id]?.length > 0));
  return missing ? missing.label : null;
}

/** Human-readable summary of a line's choices, e.g. "Croissant · Bacon · Cheddar". */
export function describeSelections(product: Product, selections: Selections): string[] {
  const parts: string[] = [];
  for (const group of product.optionGroups) {
    for (const optionId of selections[group.id] ?? []) {
      const option = group.options.find((o) => o.id === optionId);
      if (option) parts.push(option.label);
    }
  }
  return parts;
}

export function isLineAvailable(line: CartLine, availability: Availability, catalog: Catalog): boolean {
  const product = catalog[line.productId];
  // An item with no price yet (e.g. Chai Latte) can't be sold even if marked in stock.
  if (!product || availability[product.id] === false || product.priceCents <= 0) return false;
  for (const group of product.optionGroups) {
    for (const optionId of line.selections[group.id] ?? []) {
      const option = group.options.find((o) => o.id === optionId);
      if (option?.productId && availability[option.productId] === false) return false;
    }
  }
  return true;
}

export function lineKey(productId: string, selections: Selections): string {
  const parts = Object.keys(selections)
    .sort()
    .map((g) => `${g}=${[...selections[g]].sort().join("+")}`);
  return [productId, ...parts].join("|");
}
