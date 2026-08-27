import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/app.ts";
import { restoreVercelApiPath } from "../server/vercelApiRoute.ts";

const app = createApp();

/** Única função Node estável da Vercel para todas as rotas de API da Videlis. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  req.url = restoreVercelApiPath(req.url || "/api");
  return app(req as any, res as any);
}
