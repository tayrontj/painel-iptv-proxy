/**
 * Funções de acesso a dados do Nexus Stream. As rotas tRPC chamam apenas estes
 * helpers, mantendo o armazenamento de IPTV, VOD e assinaturas centralizado.
 */
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { channels, customers, epgSources, integrationSettings, InsertUser, users, vodItems } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { encryptIntegrationSecret } from "./integrationSecrets";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: user.lastSignedIn ?? new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, role: values.role, lastSignedIn: values.lastSignedIn } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listCustomers() { const db = await getDb(); return db ? db.select().from(customers).orderBy(desc(customers.updatedAt)) : []; }
export async function createCustomer(input: { label: string; plan: string; screenLimit: number; expiresAt: Date }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(customers).values({ ...input, usedScreens: 0, status: "active" }); }
export async function updateCustomerStatus(id: number, status: "active" | "attention" | "expired") { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.update(customers).set({ status }).where(eq(customers.id, id)); }

export async function listChannels() { const db = await getDb(); return db ? db.select().from(channels).orderBy(desc(channels.updatedAt)) : []; }
export async function createChannel(input: { name: string; groupTitle: string; qualities: string }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(channels).values({ ...input, routeCount: 1, isActive: false }); }
export async function toggleChannel(id: number, isActive: boolean) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.update(channels).set({ isActive }).where(eq(channels.id, id)); }

export async function listEpgSources() { const db = await getDb(); return db ? db.select().from(epgSources).orderBy(desc(epgSources.updatedAt)) : []; }
export async function createEpgSource(name: string) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(epgSources).values({ name }); }
export async function markEpgSync(id: number) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.update(epgSources).set({ status: "healthy", lastSyncedAt: new Date() }).where(eq(epgSources.id, id)); }

export async function listVodItems() { const db = await getDb(); return db ? db.select().from(vodItems).orderBy(desc(vodItems.updatedAt)) : []; }
export async function createVodItem(input: { title: string; kind: "filme" | "serie" | "novela"; releaseYear?: number | null; sourceUrl?: string | null; synopsis?: string | null }) { const db = await getDb(); if (!db) throw new Error("Banco indisponível"); await db.insert(vodItems).values({ ...input, status: input.sourceUrl ? "ready" : "draft" }); }

export async function listIntegrationSettings() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(integrationSettings).orderBy(desc(integrationSettings.updatedAt));
  return rows.map(({ secretCiphertext: _secretCiphertext, secretIv: _secretIv, secretTag: _secretTag, ...safe }) => safe);
}

export async function saveIntegrationSetting(input: { provider: string; label: string; baseUrl?: string | null; enabled: boolean; secret?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const encrypted = input.secret ? encryptIntegrationSecret(input.secret) : null;
  const values = {
    provider: input.provider,
    label: input.label,
    baseUrl: input.baseUrl ?? null,
    enabled: input.enabled,
    ...(encrypted ? { secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv, secretTag: encrypted.tag, secretHint: encrypted.hint } : {}),
  };
  const updateSet = {
    label: values.label,
    baseUrl: values.baseUrl,
    enabled: values.enabled,
    ...(encrypted ? { secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv, secretTag: encrypted.tag, secretHint: encrypted.hint } : {}),
  };
  await db.insert(integrationSettings).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
