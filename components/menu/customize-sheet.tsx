"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Product, Selections } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { useUI } from "@/lib/store/ui";
import { useCart } from "@/lib/store/cart";
import { useStoreData } from "@/lib/store/store-data";
import { emptySelections, unitPriceCents } from "@/lib/pricing";
import { formatCents } from "@/lib/format";
import { notifyAdded } from "@/lib/use-add-to-cart";
import { Sheet } from "@/components/ui/sheet";
import { ProductImage } from "@/components/ui/product-image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { OptionGroupField } from "./option-group";
import { buttonClasses } from "@/components/ui/button";

/** Global options sheet — opened by any "Add" on a customizable item, or "Edit" in the cart. */
export function CustomizeSheet() {
  const target = useUI((s) => s.customizing);
  const close = useUI((s) => s.closeCustomize);
  const { catalog } = useCatalog();
  const product = target ? catalog[target.productId] : undefined;

  return (
    <Sheet
      open={Boolean(product)}
      onOpenChange={(open) => !open && close()}
      title={product?.name ?? ""}
      description={product?.description}
    >
      {product && target && (
        // Keyed so local state resets whenever a different item/line opens
        <CustomizeForm key={`${product.id}:${target.lineKey ?? "new"}`} product={product} lineKey={target.lineKey} />
      )}
    </Sheet>
  );
}

function CustomizeForm({ product, lineKey }: { product: Product; lineKey?: string }) {
  const availability = useStoreData((s) => s.availability);
  const existing = useCart((s) => (lineKey ? s.lines.find((l) => l.key === lineKey) : undefined));
  const add = useCart((s) => s.add);
  const replace = useCart((s) => s.replace);
  const setCartOpen = useCart((s) => s.setOpen);
  const close = useUI((s) => s.closeCustomize);

  // Nothing is preselected: customers choose every required option themselves.
  const [selections, setSelections] = useState<Selections>(() => existing?.selections ?? emptySelections(product));
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [showMissing, setShowMissing] = useState(false);

  const unit = unitPriceCents(product, selections);
  const total = unit * quantity;
  const missingGroups = product.optionGroups.filter((g) => g.required && !(selections[g.id]?.length > 0));
  const nextMissing = missingGroups[0];

  function submit() {
    if (nextMissing) {
      setShowMissing(true);
      document.getElementById(`group-${nextMissing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (lineKey) {
      replace(lineKey, selections, quantity);
      close();
      setCartOpen(true);
      return;
    }
    add(product.id, selections, quantity);
    close();
    notifyAdded(product.name, () => setCartOpen(true));
  }

  return (
    <div className="flex flex-col">
      <ProductImage
        image={product.image}
        name={product.name}
        categoryId={product.categoryId}
        sizes="(min-width: 640px) 32rem, 100vw"
        className="mt-2 aspect-[16/9] w-full rounded-2xl"
      />

      <div className="divide-y divide-line">
        {product.optionGroups.map((group) => (
          <OptionGroupField
            key={group.id}
            group={group}
            selected={selections[group.id] ?? []}
            availability={availability}
            invalid={showMissing && missingGroups.includes(group)}
            onChange={(next) => setSelections((s) => ({ ...s, [group.id]: next }))}
          />
        ))}
      </div>

      <AnimatePresence>
        {showMissing && nextMissing && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm font-medium text-[#a3361f]"
            role="alert"
          >
            Choose your {missingGroups.map((g) => g.label.toLowerCase()).join(", ")} to continue.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Sticky action bar inside the scroll area keeps the price visible while choosing */}
      <div className="sticky bottom-0 -mx-6 mt-4 flex items-center gap-3 border-t border-line bg-cream px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <QuantityStepper value={quantity} onChange={setQuantity} label={`Quantity of ${product.name}`} />
        <button type="button" onClick={submit} className={buttonClasses("primary", "lg", "flex-1 justify-between px-6")}>
          <span>
            {nextMissing ? `Choose ${nextMissing.label.toLowerCase()}` : lineKey ? "Update item" : "Add to order"}
          </span>
          <motion.span key={total} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">
            {formatCents(total)}
          </motion.span>
        </button>
      </div>
    </div>
  );
}
