import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCustomerByXtreamCredentials: vi.fn(),
  listPixChargesForCustomer: vi.fn(),
  listCustomerDevices: vi.fn(), registerCustomerDevice: vi.fn(), removeCustomerDevice: vi.fn(), updateCustomerProfile: vi.fn(), applyCustomerPlanChange: vi.fn(), listPlans: vi.fn(), getPlanCycle: vi.fn(), createPixCharge: vi.fn(), listEpgProgrammes: vi.fn(), listChannels: vi.fn(), listVodItems: vi.fn(), listVodEpisodes: vi.fn(),
}));

vi.mock("./db", () => ({
  getCustomerByXtreamCredentials: mocks.getCustomerByXtreamCredentials,
  listPixChargesForCustomer: mocks.listPixChargesForCustomer,
  listPlans: mocks.listPlans, getPlanCycle: mocks.getPlanCycle, applyCustomerPlanChange: mocks.applyCustomerPlanChange,
  listChannels: mocks.listChannels, listVodItems: mocks.listVodItems, listEpgSources: vi.fn(), listEpgProgrammes: mocks.listEpgProgrammes,
  authenticateAdmin: vi.fn(), listIntegrationSettings: vi.fn(), saveIntegrationSetting: vi.fn(),
  getCustomerById: vi.fn(), createPixCharge: mocks.createPixCharge, listCustomers: vi.fn(), createCustomer: vi.fn(), updateCustomerStatus: vi.fn(), updateCustomerProfile: mocks.updateCustomerProfile,
  listCustomerDevices: mocks.listCustomerDevices, registerCustomerDevice: mocks.registerCustomerDevice, removeCustomerDevice: mocks.removeCustomerDevice,
  inspectM3uManifest: vi.fn(), createEpgSource: vi.fn(), listVodSeasons: vi.fn(), listVodEpisodes: mocks.listVodEpisodes, createVodSeason: vi.fn(), createVodEpisode: vi.fn(), createVodItem: vi.fn(),
}));

const paymentMocks = vi.hoisted(() => ({ createMercadoPagoPix: vi.fn(), searchVodMetadata: vi.fn(), getVodMetadataByTmdbId: vi.fn() }));
vi.mock("./externalIntegrations", () => paymentMocks);
vi.mock("./epgSync", () => ({ syncEpgSource: vi.fn() }));
vi.mock("./m3uInspection", () => ({ inspectM3uManifest: vi.fn() }));

import { appRouter } from "./routers";

const ctx: any = { user: null, req: { protocol: "https", headers: {} }, res: { cookie: vi.fn(), clearCookie: vi.fn() } };
const customer = { id: 7, status: "active", expiresAt: new Date(Date.now() + 86_400_000), trialEndsAt: null };

