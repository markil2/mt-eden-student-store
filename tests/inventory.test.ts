import { describe, expect, it } from "vitest";
import { products } from "@/lib/data/menu";
import { defaultAvailability } from "@/lib/data/availability";
import { applyInventory, findShortage, isOut, usageFor, type Ingredient, type IngredientUse } from "@/lib/inventory";
import { isLineAvailable } from "@/lib/pricing";
import type { CartLine } from "@/lib/types";

const ing = (id: string, kind: Ingredient["kind"], quantity: number | null, inStock = true): Ingredient => ({
  id,
  name: id,
  kind,
  quantity,
  inStock,
});

const sandwichBagels = ["sandwich-combo", "sandwich-protein", "sandwich-egg-cheese"];
const uses: IngredientUse[] = [
  ...sandwichBagels.map((productId) => ({ ingredientId: "everything", productId, groupKey: "bread", optionKey: "bagel-everything", amount: 1 })),
  { ingredientId: "everything", productId: "smoked-salmon-bagel", groupKey: "bagel", optionKey: "bagel-everything", amount: 1 },
  { ingredientId: "granola", productId: "yogurt-parfait", groupKey: null, optionKey: null, amount: 1 },
];

describe("ingredient inventory", () => {
  it("knows when counted and switch ingredients are out", () => {
    expect(isOut(ing("a", "count", 0))).toBe(true);
    expect(isOut(ing("a", "count", 2))).toBe(false);
    expect(isOut(ing("a", "switch", null, false))).toBe(true);
    expect(isOut(ing("a", "switch", null, true))).toBe(false);
  });

  it("greys out a choice when its ingredient runs out, without hiding the item", () => {
    const { products: next, availability } = applyInventory(products, defaultAvailability, [ing("everything", "count", 0), ing("granola", "switch", null)], uses);
    const egg = next.find((p) => p.id === "sandwich-egg-cheese")!;
    const bread = egg.optionGroups.find((g) => g.id === "bread")!;
    expect(bread.options.find((o) => o.id === "bagel-everything")!.soldOut).toBe(true);
    expect(bread.options.find((o) => o.id === "bagel-plain")!.soldOut).toBeUndefined();
    expect(availability["sandwich-egg-cheese"]).toBe(true);
    // Original menu is not modified
    expect(products.find((p) => p.id === "sandwich-egg-cheese")!.optionGroups[0].options.some((o) => o.soldOut)).toBe(false);
  });

  it("marks an item sold out when a whole-item ingredient is out", () => {
    const { availability } = applyInventory(products, defaultAvailability, [ing("granola", "switch", null, false)], uses);
    expect(availability["yogurt-parfait"]).toBe(false);
  });

  it("marks an item sold out when every choice of a required group is out", () => {
    const allBagels = ["bagel-plain", "bagel-everything", "bagel-cheese", "bagel-lox"].map((optionKey) => ({
      ingredientId: optionKey,
      productId: "smoked-salmon-bagel",
      groupKey: "bagel",
      optionKey,
      amount: 1,
    }));
    const ings = allBagels.map((u) => ing(u.ingredientId, "count", 0));
    expect(applyInventory(products, defaultAvailability, ings, allBagels).availability["smoked-salmon-bagel"]).toBe(false);
  });

  it("rejects a cart line whose chosen option is sold out", () => {
    const { products: next, availability } = applyInventory(products, defaultAvailability, [ing("everything", "count", 0)], uses);
    const catalog = Object.fromEntries(next.map((p) => [p.id, p]));
    const line = (bagel: string) => ({ key: "k", productId: "sandwich-egg-cheese", quantity: 1, selections: { bread: [bagel] } });
    expect(isLineAvailable(line("bagel-everything"), availability, catalog)).toBe(false);
    expect(isLineAvailable(line("bagel-plain"), availability, catalog)).toBe(true);
  });

  it("adds up what a cart needs, by quantity, and finds shortages", () => {
    const catalog = Object.fromEntries(products.map((p) => [p.id, p]));
    const lines: CartLine[] = [
      { key: "a", productId: "sandwich-protein", quantity: 2, selections: { bread: ["bagel-everything"], protein: ["turkey"] } },
      { key: "b", productId: "smoked-salmon-bagel", quantity: 1, selections: { bagel: ["bagel-everything"] } },
      { key: "c", productId: "yogurt-parfait", quantity: 3, selections: {} },
      { key: "d", productId: "sandwich-egg-cheese", quantity: 1, selections: { bread: ["croissant"] } },
    ];
    const usage = usageFor(lines, catalog, uses);
    expect(usage.get("everything")).toBe(3);
    expect(usage.get("granola")).toBe(3);
    expect(findShortage(usage, [ing("everything", "count", 3)])).toBeNull();
    expect(findShortage(usage, [ing("everything", "count", 2)])).toMatchObject({ needed: 3 });
  });
});
