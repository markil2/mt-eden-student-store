"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { useCatalog } from "@/lib/use-catalog";
import { useStoreData } from "@/lib/store/store-data";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useOrderingState } from "@/lib/use-ordering-state";
import { cn } from "@/lib/format";
import { MenuItemRow } from "./menu-item-row";
import { MobileCartBar } from "./mobile-cart-bar";

export function MenuView() {
  const availability = useStoreData((s) => s.availability);
  const ordering = useOrderingState();
  const addToCart = useAddToCart();
  const { products } = useCatalog();
  const categories = useStoreData((s) => s.categories);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [active, setActive] = useState<string>("breakfast");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        items: products.filter(
          (p) =>
            p.categoryId === category.id &&
            (!deferredQuery ||
              p.name.toLowerCase().includes(deferredQuery) ||
              p.description?.toLowerCase().includes(deferredQuery)),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [categories, deferredQuery, products]);

  // Honor deep links like /menu#snacks (from the homepage categories) after hydration.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Scroll-spy: highlight the category currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  // Keep the active tab visible in the horizontally-scrolling nav on phones.
  useEffect(() => {
    const tab = navRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    tab?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <>
      <div className="container-page pt-10 pb-6 md:pt-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-ink-muted">Order online</p>
            <h1 className="mt-3 font-display text-5xl text-navy md:text-7xl">The menu</h1>
            <p className="mt-3 max-w-md text-ink/70">
              Tap anything to add it to your order. Breakfast sandwiches let you pick your bread, protein and more.
            </p>
          </div>
          <label className="relative block w-full md:w-80">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              className="h-12 w-full rounded-full border border-line bg-white/70 pr-11 pl-11 text-base outline-none placeholder:text-ink-muted/80 focus:border-navy focus:bg-white [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-ink/[0.06]"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>

        {!ordering.open && (
          <p className="mt-6 rounded-2xl bg-gold-soft px-5 py-4 font-medium" role="status">
            {ordering.message} You can still browse the menu.
          </p>
        )}
      </div>

      {/* Sticky category navigation */}
      <div className="sticky top-[var(--header-h)] z-30 border-b border-line bg-cream/90 backdrop-blur-md">
        <div ref={navRef} className="no-scrollbar container-page flex gap-1 overflow-x-auto py-2.5" role="navigation" aria-label="Menu categories">
          {categories.map((c) => {
            const isActive = active === c.id;
            const hasItems = sections.some((s) => s.category.id === c.id);
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                data-tab={c.id}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                  isActive ? "text-cream" : "text-ink/70 hover:text-navy",
                  !hasItems && "pointer-events-none opacity-35",
                )}
              >
                {isActive && (
                  <motion.span layoutId="menu-tab" className="absolute inset-0 -z-10 rounded-full bg-navy" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
                )}
                {c.name}
              </a>
            );
          })}
        </div>
      </div>

      <div className="container-page pt-4 pb-28 md:pb-12">
        <AnimatePresence mode="popLayout">
          {sections.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 text-center">
              <p className="font-display text-3xl text-navy">Nothing matches “{query}”.</p>
              <p className="mt-2 text-ink-muted">Try “coffee”, “bagel” or “chips”.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {sections.map(({ category, items }) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
            className="scroll-mt-[calc(var(--header-h)+4rem)] pt-10 md:pt-14"
            aria-labelledby={`${category.id}-title`}
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-ink/80 pb-3">
              <h2 id={`${category.id}-title`} className="font-display text-3xl text-navy md:text-4xl">
                {category.name}
              </h2>
              <p className="hidden text-sm text-ink-muted sm:block">{category.blurb}</p>
            </div>
            <ul className="grid divide-y divide-line lg:grid-cols-2 lg:gap-x-14 lg:divide-y-0">
              {items.map((product) => (
                <li key={product.id} className="lg:border-b lg:border-line">
                  <MenuItemRow product={product} soldOut={availability[product.id] === false || product.priceCents <= 0} onAdd={addToCart} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <MobileCartBar />
    </>
  );
}
