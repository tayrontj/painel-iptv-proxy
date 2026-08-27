import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/app";

const app = createApp();

/** Única função Node da Vercel para todas as rotas de API da Videlis. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
