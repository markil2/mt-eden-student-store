"use client";

import { DoorOpen, ShoppingBag } from "lucide-react";
import type { FulfillmentMethod, FulfillmentWindow } from "@/lib/types";
import { cn } from "@/lib/format";

interface ChoiceOption<T extends string> {
  value: T;
  title: string;
  detail: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  disabledNote?: string;
}

/** Large, tappable radio cards used for "pickup vs delivery" and "before vs after school". */
export function ChoiceCards<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: T | null;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={legend} className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors sm:p-5",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy",
              checked ? "border-navy bg-navy text-cream" : "border-line bg-white/70 hover:border-navy/40",
              o.disabled && "cursor-not-allowed opacity-50 hover:border-line",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.icon && (
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-full",
                  checked ? "bg-cream/15 text-gold" : "bg-navy-soft text-navy",
                )}
              >
                {o.icon}
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-semibold">{o.title}</span>
              <span className={cn("mt-0.5 block text-sm", checked ? "text-cream/75" : "text-ink-muted")}>
                {o.disabled ? o.disabledNote : o.detail}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "ml-auto mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2",
                checked ? "border-gold" : "border-ink/25",
              )}
            >
              {checked && <span className="size-2.5 rounded-full bg-gold" />}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function methodOptions(opts: {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  pickupLocation: string;
  deliveryFeeLabel: string;
}): ChoiceOption<FulfillmentMethod>[] {
  return [
    {
      value: "pickup",
      title: "Store pickup",
      detail: opts.pickupLocation,
      icon: <ShoppingBag className="size-5" />,
      disabled: !opts.pickupEnabled,
      disabledNote: "Not available right now",
    },
    {
      value: "delivery",
      title: "Classroom delivery",
      detail: `To your room · ${opts.deliveryFeeLabel}`,
      icon: <DoorOpen className="size-5" />,
      disabled: !opts.deliveryEnabled,
      disabledNote: "Not available right now",
    },
  ];
}

export function windowOptions(windows: FulfillmentWindow[], method: FulfillmentMethod | null): ChoiceOption<string>[] {
  return windows.map((w) => ({
    value: w.id,
    title: w.label,
    detail: w.detail,
    disabled: method ? !w[method] : false,
    disabledNote: method === "delivery" ? "No delivery at this time" : "No pickup at this time",
  }));
}
