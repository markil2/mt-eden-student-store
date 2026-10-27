"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Minus, Pencil, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { isOut, LOW_STOCK_AT, type Ingredient, type IngredientUse } from "@/lib/inventory";
import { useStoreData } from "@/lib/store/store-data";
import { useStaff } from "@/lib/admin/staff-context";
import { cn } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { Sheet } from "@/components/ui/sheet";
import { buttonClasses } from "@/components/ui/button";
import {
  createIngredientAction,
  deleteIngredientAction,
  setIngredientInStockAction,
  setIngredientQuantityAction,
  setIngredientUsesAction,
  updateIngredientAction,
} from "@/app/admin/actions";

/** "Everything bagel on 4 items", "Yogurt Parfait", … */
function usedBySummary(ing: Ingredient, uses: IngredientUse[], products: Product[]): string[] {
  const mine = uses.filter((u) => u.ingredientId === ing.id);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const whole = mine.filter((u) => !u.optionKey).map((u) => name(u.productId));
  const byChoice = new Map<string, Set<string>>();
  for (const u of mine.filter((x) => x.optionKey)) {
    const product = products.find((p) => p.id === u.productId);
    const label = product?.optionGroups.find((g) => g.id === u.groupKey)?.options.find((o) => o.id === u.optionKey)?.label ?? u.optionKey!;
    if (!byChoice.has(label)) byChoice.set(label, new Set());
    byChoice.get(label)!.add(u.productId);
  }
  return [
    ...whole,
    ...[...byChoice].map(([label, items]) => `${label} on ${items.size} item${items.size === 1 ? "" : "s"}`),
  ];
}

