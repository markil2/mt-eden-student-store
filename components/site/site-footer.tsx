"use client";

import Image from "next/image";
import Link from "next/link";
import { AtSign } from "lucide-react";
import { useStoreData } from "@/lib/store/store-data";
import { formatCutoff } from "@/lib/data/settings";

export function SiteFooter() {
  const { contact, orderCutoff } = useStoreData((s) => s.settings);
  const categories = useStoreData((s) => s.categories);

  return (
    <footer className="bg-navy text-cream">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-20">
        <div className="max-w-xs">
          <div className="flex items-center gap-3">
            <Image src="/brand/monogram.jpg" alt="Mt. Eden ME monogram" width={44} height={44} className="rounded-md" />
            <p className="font-display text-2xl leading-tight">Mt. Eden Student Store</p>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-cream/70">
            The Mt. Eden High School cafe, run by Mt. Eden Entrepreneurship.
          </p>
        </div>

        <FooterColumn title="Visit">
          <li>
            <Link href="/" className="hover:text-gold">Home</Link>
          </li>
          <li>
            <Link href="/menu" className="hover:text-gold">Order online</Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-gold">About</Link>
          </li>
          <li>
            <Link href="/track" className="hover:text-gold">Track an order</Link>
          </li>
        </FooterColumn>

        <FooterColumn title="Menu">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/menu#${c.id}`} className="hover:text-gold">
                {c.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Contact">
          <li>
            <a
              href={contact.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-gold"
            >
              <AtSign className="size-4" aria-hidden /> {contact.instagram}
            </a>
          </li>
        </FooterColumn>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© Mt. Eden Student Store · Mt. Eden High School</p>
          <p>Order ahead online · Last order {formatCutoff(orderCutoff)}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="eyebrow text-gold">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm text-cream/85">{children}</ul>
    </div>
  );
}
