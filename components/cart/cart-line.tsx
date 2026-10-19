"use client";

import type { CartLine } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { describeSelections, lineTotalCents } from "@/lib/pricing";
import { formatCents, cn } from "@/lib/format";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { ProductImage } from "@/components/ui/product-image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

export function CartLineItem({ line, available }: { line: CartLine; available: boolean }) {
  const { catalog } = useCatalog();
  const product = catalog[line.productId];
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const setCartOpen = useCart((s) => s.setOpen);
  const openCustomize = useUI((s) => s.openCustomize);

  if (!product) return null;
  const details = describeSelections(product, line.selections);

  return (
    <div className="flex gap-4 py-4">
      <ProductImage
        image={product.image}
        name={product.name}
        categoryId={product.categoryId}
        sizes="72px"
        dimmed={!available}
        className="size-18 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className={cn("font-semibold leading-snug", !available && "text-ink-muted line-through")}>{product.name}</p>
          <p className="font-semibold tabular-nums">{formatCents(lineTotalCents(line, catalog))}</p>
        </div>
        {details.length > 0 && <p className="mt-0.5 text-sm text-ink-muted">{details.join(" · ")}</p>}
        {!available && <p className="mt-1 text-sm font-semibold text-[#a3361f]">Sold out</p>}

        <div className="mt-3 flex items-center gap-1">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            min={0}
            onChange={(q) => setQuantity(line.key, q)}
            label={`Quantity of ${product.name}`}
          />
          {product.optionGroups.length > 0 && available && (
            <button
              type="button"
              onClick={() => {
                // Hand off from the cart drawer to the options sheet (it reopens the cart on save)
                setCartOpen(false);
                openCustomize({ productId: product.id, lineKey: line.key });
              }}
              className="press ml-auto rounded-full px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/[0.06]"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => remove(line.key)}
            className={cn(
              "press rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-ink/[0.05] hover:text-ink",
              !(product.optionGroups.length > 0 && available) && "ml-auto",
            )}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
