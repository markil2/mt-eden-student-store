"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Clock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { sampleImages } from "@/lib/data/menu";
import { useStoreData } from "@/lib/store/store-data";
import { formatCutoff } from "@/lib/data/settings";
import { useOrderingState } from "@/lib/use-ordering-state";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const settings = useStoreData((s) => s.settings);
  const ordering = useOrderingState();

  return (
    <section className="container-page grid items-center gap-10 pt-8 pb-16 md:grid-cols-[1.05fr_1fr] md:gap-14 md:pt-14 md:pb-24 lg:gap-20">
      <div className="max-w-xl">
        <motion.p
          className="eyebrow text-navy/80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          Run by Entrepreneurship · Mt. Eden High School
        </motion.p>

        <motion.h1
          className="mt-5 font-display text-[3.4rem] leading-[0.95] font-medium tracking-[-0.02em] text-navy sm:text-7xl lg:text-[5.75rem]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease }}
          style={{ fontVariationSettings: '"SOFT" 60, "opsz" 144' }}
        >
          Your campus{" "}
          <span className="relative inline-block italic">
            cafe
            <svg
              className="animate-underline absolute -bottom-1 left-0 h-3 w-full origin-left text-gold sm:-bottom-2 sm:h-4"
              viewBox="0 0 200 16"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path d="M2 11 C 50 3, 120 3, 198 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
          .
        </motion.h1>

        <motion.p
          className="mt-7 max-w-md text-lg leading-relaxed text-ink/75"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
        >
          Fresh breakfast, your favorite drinks, and everything in between. Made for your day at Mt. Eden.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
        >
          <ButtonLink href="/menu" size="lg" className="group">
            Order now
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </ButtonLink>
          <ButtonLink href="/menu#breakfast" size="lg" variant="secondary">
            Menu
          </ButtonLink>
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-cream-deep md:aspect-[5/6]"
          initial={{ clipPath: "inset(100% 0 0 0 round 999px 999px 32px 32px)" }}
          animate={{ clipPath: "inset(0% 0 0 0 round 999px 999px 32px 32px)" }}
          transition={{ duration: 1.1, delay: 0.1, ease }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, delay: 0.1, ease }}
          >
            <Image
              src={sampleImages.hero.src}
              alt={sampleImages.hero.alt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_40px_-12px_rgb(10_52_115/0.35)] sm:left-[-1.5rem]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease }}
        >
          <span className="grid size-10 place-items-center rounded-full bg-gold-soft text-navy">
            <Clock className="size-5" />
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-semibold text-ink">
              {ordering.reason === "paused" ? "Ordering paused" : ordering.reason === "after_cutoff" ? "Closed for today" : "Order ahead"}
            </span>
            <span className="text-ink-muted">Last order {formatCutoff(settings.orderCutoff)}</span>
          </span>
        </motion.div>
      </div>
    </section>
  );
}
