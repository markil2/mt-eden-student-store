"use client";

import { Plus, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatMenuPrice, cn } from "@/lib/format";
import { ProductImage } from "@/components/ui/product-image";

export function MenuItemRow({
  product,
  soldOut,
  onAdd,
}: {
  product: Product;
  soldOut: boolean;
  onAdd: (product: Product) => void;
}) {
  const customizable = product.optionGroups.length > 0;

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={soldOut}
      aria-label={soldOut ? `${product.name}, sold out` : `${customizable ? "Customize" : "Add"} ${product.name}, ${formatMenuPrice(product.priceCents)}`}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl py-4 text-left transition-colors sm:gap-5 sm:px-3 sm:-mx-3",
        soldOut ? "cursor-not-allowed" : "hover:bg-white/70",
      )}
    >
      <ProductImage
        image={product.image}
        name={product.name}
        categoryId={product.categoryId}
        sizes="96px"
        dimmed={soldOut}
        className="size-20 shrink-0 rounded-xl sm:size-24"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline">
          <h3 className={cn("font-semibold leading-snug sm:text-lg", soldOut ? "text-ink-muted" : "text-ink")}>
            {product.name}
          </h3>
          <span className="leader" aria-hidden />
          {soldOut ? (
            <span className="shrink-0 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold text-ink">Sold out</span>
          ) : (
            <span className="shrink-0 font-display text-lg text-navy tabular-nums sm:text-xl">
              {formatMenuPrice(product.priceCents)}
            </span>
          )}
        </div>
        {product.description && (
          <p className={cn("mt-1 line-clamp-2 text-sm leading-relaxed", soldOut ? "text-ink-muted/70" : "text-ink-muted")}>
            {product.description}
          </p>
        )}
        {!soldOut && (
          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-cream">
            {customizable ? <SlidersHorizontal className="size-3.5" /> : <Plus className="size-3.5" />}
            {customizable ? "Choose options" : "Add"}
          </span>
        )}
      </div>
    </button>
  );
}
