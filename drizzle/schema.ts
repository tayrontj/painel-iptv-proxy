/**
 * Esquema persistente do Nexus Stream: separa clientes, distribuição ao vivo,
 * fontes EPG, catálogo VOD e o status que o aplicativo usará em assinaturas.
 */
import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 90 }).notNull(),
  plan: varchar("plan", { length: 64 }).notNull(),
  screenLimit: int("screenLimit").default(1).notNull(),
  usedScreens: int("usedScreens").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  status: mysqlEnum("status", ["active", "attention", "expired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  groupTitle: varchar("groupTitle", { length: 90 }).notNull(),
  qualities: varchar("qualities", { length: 120 }).notNull(),
  routeCount: int("routeCount").default(1).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const epgSources = mysqlTable("epgSources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  status: mysqlEnum("status", ["healthy", "attention", "inactive"]).default("inactive").notNull(),
  programmeCount: int("programmeCount").default(0).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vodItems = mysqlTable("vodItems", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  kind: mysqlEnum("kind", ["filme", "serie", "novela"]).notNull(),
  releaseYear: int("releaseYear"),
  sourceUrl: text("sourceUrl"),
  synopsis: text("synopsis"),
  status: mysqlEnum("status", ["draft", "ready"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pixCharges = mysqlTable("pixCharges", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  amountCents: int("amountCents").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "expired", "cancelled"]).default("pending").notNull(),
  providerPaymentId: varchar("providerPaymentId", { length: 120 }),
  dueAt: timestamp("dueAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const integrationSettings = mysqlTable("integrationSettings", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  baseUrl: varchar("baseUrl", { length: 500 }),
  enabled: boolean("enabled").default(false).notNull(),
  secretCiphertext: text("secretCiphertext"),
  secretIv: varchar("secretIv", { length: 48 }),
  secretTag: varchar("secretTag", { length: 48 }),
  secretHint: varchar("secretHint", { length: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type EpgSource = typeof epgSources.$inferSelect;
export type VodItem = typeof vodItems.$inferSelect;
export type PixCharge = typeof pixCharges.$inferSelect;
export type IntegrationSetting = typeof integrationSettings.$inferSelect;
