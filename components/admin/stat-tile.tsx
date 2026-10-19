import { cn } from "@/lib/format";

export function StatTile({ label, value, note, accent }: { label: string; value: React.ReactNode; note?: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-5 ring-1", accent ? "bg-navy text-cream ring-navy" : "bg-white ring-line")}>
      <p className={cn("text-sm font-medium", accent ? "text-cream/70" : "text-ink-muted")}>{label}</p>
      <p className={cn("mt-2 font-display text-4xl tabular-nums", accent ? "text-cream" : "text-navy")}>{value}</p>
      {note && <p className={cn("mt-1 text-xs", accent ? "text-cream/60" : "text-ink-muted")}>{note}</p>}
    </div>
  );
}
