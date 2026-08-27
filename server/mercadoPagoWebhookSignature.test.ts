import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isMercadoPagoWebhookSignatureValid } from "./mercadoPagoWebhookSignature";

const secret = "whsec_test_123";
const dataId = "987654";
const requestId = "req-123";
const timestamp = "1781009491";
const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
const hash = createHmac("sha256", secret).update(manifest).digest("hex");

describe("assinatura de webhook Mercado Pago", () => {
  it("aceita uma assinatura HMAC válida no manifesto oficial", () => expect(isMercadoPagoWebhookSignatureValid({ xSignature: `ts=${timestamp},v1=${hash}`, xRequestId: requestId, dataId, secret })).toBe(true));
  it("rejeita uma assinatura adulterada", () => expect(isMercadoPagoWebhookSignatureValid({ xSignature: `ts=${timestamp},v1=${"0".repeat(64)}`, xRequestId: requestId, dataId, secret })).toBe(false));
  it("rejeita notificação sem segredo de ambiente", () => expect(isMercadoPagoWebhookSignatureValid({ xSignature: `ts=${timestamp},v1=${hash}`, xRequestId: requestId, dataId, secret: undefined })).toBe(false));
});
