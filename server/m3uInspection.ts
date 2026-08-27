export async function inspectM3uManifest(sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("A origem deve usar HTTP ou HTTPS");
  const response = await fetch(url, { headers: { Accept: "application/vnd.apple.mpegurl,text/plain" }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("Não foi possível ler o manifesto M3U8");
  const content = await response.text();
  const variants = Array.from(content.matchAll(/#EXT-X-STREAM-INF:([^\n]+)\n([^\n]+)/g)).map(match => ({ attributes: match[1], uri: match[2].trim() }));
  return { isMaster: variants.length > 0, variantCount: variants.length, variants: variants.map(variant => ({ resolution: /RESOLUTION=([^,]+)/.exec(variant.attributes)?.[1] ?? null, bandwidth: /BANDWIDTH=(\d+)/.exec(variant.attributes)?.[1] ?? null })) };
}
