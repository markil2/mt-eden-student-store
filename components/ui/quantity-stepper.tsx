"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/format";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label: string;
}) {
  const btn = cn(
    "press grid place-items-center rounded-full text-navy transition-colors hover:bg-navy/[0.07] disabled:opacity-30",
    size === "sm" ? "size-8" : "size-11",
  );
  return (
    <div
      className={cn("inline-flex items-center rounded-full border border-line bg-white/60", size === "sm" ? "p-0.5" : "p-1")}
      role="group"
      aria-label={label}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className={cn("text-center font-semibold tabular-nums", size === "sm" ? "w-6 text-sm" : "w-8")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
