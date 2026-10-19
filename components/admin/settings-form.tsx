"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { FulfillmentWindow, StoreSettings } from "@/lib/types";
import { useStoreData } from "@/lib/store/store-data";
import { saveSettingsAction } from "@/app/admin/actions";
import { cn } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { buttonClasses } from "@/components/ui/button";

export function SettingsPanel() {
  const settings = useStoreData((s) => s.settings);
  // Re-mount the form when saved settings change (e.g. another manager saved) so the draft starts fresh.
  return <SettingsForm key={JSON.stringify(settings)} initial={settings} />;
}

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [feeText, setFeeText] = useState((initial.delivery.feeCents / 100).toFixed(2));
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial) || feeText !== (initial.delivery.feeCents / 100).toFixed(2);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setWindow = (i: number, patch: Partial<FulfillmentWindow>) =>
    set("windows", draft.windows.map((w, j) => (j === i ? { ...w, ...patch } : w)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const fee = Math.round(Number(feeText) * 100);
    if (!Number.isFinite(fee) || fee < 0) return toast("Enter a valid delivery fee (0 for free).");
    if (draft.windows.length === 0) return toast("Add at least one pickup/delivery window.");
    if (draft.windows.some((w) => !w.label.trim())) return toast("Every window needs a name.");
    setSaving(true);
    const result = await saveSettingsAction({ ...draft, delivery: { ...draft.delivery, feeCents: fee } });
    setSaving(false);
    toast(result.ok ? "Settings saved" : result.error);
  }

  return (
    <form onSubmit={save} className="max-w-3xl pb-24">
      <h1 className="font-display text-4xl text-navy">Store settings</h1>
      <p className="mt-1 text-ink-muted">These control what customers see and can order.</p>

      <Card title="Online ordering">
        <ToggleRow
          label="Accepting online orders"
          hint="Turn off to pause ordering (e.g. sold out for the day, or a school event)."
          checked={!draft.orderingPaused}
          onChange={(on) => set("orderingPaused", !on)}
        />
        <Text label="Message shown while paused" value={draft.pauseMessage} onChange={(v) => set("pauseMessage", v)} />
        <ToggleRow
          label="Stop orders after the last-order time"
          hint="Applies to before- and after-school orders. Turn off temporarily to test ordering later in the day."
          checked={draft.enforceCutoff}
          onChange={(v) => set("enforceCutoff", v)}
        />
        <label className="block text-sm font-semibold">
          Last order of the day
          <input
            type="time"
            value={draft.orderCutoff}
            onChange={(e) => set("orderCutoff", e.target.value)}
            className={cn(inputCls, "max-w-40")}
          />
        </label>
      </Card>

      <Card title="Pickup & delivery times" hint="Customers choose one of these at checkout. Leave the limit empty for no limit.">
        <div className="space-y-4">
          {draft.windows.map((w, i) => (
            <div key={w.id} className="rounded-xl bg-cream/60 p-4 ring-1 ring-line">
              <div className="grid gap-3 sm:grid-cols-2">
                <Text label="Name" value={w.label} onChange={(v) => setWindow(i, { label: v })} />
                <Text label="Description" value={w.detail} onChange={(v) => setWindow(i, { detail: v })} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Check label="Pickup" checked={w.pickup} onChange={(v) => setWindow(i, { pickup: v })} />
                <Check label="Delivery" checked={w.delivery} onChange={(v) => setWindow(i, { delivery: v })} />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  Order limit
                  <input
                    inputMode="numeric"
                    value={w.capacity ?? ""}
                    placeholder="None"
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setWindow(i, { capacity: Number.isFinite(n) && n > 0 ? n : null });
                    }}
                    className="h-10 w-20 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-navy"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => set("windows", draft.windows.filter((_, j) => j !== i))}
                  className="press ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-ink/[0.05]"
                >
                  <Trash2 className="size-4" /> Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("windows", [
                ...draft.windows,
                { id: `window-${Date.now()}`, label: "", detail: "", pickup: true, delivery: true, capacity: null },
              ])
            }
            className={buttonClasses("secondary", "md")}
          >
            <Plus className="size-4" /> Add a time
          </button>
        </div>
      </Card>

      <Card title="Store pickup">
        <ToggleRow label="Offer pickup" checked={draft.pickup.enabled} onChange={(v) => set("pickup", { ...draft.pickup, enabled: v })} />
        <Text label="Pickup location" value={draft.pickup.location} onChange={(v) => set("pickup", { ...draft.pickup, location: v })} />
      </Card>

      <Card title="Classroom delivery">
        <ToggleRow label="Offer classroom delivery" checked={draft.delivery.enabled} onChange={(v) => set("delivery", { ...draft.delivery, enabled: v })} />
        <ToggleRow
          label="Require a room number"
          checked={draft.delivery.requireRoom}
          onChange={(v) => set("delivery", { ...draft.delivery, requireRoom: v })}
        />
        <label className="block text-sm font-semibold">
          Delivery fee
          <div className="relative max-w-40">
            <span className="pointer-events-none absolute top-1/2 left-4 mt-1 -translate-y-1/2 text-ink-muted">$</span>
            <input value={feeText} onChange={(e) => setFeeText(e.target.value)} inputMode="decimal" className={cn(inputCls, "pl-8")} />
          </div>
          <span className="mt-1 block font-normal text-ink-muted">Use 0 for free delivery.</span>
        </label>
      </Card>

      <Card title="Hours" hint="Shown on the homepage.">
        {draft.hours.map((h, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-2">
            <Text label="Label" value={h.label} onChange={(v) => set("hours", draft.hours.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
            <Text label="Hours" value={h.hours} onChange={(v) => set("hours", draft.hours.map((x, j) => (j === i ? { ...x, hours: v } : x)))} />
          </div>
        ))}
        <Text label="Note under the hours" value={draft.hoursNote} onChange={(v) => set("hoursNote", v)} />
      </Card>


      {/* Sticky save bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-16 z-20 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur transition-transform duration-300 md:bottom-0 md:left-60",
          dirty ? "translate-y-0" : "pointer-events-none translate-y-[200%]",
        )}
      >
        <div className="flex max-w-3xl items-center justify-between gap-3 md:px-4">
          <p className="text-sm font-medium">You have unsaved changes.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(initial);
                setFeeText((initial.delivery.feeCents / 100).toFixed(2));
              }}
              className={buttonClasses("ghost", "md")}
            >
              Discard
            </button>
            <button type="submit" disabled={saving} className={buttonClasses("primary", "md")}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

const inputCls = "mt-2 block h-12 w-full rounded-xl border border-line bg-white px-4 text-base font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[#0a3473]" />
      {label}
    </label>
  );
}
