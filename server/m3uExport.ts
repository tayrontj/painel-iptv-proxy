import type { Request, Response } from "express";
import { getCustomerByAccessToken, listChannels } from "./db";

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
