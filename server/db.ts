/** Acesso de dados PostgreSQL do Nexus Stream, compatível com Neon. */
import { createHash, randomBytes, randomInt } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";
import { channelSources, channels, customers, epgSources, integrationSettings, type InsertUser, planCycles, plans, pixCharges, users, vodEpisodes, vodItems, vodSeasons } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { encryptIntegrationSecret } from "./integrationSecrets";
import { adminOpenId, verifyAdminPassword } from "./adminCredentials";
import { resolveNeonDatabaseUrl } from "./databaseUrl";

type Database = ReturnType<typeof drizzle<typeof schema>>;
let database: Database | null = null;

export async function getDb() {
  const connectionString = resolveNeonDatabaseUrl();
  if (!database && connectionString) database = drizzle(neon(connectionString), { schema });
  return database;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: user.lastSignedIn ?? new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") };
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: { name: values.name, email: values.email, loginMethod: values.loginMethod, role: values.role, lastSignedIn: values.lastSignedIn } });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return rows[0]; }
export async function authenticateAdmin(username: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const rows = await db.select().from(users).where(eq(users.openId, adminOpenId(username))).limit(1);
  const admin = rows[0];
  if (!admin || admin.role !== "admin" || !verifyAdminPassword(password, admin.passwordHash)) return undefined;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, admin.id));
  return admin;
}
function hashAccessToken(value: string) { return createHash("sha256").update(value).digest("hex"); }
function randomDigits(length = 10) { return Array.from({ length }, () => randomInt(0, 10)).join(""); }

export async function listCustomers() { const db = await getDb(); return db ? db.select().from(customers).orderBy(desc(customers.updatedAt)) : []; }
export async function createCustomer(input: { label: string; email?: string | null; phone?: string | null; planId: number; planCycleId: number }) {
  const db = await getDb(); if (!db) throw new Error("Banco indisponível");
  const [plan] = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
  const [cycle] = await db.select().from(planCycles).where(eq(planCycles.id, input.planCycleId)).limit(1);
  if (!plan || !cycle || cycle.planId !== plan.id || !plan.isActive || !cycle.isActive) throw new Error("Plano ou ciclo de pagamento inválido");
  const accessToken = randomBytes(24).toString("base64url"), xtreamUsername = randomDigits(10), xtreamPassword = randomDigits(12), now = Date.now();
  const trialEndsAt = plan.trialDays > 0 ? new Date(now + plan.trialDays * 86_400_000) : null, expiresAt = new Date((trialEndsAt?.getTime() ?? now) + cycle.intervalDays * 86_400_000);
  await db.insert(customers).values({ label: input.label, email: input.email || null, phone: input.phone || null, plan: plan.name, planId: plan.id, planCycleId: cycle.id, screenLimit: plan.screenLimit, usedScreens: 0, expiresAt, trialEndsAt, accessTokenHash: hashAccessToken(accessToken), xtreamUsername, xtreamPasswordHash: hashAccessToken(xtreamPassword), status: "active" });
  return { accessToken, xtreamUsername, xtreamPassword };
}
export async function getCustomerById(id: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1); return rows[0]; }
export async function getCustomerByAccessToken(accessToken: string) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(customers).where(eq(customers.accessTokenHash, hashAccessToken(accessToken))).limit(1); return rows[0]; }
export async function updateCustomerStatus(id: number, status: "active" | "attention" | "expired") { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.update(customers).set({ status }).where(eq(customers.id, id)); }
export async function rotateXtreamPassword(id: number) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); const password = randomDigits(12); await db.update(customers).set({ xtreamPasswordHash: hashAccessToken(password) }).where(eq(customers.id, id)); return { password }; }

