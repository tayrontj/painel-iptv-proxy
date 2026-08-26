import type { Request, Response } from "express";
import { getChannelSources, getCustomerByAccessToken, listChannels } from "./db";

/** Exportação para players compatíveis. O app oficial usa a API tRPC, não esta lista. */
export async function exportM3u(req: Request, res: Response) {
  const token = String(req.query.token || "");
  const customer = await getCustomerByAccessToken(token);
  if (!customer || customer.status === "expired" || customer.expiresAt.getTime() < Date.now()) { res.status(401).type("text/plain").send("Acesso não autorizado"); return; }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const channels = (await listChannels()).filter(channel => channel.isActive);
  const body = ["#EXTM3U", ...channels.map(channel => `#EXTINF:-1 tvg-id="channel-${channel.id}" group-title="${channel.groupTitle}",${channel.name}\n${baseUrl}/api/playback/${channel.id}?token=${encodeURIComponent(token)}`)].join("\n");
  res.setHeader("Content-Disposition", "attachment; filename=nexus-stream.m3u");
  res.type("audio/x-mpegurl").send(body);
}

/** Entrega o manifest M3U8 via servidor e tenta o fallback antes de responder erro. */
export async function playbackChannel(req: Request, res: Response) {
  const token = String(req.query.token || "");
  const customer = await getCustomerByAccessToken(token);
  const channelId = Number(req.params.channelId);
  if (!customer || customer.status === "expired" || customer.expiresAt.getTime() < Date.now() || !Number.isInteger(channelId)) { res.sendStatus(401); return; }
  const requestedQuality = String(req.query.quality || "").toUpperCase();
  const sources = await getChannelSources(channelId);
  const source = sources.find(item => item.quality === requestedQuality) || sources[0];
  if (!source) { res.sendStatus(404); return; }
  for (const url of [source.primaryUrl, source.fallbackUrl].filter(Boolean) as string[]) {
    try {
      const upstream = await fetch(url, { headers: { "User-Agent": "NexusStreamProxy/1.0" } });
      if (!upstream.ok || !upstream.body) continue;
      res.status(upstream.status).setHeader("Content-Type", upstream.headers.get("content-type") || "application/vnd.apple.mpegurl");
      const data = Buffer.from(await upstream.arrayBuffer());
      res.send(data);
      return;
    } catch { /* tenta fallback */ }
  }
  res.status(502).type("text/plain").send("Fonte indisponível");
}
