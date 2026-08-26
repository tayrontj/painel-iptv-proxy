/** Contratos tRPC administrativos e contratos mínimos para o aplicativo final. */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import type { AppPixCharge, AppSubscriptionSnapshot } from "@shared/types";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { createMercadoPagoPix, searchVodMetadata } from "./externalIntegrations";

const customerStatus = z.enum(["active", "attention", "expired"]);
const vodKind = z.enum(["filme", "serie", "novela"]);
const cycleKind = z.enum(["monthly", "quarterly", "semiannual", "annual", "custom"]);
const deviceInput = z.object({ accessToken: z.string().min(24).max(128) });

function cyclePrice(monthlyPriceCents: number, intervalDays: number, discountPercent: number) {
  return Math.round(monthlyPriceCents * (intervalDays / 30) * (1 - discountPercent / 100));
}

export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query(opts => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }) }),
  plans: router({
    list: publicProcedure.query(() => db.listPlans()),
    create: publicProcedure.input(z.object({ name: z.string().min(2).max(100), monthlyPriceCents: z.number().int().positive(), screenLimit: z.number().int().min(1).max(10), trialDays: z.number().int().min(0).max(90), cycles: z.array(z.object({ cycle: cycleKind, intervalDays: z.number().int().min(1).max(730), discountPercent: z.number().int().min(0).max(100) })).min(1) })).mutation(({ input }) => db.createPlan(input)),
  }),
  customers: router({
    list: publicProcedure.query(() => db.listCustomers()),
    create: publicProcedure.input(z.object({ label: z.string().min(2).max(90), planId: z.number().int().positive(), planCycleId: z.number().int().positive() })).mutation(({ input }) => db.createCustomer(input)),
    setStatus: publicProcedure.input(z.object({ id: z.number().int().positive(), status: customerStatus })).mutation(({ input }) => db.updateCustomerStatus(input.id, input.status)),
  }),
  channels: router({ list: publicProcedure.query(() => db.listChannels()), create: publicProcedure.input(z.object({ name: z.string().min(2).max(140), groupTitle: z.string().min(2).max(90), sources: z.array(z.object({ quality: z.enum(["SD", "HD", "FHD", "4K"]), primaryUrl: z.string().url(), fallbackUrl: z.string().url().nullable().optional() })).min(1).max(4) })).mutation(({ input }) => db.createChannel(input)), toggle: publicProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(({ input }) => db.toggleChannel(input.id, input.isActive)) }),
  epg: router({ list: publicProcedure.query(() => db.listEpgSources()), create: publicProcedure.input(z.object({ name: z.string().min(2).max(140) })).mutation(({ input }) => db.createEpgSource(input.name)), markSync: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.markEpgSync(input.id)) }),
  vod: router({
    list: publicProcedure.query(() => db.listVodItems()),
    create: publicProcedure.input(z.object({ title: z.string().min(2).max(255), kind: vodKind, releaseYear: z.number().int().min(1888).max(3000).nullable().optional(), sourceUrl: z.string().url().nullable().optional(), synopsis: z.string().max(5000).nullable().optional(), posterUrl: z.string().url().nullable().optional() })).mutation(({ input }) => db.createVodItem(input)),
    searchMetadata: adminProcedure.input(z.object({ query: z.string().min(2).max(120) })).mutation(({ input }) => searchVodMetadata(input.query)),
    seasons: publicProcedure.input(z.object({ vodId: z.number().int().positive() })).query(({ input }) => db.listVodSeasons(input.vodId)),
    episodes: publicProcedure.input(z.object({ vodId: z.number().int().positive() })).query(({ input }) => db.listVodEpisodes(input.vodId)),
    createSeason: publicProcedure.input(z.object({ vodId: z.number().int().positive(), seasonNumber: z.number().int().positive(), title: z.string().max(255).nullable().optional() })).mutation(({ input }) => db.createVodSeason(input)),
    createEpisode: publicProcedure.input(z.object({ vodId: z.number().int().positive(), seasonId: z.number().int().positive().nullable().optional(), episodeNumber: z.number().int().positive(), title: z.string().min(1).max(255), sourceUrl: z.string().url() })).mutation(({ input }) => db.createVodEpisode(input)),
  }),
  integrations: router({ list: adminProcedure.query(() => db.listIntegrationSettings()), save: adminProcedure.input(z.object({ provider: z.enum(["mercado_pago", "vod_metadata"]), label: z.string().min(2).max(120), baseUrl: z.string().url().nullable().optional(), enabled: z.boolean(), secret: z.string().min(6).max(2048).nullable().optional() })).mutation(({ input }) => db.saveIntegrationSetting(input)) }),
  billing: router({ createPix: adminProcedure.input(z.object({ customerId: z.number().int().positive(), payerEmail: z.string().email(), amountCents: z.number().int().positive(), description: z.string().min(2).max(255) })).mutation(async ({ input }) => { const customer = await db.getCustomerById(input.customerId); if (!customer) throw new Error("Cliente não encontrado"); const externalReference = `nexus-${customer.id}-${Date.now()}`; const payment = await createMercadoPagoPix({ ...input, externalReference }); await db.createPixCharge({ customerId: customer.id, amountCents: input.amountCents, providerPaymentId: payment.providerPaymentId, externalReference, qrCode: payment.qrCode, qrCodeBase64: payment.qrCodeBase64, dueAt: new Date(Date.now() + 30 * 60 * 1000) }); return payment; }), listForCustomer: adminProcedure.input(z.object({ customerId: z.number().int().positive() })).query(({ input }) => db.listPixChargesForCustomer(input.customerId)) }),
  app: router({
    subscription: publicProcedure.input(deviceInput).query(async ({ input }) => { const customer = await db.getCustomerByAccessToken(input.accessToken); if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Dispositivo não autorizado" }); const days = Math.ceil((customer.expiresAt.getTime() - Date.now()) / 86_400_000); const state = customer.status === "expired" || days < 0 ? "expired" : customer.status === "attention" || days <= 3 ? "attention" : "active"; const subscription: AppSubscriptionSnapshot = { state, expiresAt: customer.expiresAt.getTime(), showExpiryPopup: state !== "active", accessAllowed: state !== "expired", message: state === "active" ? "Assinatura ativa." : state === "attention" ? "Sua assinatura está próxima do vencimento." : "Sua assinatura venceu. Gere um novo PIX para continuar." }; const latest = (await db.listPixChargesForCustomer(customer.id))[0]; const charge: AppPixCharge | null = latest ? { paymentId: latest.providerPaymentId || `charge-${latest.id}`, status: latest.status, qrCode: latest.qrCode, qrCodeBase64: latest.qrCodeBase64, expiresAt: latest.dueAt.getTime() } : null; return { subscription, charge }; }),
    planOptions: publicProcedure.input(deviceInput).query(async ({ input }) => { const customer = await db.getCustomerByAccessToken(input.accessToken); if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Dispositivo não autorizado" }); const availablePlans = await db.listPlans(); return availablePlans.filter(plan => plan.isActive).map(plan => ({ id: plan.id, name: plan.name, screenLimit: plan.screenLimit, trialDays: plan.trialDays, current: plan.id === customer.planId, cycles: plan.cycles.filter(cycle => cycle.isActive).map(cycle => ({ id: cycle.id, cycle: cycle.cycle, intervalDays: cycle.intervalDays, discountPercent: cycle.discountPercent, priceCents: cyclePrice(plan.monthlyPriceCents, cycle.intervalDays, cycle.discountPercent) })) })); }),
    previewPlanChange: publicProcedure.input(deviceInput.extend({ planId: z.number().int().positive(), planCycleId: z.number().int().positive() })).query(async ({ input }) => { const customer = await db.getCustomerByAccessToken(input.accessToken); const cycle = await db.getPlanCycle(input.planCycleId); const availablePlans = await db.listPlans(); const plan = availablePlans.find(item => item.id === input.planId); if (!customer || !plan || !cycle || cycle.planId !== plan.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Opção de plano inválida" }); const priceCents = cyclePrice(plan.monthlyPriceCents, cycle.intervalDays, cycle.discountPercent); return { direction: plan.screenLimit > customer.screenLimit ? "upgrade" : plan.screenLimit < customer.screenLimit ? "downgrade" : "change", planName: plan.name, screenLimit: plan.screenLimit, intervalDays: cycle.intervalDays, discountPercent: cycle.discountPercent, priceCents }; }),
    changePlan: publicProcedure.input(deviceInput.extend({ planId: z.number().int().positive(), planCycleId: z.number().int().positive() })).mutation(async ({ input }) => { const customer = await db.getCustomerByAccessToken(input.accessToken); if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Dispositivo não autorizado" }); const result = await db.applyCustomerPlanChange({ customerId: customer.id, planId: input.planId, planCycleId: input.planCycleId }); return { planName: result.plan.name, screenLimit: result.plan.screenLimit, expiresAt: result.expiresAt.getTime() }; }),
    catalog: publicProcedure.input(deviceInput).query(async ({ input }) => { const customer = await db.getCustomerByAccessToken(input.accessToken); if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Dispositivo não autorizado" }); const [channels, vod, epg] = await Promise.all([db.listChannels(), db.listVodItems(), db.listEpgSources()]); const signal = (ageRating: number) => ({ ageRating, requiresAdultPin: ageRating >= 18 }); return { adultControl: { mode: "client_local", threshold: 18, note: "A API não recebe nem armazena PIN; o aplicativo decide o bloqueio local." }, channels: channels.filter(channel => channel.isActive).map(channel => ({ id: channel.id, name: channel.name, groupTitle: channel.groupTitle, qualities: channel.qualities, ...signal(channel.ageRating) })), vod: vod.map(item => ({ id: item.id, title: item.title, kind: item.kind, synopsis: item.synopsis, posterUrl: item.posterUrl, ...signal(item.ageRating) })), epg: epg.map(source => ({ id: source.id, name: source.name, status: source.status, programmeCount: source.programmeCount, adultSignalling: "program_age_rating" })) }; }),
  }),
});

export type AppRouter = typeof appRouter;