export async function listChannels() { const db = await getDb(); return db ? db.select().from(channels).orderBy(desc(channels.updatedAt)) : []; }
export async function createChannel(input: { name: string; groupTitle: string; channelNumber: number; epgId?: string | null; logoUrl?: string | null; ageRating: number; sources: Array<{ quality: string; primaryUrl: string; primaryOrigin?: string | null; primaryReferer?: string | null; fallbackUrl?: string | null; fallbackOrigin?: string | null; fallbackReferer?: string | null }> }) {
  const db = await getDb(); if (!db) throw new Error("Banco indisponível");
  const qualities = input.sources.map(source => source.quality).join(" · ");
  const [inserted] = await db.insert(channels).values({ channelNumber: input.channelNumber, name: input.name, groupTitle: input.groupTitle, epgId: input.epgId || null, logoUrl: input.logoUrl || null, ageRating: input.ageRating, qualities, routeCount: input.sources.length, isActive: false }).returning({ id: channels.id });
  if (!inserted) throw new Error("Não foi possível criar o canal");
  await db.insert(channelSources).values(input.sources.map(source => ({ channelId: inserted.id, quality: source.quality, primaryUrl: source.primaryUrl, primaryOrigin: source.primaryOrigin || null, primaryReferer: source.primaryReferer || null, fallbackUrl: source.fallbackUrl || null, fallbackOrigin: source.fallbackOrigin || null, fallbackReferer: source.fallbackReferer || null })));
  return inserted;
}
export async function getChannelSources(channelId: number) { const db = await getDb(); return db ? db.select().from(channelSources).where(eq(channelSources.channelId, channelId)) : []; }
export async function toggleChannel(id: number, isActive: boolean) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.update(channels).set({ isActive }).where(eq(channels.id, id)); }

export async function listEpgSources() { const db = await getDb(); return db ? db.select().from(epgSources).orderBy(desc(epgSources.updatedAt)) : []; }
export async function createEpgSource(input: { name: string; feedUrl: string; refreshThresholdHours: number }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(epgSources).values({ ...input, status: "inactive" }); }
export async function getEpgSourceById(id: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(epgSources).where(eq(epgSources.id, id)).limit(1); return rows[0]; }
export async function saveEpgSyncSuccess(input: { id: number; programmeCount: number; coverageEndsAt: Date }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); const now = new Date(); await db.update(epgSources).set({ status: "healthy", programmeCount: input.programmeCount, coverageEndsAt: input.coverageEndsAt, lastSyncedAt: now, lastAttemptAt: now, lastError: null }).where(eq(epgSources.id, input.id)); }
export async function saveEpgSyncFailure(id: number, message: string) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.update(epgSources).set({ status: "attention", lastAttemptAt: new Date(), lastError: message.slice(0, 2000) }).where(eq(epgSources.id, id)); }

export async function listVodItems() { const db = await getDb(); return db ? db.select().from(vodItems).orderBy(desc(vodItems.updatedAt)) : []; }
export async function createVodItem(input: { title: string; kind: "filme" | "serie" | "novela"; releaseYear?: number | null; sourceUrl?: string | null; synopsis?: string | null; posterUrl?: string | null; ageRating?: number }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(vodItems).values({ ...input, status: input.sourceUrl ? "ready" : "draft" }); }

export async function listIntegrationSettings() { const db = await getDb(); if (!db) return []; const rows = await db.select().from(integrationSettings).orderBy(desc(integrationSettings.updatedAt)); return rows.map(({ secretCiphertext: _secretCiphertext, secretIv: _secretIv, secretTag: _secretTag, ...safe }) => safe); }
export async function getPrivateIntegrationSetting(provider: "mercado_pago" | "vod_metadata") { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(integrationSettings).where(eq(integrationSettings.provider, provider)).limit(1); return rows[0]; }
export async function saveIntegrationSetting(input: { provider: string; label: string; baseUrl?: string | null; enabled: boolean; secret?: string | null }) {
  const db = await getDb(); if (!db) throw new Error("Banco indisponível");
  const encrypted = input.secret ? encryptIntegrationSecret(input.secret) : null;
  const values = { provider: input.provider, label: input.label, baseUrl: input.baseUrl ?? null, enabled: input.enabled, ...(encrypted ? { secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv, secretTag: encrypted.tag, secretHint: encrypted.hint } : {}) };
  await db.insert(integrationSettings).values(values).onConflictDoUpdate({ target: integrationSettings.provider, set: { label: values.label, baseUrl: values.baseUrl, enabled: values.enabled, ...(encrypted ? { secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv, secretTag: encrypted.tag, secretHint: encrypted.hint } : {}) } });
}

