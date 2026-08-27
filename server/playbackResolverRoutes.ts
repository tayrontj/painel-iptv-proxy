import { timingSafeEqual } from "node:crypto";
import type { Express, Request } from "express";
import { getChannelSources, getVodEpisodeById, getVodItemById } from "./db";
import { readPlaybackTicket } from "./playbackTickets";

function edgeAuthorized(req: Request) { const expected = process.env.PLAYBACK_EDGE_RESOLVER_SECRET; const received = req.get("x-videlis-playback-edge-secret"); if (!expected || !received || expected.length !== received.length) return false; return timingSafeEqual(Buffer.from(expected), Buffer.from(received)); }
function selectChannelRoute(sources: Awaited<ReturnType<typeof getChannelSources>>, quality?: string) { const source = sources.find(item => item.quality === quality) || sources[0]; if (!source) return undefined; const fallbackSelected = source.selectedRoute === "fallback" && source.fallbackUrl; return fallbackSelected ? { url: source.fallbackUrl!, origin: source.fallbackOrigin, referer: source.fallbackReferer } : { url: source.primaryUrl, origin: source.primaryOrigin, referer: source.primaryReferer }; }
function resolveNestedResource(sourceUrl: string, nestedResource: string | undefined) { if (!nestedResource) return sourceUrl; const target = new URL(nestedResource, sourceUrl); const original = new URL(sourceUrl); if (target.origin !== original.origin) throw new Error("O recurso solicitado não pertence à origem autorizada."); return target.toString(); }

export function registerPlaybackResolverRoutes(app: Express) {
  app.post("/api/internal/playback/resolve", async (req, res) => {
    if (!edgeAuthorized(req)) return res.sendStatus(401);
    const ticket = typeof req.body?.ticket === "string" ? req.body.ticket : ""; const nestedResource = typeof req.body?.resource === "string" ? req.body.resource : undefined;
    if (nestedResource && nestedResource.length > 2048) return res.status(400).json({ error: "Recurso inválido" });
    const payload = await readPlaybackTicket(ticket); if (!payload) return res.status(401).json({ error: "Ticket de reprodução inválido ou expirado" });
    try {
      if (payload.resource === "channel") { const source = selectChannelRoute(await getChannelSources(payload.itemId), payload.quality); if (!source) return res.sendStatus(404); return res.json({ url: resolveNestedResource(source.url, nestedResource), headers: { ...(source.origin ? { Origin: source.origin } : {}), ...(source.referer ? { Referer: source.referer } : {}), "User-Agent": "VidelisMediaGateway/1.0" } }); }
      const item = payload.resource === "episode" ? await getVodEpisodeById(payload.itemId) : await getVodItemById(payload.itemId); if (!item?.sourceUrl) return res.sendStatus(404); return res.json({ url: resolveNestedResource(item.sourceUrl, nestedResource), headers: { "User-Agent": "VidelisMediaGateway/1.0" } });
    } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível resolver a reprodução" }); }
  });
}
