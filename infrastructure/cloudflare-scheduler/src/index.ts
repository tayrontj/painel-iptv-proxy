export interface Env {
  VERCEL_API_BASE_URL: string;
  NEXUS_SCHEDULER_SECRET: string;
}

const CRON_TO_JOB: Record<string, "monitor" | "epg"> = { "*/5 * * * *": "monitor", "0 * * * *": "epg" };

/** Worker leve: apenas dispara a API Vercel; nunca lê XMLTV nem testa mídia diretamente. */
export default {
  async scheduled(controller: ScheduledController, env: Env, executionCtx: ExecutionContext) {
    const job = CRON_TO_JOB[controller.cron];
    if (!job) return;
    const target = `${env.VERCEL_API_BASE_URL.replace(/\/$/, "")}/api/scheduled/jobs`;
    executionCtx.waitUntil(fetch(target, { method: "POST", headers: { "content-type": "application/json", "x-videlis-scheduler-secret": env.NEXUS_SCHEDULER_SECRET, "x-videlis-scheduled-at": new Date(controller.scheduledTime).toISOString() }, body: JSON.stringify({ job }) }).then(response => { if (!response.ok) console.error("Falha no job Videlis", { job, status: response.status }); }));
  },
} satisfies ExportedHandler<Env>;
