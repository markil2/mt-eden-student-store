import Link from "next/link";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "gold";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-navy text-cream hover:bg-navy-deep",
  gold: "bg-gold text-ink hover:bg-[#ebb11a]",
  secondary: "border border-navy/25 text-navy hover:border-navy hover:bg-navy/[0.04]",
  ghost: "text-navy hover:bg-navy/[0.06]",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[0.95rem]",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "press inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
    "disabled:cursor-not-allowed disabled:opacity-45",
    variants[variant],
    sizes[size],
    className,
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}
