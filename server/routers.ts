/**
 * Contratos tRPC do Nexus Stream. São procedimentos administrativos internos;
 * o aplicativo final deverá receber apenas contratos próprios e mínimos.
 */
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const customerStatus = z.enum(["active", "attention", "expired"]);
const vodKind = z.enum(["filme", "serie", "novela"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  customers: router({
    list: publicProcedure.query(() => db.listCustomers()),
    create: publicProcedure.input(z.object({ label: z.string().min(2).max(90), plan: z.string().min(2).max(64), screenLimit: z.number().int().min(1).max(10), expiresAt: z.date() })).mutation(({ input }) => db.createCustomer(input)),
    setStatus: publicProcedure.input(z.object({ id: z.number().int().positive(), status: customerStatus })).mutation(({ input }) => db.updateCustomerStatus(input.id, input.status)),
  }),
  channels: router({
    list: publicProcedure.query(() => db.listChannels()),
    create: publicProcedure.input(z.object({ name: z.string().min(2).max(140), groupTitle: z.string().min(2).max(90), qualities: z.string().min(2).max(120) })).mutation(({ input }) => db.createChannel(input)),
    toggle: publicProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(({ input }) => db.toggleChannel(input.id, input.isActive)),
  }),
  epg: router({
    list: publicProcedure.query(() => db.listEpgSources()),
    create: publicProcedure.input(z.object({ name: z.string().min(2).max(140) })).mutation(({ input }) => db.createEpgSource(input.name)),
    markSync: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.markEpgSync(input.id)),
  }),
  vod: router({
    list: publicProcedure.query(() => db.listVodItems()),
    create: publicProcedure.input(z.object({ title: z.string().min(2).max(255), kind: vodKind, releaseYear: z.number().int().min(1888).max(3000).nullable().optional(), sourceUrl: z.string().url().nullable().optional(), synopsis: z.string().max(5000).nullable().optional() })).mutation(({ input }) => db.createVodItem(input)),
  }),
  integrations: router({
    list: adminProcedure.query(() => db.listIntegrationSettings()),
    save: adminProcedure.input(z.object({ provider: z.enum(["mercado_pago", "vod_metadata"]), label: z.string().min(2).max(120), baseUrl: z.string().url().nullable().optional(), enabled: z.boolean(), secret: z.string().min(6).max(2048).nullable().optional() })).mutation(({ input }) => db.saveIntegrationSetting(input)),
  }),
});

export type AppRouter = typeof appRouter;
