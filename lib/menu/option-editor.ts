import type { Option, OptionGroup } from "@/lib/types";

/**
 * The menu option editor (Admin → Menu → edit an item) works with these
 * friendlier shapes, then converts them back to `OptionGroup`s.
 * The same `fromEditable()` runs on the server to validate what managers save.
 */

export type PickStyle = "one" | "dropdown" | "several" | "amount";

export interface EditableChoice {
  /** Existing option id, kept so saved carts and past choices still match. */
  key?: string;
  label: string;
  priceCents: number;
  /** Links a choice to another item's stock (e.g. combo drinks). Kept as-is. */
  productId?: string;
}

export interface EditableGroup {
  key?: string;
  label: string;
  hint: string;
  required: boolean;
  style: PickStyle;
  /** "several": most they can pick. "amount": highest number on the − / + stepper. */
  max: number;
  /** "several": how many are included before extra charges start. */
  includedCount: number;
  /** "several": charge for each pick beyond `includedCount`. */
  extraEachCents: number;
  /** "amount": words for one / many, e.g. "creamer" / "creamers". */
  singular: string;
  plural: string;
  choices: EditableChoice[];
}

export const MAX_GROUPS = 12;
export const MAX_CHOICES = 30;

export function blankGroup(): EditableGroup {
  return {
    label: "",
    hint: "",
    required: true,
    style: "one",
    max: 2,
    includedCount: 0,
    extraEachCents: 0,
    singular: "",
    plural: "",
    choices: [{ label: "", priceCents: 0 }],
  };
}

function isAmount(group: OptionGroup): boolean {
  if (group.display) return group.display === "stepper";
  return !group.required && group.max === 1 && group.options.length > 1 && group.options.every((o, i) => o.id === String(i + 1));
}

/** Turns a saved option group into the editor's shape. */
export function toEditable(group: OptionGroup): EditableGroup {
  if (isAmount(group)) {
    // Labels look like "1 creamer", "2 creamers" — recover the words.
    const one = group.options[0]?.label.replace(/^1\s+/, "") ?? "";
    const many = group.options[1]?.label.replace(/^\d+\s+/, "") ?? one;
    return {
      key: group.id,
      label: group.label,
      hint: group.hint ?? "",
      required: false,
      style: "amount",
      max: group.options.length,
      includedCount: 0,
      extraEachCents: 0,
      singular: one,
      plural: many,
      choices: [],
    };
  }
  const style: PickStyle = group.display === "dropdown" ? "dropdown" : group.max > 1 ? "several" : "one";
  return {
    key: group.id,
    label: group.label,
    hint: group.hint ?? "",
    required: group.required,
    style,
    max: style === "several" ? group.max : 2,
    includedCount: group.includedCount ?? 0,
    extraEachCents: group.extraEachCents ?? 0,
    singular: "",
    plural: "",
    choices: group.options.map((o) => ({ key: o.id, label: o.label, priceCents: o.priceDeltaCents, productId: o.productId })),
  };
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "choice"
  );
}

function uniqueKey(base: string, taken: Set<string>): string {
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}-${n}`;
  taken.add(key);
  return key;
}

const money = (cents: number) => Number.isInteger(cents) && cents >= 0 && cents <= 5000;
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ").slice(0, max) : "");

/**
 * Validates editor groups and converts them to `OptionGroup`s.
 * Returns an error message for the manager instead of throwing.
 */
export function fromEditable(input: EditableGroup[]): { ok: true; groups: OptionGroup[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "Something went wrong. Please reload and try again." };
  if (input.length > MAX_GROUPS) return { ok: false, error: `An item can have at most ${MAX_GROUPS} option groups.` };

  const groupKeys = new Set(input.map((g) => (g.key ? clean(g.key, 60) : "")).filter(Boolean));
  const groups: OptionGroup[] = [];

  for (const [i, g] of input.entries()) {
    const label = clean(g.label, 40);
    const where = label ? `"${label}"` : `option group ${i + 1}`;
    if (!label) return { ok: false, error: `Give option group ${i + 1} a name (e.g. "Bread" or "Flavor").` };
    const hint = clean(g.hint, 80) || undefined;
    const key = g.key ? clean(g.key, 60) : uniqueKey(slugify(label), groupKeys);

    if (g.style === "amount") {
      const max = Math.floor(Number(g.max));
      const singular = clean(g.singular, 30);
      const plural = clean(g.plural, 30) || singular;
      if (!(max >= 1 && max <= 10)) return { ok: false, error: `${where}: the most they can pick must be between 1 and 10.` };
      if (!singular) return { ok: false, error: `${where}: enter what one of them is called (e.g. "creamer").` };
      groups.push({
        id: key,
        label,
        hint,
        required: false,
        max: 1,
        display: "stepper",
        options: Array.from({ length: max }, (_, n) => ({
          id: String(n + 1),
          label: `${n + 1} ${n === 0 ? singular : plural}`,
          priceDeltaCents: 0,
        })),
      });
      continue;
    }

    const rawChoices = Array.isArray(g.choices) ? g.choices : [];
    if (rawChoices.length === 0) return { ok: false, error: `${where}: add at least one choice.` };
    if (rawChoices.length > MAX_CHOICES) return { ok: false, error: `${where}: at most ${MAX_CHOICES} choices.` };

    const optionKeys = new Set(rawChoices.map((c) => (c.key ? clean(c.key, 60) : "")).filter(Boolean));
    const seenLabels = new Set<string>();
    const options: Option[] = [];
    for (const c of rawChoices) {
      const choiceLabel = clean(c.label, 60);
      if (!choiceLabel) return { ok: false, error: `${where}: every choice needs a name.` };
      if (seenLabels.has(choiceLabel.toLowerCase())) return { ok: false, error: `${where}: "${choiceLabel}" is listed twice.` };
      seenLabels.add(choiceLabel.toLowerCase());
      const price = Math.round(Number(c.priceCents));
      if (!money(price)) return { ok: false, error: `${where}: "${choiceLabel}" needs a price between $0 and $50.` };
      options.push({
        id: c.key ? clean(c.key, 60) : uniqueKey(slugify(choiceLabel), optionKeys),
        label: choiceLabel,
        priceDeltaCents: price,
        ...(c.productId ? { productId: clean(c.productId, 60) } : {}),
      });
    }

    if (g.style === "several") {
      const max = Math.floor(Number(g.max));
      if (!(max >= 2 && max <= options.length)) {
        return { ok: false, error: `${where}: "most they can pick" must be between 2 and ${options.length}.` };
      }
      const included = Math.floor(Number(g.includedCount)) || 0;
      const extra = Math.round(Number(g.extraEachCents)) || 0;
      if (included < 0 || included > max) return { ok: false, error: `${where}: "included" must be between 0 and ${max}.` };
      if (!money(extra)) return { ok: false, error: `${where}: the extra charge must be between $0 and $50.` };
      groups.push({
        id: key,
        label,
        hint,
        required: Boolean(g.required),
        max,
        ...(extra > 0 ? { includedCount: included, extraEachCents: extra } : {}),
        options,
      });
      continue;
    }

    groups.push({
      id: key,
      label,
      hint,
      required: Boolean(g.required),
      max: 1,
      ...(g.style === "dropdown" ? { display: "dropdown" as const } : {}),
      options,
    });
  }

  return { ok: true, groups };
}
