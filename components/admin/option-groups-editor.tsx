"use client";

import { ArrowDown, ArrowUp, Copy, Link2, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { blankGroup, MAX_CHOICES, MAX_GROUPS, toEditable, type EditableGroup, type PickStyle } from "@/lib/menu/option-editor";
import { cn } from "@/lib/format";
import { buttonClasses } from "@/components/ui/button";

const styles: { value: PickStyle; label: string }[] = [
  { value: "one", label: "Pick one (buttons)" },
  { value: "dropdown", label: "Pick one from a dropdown" },
  { value: "several", label: "Pick several" },
  { value: "amount", label: "Amount (− / + counter)" },
];

const field =
  "block h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";
const iconBtn =
  "press grid size-9 shrink-0 place-items-center rounded-full text-ink/60 hover:bg-ink/[0.06] hover:text-ink disabled:opacity-30";

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const dollars = (cents: number) => (cents / 100).toFixed(2);
const toCents = (text: string) => Math.round(Number(text || 0) * 100);

/**
 * Lets managers build an item's choices: bread types, flavors, add-ons,
 * "how many" counters… Each group shows on the customer's options sheet.
 */
export function OptionGroupsEditor({
  value,
  onChange,
  products,
  currentProductId,
}: {
  value: EditableGroup[];
  onChange: (next: EditableGroup[]) => void;
  products: Product[];
  currentProductId?: string;
}) {
  const update = (i: number, patch: Partial<EditableGroup>) => onChange(value.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const copyable = products.filter((p) => p.id !== currentProductId && p.optionGroups.length > 0);

  return (
    <section aria-labelledby="options-editor-title" className="space-y-4">
      <div>
        <h3 id="options-editor-title" className="text-base font-semibold">
          Choices customers make
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          Bread types, flavors, add-ons and more. Leave empty for items with no choices.
        </p>
      </div>

      {value.map((group, i) => (
        <div key={i} className="rounded-2xl bg-cream/70 p-4 ring-1 ring-line">
          <div className="flex items-start gap-2">
            <label className="min-w-0 flex-1 text-xs font-semibold text-ink-muted">
              Group name
              <input
                value={group.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="e.g. Bread, Flavor, Toppings"
                maxLength={40}
                className={cn(field, "mt-1 text-base font-semibold text-ink")}
              />
            </label>
            <div className="mt-5 flex">
              <button type="button" className={iconBtn} onClick={() => onChange(move(value, i, i - 1))} disabled={i === 0} aria-label={`Move ${group.label || "group"} up`}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" className={iconBtn} onClick={() => onChange(move(value, i, i + 1))} disabled={i === value.length - 1} aria-label={`Move ${group.label || "group"} down`}>
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                className={cn(iconBtn, "hover:text-[#a3361f]")}
                onClick={() => window.confirm(`Remove the "${group.label || "untitled"}" group?`) && onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove ${group.label || "group"}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-ink-muted">
              How customers choose
              <select
                value={group.style}
                onChange={(e) => {
                  const style = e.target.value as PickStyle;
                  update(i, {
                    style,
                    ...(style === "amount" ? { required: false, max: Math.min(Math.max(group.max, 1), 10) } : {}),
                    ...(style === "several" ? { max: Math.max(2, Math.min(group.max, group.choices.length || 2)) } : {}),
                  });
                }}
                className={cn(field, "mt-1")}
              >
                {styles.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-muted">
              Note for customers <span className="font-normal">(optional)</span>
              <input
                value={group.hint}
                onChange={(e) => update(i, { hint: e.target.value })}
                placeholder="e.g. Free, or Only if you chose tea"
                maxLength={80}
                className={cn(field, "mt-1")}
              />
            </label>
          </div>

          {group.style !== "amount" && (
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={group.required}
                onChange={(e) => update(i, { required: e.target.checked })}
                className="size-5 accent-[#0a3473]"
              />
              Customers must choose
            </label>
          )}

          {group.style === "several" && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <label className="text-xs font-semibold text-ink-muted">
                Most they can pick
                <input type="number" min={2} max={group.choices.length || 2} value={group.max} onChange={(e) => update(i, { max: Number(e.target.value) })} className={cn(field, "mt-1")} />
              </label>
              <label className="text-xs font-semibold text-ink-muted">
                Included in price
                <input type="number" min={0} max={group.max} value={group.includedCount} onChange={(e) => update(i, { includedCount: Number(e.target.value) })} className={cn(field, "mt-1")} />
              </label>
              <label className="text-xs font-semibold text-ink-muted">
                Each extra costs
                <span className="relative mt-1 block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-muted">$</span>
                  <input
                    key={`${i}-${group.extraEachCents}`}
                    inputMode="decimal"
                    defaultValue={dollars(group.extraEachCents)}
                    onBlur={(e) => update(i, { extraEachCents: toCents(e.target.value) })}
                    className={cn(field, "pl-6")}
                  />
                </span>
              </label>
              <p className="col-span-3 text-xs text-ink-muted">
                Example: proteins with 1 included and $1.00 each extra → picking 3 adds $2.00.
              </p>
            </div>
          )}

          {group.style === "amount" ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <label className="text-xs font-semibold text-ink-muted">
                Up to
                <input type="number" min={1} max={10} value={group.max} onChange={(e) => update(i, { max: Number(e.target.value) })} className={cn(field, "mt-1")} />
              </label>
              <label className="text-xs font-semibold text-ink-muted">
                One is called
                <input value={group.singular} onChange={(e) => update(i, { singular: e.target.value })} placeholder="creamer" className={cn(field, "mt-1")} />
              </label>
              <label className="text-xs font-semibold text-ink-muted">
                More than one
                <input value={group.plural} onChange={(e) => update(i, { plural: e.target.value })} placeholder="creamers" className={cn(field, "mt-1")} />
              </label>
              <p className="col-span-3 text-xs text-ink-muted">Shown as a − / + counter starting at 0. Always free and optional.</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-xs font-semibold text-ink-muted">Choices</p>
              <ul className="mt-1 space-y-2">
                {group.choices.map((choice, ci) => (
                  <li key={ci} className="flex items-center gap-2">
                    <input
                      value={choice.label}
                      onChange={(e) =>
                        update(i, { choices: group.choices.map((c, j) => (j === ci ? { ...c, label: e.target.value } : c)) })
                      }
                      placeholder="e.g. Everything bagel"
                      maxLength={60}
                      aria-label={`Choice ${ci + 1} name`}
                      className={cn(field, "min-w-0 flex-1")}
                    />
                    <span className="relative w-24 shrink-0">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-muted">+$</span>
                      <input
                        key={`${ci}-${choice.priceCents}`}
                        inputMode="decimal"
                        defaultValue={dollars(choice.priceCents)}
                        onBlur={(e) =>
                          update(i, {
                            choices: group.choices.map((c, j) => (j === ci ? { ...c, priceCents: toCents(e.target.value) } : c)),
                          })
                        }
                        aria-label={`Extra cost for choice ${ci + 1}`}
                        className={cn(field, "pl-8 tabular-nums")}
                      />
                    </span>
                    <div className="flex">
                      <button type="button" className={iconBtn} onClick={() => update(i, { choices: move(group.choices, ci, ci - 1) })} disabled={ci === 0} aria-label="Move choice up">
                        <ArrowUp className="size-4" />
                      </button>
                      <button type="button" className={iconBtn} onClick={() => update(i, { choices: move(group.choices, ci, ci + 1) })} disabled={ci === group.choices.length - 1} aria-label="Move choice down">
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={cn(iconBtn, "hover:text-[#a3361f]")}
                        onClick={() => update(i, { choices: group.choices.filter((_, j) => j !== ci) })}
                        aria-label={`Remove ${choice.label || "choice"}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {choice.productId && (
                      <span className="sr-only">Follows the stock of {choice.productId}</span>
                    )}
                  </li>
                ))}
              </ul>
              {group.choices.some((c) => c.productId) && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Link2 className="size-3.5" /> Some choices follow another item&apos;s stock (they show as sold out when that item is).
                </p>
              )}
              <button
                type="button"
                onClick={() => update(i, { choices: [...group.choices, { label: "", priceCents: 0 }] })}
                disabled={group.choices.length >= MAX_CHOICES}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/[0.06]"
              >
                <Plus className="size-4" /> Add choice
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onChange([...value, blankGroup()])}
          disabled={value.length >= MAX_GROUPS}
          className={buttonClasses("secondary", "md")}
        >
          <Plus className="size-4" /> Add option group
        </button>
        {copyable.length > 0 && (
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <Copy className="size-4" />
            <select
              value=""
              onChange={(e) => {
                const source = copyable.find((p) => p.id === e.target.value);
                if (!source) return;
                // Copies get fresh keys from their names (and keep any stock links).
                const copied = source.optionGroups.map((g) => {
                  const ed = toEditable(g);
                  return { ...ed, key: undefined, choices: ed.choices.map((c) => ({ ...c, key: undefined })) };
                });
                onChange([...value, ...copied].slice(0, MAX_GROUPS));
              }}
              className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink"
              aria-label="Copy option groups from another item"
            >
              <option value="">Copy options from…</option>
              {copyable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  );
}
