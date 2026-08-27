/**
 * Reconstrói o caminho original após o rewrite Vercel /api/:path* -> /api.
 * O parâmetro interno é removido antes de o Express receber a requisição.
 */
export function restoreVercelApiPath(rawUrl: string) {
  const url = new URL(rawUrl, "https://videlis.internal");
  const forwardedPath = url.searchParams.get("__videlis_api_path");
  if (!forwardedPath) return rawUrl;

  const normalized = forwardedPath.replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some(segment => segment === "." || segment === "..")) return rawUrl;

  url.searchParams.delete("__videlis_api_path");
  return `/api/${normalized}${url.search}`;
}
