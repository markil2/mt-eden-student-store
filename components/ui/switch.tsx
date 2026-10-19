"use client";

import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "@/lib/format";

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "data-[state=checked]:bg-navy data-[state=unchecked]:bg-ink/20",
        className,
      )}
    >
      <RadixSwitch.Thumb className="block size-5 translate-x-1 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out-soft data-[state=checked]:translate-x-6" />
    </RadixSwitch.Root>
  );
}
