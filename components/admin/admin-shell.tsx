"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { BarChart3, ExternalLink, LayoutGrid, LogOut, ReceiptText, Settings2, Users, UtensilsCrossed } from "lucide-react";
import type { StaffMember } from "@/lib/types";
import { StaffProvider, useStaff } from "@/lib/admin/staff-context";
import { useAdminOrders, useAdminOrdersSync } from "@/lib/admin/orders-store";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/format";
import { useOrderingState } from "@/lib/use-ordering-state";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, managerOnly: false },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText, managerOnly: false },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, managerOnly: false },
  { href: "/admin/settings", label: "Settings", icon: Settings2, managerOnly: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, managerOnly: true },
  { href: "/admin/staff", label: "Staff", icon: Users, managerOnly: true },
];

export function AdminShell({ staff, children }: { staff: StaffMember; children: React.ReactNode }) {
  return (
    <StaffProvider staff={staff}>
      <ShellLayout>{children}</ShellLayout>
    </StaffProvider>
  );
}

function ShellLayout({ children }: { children: React.ReactNode }) {
  const ordering = useOrderingState();
  const staff = useStaff();
  useAdminOrdersSync();

  return (
    <div className="min-h-dvh bg-[#f7f3ea] md:grid md:grid-cols-[15rem_1fr]">
      {/* Sidebar (tablet/desktop) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-cream px-4 py-6 md:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <Image src="/brand/crest.jpg" alt="" width={36} height={36} className="rounded-full" />
          <span className="leading-tight">
            <span className="block font-display text-lg text-navy">Mt. Eden</span>
            <span className="eyebrow text-[0.58rem] text-ink-muted">Staff dashboard</span>
          </span>
        </Link>
        <Suspense fallback={<NavLinks pathname={null} variant="side" />}>
          <ActiveNav variant="side" />
        </Suspense>
        <div className="mt-auto space-y-3 px-2">
          <StoreStatus reason={ordering.reason} />
          <div className="border-t border-line pt-3">
            <p className="truncate text-sm font-semibold">{staff.displayName}</p>
            <p className="text-xs text-ink-muted capitalize">{staff.role}</p>
            <SignOutButton />
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
            View customer site <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Top bar (phones) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream/95 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/brand/crest.jpg" alt="" width={30} height={30} className="rounded-full" />
            <span className="font-display text-lg text-navy">Staff</span>
          </Link>
          <div className="flex items-center gap-2">
            <StoreStatus reason={ordering.reason} />
            <SignOutButton compact />
          </div>
        </header>

        <main className="px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>

        {/* Bottom tab bar (phones) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Dashboard">
          <Suspense fallback={<NavLinks pathname={null} variant="bottom" />}>
            <ActiveNav variant="bottom" />
          </Suspense>
        </nav>
      </div>
    </div>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }
  return compact ? (
    <button type="button" onClick={signOut} className="press grid size-10 place-items-center rounded-full text-ink/70 hover:bg-ink/[0.06]" aria-label="Sign out">
      <LogOut className="size-4" />
    </button>
  ) : (
    <button type="button" onClick={signOut} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-navy">
      <LogOut className="size-3.5" /> Sign out
    </button>
  );
}

function StoreStatus({ reason }: { reason: "paused" | "after_cutoff" | null }) {
  const paused = reason !== null;
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
        paused ? "bg-gold-soft text-ink" : "bg-[#e3f1e8] text-[#1f6b41]",
      )}
    >
      <span className={cn("size-2 rounded-full", paused ? "bg-gold" : "bg-[#2f8f5b]")} />
      {reason === "paused" ? "Ordering paused" : reason === "after_cutoff" ? "Closed (past last order)" : "Accepting orders"}
    </span>
  );
}

function ActiveNav({ variant }: { variant: "side" | "bottom" }) {
  return <NavLinks pathname={usePathname()} variant={variant} />;
}

function NavLinks({ pathname, variant }: { pathname: string | null; variant: "side" | "bottom" }) {
  const newCount = useAdminOrders((s) => s.orders.filter((o) => o.status === "received").length);
  const staff = useStaff();
  const items = nav.filter((item) => !item.managerOnly || staff.role === "manager");

  return (
    <ul
      className={variant === "side" ? "mt-8 space-y-1" : "grid"}
      style={variant === "bottom" ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && (href === "/admin" ? pathname === href : pathname.startsWith(href));
        const badge = href === "/admin/orders" && newCount > 0 ? newCount : null;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                variant === "side"
                  ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
                  : "relative flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold",
                active
                  ? variant === "side"
                    ? "bg-navy text-cream"
                    : "text-navy"
                  : "text-ink/65 hover:bg-navy/[0.05] hover:text-navy",
              )}
            >
              <Icon className="size-5" strokeWidth={1.8} />
              {label}
              {badge !== null && (
                <span
                  className={cn(
                    "grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[0.68rem] font-bold text-ink tabular-nums",
                    variant === "side" ? "ml-auto" : "absolute top-1 left-1/2 ml-2",
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