export function InventoryManager() {
  const ingredients = useStoreData((s) => s.ingredients);
  const uses = useStoreData((s) => s.ingredientUses);
  const products = useStoreData((s) => s.products);
  const setIngredientLocal = useStoreData((s) => s.setIngredientLocal);
  const staff = useStaff();
  const isManager = staff.role === "manager";
  const [editing, setEditing] = useState<Ingredient | "new" | null>(null);

  const counted = ingredients.filter((i) => i.kind === "count");
  const switches = ingredients.filter((i) => i.kind === "switch");

  async function saveQuantity(ing: Ingredient, quantity: number) {
    const previous = ing.quantity;
    setIngredientLocal(ing.id, { quantity });
    const result = await setIngredientQuantityAction(ing.id, quantity);
    if (!result.ok) {
      setIngredientLocal(ing.id, { quantity: previous });
      toast(`Couldn't update ${ing.name}: ${result.error}`);
    }
  }

  async function saveInStock(ing: Ingredient, inStock: boolean) {
    setIngredientLocal(ing.id, { inStock });
    const result = await setIngredientInStockAction(ing.id, inStock);
    if (!result.ok) {
      setIngredientLocal(ing.id, { inStock: !inStock });
      toast(`Couldn't update ${ing.name}: ${result.error}`);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-navy">Inventory</h1>
          <p className="mt-1 text-ink-muted">
            Counts go down automatically when people order. When something runs out, the items and choices that need it
            are marked sold out on the menu.
          </p>
        </div>
        {isManager && (
          <button type="button" onClick={() => setEditing("new")} className={buttonClasses("primary", "md")}>
            <Plus className="size-4" /> Add ingredient
          </button>
        )}
      </div>

      {ingredients.length === 0 && (
        <p className="mt-8 rounded-2xl bg-white p-8 text-center text-ink-muted ring-1 ring-line">
          No ingredients yet.{isManager ? " Add one to start tracking stock." : " Ask a manager to add some."}
        </p>
      )}

      {counted.length > 0 && (
        <section className="mt-8" aria-labelledby="counted-title">
          <h2 id="counted-title" className="eyebrow text-ink-muted">
            Counted
          </h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            {counted.map((ing) => (
              <li key={ing.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
                <IngredientInfo ing={ing} usedBy={usedBySummary(ing, uses, products)} />
                <CountControl key={`${ing.id}-${ing.quantity}`} ing={ing} onSave={(q) => saveQuantity(ing, q)} />
                {isManager && <EditButton ing={ing} onClick={() => setEditing(ing)} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {switches.length > 0 && (
        <section className="mt-8" aria-labelledby="switch-title">
          <h2 id="switch-title" className="eyebrow text-ink-muted">
            In stock / out
          </h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            {switches.map((ing) => (
              <li key={ing.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
                <IngredientInfo ing={ing} usedBy={usedBySummary(ing, uses, products)} />
                <label className="flex items-center gap-2.5">
                  <span className={cn("w-16 text-right text-sm font-semibold", ing.inStock ? "text-[#1f6b41]" : "text-[#a3361f]")}>
                    {ing.inStock ? "In stock" : "Out"}
                  </span>
                  <Switch checked={ing.inStock} onCheckedChange={(on) => saveInStock(ing, on)} label={`${ing.name} in stock`} />
                </label>
                {isManager && <EditButton ing={ing} onClick={() => setEditing(ing)} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "Add an ingredient" : `Edit ${editing?.name ?? ""}`}
        large
      >
        {editing && (
          <IngredientForm
            key={editing === "new" ? "new" : editing.id}
            ingredient={editing === "new" ? null : editing}
            uses={uses}
            products={products}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function IngredientInfo({ ing, usedBy }: { ing: Ingredient; usedBy: string[] }) {
  const out = isOut(ing);
  const low = !out && ing.kind === "count" && (ing.quantity ?? 0) <= LOW_STOCK_AT;
  return (
    <div className="min-w-0 flex-1 basis-48">
      <p className="flex flex-wrap items-center gap-2 font-semibold">
        {ing.name}
        {out && <span className="rounded-full bg-[#fbe4df] px-2 py-0.5 text-[0.7rem] font-bold text-[#a3361f]">Out</span>}
        {low && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[0.7rem] font-bold text-ink">Low</span>}
      </p>
      <p className="mt-0.5 text-sm text-ink-muted">{usedBy.length ? `Used by: ${usedBy.join(" · ")}` : "Not linked to any menu item yet"}</p>
    </div>
  );
}

function EditButton({ ing, onClick }: { ing: Ingredient; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press grid size-10 place-items-center rounded-full text-navy hover:bg-navy/[0.06]"
      aria-label={`Edit ${ing.name}`}
    >
      <Pencil className="size-4" />
    </button>
  );
}

/** Big − / + buttons plus a number you can type into (e.g. after a delivery). */
function CountControl({ ing, onSave }: { ing: Ingredient; onSave: (quantity: number) => void }) {
  const [text, setText] = useState(String(ing.quantity ?? 0));
  const current = ing.quantity ?? 0;
  const commit = () => {
    const n = Math.floor(Number(text));
    if (!Number.isFinite(n) || n < 0 || n > 9999) return setText(String(current));
    if (n !== current) onSave(n);
  };
  const btn = "press grid size-11 place-items-center rounded-full text-navy transition-colors hover:bg-navy/[0.07] disabled:opacity-30";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-cream/60 p-1" role="group" aria-label={`${ing.name} count`}>
      <button type="button" className={btn} onClick={() => onSave(Math.max(0, current - 1))} disabled={current <= 0} aria-label={`One less ${ing.name}`}>
        <Minus className="size-4" />
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        inputMode="numeric"
        aria-label={`${ing.name} count`}
        className="w-14 bg-transparent text-center text-lg font-semibold tabular-nums outline-none"
      />
      <button type="button" className={btn} onClick={() => onSave(current + 1)} disabled={current >= 9999} aria-label={`One more ${ing.name}`}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

const linkKey = (productId: string, groupKey: string | null, optionKey: string | null) =>
  `${productId}|${groupKey ?? ""}|${optionKey ?? ""}`;

function IngredientForm({
  ingredient,
  uses,
  products,
  onDone,
}: {
  ingredient: Ingredient | null;
  uses: IngredientUse[];
  products: Product[];
  onDone: () => void;
}) {
  const [name, setName] = useState(ingredient?.name ?? "");
  const [kind, setKind] = useState<Ingredient["kind"]>(ingredient?.kind ?? "count");
  const [quantity, setQuantity] = useState(String(ingredient?.quantity ?? 0));
  const [linked, setLinked] = useState<Set<string>>(
    () => new Set(uses.filter((u) => u.ingredientId === ingredient?.id).map((u) => linkKey(u.productId, u.groupKey, u.optionKey))),
  );
  const [open, setOpen] = useState<Set<string>>(() => new Set([...linked].map((k) => k.split("|")[0])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) =>
    setLinked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const linkCount = useMemo(() => linked.size, [linked]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const input = { name, kind, quantity: Number(quantity) };
    const result = ingredient ? await updateIngredientAction(ingredient.id, input) : await createIngredientAction(input);
    const id = ingredient?.id ?? (result.ok ? result.id : undefined);
    if (!result.ok || !id) {
      setBusy(false);
      return setError(result.ok ? "Something went wrong." : result.error);
    }
    const links = [...linked].map((k) => {
      const [productId, groupKey, optionKey] = k.split("|");
      return { productId, groupKey: groupKey || null, optionKey: optionKey || null };
    });
    const linkResult = await setIngredientUsesAction(id, links);
    setBusy(false);
    if (!linkResult.ok) return setError(linkResult.error);
    toast(ingredient ? "Saved" : `${name} added`);
    onDone();
  }

  async function remove() {
    if (!ingredient || !window.confirm(`Delete ${ingredient.name}? Menu items that used it will no longer depend on it.`)) return;
    const result = await deleteIngredientAction(ingredient.id);
    if (!result.ok) return setError(result.error);
    toast(`${ingredient.name} deleted`);
    onDone();
  }

  const input =
    "mt-2 block h-12 w-full rounded-xl border border-line bg-white px-4 text-base font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";

  return (
    <form onSubmit={save} className="space-y-5 pt-2 pb-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="block text-sm font-semibold">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Everything bagel, Granola" className={input} />
        </label>
        {!ingredient && kind === "count" && (
          <label className="block text-sm font-semibold">
            How many now
            <input value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(input, "w-32")} />
          </label>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">How do you track it?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["count", "Count it", "Bagels, croissants… goes down with each order"],
              ["switch", "Just in stock / out", "Fruit, granola… a simple on/off switch"],
            ] as const
          ).map(([value, title, detail]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm",
                kind === value ? "border-navy bg-navy text-cream" : "border-line bg-white",
              )}
            >
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
              <span>
                <span className="block font-semibold">{title}</span>
                <span className={kind === value ? "text-cream/75" : "text-ink-muted"}>{detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="used-by-title">
        <h3 id="used-by-title" className="text-sm font-semibold">
          Used by <span className="font-normal text-ink-muted">({linkCount} selected)</span>
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          Tick a whole item if it always needs this, or open it and tick just the choices that do (e.g. “Everything bagel”).
        </p>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl ring-1 ring-line">
          {products.map((product) => {
            const wholeKey = linkKey(product.id, null, null);
            const expanded = open.has(product.id);
            const choiceCount = [...linked].filter((k) => k.startsWith(`${product.id}|`) && k !== wholeKey).length;
            return (
              <li key={product.id} className="bg-white">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <label className="flex min-w-0 flex-1 items-center gap-3 text-sm font-semibold">
                    <input type="checkbox" checked={linked.has(wholeKey)} onChange={() => toggle(wholeKey)} className="size-5 shrink-0 accent-[#0a3473]" />
                    <span className="truncate">{product.name}</span>
                    {choiceCount > 0 && <span className="shrink-0 text-xs font-normal text-ink-muted">· {choiceCount} choice{choiceCount === 1 ? "" : "s"}</span>}
                  </label>
                  {product.optionGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setOpen((prev) => {
                          const next = new Set(prev);
                          if (next.has(product.id)) next.delete(product.id);
                          else next.add(product.id);
                          return next;
                        })
                      }
                      aria-expanded={expanded}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/[0.06]"
                    >
                      Choices <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
                    </button>
                  )}
                </div>
                {expanded && (
                  <div className="space-y-3 bg-cream/50 px-3 pt-1 pb-3 pl-11">
                    {product.optionGroups.map((group) => (
                      <div key={group.id}>
                        <p className="text-xs font-semibold text-ink-muted">{group.label}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
                          {group.options.map((option) => {
                            const key = linkKey(product.id, group.id, option.id);
                            return (
                              <label key={option.id} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={linked.has(key)} onChange={() => toggle(key)} className="size-4 accent-[#0a3473]" />
                                {option.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {error && (
        <p className="text-sm font-medium text-[#a3361f]" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "flex-1")}>
          {busy ? "Saving…" : ingredient ? "Save changes" : "Add ingredient"}
        </button>
        <button type="button" onClick={onDone} className={buttonClasses("secondary", "lg")}>
          Cancel
        </button>
      </div>
      {ingredient && (
        <button type="button" onClick={remove} className="text-sm font-semibold text-[#a3361f] hover:underline">
          Delete ingredient
        </button>
      )}
    </form>
  );
}
