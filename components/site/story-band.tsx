import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { Reveal } from "@/components/ui/reveal";
import { sampleImages } from "@/lib/data/menu";

export function StoryBand() {
  return (
    <section className="container-page grid items-center gap-10 py-20 md:grid-cols-[1fr_1.1fr] md:gap-16 md:py-28">
      <Reveal className="order-2 md:order-1">
        <p className="eyebrow text-ink-muted">Run by Entrepreneurship</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] text-navy md:text-[3.4rem]">
          Made by Mt. Eden, <span className="italic">for</span> Mt. Eden.
        </h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/75">
          The Student Store is run by Mt. Eden Entrepreneurship. Every order helps students learn how a real cafe works,
          from the morning rush to the books.
        </p>
        <Link href="/about" className="group mt-8 inline-flex items-center gap-1.5 font-semibold text-navy">
          Our story
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </Reveal>
      <Reveal className="order-1 md:order-2">
        <ProductImage
          image={sampleImages.cafe}
          name="The student store"
          categoryId="coffee"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-[4/3] w-full rounded-[2rem]"
        />
      </Reveal>
    </section>
  );
}
