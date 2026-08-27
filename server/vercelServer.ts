import { createServer } from "node:http";
import path from "node:path";
import express from "express";
import { createApp } from "./app";

/** Diretório estático produzido pelo build Vite e entregue pelo servidor Node em produção. */
export function getVidelisStaticDirectory(cwd = process.cwd()) {
  return path.resolve(cwd, "dist", "public");
}

/** O fallback SPA nunca pode interceptar endpoints da API. */
export function shouldServeVidelisSpa(pathname: string) {
  return !/^\/api(?:\/|$)/.test(pathname);
}

/**
 * Servidor Node único capturado nativamente pela Vercel a partir de `server.ts`.
 * As rotas API ficam no Express; caminhos da SPA recebem o build Vite em produção.
 */
export function createVercelServer() {
  const app = createApp();

  if (process.env.NODE_ENV === "production") {
    const staticDirectory = getVidelisStaticDirectory();
    app.use(express.static(staticDirectory));
    app.get(/.*/, (req, res, next) => {
      if (!shouldServeVidelisSpa(req.path)) return next();
      res.sendFile(path.join(staticDirectory, "index.html"));
    });
  }

  return createServer(app);
}
