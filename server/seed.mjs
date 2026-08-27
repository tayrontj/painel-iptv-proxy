import { createHash, randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const postgresUrl = value => value?.startsWith("postgres://") || value?.startsWith("postgresql://") ? value : undefined;
const connectionString = postgresUrl(process.env.NEON_DATABASE_URL) ?? postgresUrl(process.env.POSTGRES_URL) ?? postgresUrl(process.env.DATABASE_URL);
const username = process.env.NEXUS_ADMIN_USERNAME;
const password = process.env.NEXUS_ADMIN_PASSWORD;

if (!connectionString) throw new Error("NEON_DATABASE_URL, POSTGRES_URL ou DATABASE_URL PostgreSQL é obrigatória para executar o seeder.");
if (!username || !password) throw new Error("NEXUS_ADMIN_USERNAME e NEXUS_ADMIN_PASSWORD são obrigatórios para criar o administrador.");
if (password.length < 12) throw new Error("NEXUS_ADMIN_PASSWORD deve ter pelo menos 12 caracteres.");

const sql = neon(connectionString);
const stableTokenHash = value => createHash("sha256").update(value).digest("hex");
const passwordHash = value => {
  const salt = randomBytes(16).toString("base64url");
  return `scrypt$${salt}$${scryptSync(value, salt, 64).toString("base64url")}`;
};
const now = new Date();
const adminOpenId = `admin:${username.trim().toLowerCase()}`;
const plans = [
  { name: "Essencial", monthly: 2990, screens: 1, trialDays: 3 },
  { name: "Família", monthly: 4990, screens: 3, trialDays: 3 },
  { name: "Premium", monthly: 6990, screens: 5, trialDays: 7 },
];

async function upsertPlan(plan) {
  const found = await sql`SELECT id FROM plans WHERE name = ${plan.name} LIMIT 1`;
  if (found.length) return found[0].id;
  const inserted = await sql`INSERT INTO plans (name, monthly_price_cents, screen_limit, trial_days, is_active) VALUES (${plan.name}, ${plan.monthly}, ${plan.screens}, ${plan.trialDays}, true) RETURNING id`;
  const planId = inserted[0].id;
  await sql`INSERT INTO plan_cycles (plan_id, cycle, interval_days, discount_percent, is_active) VALUES (${planId}, 'monthly', 30, 0, true), (${planId}, 'quarterly', 90, 8, true), (${planId}, 'semiannual', 180, 12, true), (${planId}, 'annual', 365, 18, true)`;
  return planId;
}

async function ensureVod(title, kind, year, rating) {
  const exists = await sql`SELECT id FROM vod_items WHERE title = ${title} LIMIT 1`;
  if (!exists.length) await sql`INSERT INTO vod_items (title, kind, release_year, age_rating, status) VALUES (${title}, ${kind}, ${year}, ${rating}, 'draft')`;
}

async function ensureChannel(channelNumber, name, groupTitle, epgId, rating) {
  const exists = await sql`SELECT id FROM channels WHERE channel_number = ${channelNumber} LIMIT 1`;
  if (!exists.length) await sql`INSERT INTO channels (channel_number, name, group_title, epg_id, qualities, age_rating, route_count, is_active) VALUES (${channelNumber}, ${name}, ${groupTitle}, ${epgId}, 'HD', ${rating}, 1, false)`;
}

async function seed() {
  const existingAdmin = await sql`SELECT password_hash FROM users WHERE open_id = ${adminOpenId} LIMIT 1`;
  const hash = existingAdmin[0]?.password_hash || passwordHash(password);
  await sql`INSERT INTO users (open_id, name, email, login_method, password_hash, role, last_signed_in) VALUES (${adminOpenId}, 'Administrador Nexus', NULL, 'local', ${hash}, 'admin', ${now}) ON CONFLICT (open_id) DO UPDATE SET name = EXCLUDED.name, login_method = EXCLUDED.login_method, role = 'admin', updated_at = NOW()`;
  for (const plan of plans) await upsertPlan(plan);
  await ensureVod("Catálogo demonstrativo: filme", "filme", 2026, 0);
  await ensureVod("Catálogo demonstrativo: série", "serie", 2026, 12);
  await ensureVod("Catálogo demonstrativo: novela", "novela", 2026, 10);
  await ensureChannel(1, "Canal demonstrativo", "Demonstração", "demo.channel.1", 0);
  await ensureChannel(18, "Canal demonstrativo adulto", "Demonstração", "demo.channel.18", 18);
  console.log(JSON.stringify({ ok: true, admin: username, tokenChecksum: stableTokenHash(adminOpenId).slice(0, 12), seededAt: now.toISOString() }));
}

seed().catch(error => { console.error(error); process.exitCode = 1; });
