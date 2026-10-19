import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { sampleImages } from "@/lib/data/menu";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-page py-14 md:py-24">
      <p className="eyebrow text-ink-muted">About the store</p>
      <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] text-navy md:text-7xl">
        A real cafe, run by Entrepreneurship.
      </h1>
      <div className="mt-12 grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <ProductImage
          image={sampleImages.cafe}
          name="The student store"
          categoryId="coffee"
          sizes="(min-width: 768px) 55vw, 100vw"
          className="aspect-[4/3] w-full rounded-[2rem]"
        />
        <div className="space-y-5 text-lg leading-relaxed text-ink/80">
          <p>
            The Mt. Eden Student Store is brought to you by Mt. Eden Entrepreneurship. Students plan the menu, run the
            counter and deliver to classrooms, all while learning what it takes to run a small business.
          </p>
          <p className="rounded-2xl border border-dashed border-line p-5 text-base text-ink-muted">
            Placeholder: add the store&apos;s story, the team, and how proceeds are used once confirmed by the
            Entrepreneurship program.
          </p>
          <ButtonLink href="/menu" size="lg">
            Start an order
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
