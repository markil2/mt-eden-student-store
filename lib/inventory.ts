import type { Availability, CartLine, Catalog, Product } from "@/lib/types";

/**
 * Ingredient inventory. Pure functions shared by the browser (menu greying)
 * and the server (order validation), so both always agree.
 *
 *  • "count" ingredients have a number (bagels, croissants) that goes down when orders are placed.
 *  • "switch" ingredients are just in stock / out (fruit, granola).
 *
 * A use without a group/option key means the whole item needs the ingredient;
 * with keys, only that choice (e.g. "Everything bagel" on a sandwich) does.
 */

export type IngredientKind = "count" | "switch";

export interface Ingredient {
  id: string;
  name: string;
  kind: IngredientKind;
  quantity: number | null;
  inStock: boolean;
}

export interface IngredientUse {
  ingredientId: string;
  productId: string;
  groupKey: string | null;
  optionKey: string | null;
  amount: number;
}

export const LOW_STOCK_AT = 3;

export function isOut(ing: Ingredient): boolean {
  return ing.kind === "count" ? (ing.quantity ?? 0) <= 0 : !ing.inStock;
}

/**
 * Marks items unavailable and choices sold out based on ingredients.
 * Returns new objects; inputs are not changed.
 */
export function applyInventory(
  products: Product[],
  availability: Availability,
  ingredients: Ingredient[],
  uses: IngredientUse[],
): { products: Product[]; availability: Availability } {
  const out = new Set(ingredients.filter(isOut).map((i) => i.id));
  if (out.size === 0) return { products, availability };

  const nextAvailability: Availability = { ...availability };
  const blockedItems = new Set<string>();
  const blockedChoices = new Set<string>(); // `${productId}|${groupKey}|${optionKey}`
  for (const use of uses) {
    if (!out.has(use.ingredientId)) continue;
    if (use.groupKey && use.optionKey) blockedChoices.add(`${use.productId}|${use.groupKey}|${use.optionKey}`);
    else blockedItems.add(use.productId);
  }

  const nextProducts = products.map((product) => {
    if (blockedItems.has(product.id)) nextAvailability[product.id] = false;
    let touched = false;
    const optionGroups = product.optionGroups.map((group) => {
      let groupTouched = false;
      const options = group.options.map((option) => {
        if (!blockedChoices.has(`${product.id}|${group.id}|${option.id}`)) return option;
        groupTouched = true;
        return { ...option, soldOut: true };
      });
      if (!groupTouched) return group;
      touched = true;
      // A required choice with nothing left makes the whole item unavailable.
      if (group.required && options.every((o) => o.soldOut)) nextAvailability[product.id] = false;
      return { ...group, options };
    });
    return touched ? { ...product, optionGroups } : product;
  });

  return { products: nextProducts, availability: nextAvailability };
}

/** How much of each ingredient a cart needs (ingredientId → amount). */
export function usageFor(lines: CartLine[], catalog: Catalog, uses: IngredientUse[]): Map<string, number> {
  const usage = new Map<string, number>();
  const add = (id: string, n: number) => usage.set(id, (usage.get(id) ?? 0) + n);
  for (const line of lines) {
    const product = catalog[line.productId];
    if (!product) continue;
    const qty = Math.max(1, Math.floor(line.quantity));
    for (const use of uses) {
      if (use.productId !== product.id) continue;
      if (!use.groupKey || !use.optionKey) {
        add(use.ingredientId, use.amount * qty);
      } else if ((line.selections[use.groupKey] ?? []).includes(use.optionKey)) {
        add(use.ingredientId, use.amount * qty);
      }
    }
  }
  return usage;
}

/** First counted ingredient the cart needs more of than we have, if any. */
export function findShortage(
  usage: Map<string, number>,
  ingredients: Ingredient[],
): { ingredient: Ingredient; needed: number } | null {
  for (const ing of ingredients) {
    if (ing.kind !== "count") continue;
    const needed = usage.get(ing.id) ?? 0;
    if (needed > (ing.quantity ?? 0)) return { ingredient: ing, needed };
  }
  return null;
}
