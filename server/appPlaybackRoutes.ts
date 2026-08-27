import type { Express, Request, Response } from "express";
import { playbackChannel, playbackVod } from "./m3uExport";

function credentialsFromHeaders(req: Request) { const username = req.header("x-videlis-username")?.trim() || ""; const password = req.header("x-videlis-password")?.trim() || ""; Object.assign(req.query, { username, password }); }
function playLive(req: Request, res: Response) { credentialsFromHeaders(req); return playbackChannel(req, res); }
function playMovie(req: Request, res: Response) { credentialsFromHeaders(req); req.params.kind = "movie"; return playbackVod(req, res); }
function playEpisode(req: Request, res: Response) { credentialsFromHeaders(req); req.params.kind = "series"; return playbackVod(req, res); }

/** Superfície exclusiva do aplicativo: credenciais seguem em cabeçalhos e nunca na URL ou resposta do catálogo. */
export function registerAppPlaybackRoutes(app: Express) { app.get("/api/app/playback/live/:channelId", playLive); app.get("/api/app/playback/movie/:itemId", playMovie); app.get("/api/app/playback/episode/:itemId", playEpisode); }
