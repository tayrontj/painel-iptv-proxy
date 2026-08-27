export type LinkCheck = { ok: boolean; status: number | null; latencyMs: number; error?: string };
export type SourceMonitorResult = { primary: LinkCheck; fallback?: LinkCheck; selected: "primary" | "fallback" | null };

let running = false;

async function check(url: string, headers: Record<string, string> = {}): Promise<LinkCheck> {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(10_000) });
    return { ok: response.ok, status: response.status, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { ok: false, status: null, latencyMs: Date.now() - startedAt, error: error instanceof Error ? error.message : "Falha ao consultar fonte" };
  }
}

export async function monitorSource(input: { primaryUrl: string; fallbackUrl?: string | null; primaryHeaders?: Record<string, string>; fallbackHeaders?: Record<string, string> }): Promise<SourceMonitorResult> {
  const primary = await check(input.primaryUrl, input.primaryHeaders);
  if (primary.ok) return { primary, selected: "primary" };
  if (!input.fallbackUrl) return { primary, selected: null };
  const fallback = await check(input.fallbackUrl, input.fallbackHeaders);
  return { primary, fallback, selected: fallback.ok ? "fallback" : null };
}

export async function runChannelMonitor<T>(task: () => Promise<T>): Promise<{ skipped: boolean; result?: T }> {
  if (running) return { skipped: true };
  running = true;
  try { return { skipped: false, result: await task() }; } finally { running = false; }
}
