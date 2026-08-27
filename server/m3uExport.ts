import type { Request, Response } from "express";
import { getChannelSources, getCustomerByXtreamCredentials, getVodEpisodeById, getVodItemById, listChannels, listVodEpisodes, listVodItems, listVodSeasons } from "./db";

function value(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function escaped(value: string) { return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("\n", " "); }
function extension(sourceUrl: string | null | undefined) { return sourceUrl?.split(".").pop()?.split("?")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4"; }

async function authenticateXtream(req: Request) {
  const username = value(req.query.username ?? req.params.username);
  const password = value(req.query.password ?? req.params.password);
  const customer = await getCustomerByXtreamCredentials(username, password);
  if (!customer || customer.status === "expired" || customer.expiresAt.getTime() < Date.now()) return undefined;
  return { customer, username, password };
}

/** Exportação para players Xtream V2 e M3U. O app oficial usa API separada. */
export async function exportM3u(req: Request, res: Response) {
  const access = await authenticateXtream(req);
  if (!access) { res.status(401).type("text/plain").send("Acesso não autorizado"); return; }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const channels = (await listChannels()).filter(channel => channel.isActive && channel.healthStatus !== "unavailable");
  const query = `username=${encodeURIComponent(access.username)}&password=${encodeURIComponent(access.password)}`;
  const body = ["#EXTM3U", ...channels.map(channel => `#EXTINF:-1 tvg-id="${escaped(channel.epgId || `channel-${channel.id}`)}" tvg-logo="${escaped(channel.logoUrl || "")}" tvg-chno="${channel.channelNumber}" group-title="${escaped(channel.groupTitle)}",${escaped(channel.name)}\n${baseUrl}/api/playback/${channel.id}?${query}`)].join("\n");
  res.setHeader("Content-Disposition", "attachment; filename=videlis.m3u");
  res.type("audio/x-mpegurl").send(body);
}

/** Entrega o manifest da qualidade solicitada com Origin e Referer específicos de cada rota. */
export async function playbackChannel(req: Request, res: Response) {
  const access = await authenticateXtream(req);
  const channelId = Number(String(req.params.channelId).replace(/\.(m3u8|ts)$/i, ""));
  if (!access || !Number.isInteger(channelId)) { res.sendStatus(401); return; }
  const requestedQuality = String(req.query.quality || "").toUpperCase();
  const sources = await getChannelSources(channelId);
  const source = sources.find(item => item.quality === requestedQuality) || sources[0];
  if (!source) { res.sendStatus(404); return; }
  const routes = [{ url: source.primaryUrl, origin: source.primaryOrigin, referer: source.primaryReferer }, source.fallbackUrl ? { url: source.fallbackUrl, origin: source.fallbackOrigin, referer: source.fallbackReferer } : null].filter(Boolean) as Array<{ url: string; origin: string | null; referer: string | null }>;
  for (const route of routes) {
    try { const headers: Record<string, string> = { "User-Agent": "VidelisProxy/1.0" }; if (route.origin) headers.Origin = route.origin; if (route.referer) headers.Referer = route.referer; const upstream = await fetch(route.url, { headers, signal: AbortSignal.timeout(10_000) }); if (!upstream.ok || !upstream.body) continue; res.status(upstream.status).setHeader("Content-Type", upstream.headers.get("content-type") || "application/vnd.apple.mpegurl"); res.send(Buffer.from(await upstream.arrayBuffer())); return; } catch { /* tenta fallback */ }
  }
  res.status(502).type("text/plain").send("Fonte indisponível");
}

/** Entrega filme ou episódio pelo proxy e não divulga a URL de origem armazenada. */
export async function playbackVod(req: Request, res: Response) {
  const access = await authenticateXtream(req);
  const itemId = Number(String(req.params.itemId).replace(/\.[a-z0-9]+$/i, ""));
  if (!access || !Number.isInteger(itemId)) { res.sendStatus(401); return; }
  const item = req.params.kind === "series" ? await getVodEpisodeById(itemId) : await getVodItemById(itemId);
  if (!item?.sourceUrl) { res.sendStatus(404); return; }
  try { const upstream = await fetch(item.sourceUrl, { headers: { "User-Agent": "VidelisProxy/1.0" }, signal: AbortSignal.timeout(10_000) }); if (!upstream.ok || !upstream.body) { res.sendStatus(502); return; } res.status(upstream.status).setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream"); res.send(Buffer.from(await upstream.arrayBuffer())); } catch { res.sendStatus(502); }
}

/** Resposta compatível com actions comuns do Xtream V2, sem vazar origem de canais e VOD. */
export async function xtreamPlayerApi(req: Request, res: Response) {
  const access = await authenticateXtream(req);
  if (!access) { res.status(401).json({ user_info: { auth: 0 } }); return; }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const action = value(req.query.action);
  const channels = (await listChannels()).filter(channel => channel.isActive && channel.healthStatus !== "unavailable");
  const vod = await listVodItems();
  const serials = vod.filter(item => item.kind !== "filme");
  const userInfo = { username: access.username, password: access.password, auth: 1, status: "Active", exp_date: String(Math.floor(access.customer.expiresAt.getTime() / 1000)), is_trial: access.customer.trialEndsAt ? "1" : "0", active_cons: String(access.customer.usedScreens), max_connections: String(access.customer.screenLimit), allowed_output_formats: ["m3u8"] };
  const serverInfo = { url: req.get("host") || "", port: "443", https_port: "443", server_protocol: req.protocol, rtmp_port: "", timezone: "America/Sao_Paulo", timestamp_now: Math.floor(Date.now() / 1000), time_now: new Date().toISOString() };
  if (!action) { res.json({ user_info: userInfo, server_info: serverInfo }); return; }
  if (action === "get_live_categories") { res.json(Array.from(new Set(channels.map(channel => channel.groupTitle))).map((categoryName, index) => ({ category_id: String(index + 1), category_name: categoryName, parent_id: 0 }))); return; }
  if (action === "get_live_streams") { const categories = Array.from(new Set(channels.map(item => item.groupTitle))); res.json(channels.map(channel => ({ num: channel.channelNumber, name: channel.name, stream_type: "live", stream_id: channel.id, stream_icon: channel.logoUrl, epg_channel_id: channel.epgId, added: String(Math.floor(channel.updatedAt.getTime() / 1000)), category_id: String(categories.indexOf(channel.groupTitle) + 1), custom_sid: "", tv_archive: 0, direct_source: "", container_extension: "m3u8", stream_url: `${baseUrl}/live/${access.username}/${access.password}/${channel.id}.m3u8` }))); return; }
  if (action === "get_vod_categories") { res.json(Array.from(new Set(vod.map(item => item.kind))).map((categoryName, index) => ({ category_id: String(index + 1), category_name: categoryName === "filme" ? "Filmes" : categoryName === "serie" ? "Séries" : "Novelas", parent_id: 0 }))); return; }
  if (action === "get_vod_streams") { res.json(vod.filter(item => item.kind === "filme" && item.sourceUrl).map(item => ({ name: item.title, stream_type: "movie", stream_id: item.id, stream_icon: item.posterUrl, added: String(Math.floor(item.updatedAt.getTime() / 1000)), category_id: "1", container_extension: extension(item.sourceUrl), custom_sid: "", direct_source: "", stream_url: `${baseUrl}/movie/${access.username}/${access.password}/${item.id}.${extension(item.sourceUrl)}` }))); return; }
  if (action === "get_series") { res.json(serials.map(item => ({ series_id: item.id, name: item.title, cover: item.posterUrl, plot: item.synopsis, category_id: item.kind === "serie" ? "2" : "3", last_modified: String(Math.floor(item.updatedAt.getTime() / 1000)) }))); return; }
  if (action === "get_series_info") { const seriesId = Number(req.query.series_id); const series = serials.find(item => item.id === seriesId); if (!series) { res.json({}); return; } const [seriesEpisodes, seasons] = await Promise.all([listVodEpisodes(series.id), listVodSeasons(series.id)]); const groups = Object.fromEntries(seasons.map(season => [String(season.seasonNumber), seriesEpisodes.filter(item => item.seasonId === season.id).map(item => ({ id: item.id, title: item.title, episode_num: item.episodeNumber, container_extension: extension(item.sourceUrl), info: { releasedate: item.publishedAt.toISOString() } }))])); const unassigned = seriesEpisodes.filter(item => !item.seasonId).map(item => ({ id: item.id, title: item.title, episode_num: item.episodeNumber, container_extension: extension(item.sourceUrl), info: { releasedate: item.publishedAt.toISOString() } })); if (unassigned.length) groups["1"] = [...(groups["1"] || []), ...unassigned]; res.json({ info: { name: series.title, cover: series.posterUrl, plot: series.synopsis }, episodes: groups }); return; }
  res.json([]);
}
