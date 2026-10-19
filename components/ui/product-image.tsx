import Image from "next/image";
import { Coffee, Cookie, CupSoda, Croissant } from "lucide-react";
import type { CategoryId, ProductImage as ProductImageType } from "@/lib/types";
import { cn } from "@/lib/format";

const showPlaceholderTag = process.env.NODE_ENV === "development";

const fallbackIcon: Record<string, typeof Coffee> = {
  breakfast: Croissant,
  snacks: Cookie,
  beverages: CupSoda,
  coffee: Coffee,
};

interface Props {
  image: ProductImageType | null;
  name: string;
  categoryId: CategoryId;
  sizes: string;
  className?: string;
  eager?: boolean;
  dimmed?: boolean;
}

/**
 * Product photo with a branded fallback tile when no photo exists yet.
 * In development, stock photos carry a small "Sample" tag so they are never
 * mistaken for real cafe photography.
 */
export function ProductImage({ image, name, categoryId, sizes, className, eager, dimmed }: Props) {
  if (!image) {
    const Icon = fallbackIcon[categoryId] ?? Croissant;
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 overflow-hidden bg-navy-soft text-navy",
          dimmed && "opacity-60",
          className,
        )}
        role="img"
        aria-label={`${name} — photo coming soon`}
      >
        <Icon className="size-[28%] max-w-12 stroke-[1.25]" aria-hidden />
        <span className="eyebrow hidden text-[0.6rem] text-navy/70 sm:block">Photo soon</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-cream-deep", className)}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        className={cn("object-cover", dimmed && "grayscale opacity-60")}
      />
      {image.isPlaceholder && showPlaceholderTag && (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-ink/60 px-1.5 py-0.5 text-[0.55rem] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
          Sample
        </span>
      )}
    </div>
  );
}
