import { formatCents } from "@/lib/format";

export interface SummaryLine {
  key: string;
  name: string;
  options: string[];
  quantity: number;
  totalCents: number;
  unavailable?: boolean;
}

/** Itemized list + totals. Shared by checkout and the order confirmation page. */
export function OrderSummary({
  lines,
  subtotalCents,
  deliveryFeeCents,
  showDelivery,
}: {
  lines: SummaryLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  showDelivery: boolean;
}) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-3 py-3.5">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-navy-soft px-1.5 text-xs font-bold text-navy tabular-nums">
              {line.quantity}
            </span>
            <div className="min-w-0 flex-1">
              <p className={line.unavailable ? "font-semibold text-ink-muted line-through" : "font-semibold"}>{line.name}</p>
              {line.options.length > 0 && <p className="mt-0.5 text-sm text-ink-muted">{line.options.join(" · ")}</p>}
              {line.unavailable && <p className="mt-0.5 text-sm font-semibold text-[#a3361f]">Sold out</p>}
            </div>
            <p className="font-medium tabular-nums">{formatCents(line.totalCents)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatCents(subtotalCents)}</dd>
        </div>
        {showDelivery && (
          <div className="flex justify-between">
            <dt className="text-ink-muted">Classroom delivery</dt>
            <dd className="tabular-nums">{deliveryFeeCents === 0 ? "Free" : formatCents(deliveryFeeCents)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display text-2xl text-navy tabular-nums">{formatCents(subtotalCents + (showDelivery ? deliveryFeeCents : 0))}</dd>
        </div>
      </dl>
    </div>
  );
}
