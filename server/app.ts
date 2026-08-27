import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./_core/storageProxy";
import { createContext } from "./_core/context";
import { handleMercadoPagoWebhook } from "./mercadoPagoWebhook";
import { appRouter } from "./routers";
import { registerXtreamRoutes } from "./xtreamRoutes";
import { registerAppPlaybackRoutes } from "./appPlaybackRoutes";
import { handleScheduledJob } from "./scheduledJobs";
import { registerAndroidUpdateRoutes } from "./androidUpdateRoutes";

/** Aplicação HTTP única, reutilizada tanto pelo processo local quanto pelo handler catch-all da Vercel. */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  registerStorageProxy(app);
  app.post("/api/webhooks/mercado-pago", handleMercadoPagoWebhook);
  app.post("/api/scheduled/jobs", handleScheduledJob);
  registerXtreamRoutes(app);
  registerAppPlaybackRoutes(app);
  registerAndroidUpdateRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
