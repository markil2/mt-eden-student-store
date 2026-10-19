"use client";

import { Plus } from "lucide-react";
import { useCatalog } from "@/lib/use-catalog";
import { useStoreData } from "@/lib/store/store-data";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { formatMenuPrice, cn } from "@/lib/format";
import { ProductImage } from "@/components/ui/product-image";
import { Reveal } from "@/components/ui/reveal";

export function PopularItems() {
  const availability = useStoreData((s) => s.availability);
  const addToCart = useAddToCart();
  const popular = useCatalog().products.filter((p) => p.popular);

  return (
    <section className="bg-cream-deep/60 py-16 md:py-24" aria-labelledby="popular-title">
      <div className="container-page">
        <Reveal>
          <p className="eyebrow text-ink-muted">Most ordered</p>
          <h2 id="popular-title" className="mt-3 font-display text-4xl text-navy md:text-5xl">
            Campus favorites.
          </h2>
        </Reveal>
      </div>

      <ul className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:container-page md:grid md:grid-cols-5 md:gap-6 md:overflow-visible">
        {popular.map((product, i) => {
          const soldOut = availability[product.id] === false || product.priceCents <= 0;
          return (
            <Reveal as="li" key={product.id} delay={i * 0.05} className="w-[68%] shrink-0 snap-start sm:w-[40%] md:w-auto">
              <article className="group">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={soldOut}
                    className="block w-full overflow-hidden rounded-[1.25rem] disabled:cursor-not-allowed"
                    aria-label={`Add ${product.name}`}
                  >
                    <ProductImage
                      image={product.image}
                      name={product.name}
                      categoryId={product.categoryId}
                      sizes="(min-width: 768px) 20vw, 68vw"
                      dimmed={soldOut}
                      className="aspect-square w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={soldOut}
                    tabIndex={-1}
                    aria-hidden
                    className={cn(
                      "press absolute right-3 bottom-3 grid size-11 place-items-center rounded-full bg-cream text-navy shadow-md",
                      "transition-colors hover:bg-gold disabled:hidden",
                    )}
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3 lg:flex-col lg:gap-0.5">
                  <h3 className="font-semibold leading-snug">{product.name}</h3>
                  <p className="font-display text-lg text-navy tabular-nums">{formatMenuPrice(product.priceCents)}</p>
                </div>
                {product.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{product.description}</p>}
              </article>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
