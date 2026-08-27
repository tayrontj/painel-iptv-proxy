import * as db from "./db";
import { shouldRefreshEpg } from "./epgCoverage";

function parseXmltvDate(value: string) {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute, second, sign, offsetHours, offsetMinutes] = match;
  let timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  if (sign && offsetHours && offsetMinutes) {
    const offset = (Number(offsetHours) * 60 + Number(offsetMinutes)) * 60_000;
    timestamp += sign === "+" ? -offset : offset;
  }
  return new Date(timestamp);
}

export async function inspectXmltvCoverage(feedUrl: string, now = new Date()) {
  const url = new URL(feedUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("A fonte XMLTV deve usar HTTP ou HTTPS");
  const response = await fetch(url, { headers: { Accept: "application/xml,text/xml,text/plain" }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`A fonte XMLTV respondeu HTTP ${response.status}`);
  const document = await response.text();
  const programmes = Array.from(document.matchAll(/<programme\b([^>]*)>/gi));
  const coverageEndsAt = programmes.reduce<Date | null>((latest, programme) => {
    const stop = /\bstop\s*=\s*["']([^"']+)["']/i.exec(programme[1] ?? "")?.[1];
    const end = stop ? parseXmltvDate(stop) : null;
    return end && end > now && (!latest || end > latest) ? end : latest;
  }, null);
  if (!coverageEndsAt) throw new Error("A fonte XMLTV não informou programação futura válida");
  return { programmeCount: programmes.length, coverageEndsAt };
}

export async function syncEpgSource(id: number, options: { force?: boolean; now?: Date } = {}) {
  const source = await db.getEpgSourceById(id);
  if (!source) throw new Error("Fonte EPG não encontrada");
  if (!source.feedUrl) throw new Error("A fonte EPG não possui URL XMLTV configurada");
  const now = options.now ?? new Date();
  const refresh = options.force || shouldRefreshEpg({ coverageEndsAt: source.coverageEndsAt, refreshThresholdHours: source.refreshThresholdHours, lastSyncFailed: source.status === "attention", now });
  if (!refresh) return { id: source.id, result: "skipped" as const, coverageEndsAt: source.coverageEndsAt };
  try {
    const summary = await inspectXmltvCoverage(source.feedUrl, now);
    await db.saveEpgSyncSuccess({ id: source.id, ...summary });
    return { id: source.id, result: "synced" as const, ...summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na leitura XMLTV";
    await db.saveEpgSyncFailure(source.id, message);
    throw new Error(message);
  }
}

export async function syncEligibleEpgSources() {
  const sources = await db.listEpgSources();
  const results = [];
  for (const source of sources) {
    if (!source.feedUrl) continue;
    try { results.push(await syncEpgSource(source.id)); }
    catch (error) { results.push({ id: source.id, result: "failed" as const, error: error instanceof Error ? error.message : "Falha desconhecida" }); }
  }
  return results;
}
