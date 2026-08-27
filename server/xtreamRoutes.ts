import type { Express } from "express";
import { exportM3u, playbackChannel, playbackVod, xtreamPlayerApi } from "./m3uExport";

/** Registra toda a superfície HTTP do Xtream V2 em um único ponto reutilizável. */
export function registerXtreamRoutes(app: Express) {
  app.get("/api/m3u", exportM3u);
  app.get("/api/playback/:channelId", playbackChannel);
  app.get(["/player_api.php", "/api/xtream/player_api.php"], xtreamPlayerApi);
  app.get(["/get.php", "/api/xtream/get.php"], exportM3u);
  app.get(["/live/:username/:password/:channelId", "/api/xtream/live/:username/:password/:channelId"], playbackChannel);
  app.get(["/movie/:username/:password/:itemId", "/api/xtream/movie/:username/:password/:itemId"], (req, res) => { req.params.kind = "movie"; return playbackVod(req, res); });
  app.get(["/series/:username/:password/:itemId", "/api/xtream/series/:username/:password/:itemId"], (req, res) => { req.params.kind = "series"; return playbackVod(req, res); });
}
