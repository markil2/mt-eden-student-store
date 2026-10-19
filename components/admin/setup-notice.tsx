import Link from "next/link";

/** Shown in /admin until Supabase keys are added to .env.local. */
export function SetupNotice() {
  return (
    <div className="min-h-dvh bg-[#f7f3ea] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 ring-1 ring-line">
        <p className="eyebrow text-ink-muted">Almost there</p>
        <h1 className="mt-3 font-display text-4xl text-navy">Connect Supabase to open the dashboard</h1>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-ink/80">
          <li>Create a free project at supabase.com.</li>
          <li>
            In its SQL Editor, run <code className="rounded bg-ink/[0.06] px-1.5">supabase/schema.sql</code>, then{" "}
            <code className="rounded bg-ink/[0.06] px-1.5">supabase/seed.sql</code>.
          </li>
          <li>
            Copy <code className="rounded bg-ink/[0.06] px-1.5">.env.example</code> to{" "}
            <code className="rounded bg-ink/[0.06] px-1.5">.env.local</code> and paste in the project URL and keys.
          </li>
          <li>Create the first manager account, then restart the dev server.</li>
        </ol>
        <p className="mt-6 text-sm text-ink-muted">Full steps are in SETUP.md in the project folder.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-navy hover:underline">
          ← Back to the customer site
        </Link>
      </div>
    </div>
  );
}
