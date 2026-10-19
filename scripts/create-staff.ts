/**
 * Creates a staff or manager account (use this once for the first manager;
 * after that, managers add staff from /admin/staff).
 *
 *   node --env-file=.env.local scripts/create-staff.ts
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local");
  process.exit(1);
}

const rl = createInterface({ input: stdin, output: stdout });
const displayName = (await rl.question("Name: ")).trim();
const email = (await rl.question("Email: ")).trim().toLowerCase();
const roleAnswer = (await rl.question("Role (manager/staff) [manager]: ")).trim().toLowerCase();
const password = await rl.question("Password (8+ characters): ");
rl.close();

const role = roleAnswer === "staff" ? "staff" : "manager";
if (!displayName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
  console.error("Please enter a name, a valid email and a password of at least 8 characters.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  console.error(`Couldn't create the account: ${error.message}`);
  process.exit(1);
}
const { error: staffError } = await admin
  .from("staff")
  .insert({ user_id: data.user.id, display_name: displayName, email, role });
if (staffError) {
  await admin.auth.admin.deleteUser(data.user.id);
  console.error(`Couldn't add the staff record: ${staffError.message}`);
  process.exit(1);
}
console.log(`✓ ${displayName} (${email}) can now sign in at /admin/login as ${role}.`);
