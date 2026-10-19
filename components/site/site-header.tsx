"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/ui/brand";
import { CartButton } from "@/components/cart/cart-button";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/format";
import { OrderingStatusBar } from "./ordering-status-bar";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Order Online" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <OrderingStatusBar />
      <div
        className={cn(
          "border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled ? "border-line/80 bg-cream/85 backdrop-blur-md" : "border-transparent bg-cream",
        )}
      >
        <nav className="container-page flex h-16 items-center justify-between sm:h-20" aria-label="Main">
          <BrandMark />

          {/* Active-link state reads the URL, so it streams in under Suspense (needed on dynamic routes). */}
          <Suspense fallback={<DesktopLinks pathname={null} />}>
            <ActiveDesktopLinks />
          </Suspense>

          <div className="flex items-center gap-2">
            <Link href="/menu" className={buttonClasses("primary", "md", "hidden md:inline-flex")}>
              Order now
            </Link>
            <CartButton />
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger
                className="press grid size-11 place-items-center rounded-full text-navy hover:bg-navy/[0.06] md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Dialog.Trigger>
              <AnimatePresence>
                {mobileOpen && (
                  <Dialog.Portal forceMount>
                    <Dialog.Overlay asChild>
                      <motion.div
                        className="fixed inset-0 z-50 bg-ink/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    </Dialog.Overlay>
                    <Dialog.Content asChild aria-describedby={undefined}>
                      <motion.div
                        className="fixed inset-x-0 top-0 z-50 rounded-b-3xl bg-cream px-5 pt-4 pb-8 shadow-xl"
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ type: "tween", duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                      >
                        <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                        <div className="flex h-12 items-center justify-between">
                          <BrandMark />
                          <Dialog.Close
                            className="press grid size-11 place-items-center rounded-full text-navy hover:bg-navy/[0.06]"
                            aria-label="Close menu"
                          >
                            <X className="size-5" />
                          </Dialog.Close>
                        </div>
                        <ul className="mt-6 flex flex-col">
                          {links.map((link) => (
                            <li key={link.href} className="border-b border-line">
                              <Link
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-between py-4 font-display text-3xl text-navy"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/menu"
                          onClick={() => setMobileOpen(false)}
                          className={buttonClasses("primary", "lg", "mt-8 w-full")}
                        >
                          Start an order
                        </Link>
                      </motion.div>
                    </Dialog.Content>
                  </Dialog.Portal>
                )}
              </AnimatePresence>
            </Dialog.Root>
          </div>
        </nav>
      </div>
    </header>
  );
}

function ActiveDesktopLinks() {
  return <DesktopLinks pathname={usePathname()} />;
}

function DesktopLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {links.map((link) => {
        const active = pathname !== null && (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active ? "text-navy" : "text-ink/70 hover:text-navy",
              )}
            >
              {link.label}
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gold"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
