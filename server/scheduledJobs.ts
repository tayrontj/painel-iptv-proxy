import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import * as db from "./db";
import { runPersistedChannelMonitor } from "./channelMonitor";
import { syncEligibleEpgSources } from "./epgSync";

function secretMatches(received: unknown, expected: string) { if (typeof received !== "string") return false; const left = Buffer.from(received); const right = Buffer.from(expected); return left.length === right.length && timingSafeEqual(left, right); }
function validScheduledAt(value: unknown) { if (typeof value !== "string") return false; const scheduledAt = Date.parse(value); return Number.isFinite(scheduledAt) && Math.abs(Date.now() - scheduledAt) <= 15 * 60_000; }

/** Endpoint consumido apenas pelo Worker externo: uma execução por job, com lock PostgreSQL e sem cron interno. */
export async function handleScheduledJob(req: Request, res: Response) {
  const secret = process.env.NEXUS_SCHEDULER_SECRET;
  if (!secret) { res.status(503).json({ error: "scheduler_not_configured" }); return; }
  if (!secretMatches(req.header("x-videlis-scheduler-secret"), secret) || !validScheduledAt(req.header("x-videlis-scheduled-at"))) { res.status(401).json({ error: "unauthorized_scheduler" }); return; }
  const job = req.body?.job;
  try {
    if (job === "monitor") return res.json({ ok: true, job, ...(await runPersistedChannelMonitor()) });
    if (job === "epg") { const acquired = await db.tryAcquireSchedulerLock("epg-sync", 14 * 60_000); if (!acquired) return res.json({ ok: true, job, skipped: true }); try { return res.json({ ok: true, job, skipped: false, results: await syncEligibleEpgSources() }); } finally { await db.releaseSchedulerLock("epg-sync"); } }
    return res.status(400).json({ error: "unknown_job" });
  } catch (error) { const message = error instanceof Error ? error.message : "Falha desconhecida no agendamento"; console.error("[Scheduled job]", { job, message }); return res.status(500).json({ error: message, job, timestamp: new Date().toISOString() }); }
}
