"use client";

import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/button";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20" role="alert">
      <p className="eyebrow text-ink-muted">Something went wrong</p>
      <h1 className="mt-4 font-display text-5xl text-navy">Sorry, that didn&apos;t load.</h1>
      <p className="mt-4 max-w-md text-lg text-ink/70">
        Your cart is saved. Try again, and if it keeps happening, text the cafe.
      </p>
      <button type="button" onClick={() => retry()} className={buttonClasses("primary", "lg", "mt-8")}>
        Try again
      </button>
    </div>
  );
}
