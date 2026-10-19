"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, UserPlus } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useStaff } from "@/lib/admin/staff-context";
import { cn } from "@/lib/format";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { buttonClasses } from "@/components/ui/button";
import { createStaffAction, resetStaffPasswordAction, updateStaffAction } from "@/app/admin/actions";

interface StaffRow {
  user_id: string;
  display_name: string;
  email: string;
  role: "staff" | "manager";
  active: boolean;
}

const input =
  "mt-2 block h-12 w-full rounded-xl border border-line bg-white px-4 text-base font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";

export function StaffManager() {
  const me = useStaff();
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<StaffRow | null>(null);

  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    getBrowserSupabase()!
      .from("staff")
      .select("user_id, display_name, email, role, active")
      .order("display_name")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast(`Couldn't load staff: ${error.message}`);
        else setRows(data as StaffRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  async function update(row: StaffRow, patch: { role?: "staff" | "manager"; active?: boolean }) {
    const result = await updateStaffAction(row.user_id, patch);
    if (!result.ok) toast(result.error);
    load();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-navy">Staff</h1>
          <p className="mt-1 text-ink-muted">Staff run orders and stock. Managers can also change prices, settings and staff.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={buttonClasses("primary", "md")}>
          <UserPlus className="size-4" /> Add staff
        </button>
      </div>

      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        {rows === null && <li className="px-5 py-6 text-ink-muted">Loading…</li>}
        {rows?.map((row) => {
          const isMe = row.user_id === me.userId;
          return (
            <li key={row.user_id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4", !row.active && "opacity-60")}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {row.display_name} {isMe && <span className="text-sm font-normal text-ink-muted">(you)</span>}
                </p>
                <p className="truncate text-sm text-ink-muted">{row.email}</p>
              </div>
              <select
                value={row.role}
                disabled={isMe}
                onChange={(e) => update(row, { role: e.target.value as StaffRow["role"] })}
                className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold disabled:opacity-60"
                aria-label={`Role for ${row.display_name}`}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
              <button
                type="button"
                onClick={() => setResetting(row)}
                className="press grid size-10 place-items-center rounded-full text-navy hover:bg-navy/[0.06]"
                aria-label={`Reset password for ${row.display_name}`}
              >
                <KeyRound className="size-4" />
              </button>
              <label className="flex items-center gap-2 text-sm font-semibold">
                {row.active ? "Active" : "Disabled"}
                <Switch
                  checked={row.active}
                  onCheckedChange={(on) => !isMe && update(row, { active: on })}
                  label={`${row.display_name} can sign in`}
                  className={isMe ? "pointer-events-none opacity-50" : undefined}
                />
              </label>
            </li>
          );
        })}
      </ul>

      <Sheet open={adding} onOpenChange={setAdding} title="Add a staff member" description="They can sign in right away with this email and password.">
        {adding && (
          <AddStaffForm
            onDone={() => {
              setAdding(false);
              load();
            }}
          />
        )}
      </Sheet>
      <Sheet open={resetting !== null} onOpenChange={(o) => !o && setResetting(null)} title={`Reset password`} description={resetting?.email}>
        {resetting && <ResetPasswordForm row={resetting} onDone={() => setResetting(null)} />}
      </Sheet>
    </div>
  );
}

function AddStaffForm({ onDone }: { onDone: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await createStaffAction({ displayName, email, password, role });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    toast(`${displayName} added`);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5 pt-2 pb-6">
      <label className="block text-sm font-semibold">
        Name
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={input} required />
      </label>
      <label className="block text-sm font-semibold">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="off" required />
      </label>
      <label className="block text-sm font-semibold">
        Temporary password
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="mt-1 block font-normal text-ink-muted">At least 8 characters. Share it with them in person.</span>
      </label>
      <label className="block text-sm font-semibold">
        Role
        <select value={role} onChange={(e) => setRole(e.target.value as "staff" | "manager")} className={input}>
          <option value="staff">Staff: orders and stock</option>
          <option value="manager">Manager: everything</option>
        </select>
      </label>
      {error && (
        <p className="text-sm font-medium text-[#a3361f]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "w-full")}>
        {busy ? "Adding…" : "Add staff member"}
      </button>
    </form>
  );
}

function ResetPasswordForm({ row, onDone }: { row: StaffRow; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await resetStaffPasswordAction(row.user_id, password);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    toast(`Password updated for ${row.display_name}`);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5 pt-2 pb-6">
      <label className="block text-sm font-semibold">
        New password
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {error && (
        <p className="text-sm font-medium text-[#a3361f]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "w-full")}>
        {busy ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
