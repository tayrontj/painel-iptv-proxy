import type { Request, Response } from "express";
import { getChannelSources, getCustomerByXtreamCredentials, getVodEpisodeById, getVodItemById, listChannels, listVodEpisodes, listVodItems, listVodSeasons } from "./db";
import { createPlaybackGatewayUrl } from "./playbackTickets";

function value(input: unknown) { return typeof input === "string" ? input.trim() : ""; }
function escaped(input: string) { return input.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("\n", " "); }
function extension(sourceUrl: string | null | undefined) { return sourceUrl?.split(".").pop()?.split("?")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4"; }
function gatewayBaseUrl() { if (process.env.PLAYBACK_EDGE_BASE_URL) return process.env.PLAYBACK_EDGE_BASE_URL; if (process.env.NODE_ENV === "test") return "https://media.test.videlis.local"; throw new Error("Gateway de mídia não configurado."); }
async function authenticateXtream(req: Request) { const username = value(req.query.username ?? req.params.username); const password = value(req.query.password ?? req.params.password); const customer = await getCustomerByXtreamCredentials(username, password); if (!customer || customer.status === "expired" || customer.expiresAt.getTime() < Date.now()) return undefined; return { customer, username, password }; }
async function playbackUrl(resource: "channel" | "vod" | "episode", itemId: number, quality?: string) { return createPlaybackGatewayUrl(gatewayBaseUrl(), { resource, itemId, ...(quality ? { quality } : {}) }); }

/** Exportação Xtream/M3U: links curtos apontam ao gateway Cloudflare e nunca à origem do conteúdo. */
export async function exportM3u(req: Request, res: Response) {
  const access = await authenticateXtream(req); if (!access) return void res.status(401).type("text/plain").send("Acesso não autorizado");
  try { const channels = (await listChannels()).filter(channel => channel.isActive && channel.healthStatus !== "unavailable"); const entries = await Promise.all(channels.map(async channel => `#EXTINF:-1 tvg-id="${escaped(channel.epgId || `channel-${channel.id}`)}" tvg-logo="${escaped(channel.logoUrl || "")}" tvg-chno="${channel.channelNumber}" group-title="${escaped(channel.groupTitle)}",${escaped(channel.name)}\n${await playbackUrl("channel", channel.id)}`)); res.setHeader("Content-Disposition", "attachment; filename=videlis.m3u"); return void res.type("audio/x-mpegurl").send(["#EXTM3U", ...entries].join("\n")); } catch (error) { return void res.status(503).type("text/plain").send(error instanceof Error ? error.message : "Gateway de mídia indisponível"); }
}

/** Redireciona somente ao gateway de mídia; a origem continua privada entre gateway e servidor. */
export async function playbackChannel(req: Request, res: Response) {
  const access = await authenticateXtream(req); const channelId = Number(String(req.params.channelId).replace(/\.(m3u8|ts)$/i, "")); if (!access || !Number.isInteger(channelId)) return void res.sendStatus(401);
  const source = (await getChannelSources(channelId)).find(item => item.quality === String(req.query.quality || "").toUpperCase()) || (await getChannelSources(channelId))[0]; if (!source) return void res.sendStatus(404);
  try { return void res.redirect(307, await playbackUrl("channel", channelId, source.quality)); } catch (error) { return void res.status(503).type("text/plain").send(error instanceof Error ? error.message : "Gateway de mídia indisponível"); }
}

/** Redireciona filme ou episódio ao gateway de mídia sem devolver URL de origem em resposta HTTP. */
export async function playbackVod(req: Request, res: Response) {
  const access = await authenticateXtream(req); const itemId = Number(String(req.params.itemId).replace(/\.[a-z0-9]+$/i, "")); if (!access || !Number.isInteger(itemId)) return void res.sendStatus(401);
  const item = req.params.kind === "series" ? await getVodEpisodeById(itemId) : await getVodItemById(itemId); if (!item?.sourceUrl) return void res.sendStatus(404);
  try { return void res.redirect(307, await playbackUrl(req.params.kind === "series" ? "episode" : "vod", itemId)); } catch (error) { return void res.status(503).type("text/plain").send(error instanceof Error ? error.message : "Gateway de mídia indisponível"); }
}

/** Resposta compatível com ações Xtream V2; links de stream usam tickets efêmeros do gateway. */
export async function xtreamPlayerApi(req: Request, res: Response) {
  const access = await authenticateXtream(req); if (!access) return void res.status(401).json({ user_info: { auth: 0 } });
  const action = value(req.query.action); const channels = (await listChannels()).filter(channel => channel.isActive && channel.healthStatus !== "unavailable"); const vod = (await listVodItems()).filter(item => item.status === "ready"); const serials = vod.filter(item => item.kind !== "filme"); const userInfo = { username: access.username, password: access.password, auth: 1, status: "Active", exp_date: String(Math.floor(access.customer.expiresAt.getTime() / 1000)), is_trial: access.customer.trialEndsAt ? "1" : "0", active_cons: String(access.customer.usedScreens), max_connections: String(access.customer.screenLimit), allowed_output_formats: ["m3u8"] }; const serverInfo = { url: req.get("host") || "", port: "443", https_port: "443", server_protocol: req.protocol, rtmp_port: "", timezone: "America/Sao_Paulo", timestamp_now: Math.floor(Date.now() / 1000), time_now: new Date().toISOString() };
  if (!action) return void res.json({ user_info: userInfo, server_info: serverInfo });
  if (action === "get_live_categories") return void res.json(Array.from(new Set(channels.map(channel => channel.groupTitle))).map((categoryName, index) => ({ category_id: String(index + 1), category_name: categoryName, parent_id: 0 })));
  if (action === "get_live_streams") { try { return void res.json(await Promise.all(channels.map(async channel => ({ num: channel.channelNumber, name: channel.name, stream_type: "live", stream_id: channel.id, stream_icon: channel.logoUrl, epg_channel_id: channel.epgId, added: String(Math.floor(channel.updatedAt.getTime() / 1000)), category_id: String(Array.from(new Set(channels.map(item => item.groupTitle))).indexOf(channel.groupTitle) + 1), custom_sid: "", tv_archive: 0, direct_source: "", container_extension: "m3u8", stream_url: await playbackUrl("channel", channel.id) })))); } catch (error) { return void res.status(503).json({ error: error instanceof Error ? error.message : "Gateway de mídia indisponível" }); } }
  if (action === "get_vod_categories") return void res.json(Array.from(new Set(vod.map(item => item.kind))).map((categoryName, index) => ({ category_id: String(index + 1), category_name: categoryName === "filme" ? "Filmes" : categoryName === "serie" ? "Séries" : "Novelas", parent_id: 0 })));
  if (action === "get_vod_streams") { try { return void res.json(await Promise.all(vod.filter(item => item.kind === "filme" && item.sourceUrl).map(async item => ({ name: item.title, stream_type: "movie", stream_id: item.id, stream_icon: item.posterUrl, added: String(Math.floor(item.updatedAt.getTime() / 1000)), category_id: "1", container_extension: extension(item.sourceUrl), custom_sid: "", direct_source: "", stream_url: await playbackUrl("vod", item.id) })))); } catch (error) { return void res.status(503).json({ error: error instanceof Error ? error.message : "Gateway de mídia indisponível" }); } }
  if (action === "get_series") return void res.json(serials.map(item => ({ series_id: item.id, name: item.title, cover: item.posterUrl, plot: item.synopsis, category_id: item.kind === "serie" ? "2" : "3", last_modified: String(Math.floor(item.updatedAt.getTime() / 1000)) })));
  if (action === "get_series_info") { const seriesId = Number(req.query.series_id); const series = serials.find(item => item.id === seriesId); if (!series) return void res.json({}); const [seriesEpisodes, seasons] = await Promise.all([listVodEpisodes(series.id), listVodSeasons(series.id)]); const groups = Object.fromEntries(seasons.map(season => [String(season.seasonNumber), seriesEpisodes.filter(item => item.seasonId === season.id).map(item => ({ id: item.id, title: item.title, episode_num: item.episodeNumber, container_extension: extension(item.sourceUrl), info: { releasedate: item.publishedAt.toISOString() } }))])); const unassigned = seriesEpisodes.filter(item => !item.seasonId).map(item => ({ id: item.id, title: item.title, episode_num: item.episodeNumber, container_extension: extension(item.sourceUrl), info: { releasedate: item.publishedAt.toISOString() } })); if (unassigned.length) groups["1"] = [...(groups["1"] || []), ...unassigned]; return void res.json({ info: { name: series.title, cover: series.posterUrl, plot: series.synopsis }, episodes: groups }); }
  return void res.json([]);
}
