import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { syncEligibleEpgSources } from "./epgSync";

export async function handleScheduledEpgSync(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const results = await syncEligibleEpgSources();
    return res.json({ ok: true, taskUid: user.taskUid, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na sincronização EPG";
    return res.status(500).json({ error: message, timestamp: new Date().toISOString(), context: { path: req.path } });
  }
}
