/** Modelos persistentes do Nexus Stream. */
import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", { id: int("id").autoincrement().primaryKey(), openId: varchar("openId", { length: 64 }).notNull().unique(), name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }), role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull() });

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  monthlyPriceCents: int("monthlyPriceCents").notNull(),
  screenLimit: int("screenLimit").default(1).notNull(),
  trialDays: int("trialDays").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const planCycles = mysqlTable("planCycles", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  cycle: mysqlEnum("cycle", ["monthly", "quarterly", "semiannual", "annual", "custom"]).notNull(),
  intervalDays: int("intervalDays").notNull(),
  discountPercent: int("discountPercent").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(), label: varchar("label", { length: 90 }).notNull(), email: varchar("email", { length: 320 }), phone: varchar("phone", { length: 30 }), plan: varchar("plan", { length: 64 }).notNull(), planId: int("planId"), planCycleId: int("planCycleId"), screenLimit: int("screenLimit").default(1).notNull(), usedScreens: int("usedScreens").default(0).notNull(), expiresAt: timestamp("expiresAt").notNull(), trialEndsAt: timestamp("trialEndsAt"), accessTokenHash: varchar("accessTokenHash", { length: 64 }).notNull().unique(), xtreamUsername: varchar("xtreamUsername", { length: 16 }).unique(), xtreamPasswordHash: varchar("xtreamPasswordHash", { length: 64 }), status: mysqlEnum("status", ["active", "attention", "expired"]).default("active").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const customerDevices = mysqlTable("customerDevices", { id: int("id").autoincrement().primaryKey(), customerId: int("customerId").notNull(), deviceName: varchar("deviceName", { length: 120 }).notNull(), deviceKeyHash: varchar("deviceKeyHash", { length: 64 }).notNull().unique(), lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });

export const channels = mysqlTable("channels", { id: int("id").autoincrement().primaryKey(), channelNumber: int("channelNumber").notNull(), name: varchar("name", { length: 140 }).notNull(), groupTitle: varchar("groupTitle", { length: 90 }).notNull(), epgId: varchar("epgId", { length: 160 }), logoUrl: text("logoUrl"), qualities: varchar("qualities", { length: 120 }).notNull(), ageRating: int("ageRating").default(0).notNull(), routeCount: int("routeCount").default(1).notNull(), isActive: boolean("isActive").default(false).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });
export const channelSources = mysqlTable("channelSources", { id: int("id").autoincrement().primaryKey(), channelId: int("channelId").notNull(), quality: varchar("quality", { length: 24 }).notNull(), primaryUrl: text("primaryUrl").notNull(), primaryOrigin: varchar("primaryOrigin", { length: 500 }), primaryReferer: varchar("primaryReferer", { length: 500 }), fallbackUrl: text("fallbackUrl"), fallbackOrigin: varchar("fallbackOrigin", { length: 500 }), fallbackReferer: varchar("fallbackReferer", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });
export const epgSources = mysqlTable("epgSources", { id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 140 }).notNull(), status: mysqlEnum("status", ["healthy", "attention", "inactive"]).default("inactive").notNull(), programmeCount: int("programmeCount").default(0).notNull(), lastSyncedAt: timestamp("lastSyncedAt"), coverageEndsAt: timestamp("coverageEndsAt"), refreshThresholdHours: int("refreshThresholdHours").default(6).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });

export const vodItems = mysqlTable("vodItems", { id: int("id").autoincrement().primaryKey(), title: varchar("title", { length: 255 }).notNull(), kind: mysqlEnum("kind", ["filme", "serie", "novela"]).notNull(), releaseYear: int("releaseYear"), sourceUrl: text("sourceUrl"), synopsis: text("synopsis"), posterUrl: text("posterUrl"), ageRating: int("ageRating").default(0).notNull(), status: mysqlEnum("status", ["draft", "ready"]).default("draft").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });
export const vodSeasons = mysqlTable("vodSeasons", { id: int("id").autoincrement().primaryKey(), vodId: int("vodId").notNull(), seasonNumber: int("seasonNumber").notNull(), title: varchar("title", { length: 255 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });
export const vodEpisodes = mysqlTable("vodEpisodes", { id: int("id").autoincrement().primaryKey(), vodId: int("vodId").notNull(), seasonId: int("seasonId"), episodeNumber: int("episodeNumber").notNull(), title: varchar("title", { length: 255 }).notNull(), sourceUrl: text("sourceUrl").notNull(), publishedAt: timestamp("publishedAt").defaultNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });

export const pixCharges = mysqlTable("pixCharges", { id: int("id").autoincrement().primaryKey(), customerId: int("customerId").notNull(), amountCents: int("amountCents").notNull(), status: mysqlEnum("status", ["pending", "approved", "expired", "cancelled"]).default("pending").notNull(), providerPaymentId: varchar("providerPaymentId", { length: 120 }), externalReference: varchar("externalReference", { length: 160 }), qrCode: text("qrCode"), qrCodeBase64: text("qrCodeBase64"), dueAt: timestamp("dueAt").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });
export const integrationSettings = mysqlTable("integrationSettings", { id: int("id").autoincrement().primaryKey(), provider: varchar("provider", { length: 64 }).notNull().unique(), label: varchar("label", { length: 120 }).notNull(), baseUrl: varchar("baseUrl", { length: 500 }), enabled: boolean("enabled").default(false).notNull(), secretCiphertext: text("secretCiphertext"), secretIv: varchar("secretIv", { length: 48 }), secretTag: varchar("secretTag", { length: 48 }), secretHint: varchar("secretHint", { length: 8 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull() });

export type User = typeof users.$inferSelect; export type InsertUser = typeof users.$inferInsert; export type Plan = typeof plans.$inferSelect; export type PlanCycle = typeof planCycles.$inferSelect; export type Customer = typeof customers.$inferSelect; export type Channel = typeof channels.$inferSelect; export type ChannelSource = typeof channelSources.$inferSelect; export type EpgSource = typeof epgSources.$inferSelect; export type VodItem = typeof vodItems.$inferSelect; export type VodSeason = typeof vodSeasons.$inferSelect; export type VodEpisode = typeof vodEpisodes.$inferSelect; export type PixCharge = typeof pixCharges.$inferSelect; export type IntegrationSetting = typeof integrationSettings.$inferSelect;
