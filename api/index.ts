import { createRequire } from "node:module";
import type { IncomingMessage, ServerResponse } from "node:http";

type ExpressHandler = (request: IncomingMessage, response: ServerResponse) => void;

const require = createRequire(import.meta.url);
const bundledApplication = require("../dist/videlis-api.cjs") as { default?: ExpressHandler } | ExpressHandler;
const application: ExpressHandler =
  typeof bundledApplication === "function" ? bundledApplication : bundledApplication.default!;

function restoreOriginalApiPath(rawUrl: string) {
  const url = new URL(rawUrl, "https://videlis.internal");
  const forwardedPath = url.searchParams.get("__videlis_api_path");
  if (!forwardedPath) return rawUrl;

  const normalized = forwardedPath.replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some(segment => segment === "." || segment === "..")) {
    return rawUrl;
  }

  url.searchParams.delete("__videlis_api_path");
  return `/api/${normalized}${url.search}`;
}

/** Única Vercel Function: restaura a rota e delega ao Express empacotado. */
export default function handler(request: IncomingMessage, response: ServerResponse) {
  request.url = restoreOriginalApiPath(request.url ?? "/api");
  return application(request, response);
}