describe("API oficial autenticada por Xtream", () => {
  it("aceita usuário e senha numéricos para consultar a assinatura", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue(customer);
    mocks.listPixChargesForCustomer.mockResolvedValue([]);
    const result = await appRouter.createCaller(ctx).app.subscription({ username: "1234567890", password: "987654321012" });
    expect(mocks.getCustomerByXtreamCredentials).toHaveBeenCalledWith("1234567890", "987654321012");
    expect(result.subscription.accessAllowed).toBe(true);
  });

  it("rejeita as credenciais numéricas que não correspondem a um cliente", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue(undefined);
    await expect(appRouter.createCaller(ctx).app.subscription({ username: "1234567890", password: "000000000000" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("permite ao aplicativo consultar e editar somente o próprio perfil", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue({ ...customer, label: "Maria", email: "maria@exemplo.com", phone: "11999999999", plan: "Premium", screenLimit: 2, usedScreens: 1 });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.app.profile({ username: "1234567890", password: "987654321012" })).resolves.toMatchObject({ label: "Maria", screenLimit: 2, usedScreens: 1 });
    await caller.app.updateProfile({ username: "1234567890", password: "987654321012", label: "Maria Silva", email: "nova@exemplo.com", phone: "11988888888" });
    expect(mocks.updateCustomerProfile).toHaveBeenCalledWith({ id: 7, label: "Maria Silva", email: "nova@exemplo.com", phone: "11988888888" });
  });

  it("lista, registra e remove telas somente da própria conta", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue(customer); mocks.listCustomerDevices.mockResolvedValue([{ id: 2, slot: 1, deviceName: "TV", lastSeenAt: new Date(), createdAt: new Date() }]); mocks.registerCustomerDevice.mockResolvedValue({ id: 3, slot: 2, deviceName: "Celular", lastSeenAt: new Date(), createdAt: new Date() });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.app.devices({ username: "1234567890", password: "987654321012" })).resolves.toHaveLength(1);
    await caller.app.registerDevice({ username: "1234567890", password: "987654321012", deviceName: "Celular", deviceKey: "chave-segura-com-mais-de-dezesseis" });
    await caller.app.removeDevice({ username: "1234567890", password: "987654321012", deviceId: 2 });
    expect(mocks.registerCustomerDevice).toHaveBeenCalledWith(expect.objectContaining({ customerId: 7, deviceName: "Celular" }));
    expect(mocks.removeCustomerDevice).toHaveBeenCalledWith({ customerId: 7, deviceId: 2 });
  });

  it("cria um PIX pendente para alteração de plano sem alterar o acesso antes da aprovação", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue({ ...customer, email: "cliente@exemplo.com" });
    mocks.listPlans.mockResolvedValue([{ id: 2, name: "Premium", monthlyPriceCents: 3000, screenLimit: 3, trialDays: 0, isActive: true, cycles: [] }]);
    mocks.getPlanCycle.mockResolvedValue({ id: 5, planId: 2, intervalDays: 30, discountPercent: 10, isActive: true });
    paymentMocks.createMercadoPagoPix.mockResolvedValue({ providerPaymentId: "pix-90", qrCode: "pix-copia-cola", qrCodeBase64: null });
    const result = await appRouter.createCaller(ctx).app.changePlan({ username: "1234567890", password: "987654321012", planId: 2, planCycleId: 5, payerEmail: "cliente@exemplo.com" });
    expect(result).toMatchObject({ status: "pending", planName: "Premium", amountCents: 2700 });
    expect(mocks.createPixCharge).toHaveBeenCalledWith(expect.objectContaining({ customerId: 7, requestedPlanId: 2, requestedPlanCycleId: 5, amountCents: 2700 }));
    expect(mocks.applyCustomerPlanChange).not.toHaveBeenCalled();
  });

  it("entrega catálogo e EPG com sinalização 18+ sem URL de origem ou PIN", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue(customer);
    mocks.listChannels.mockResolvedValue([{ id: 9, isActive: true, name: "Canal adulto", groupTitle: "Filmes", channelNumber: 9, logoUrl: null, epgId: "adulto.9", qualities: ["FHD"], ageRating: 18, primaryUrl: "https://origem.exemplo/live.m3u8" }]);
    mocks.listVodItems.mockResolvedValue([{ id: 21, kind: "serie", title: "Série adulta", tmdbId: 500, synopsis: "", posterUrl: null, releaseYear: 2026, ageRating: 18, sourceUrl: "https://origem.exemplo/serie" }]);
    mocks.listVodEpisodes.mockResolvedValue([{ id: 31, seasonId: null, episodeNumber: 1, title: "Episódio 1", publishedAt: new Date("2026-08-27T00:00:00Z"), sourceUrl: "https://origem.exemplo/episodio.m3u8" }]);
    mocks.listEpgProgrammes.mockResolvedValue([{ id: 41, channelEpgId: "adulto.9", title: "Programa adulto", synopsis: null, startsAt: new Date(), endsAt: new Date(), ageRating: 18 }]);
    const result = await appRouter.createCaller(ctx).app.catalog({ username: "1234567890", password: "987654321012" });
    expect(result.playback).toMatchObject({ credentialTransport: "headers", usernameHeader: "x-videlis-username" }); expect(result.channels[0]).toMatchObject({ id: 9, playbackPath: "/api/app/playback/live/9", requiresAdultPin: true, ageRating: 18 }); expect(result.vod[0]).toMatchObject({ tmdbId: 500, playbackPath: null, requiresAdultPin: true }); expect(result.episodes[0]).toMatchObject({ id: 31, playbackPath: "/api/app/playback/episode/31", requiresAdultPin: true }); expect(result.epg[0]).toMatchObject({ id: 41, channelId: 9, requiresAdultPin: true });
    expect(JSON.stringify(result)).not.toContain("origem.exemplo"); expect(JSON.stringify(result)).not.toContain("987654321012");
  });
});
