import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** Menu-style price: "$3" for whole dollars, "$3.50" otherwise. */
export function formatMenuPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : usd.format(cents / 100);
}

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
