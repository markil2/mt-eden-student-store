"use client";

import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";
import { useMediaQuery } from "@/lib/use-media-query";

const ease = [0.32, 0.72, 0, 1] as const;

/**
 * Responsive sheet: slides up from the bottom on phones, and either slides in
 * from the right ("side") or appears centered ("center") on larger screens.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  variant = "center",
  children,
  footer,
  large = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: "center" | "side";
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Wider centered dialog on larger screens (e.g. the menu item editor). */
  large?: boolean;
}) {
  const wide = useMediaQuery("(min-width: 640px)");
  const hidden = variant === "side" && wide ? { x: "100%", y: 0 } : wide ? { y: 24, opacity: 0, scale: 0.98 } : { y: "100%" };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>
            <div
              className={cn(
                "pointer-events-none fixed inset-0 z-50 flex items-end",
                variant === "side" ? "sm:items-stretch sm:justify-end" : "sm:items-center sm:justify-center sm:p-6",
              )}
            >
              <Dialog.Content asChild>
                <motion.div
                  className={cn(
                    "pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-cream shadow-2xl outline-none",
                    variant === "side"
                      ? "sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-[1.75rem]"
                      : cn("sm:max-h-[86dvh] sm:rounded-[1.75rem]", large ? "sm:max-w-2xl" : "sm:max-w-lg"),
                  )}
                  initial={hidden}
                  animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  exit={hidden}
                  transition={{ type: "tween", duration: wide && variant === "center" ? 0.3 : 0.45, ease }}
                >
                  <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink/15 sm:hidden" aria-hidden />
                  <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-4 pb-2 sm:pt-6">
                    <div>
                      <Dialog.Title className="font-display text-2xl leading-tight text-navy">{title}</Dialog.Title>
                      {description ? (
                        <Dialog.Description className="mt-1 text-sm text-ink-muted">{description}</Dialog.Description>
                      ) : (
                        <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</Dialog.Description>
                      )}
                    </div>
                    <Dialog.Close
                      className="press -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-ink/70 hover:bg-ink/[0.06]"
                      aria-label="Close"
                    >
                      <X className="size-5" />
                    </Dialog.Close>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">{children}</div>
                  {footer && (
                    <div className="shrink-0 border-t border-line bg-cream px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
