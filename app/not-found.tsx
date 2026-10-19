import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-5 text-center">
      <div>
        <p className="eyebrow text-ink-muted">Page not found</p>
        <h1 className="mt-4 font-display text-5xl text-navy md:text-6xl">Nothing on the menu here.</h1>
        <p className="mt-4 text-lg text-ink/70">The page may have moved, or the link is incomplete.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/menu" className="press inline-flex h-13 items-center rounded-full bg-navy px-7 font-semibold text-cream">
            See the menu
          </Link>
          <Link href="/track" className="press inline-flex h-13 items-center rounded-full border border-navy/25 px-7 font-semibold text-navy">
            Track an order
          </Link>
        </div>
      </div>
    </main>
  );
}