export async function createPixCharge(input: { customerId: number; amountCents: number; providerPaymentId: string; externalReference: string; qrCode: string | null; qrCodeBase64: string | null; dueAt: Date }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(pixCharges).values({ ...input, status: "pending" }); }
export async function listPixChargesForCustomer(customerId: number) { const db = await getDb(); return db ? db.select().from(pixCharges).where(eq(pixCharges.customerId, customerId)).orderBy(desc(pixCharges.createdAt)) : []; }
export async function updatePixChargeStatusByProviderId(providerPaymentId: string, status: "pending" | "approved" | "expired" | "cancelled") { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.update(pixCharges).set({ status }).where(eq(pixCharges.providerPaymentId, providerPaymentId)); }

export async function listPlans() { const db = await getDb(); if (!db) return []; const base = await db.select().from(plans).orderBy(desc(plans.updatedAt)); const cycles = await db.select().from(planCycles).orderBy(planCycles.intervalDays); return base.map(plan => ({ ...plan, cycles: cycles.filter(cycle => cycle.planId === plan.id) })); }
export async function createPlan(input: { name: string; monthlyPriceCents: number; screenLimit: number; trialDays: number; cycles: Array<{ cycle: "monthly" | "quarterly" | "semiannual" | "annual" | "custom"; intervalDays: number; discountPercent: number }> }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); const [inserted] = await db.insert(plans).values({ name: input.name, monthlyPriceCents: input.monthlyPriceCents, screenLimit: input.screenLimit, trialDays: input.trialDays, isActive: true }).returning({ id: plans.id }); if (!inserted) throw new Error("Não foi possível criar o plano"); await db.insert(planCycles).values(input.cycles.map(cycle => ({ ...cycle, planId: inserted.id, isActive: true }))); return inserted; }
export async function getPlanCycle(planCycleId: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(planCycles).where(eq(planCycles.id, planCycleId)).limit(1); return rows[0]; }
export async function applyCustomerPlanChange(input: { customerId: number; planId: number; planCycleId: number }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); const [plan] = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1); const [cycle] = await db.select().from(planCycles).where(eq(planCycles.id, input.planCycleId)).limit(1); if (!plan || !cycle || cycle.planId !== plan.id || !plan.isActive || !cycle.isActive) throw new Error("Plano ou ciclo de pagamento inválido"); const expiresAt = new Date(Date.now() + cycle.intervalDays * 86_400_000); await db.update(customers).set({ plan: plan.name, planId: plan.id, planCycleId: cycle.id, screenLimit: plan.screenLimit, expiresAt, trialEndsAt: null, status: "active" }).where(eq(customers.id, input.customerId)); return { plan, cycle, expiresAt }; }

export async function listVodSeasons(vodId: number) { const db = await getDb(); return db ? db.select().from(vodSeasons).where(eq(vodSeasons.vodId, vodId)).orderBy(vodSeasons.seasonNumber) : []; }
export async function listVodEpisodes(vodId: number) { const db = await getDb(); return db ? db.select().from(vodEpisodes).where(eq(vodEpisodes.vodId, vodId)).orderBy(desc(vodEpisodes.publishedAt), desc(vodEpisodes.episodeNumber)) : []; }
export async function createVodSeason(input: { vodId: number; seasonNumber: number; title?: string | null }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(vodSeasons).values(input); }
export async function createVodEpisode(input: { vodId: number; seasonId?: number | null; episodeNumber: number; title: string; sourceUrl: string }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(vodEpisodes).values(input); }
