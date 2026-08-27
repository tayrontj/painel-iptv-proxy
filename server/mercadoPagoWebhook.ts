/**
 * Webhook do Mercado Pago. O identificador recebido não é confiado para definir
 * acesso: o servidor sempre consulta o pagamento com sua credencial cifrada.
 */
import type { Request, Response } from "express";
import { settlePixCharge } from "./db";
import { getMercadoPagoPaymentStatus } from "./externalIntegrations";
import { isMercadoPagoWebhookSignatureValid } from "./mercadoPagoWebhookSignature";

export async function handleMercadoPagoWebhook(req: Request, res: Response) {
  const dataId = typeof req.query["data.id"] === "string" ? req.query["data.id"] : undefined;
  const xRequestId = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"] : undefined;
  if (!dataId || !xRequestId) { res.sendStatus(400); return; }
  const paymentId = dataId;
  const valid = isMercadoPagoWebhookSignatureValid({
    xSignature: typeof req.headers["x-signature"] === "string" ? req.headers["x-signature"] : undefined,
    xRequestId,
    dataId,
    secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
  });
  if (!valid) { res.sendStatus(401); return; }
  try {
    const status = await getMercadoPagoPaymentStatus(paymentId);
    await settlePixCharge(paymentId, status);
    res.sendStatus(200);
  } catch (error) {
    console.error("[MercadoPago Webhook]", error);
    res.sendStatus(500);
  }
}
