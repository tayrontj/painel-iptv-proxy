/**
 * Webhook do Mercado Pago. O identificador recebido não é confiado para definir
 * acesso: o servidor sempre consulta o pagamento com sua credencial cifrada.
 */
import type { Request, Response } from "express";
import { updatePixChargeStatusByProviderId } from "./db";
import { getMercadoPagoPaymentStatus } from "./externalIntegrations";

export async function handleMercadoPagoWebhook(req: Request, res: Response) {
  const paymentId = String(req.body?.data?.id || req.query["data.id"] || req.query.id || "");
  if (!paymentId) { res.sendStatus(200); return; }
  try {
    const status = await getMercadoPagoPaymentStatus(paymentId);
    await updatePixChargeStatusByProviderId(paymentId, status);
    res.sendStatus(200);
  } catch (error) {
    console.error("[MercadoPago Webhook]", error);
    res.sendStatus(500);
  }
}
