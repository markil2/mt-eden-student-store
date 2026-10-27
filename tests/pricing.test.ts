import { describe, expect, it } from "vitest";
import { categories, products } from "@/lib/data/menu";
import { defaultAvailability } from "@/lib/data/availability";
import { isAmountGroup } from "@/components/menu/option-group";
import {
  describeSelections,
  emptySelections,
  isLineAvailable,
  lineKey,
  missingRequiredGroup,
  subtotalCents,
  unitPriceCents,
} from "@/lib/pricing";

const catalog = Object.fromEntries(products.map((p) => [p.id, p]));
const combo = catalog["sandwich-combo"];
const protein = catalog["sandwich-protein"];
const eggCheese = catalog["sandwich-egg-cheese"];

describe("menu rules (confirmed by the cafe)", () => {
  it("bread is plain, everything, cheese or lox bagel, or croissant — no biscuit", () => {
    const bread = protein.optionGroups.find((g) => g.id === "bread")!;
    expect(bread.options.map((o) => o.label)).toEqual([
      "Plain bagel",
      "Everything bagel",
      "Cheese bagel",
      "Lox bagel",
      "Croissant",
    ]);
  });

  it("every breakfast sandwich offers free, optional mayo", () => {
    for (const s of [combo, protein, eggCheese, catalog["smoked-salmon-bagel"]]) {
      const mayo = s.optionGroups.find((g) => g.id === "mayo")!;
      expect(mayo.required).toBe(false);
      expect(mayo.options.map((o) => [o.label, o.priceDeltaCents])).toEqual([["Mayonnaise", 0]]);
    }
  });

  it("the $8 Smoked Salmon Bagel requires a bagel type (no croissant)", () => {
    const salmon = catalog["smoked-salmon-bagel"];
    expect(salmon.priceCents).toBe(800);
    expect(salmon.optionGroups[0].options.map((o) => o.label)).toEqual([
      "Plain bagel",
      "Everything bagel",
      "Cheese bagel",
      "Lox bagel",
    ]);
    expect(missingRequiredGroup(salmon, emptySelections(salmon))).toBe("Bagel");
    expect(unitPriceCents(salmon, { bagel: ["bagel-lox"], mayo: ["mayonnaise"] })).toBe(800);
  });

  it("protein is turkey, chicken sausage or bacon — pick up to 3, no separate bacon add-on", () => {
    const p = protein.optionGroups.find((g) => g.id === "protein")!;
    expect(p.required).toBe(true);
    expect(p.max).toBe(3);
    expect(p.options.map((o) => o.id)).toEqual(["turkey", "chicken-sausage", "bacon"]);
    for (const s of [combo, protein]) expect(s.optionGroups.some((g) => g.id === "extras")).toBe(false);
  });

  it("cheese is optional on every sandwich", () => {
    for (const s of [combo, protein, eggCheese]) {
      expect(s.optionGroups.find((g) => g.id === "cheese")!.required).toBe(false);
    }
  });

  it("the $3 bagel with cream cheese requires a bagel type", () => {
    const bagel = catalog.bagel;
    expect(bagel.priceCents).toBe(300);
    expect(missingRequiredGroup(bagel, emptySelections(bagel))).toBe("Bagel");
    expect(bagel.optionGroups[0].options.map((o) => o.label)).toEqual(["Plain", "Everything", "Cheese"]);
  });

  it("chips require a flavor", () => {
    const chips = catalog.chips;
    expect(chips.optionGroups[0].options.map((o) => o.label)).toEqual([
      "Cheetos Puffs",
      "Sour Cream & Onion",
      "Ruffles",
      "Doritos",
    ]);
    expect(missingRequiredGroup(chips, emptySelections(chips))).toBe("Flavor");
  });

  it("drink prices: Italian soda $5 (free whipped cream), smoothie $6, hot chocolate $3", () => {
    expect(unitPriceCents(catalog["italian-soda"], { flavor: ["peach"], add: ["whipped-cream"] })).toBe(500);
    expect(catalog.smoothie.priceCents).toBe(600);
    expect(catalog["hot-chocolate"].priceCents).toBe(300);
  });

  it("hot coffee and cold brew let customers pick 0–3 creamers and 0–3 sugar packets, free", () => {
    for (const id of ["hot-coffee", "cold-brew"]) {
      const coffee = catalog[id];
      const creamer = coffee.optionGroups.find((g) => g.id === "creamer")!;
      const sugar = coffee.optionGroups.find((g) => g.id === "sugar")!;
      expect([creamer.required, sugar.required]).toEqual([false, false]);
      expect(creamer.options.map((o) => o.label)).toEqual(["1 creamer", "2 creamers", "3 creamers"]);
      expect(sugar.options.map((o) => o.label)).toEqual(["1 sugar packet", "2 sugar packets", "3 sugar packets"]);
      expect(missingRequiredGroup(coffee, emptySelections(coffee))).toBeNull();
      expect(unitPriceCents(coffee, { creamer: ["2"], sugar: ["3"] })).toBe(coffee.priceCents);
      expect(describeSelections(coffee, { creamer: ["2"], sugar: ["1"] })).toEqual(["2 creamers", "1 sugar packet"]);
    }
    expect(combo.optionGroups.filter((g) => g.id.startsWith("coffee-")).map((g) => g.required)).toEqual([false, false]);
  });

  it("coffee, tea and hot chocolate share one section; Beverages keeps the cold drinks", () => {
    expect(categories.find((c) => c.id === "coffee")!.name).toBe("Coffee, Tea & Hot Chocolate");
    expect(products.filter((p) => p.categoryId === "coffee").map((p) => p.id)).toEqual([
      "cold-brew",
      "hot-coffee",
      "tea",
      "hot-chocolate",
      "chai-latte",
    ]);
    expect(products.filter((p) => p.categoryId === "beverages").map((p) => p.id)).not.toContain("hot-chocolate");
  });

  it("Italian soda requires a flavor from a dropdown; whipped cream stays optional", () => {
    const soda = catalog["italian-soda"];
    const flavor = soda.optionGroups.find((g) => g.id === "flavor")!;
    expect([flavor.required, flavor.display]).toEqual([true, "dropdown"]);
    expect(flavor.options.map((o) => o.label)).toEqual(["Raspberry", "Vanilla", "Peach", "Strawberry"]);
    expect(missingRequiredGroup(soda, emptySelections(soda))).toBe("Flavor");
    expect(soda.optionGroups.find((g) => g.id === "add")!.required).toBe(false);
  });

  it("tea requires a flavor, chosen from a dropdown of six", () => {
    const tea = catalog.tea;
    const flavor = tea.optionGroups.find((g) => g.id === "flavor")!;
    expect(flavor.required).toBe(true);
    expect(flavor.display).toBe("dropdown");
    expect(flavor.options.map((o) => o.label)).toEqual([
      "Chamomile",
      "Chai Spice",
      "Peppermint",
      "Double Bergamot Earl Grey",
      "Moroccan Mint",
      "Lemon Ginger",
    ]);
    expect(missingRequiredGroup(tea, emptySelections(tea))).toBe("Flavor");
    expect(unitPriceCents(tea, { flavor: ["moroccan-mint"] })).toBe(300);
    const comboTea = combo.optionGroups.find((g) => g.id === "tea-flavor")!;
    expect([comboTea.required, comboTea.display, comboTea.options.length]).toEqual([false, "dropdown", 6]);
  });

  it("creamer and sugar show as − / + steppers; other choices stay as buttons", () => {
    const coffee = catalog["hot-coffee"];
    expect(coffee.optionGroups.map(isAmountGroup)).toEqual([true, true]);
    expect(combo.optionGroups.filter(isAmountGroup).map((g) => g.id)).toEqual(["coffee-creamer", "coffee-sugar"]);
    expect(protein.optionGroups.some(isAmountGroup)).toBe(false);
  });

  it("hot chocolate is a combo drink choice", () => {
    expect(combo.optionGroups.find((g) => g.id === "drink")!.options.some((o) => o.productId === "hot-chocolate")).toBe(true);
  });
});

