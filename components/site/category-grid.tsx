import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { Reveal } from "@/components/ui/reveal";
import { sampleImages } from "@/lib/data/menu";
import type { CategoryId, ProductImage as ProductImageType } from "@/lib/types";

const featured: { name: string; note: string; href: string; image: ProductImageType; categoryId: CategoryId }[] = [
  { name: "Breakfast", note: "Sandwiches, bagels & muffins", href: "/menu#breakfast", image: sampleImages.breakfast, categoryId: "breakfast" },
  { name: "Coffee & Drinks", note: "Cold brew, juice & more", href: "/menu#coffee", image: sampleImages.coffee, categoryId: "coffee" },
  { name: "Snacks", note: "Chips, popcorn & bars", href: "/menu#snacks", image: sampleImages.snacks, categoryId: "snacks" },
  { name: "Parfaits & More", note: "Yogurt, berries & granola", href: "/menu#breakfast", image: sampleImages.parfait, categoryId: "breakfast" },
];

export function CategoryGrid() {
  return (
    <section className="container-page py-16 md:py-24" aria-labelledby="categories-title">
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-ink-muted">The menu</p>
          <h2 id="categories-title" className="mt-3 font-display text-4xl text-navy md:text-5xl">
            Something for every period.
          </h2>
        </div>
        <Link href="/menu" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
          See the full menu
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </Reveal>

      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
        {featured.map((item, i) => (
          <Reveal as="li" key={item.name} delay={i * 0.06}>
            <Link href={item.href} className="group block">
              <div className="overflow-hidden rounded-[1.25rem]">
                <ProductImage
                  image={item.image}
                  name={item.name}
                  categoryId={item.categoryId}
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="aspect-[4/5] w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl text-navy md:text-2xl">{item.name}</p>
                  <p className="mt-1 text-sm text-ink-muted">{item.note}</p>
                </div>
                <span className="mt-1 text-xs font-semibold text-ink/40 tabular-nums">0{i + 1}</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
