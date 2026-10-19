"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { buttonClasses } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "not_staff" ? "That account isn't set up as cafe staff. Ask a manager to add you." : null,
  );
  const emailId = useId();
  const passwordId = useId();
  const supabase = getBrowserSupabase();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setBusy(false);
      setError(signInError.message === "Invalid login credentials" ? "Wrong email or password." : signInError.message);
      return;
    }
    // Only allow same-site paths for the post-login redirect.
    const next = params.get("next");
    router.replace(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
    router.refresh();
  }

  const input =
    "mt-2 h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";

  return (
    <div className="grid min-h-dvh place-items-center bg-[#f7f3ea] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <Image src="/brand/crest.jpg" alt="" width={44} height={44} className="rounded-full" />
          <div className="leading-tight">
            <p className="font-display text-xl text-navy">Mt. Eden</p>
            <p className="eyebrow text-[0.6rem] text-ink-muted">Staff dashboard</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
          <h1 className="font-display text-3xl text-navy">Sign in</h1>
          {!supabase ? (
            <p className="mt-4 text-ink/75">Sign-in isn&apos;t available until Supabase is connected. See SETUP.md.</p>
          ) : (
            <>
              <label htmlFor={emailId} className="mt-6 block text-sm font-semibold">
                Email
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                required
              />
              <label htmlFor={passwordId} className="mt-5 block text-sm font-semibold">
                Password
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                required
              />
              {error && (
                <p className="mt-4 text-sm font-medium text-[#a3361f]" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "mt-6 w-full")}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <p className="mt-4 text-center text-sm text-ink-muted">Forgot your password? Ask a manager to reset it.</p>
            </>
          )}
        </form>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-navy hover:underline">
          ← Customer site
        </Link>
      </div>
    </div>
  );
}