describe("pricing", () => {
  const sel = { bread: ["croissant"], protein: ["turkey"], cheese: [], drink: ["orange-juice"] };

  it("prices the combo at $10 with one protein", () => {
    expect(unitPriceCents(combo, sel)).toBe(1000);
  });

  it("charges +$1 for each protein after the first", () => {
    const withProteins = (ids: string[]) => unitPriceCents(protein, { bread: ["bagel-plain"], protein: ids });
    expect(withProteins(["turkey"])).toBe(800);
    expect(withProteins(["turkey", "bacon"])).toBe(900);
    expect(withProteins(["turkey", "chicken-sausage", "bacon"])).toBe(1000);
    expect(unitPriceCents(combo, { ...sel, protein: ["turkey", "chicken-sausage", "bacon"] })).toBe(1200);
  });

  it("doesn't charge extra for unknown options", () => {
    expect(unitPriceCents(protein, { bread: ["bagel-plain"], protein: ["turkey", "made-up"] })).toBe(800);
  });

  it("multiplies by quantity across lines", () => {
    const lines = [
      { key: "a", productId: "sandwich-combo", quantity: 2, selections: sel },
      { key: "b", productId: "water", quantity: 3, selections: {} },
    ];
    expect(subtotalCents(lines, catalog)).toBe(2 * 1000 + 3 * 100);
  });

  it("ignores options that don't exist instead of charging for them", () => {
    expect(unitPriceCents(eggCheese, { bread: ["biscuit"] })).toBe(600);
  });

  it("starts with nothing selected and reports the first missing required choice", () => {
    const empty = emptySelections(combo);
    expect(Object.values(empty).every((v) => v.length === 0)).toBe(true);
    expect(missingRequiredGroup(combo, empty)).toBe("Bread");
    expect(missingRequiredGroup(combo, sel)).toBeNull();
  });

  it("describes choices in menu order", () => {
    expect(describeSelections(combo, { ...sel, protein: ["turkey", "bacon"] })).toEqual([
      "Croissant",
      "Turkey",
      "Bacon",
      "Orange juice",
    ]);
  });

  it("merges identical lines regardless of selection order", () => {
    expect(lineKey("x", { a: ["1", "2"], b: ["3"] })).toBe(lineKey("x", { b: ["3"], a: ["2", "1"] }));
  });
});

describe("availability", () => {
  const line = { key: "k", productId: "sandwich-combo", quantity: 1, selections: { drink: ["orange-juice"] } };

  it("blocks a combo whose chosen drink is sold out", () => {
    expect(isLineAvailable(line, { "sandwich-combo": true, "orange-juice": false }, catalog)).toBe(false);
    expect(isLineAvailable(line, { "sandwich-combo": true, "orange-juice": true }, catalog)).toBe(true);
  });

  it("energy drink is sold out by default and blocks a combo that chose it", () => {
    const energyCombo = { key: "e", productId: "sandwich-combo", quantity: 1, selections: { drink: ["energy-drink"] } };
    expect(defaultAvailability["energy-drink"]).toBe(false);
    expect(isLineAvailable(energyCombo, defaultAvailability, catalog)).toBe(false);
  });

  it("blocks items with no price yet (Chai Latte)", () => {
    expect(isLineAvailable({ key: "c", productId: "chai-latte", quantity: 1, selections: {} }, {}, catalog)).toBe(false);
  });
});
