import type { Express } from "express";
import { z } from "zod";
import { createAndroidUpdateManifest, androidUpdateDecision } from "./androidUpdates";
import { getLatestPublishedAndroidRelease } from "./db";

export function registerAndroidUpdateRoutes(app: Express) {
  app.get("/api/app/update/android", async (req, res) => {
    const parsed = z.object({ versionCode: z.coerce.number().int().min(0).max(2_000_000_000).default(0) }).safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "versionCode inválido" });
    const release = await getLatestPublishedAndroidRelease(); const manifest = release ? createAndroidUpdateManifest(release) : undefined;
    if (!manifest) return res.status(204).end();
    return res.setHeader("Cache-Control", "no-store").json(androidUpdateDecision(manifest, parsed.data.versionCode));
  });
}
