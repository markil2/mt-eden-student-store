import { describe, expect, it } from "vitest";
import { products } from "@/lib/data/menu";
import { blankGroup, fromEditable, toEditable, type EditableGroup } from "@/lib/menu/option-editor";
import { unitPriceCents } from "@/lib/pricing";
import type { Product } from "@/lib/types";

const normalize = (groups: Product["optionGroups"]) =>
  JSON.parse(JSON.stringify(groups.map((g) => ({ ...g, hint: g.hint || undefined }))));

describe("menu option editor", () => {
  it("round-trips every item on the current menu without changing it", () => {
    for (const product of products) {
      const result = fromEditable(product.optionGroups.map(toEditable));
      expect(result.ok, product.id).toBe(true);
      if (result.ok) expect(normalize(result.groups), product.id).toEqual(normalize(product.optionGroups));
    }
  });

  it("creates new keys from names and keeps them unique", () => {
    const group: EditableGroup = {
      ...blankGroup(),
      label: "Bread",
      choices: [
        { label: "Sourdough", priceCents: 0 },
        { label: "Rye", priceCents: 50 },
      ],
    };
    const result = fromEditable([group, { ...group, choices: [{ label: "Wheat", priceCents: 0 }] }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.groups.map((g) => g.id)).toEqual(["bread", "bread-2"]);
    expect(result.groups[0].options.map((o) => [o.id, o.priceDeltaCents])).toEqual([
      ["sourdough", 0],
      ["rye", 50],
    ]);
  });

  it("builds a − / + amount group from words and a maximum", () => {
    const result = fromEditable([{ ...blankGroup(), label: "Honey", style: "amount", max: 2, singular: "packet", plural: "packets" }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.groups[0]).toMatchObject({ required: false, display: "stepper", max: 1 });
    expect(result.groups[0].options.map((o) => o.label)).toEqual(["1 packet", "2 packets"]);
  });

  it("supports 'pick several' with extra charges, which pricing then applies", () => {
    const result = fromEditable([
      {
        ...blankGroup(),
        label: "Toppings",
        style: "several",
        max: 3,
        includedCount: 1,
        extraEachCents: 75,
        choices: ["Berries", "Granola", "Honey"].map((label) => ({ label, priceCents: 0 })),
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const item = { ...products[0], priceCents: 500, optionGroups: result.groups };
    expect(unitPriceCents(item, { toppings: ["berries", "granola", "honey"] })).toBe(500 + 2 * 75);
  });

  it("rejects mistakes with a clear message", () => {
    const bad = (patch: Partial<EditableGroup>) => fromEditable([{ ...blankGroup(), label: "Bread", choices: [{ label: "Rye", priceCents: 0 }], ...patch }]);
    expect(fromEditable([blankGroup()])).toMatchObject({ ok: false });
    expect(bad({ choices: [] })).toMatchObject({ ok: false, error: expect.stringContaining("at least one choice") });
    expect(bad({ choices: [{ label: "Rye", priceCents: 0 }, { label: "rye", priceCents: 0 }] })).toMatchObject({
      ok: false,
      error: expect.stringContaining("twice"),
    });
    expect(bad({ choices: [{ label: "Rye", priceCents: 99999 }] })).toMatchObject({ ok: false });
    expect(bad({ style: "several", max: 5 })).toMatchObject({ ok: false, error: expect.stringContaining("most they can pick") });
    expect(bad({ style: "amount", singular: "" })).toMatchObject({ ok: false });
  });
});
