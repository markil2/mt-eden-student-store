"use client";

import { Check } from "lucide-react";
import type { Availability, OptionGroup as OptionGroupType } from "@/lib/types";
import { cn, formatCents } from "@/lib/format";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

/**
 * "How many?" groups (creamer, sugar packets): one optional choice whose option
 * ids are 1, 2, 3… These show as a − / + stepper starting at 0 instead of chips.
 */
export function isAmountGroup(group: OptionGroupType): boolean {
  return (
    !group.required &&
    group.max === 1 &&
    group.options.length > 1 &&
    group.options.every((o, i) => o.id === String(i + 1))
  );
}

export function OptionGroupField({
  group,
  selected,
  availability,
  invalid = false,
  onChange,
}: {
  group: OptionGroupType;
  selected: string[];
  availability: Availability;
  /** Highlights a required group the customer skipped */
  invalid?: boolean;
  onChange: (next: string[]) => void;
}) {
  if (isAmountGroup(group)) return <AmountField group={group} selected={selected} onChange={onChange} />;

  const single = group.max === 1 && group.required;
  const inputType = single ? "radio" : "checkbox";

  return (
    <div className="py-5" role={single ? "radiogroup" : "group"} aria-labelledby={`group-${group.id}`}>
      <div className="flex w-full items-baseline justify-between gap-3">
        <span id={`group-${group.id}`} className="font-semibold text-ink">
          {group.label}
        </span>
        <span
          className={cn(
            "eyebrow text-[0.62rem]",
            invalid ? "text-[#a3361f]" : group.required ? "text-navy" : "text-ink-muted",
          )}
        >
          {invalid ? "Choose one" : group.required ? "Required" : "Optional"}
        </span>
      </div>
      {group.hint && <p className="mt-1 text-sm text-ink-muted">{group.hint}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {group.options.map((option) => {
          const soldOut = option.productId ? availability[option.productId] === false : false;
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={cn(
                "relative flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-sm transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy",
                checked ? "border-navy bg-navy text-cream" : "border-line bg-white/70 text-ink hover:border-navy/40",
                soldOut && "cursor-not-allowed opacity-45 hover:border-line",
              )}
            >
              <input
                type={inputType}
                name={group.id}
                value={option.id}
                checked={checked}
                disabled={soldOut}
                className="sr-only"
                onChange={() => {
                  if (single) onChange([option.id]);
                  else if (checked) onChange(selected.filter((id) => id !== option.id));
                  else onChange(group.max === 1 ? [option.id] : [...selected, option.id].slice(-group.max));
                }}
              />
              <span className="font-medium">
                {option.label}
                {soldOut && <span className="ml-1 text-xs">(sold out)</span>}
              </span>
              {option.priceDeltaCents > 0 ? (
                <span className={cn("text-xs font-semibold tabular-nums", checked ? "text-gold" : "text-ink-muted")}>
                  +{formatCents(option.priceDeltaCents)}
                </span>
              ) : (
                checked && <Check className="size-4 text-gold" aria-hidden />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function AmountField({
  group,
  selected,
  onChange,
}: {
  group: OptionGroupType;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const count = Number(selected[0] ?? 0) || 0;
  const free = group.options.every((o) => o.priceDeltaCents === 0);
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div>
        <p id={`group-${group.id}`} className="font-semibold text-ink">
          {group.label}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{group.hint ?? (free ? "Free" : "Optional")}</p>
      </div>
      <QuantityStepper
        value={count}
        min={0}
        max={group.options.length}
        onChange={(n) => onChange(n > 0 ? [String(n)] : [])}
        label={group.label}
        itemLabel={group.label.toLowerCase()}
      />
    </div>
  );
}
