import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";

export function BrandMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-3", className)} aria-label="Mt. Eden Student Store — Home">
      <Image
        src="/brand/crest.jpg"
        alt=""
        width={44}
        height={44}
        className="size-10 rounded-full transition-transform duration-500 ease-out-soft group-hover:-rotate-6 sm:size-11"
        loading="eager"
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.15rem] font-semibold tracking-tight whitespace-nowrap sm:text-[1.3rem]",
            inverted ? "text-cream" : "text-navy",
          )}
        >
          Mt. Eden
        </span>
        <span className={cn("eyebrow mt-1 text-[0.58rem] whitespace-nowrap", inverted ? "text-gold" : "text-ink-muted")}>
          Student Store
        </span>
      </span>
    </Link>
  );
}
