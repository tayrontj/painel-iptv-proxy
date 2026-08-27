import { createHmac, timingSafeEqual } from "node:crypto";

type WebhookSignatureInput = {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | undefined;
  secret: string | undefined;
};

function signatureParts(value: string | undefined) {
  return Object.fromEntries((value ?? "").split(",").map(part => part.trim().split("=", 2)).filter(([key, entry]) => Boolean(key && entry)));
}

/** Valida o manifesto oficial: id:<data.id>;request-id:<x-request-id>;ts:<ts>; */
export function isMercadoPagoWebhookSignatureValid({ xSignature, xRequestId, dataId, secret }: WebhookSignatureInput) {
  if (!secret) return false;
  const { ts, v1 } = signatureParts(xSignature);
  if (!ts || !v1) return false;
  const manifest = [dataId && `id:${dataId};`, xRequestId && `request-id:${xRequestId};`, `ts:${ts};`].filter(Boolean).join("");
  const expected = createHmac("sha256", secret).update(manifest).digest();
  const received = Buffer.from(v1, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
