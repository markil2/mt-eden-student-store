import { describe, expect, it } from "vitest";
import { products } from "@/lib/data/menu";
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
  it("only offers bagel or croissant — no biscuit", () => {
    const bread = protein.optionGroups.find((g) => g.id === "bread")!;
    expect(bread.options.map((o) => o.label)).toEqual(["Bagel", "Croissant"]);
  });

  it("protein is turkey or chicken sausage; bacon is a free optional extra", () => {
    const p = protein.optionGroups.find((g) => g.id === "protein")!;
    expect(p.required).toBe(true);
    expect(p.options.map((o) => o.id)).toEqual(["turkey", "chicken-sausage"]);
    const bacon = protein.optionGroups.find((g) => g.id === "extras")!;
    expect(bacon.required).toBe(false);
    expect(bacon.options[0].priceDeltaCents).toBe(0);
  });

  it("cheese is optional on every sandwich", () => {
    for (const s of [combo, protein, eggCheese]) {
      expect(s.optionGroups.find((g) => g.id === "cheese")!.required).toBe(false);
    }
  });

  it("the $3 bagel comes with cream cheese and has no options", () => {
    expect(catalog.bagel.priceCents).toBe(300);
    expect(catalog.bagel.optionGroups).toHaveLength(0);
  });
});

describe("pricing", () => {
  const sel = { bread: ["croissant"], protein: ["turkey"], extras: ["bacon"], cheese: [], drink: ["orange-juice"] };

  it("prices the combo at $10 with bacon included free", () => {
    expect(unitPriceCents(combo, sel)).toBe(1000);
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
    expect(describeSelections(combo, sel)).toEqual(["Croissant", "Turkey", "Bacon", "Orange juice"]);
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

  it("blocks items with no price yet (Chai Latte)", () => {
    expect(isLineAvailable({ key: "c", productId: "chai-latte", quantity: 1, selections: {} }, {}, catalog)).toBe(false);
  });
});
