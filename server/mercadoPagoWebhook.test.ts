import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ settlePixCharge: vi.fn(), getMercadoPagoPaymentStatus: vi.fn() }));
vi.mock("./db", () => ({ settlePixCharge: mocks.settlePixCharge }));
vi.mock("./externalIntegrations", () => ({ getMercadoPagoPaymentStatus: mocks.getMercadoPagoPaymentStatus }));

import { handleMercadoPagoWebhook } from "./mercadoPagoWebhook";

const secret = "mp-webhook-secret";
const dataId = "123456";
const requestId = "request-1";
const timestamp = "1781009491";
const signature = createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${timestamp};`).digest("hex");
function response() { return { sendStatus: vi.fn() } as any; }

describe("handleMercadoPagoWebhook", () => {
  beforeEach(() => { vi.clearAllMocks(); process.env.MERCADO_PAGO_WEBHOOK_SECRET = secret; mocks.getMercadoPagoPaymentStatus.mockResolvedValue("approved"); mocks.settlePixCharge.mockResolvedValue({ appliedPlanChange: false }); });

  it("consulta e liquida somente uma notificação assinada", async () => {
    const res = response();
    await handleMercadoPagoWebhook({ query: { "data.id": dataId }, headers: { "x-signature": `ts=${timestamp},v1=${signature}`, "x-request-id": requestId } } as any, res);
    expect(mocks.getMercadoPagoPaymentStatus).toHaveBeenCalledWith(dataId);
    expect(mocks.settlePixCharge).toHaveBeenCalledWith(dataId, "approved");
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("rejeita assinatura inválida sem consultar ou alterar a cobrança", async () => {
    const res = response();
    await handleMercadoPagoWebhook({ query: { "data.id": dataId }, headers: { "x-signature": `ts=${timestamp},v1=${"0".repeat(64)}`, "x-request-id": requestId } } as any, res);
    expect(mocks.getMercadoPagoPaymentStatus).not.toHaveBeenCalled(); expect(mocks.settlePixCharge).not.toHaveBeenCalled(); expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  it("rejeita uma notificação sem data.id antes de consultar o pagamento", async () => {
    const res = response(); await handleMercadoPagoWebhook({ query: {}, headers: {} } as any, res);
    expect(mocks.getMercadoPagoPaymentStatus).not.toHaveBeenCalled(); expect(mocks.settlePixCharge).not.toHaveBeenCalled(); expect(res.sendStatus).toHaveBeenCalledWith(400);
  });

  it("rejeita uma notificação sem x-request-id antes de consultar o pagamento", async () => {
    const res = response(); await handleMercadoPagoWebhook({ query: { "data.id": dataId }, headers: { "x-signature": `ts=${timestamp},v1=${signature}` } } as any, res);
    expect(mocks.getMercadoPagoPaymentStatus).not.toHaveBeenCalled(); expect(mocks.settlePixCharge).not.toHaveBeenCalled(); expect(res.sendStatus).toHaveBeenCalledWith(400);
  });
});
