import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/app.ts";

const app = createApp();

/** Única função Node estável da Vercel para todas as rotas de API da Videlis. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "/api", "https://videlis.internal");
  const forwardedPath = url.searchParams.get("__videlis_api_path");

  if (forwardedPath) {
    const normalized = forwardedPath.replace(/^\/+/, "");
    if (normalized && !normalized.split("/").some(segment => segment === "." || segment === "..")) {
      url.searchParams.delete("__videlis_api_path");
      req.url = `/api/${normalized}${url.search}`;
    }
  }

  return app(req as any, res as any);
}
