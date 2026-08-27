/**
 * Adaptadores de integrações externas. Tokens são recuperados apenas no servidor
 * depois de decifrados; nenhuma resposta devolve a credencial ao painel ou app.
 */
import { randomUUID } from "node:crypto";
import { decryptIntegrationSecret } from "./integrationSecrets";
import { getPrivateIntegrationSetting } from "./db";

type MetadataResult = { providerId: string; tmdbId: number; title: string; overview: string; releaseYear: number | null; posterUrl: string | null };

async function activeCredential(provider: "mercado_pago" | "vod_metadata") {
  const setting = await getPrivateIntegrationSetting(provider);
  if (!setting?.enabled || !setting.secretCiphertext || !setting.secretIv || !setting.secretTag) throw new Error(`Integração ${provider === "mercado_pago" ? "Mercado Pago" : "de metadados VOD"} não configurada`);
  return { baseUrl: setting.baseUrl, secret: decryptIntegrationSecret({ ciphertext: setting.secretCiphertext, iv: setting.secretIv, tag: setting.secretTag }) };
}

function integrationUrl(baseUrl: string | null, relativePath: string) { const endpoint = new URL(baseUrl || ""); if (endpoint.protocol !== "https:") throw new Error("A URL da integração precisa utilizar HTTPS"); return new URL(relativePath, endpoint.href.endsWith("/") ? endpoint.href : `${endpoint.href}/`); }
function metadataResult(item: { id: number; title?: string; name?: string; overview?: string; release_date?: string; first_air_date?: string; poster_path?: string | null }): MetadataResult { const date = item.release_date || item.first_air_date || ""; return { providerId: `metadata-${item.id}`, tmdbId: item.id, title: item.title || item.name || "Título sem identificação", overview: item.overview || "", releaseYear: /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null, posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null }; }

export async function searchVodMetadata(query: string): Promise<MetadataResult[]> {
  const integration = await activeCredential("vod_metadata");
  const endpoint = integrationUrl(integration.baseUrl, `search/multi?query=${encodeURIComponent(query)}&language=pt-BR&include_adult=false`);
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${integration.secret}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`A fonte de metadados respondeu com erro ${response.status}`);
  const payload = await response.json() as { results?: Array<{ id: number; title?: string; name?: string; overview?: string; release_date?: string; first_air_date?: string; poster_path?: string | null }> };
  return (payload.results ?? []).map(metadataResult);
}

/** Consulta por ID interno do TMDB e usa movie/tv conforme o tipo selecionado no formulário. */
export async function getVodMetadataByTmdbId(input: { tmdbId: number; kind: "filme" | "serie" | "novela" }): Promise<MetadataResult> {
  const integration = await activeCredential("vod_metadata");
  const resource = input.kind === "filme" ? "movie" : "tv";
  const endpoint = integrationUrl(integration.baseUrl, `${resource}/${input.tmdbId}?language=pt-BR`);
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${integration.secret}`, Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`O TMDB não encontrou o ID informado (${response.status})`);
  return metadataResult(await response.json() as { id: number; title?: string; name?: string; overview?: string; release_date?: string; first_air_date?: string; poster_path?: string | null });
}

export async function createMercadoPagoPix(input: { amountCents: number; description: string; payerEmail: string; externalReference: string }) {
  const integration = await activeCredential("mercado_pago");
  const endpoint = integrationUrl(integration.baseUrl, "v1/payments");
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${integration.secret}`, "Content-Type": "application/json", "X-Idempotency-Key": randomUUID() }, body: JSON.stringify({ transaction_amount: input.amountCents / 100, description: input.description, payment_method_id: "pix", external_reference: input.externalReference, payer: { email: input.payerEmail }, ...(process.env.MERCADO_PAGO_WEBHOOK_URL?.startsWith("https://") ? { notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL } : {}) }) });
  if (!response.ok) throw new Error(`O Mercado Pago respondeu com erro ${response.status}`);
  const payload = await response.json() as { id: string | number; status: string; point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } } };
  return { providerPaymentId: String(payload.id), status: payload.status, qrCode: payload.point_of_interaction?.transaction_data?.qr_code ?? null, qrCodeBase64: payload.point_of_interaction?.transaction_data?.qr_code_base64 ?? null, ticketUrl: payload.point_of_interaction?.transaction_data?.ticket_url ?? null };
}

export async function getMercadoPagoPaymentStatus(providerPaymentId: string) {
  const integration = await activeCredential("mercado_pago");
  const endpoint = integrationUrl(integration.baseUrl, `v1/payments/${encodeURIComponent(providerPaymentId)}`);
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${integration.secret}`, Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Não foi possível consultar o pagamento (${response.status})`);
  const payload = await response.json() as { status?: string };
  const statusMap: Record<string, "pending" | "approved" | "expired" | "cancelled"> = { approved: "approved", cancelled: "cancelled", rejected: "cancelled", expired: "expired", pending: "pending", in_process: "pending", in_mediation: "pending" };
  return statusMap[payload.status || ""] || "pending";
}
