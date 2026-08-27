import express from "express";
import { createApp } from "./server/app";

// A importação runtime mantém o preset Express da Vercel ativo.
const app: express.Express = createApp();

/** Servidor Express único detectado automaticamente pela Vercel. */
export default app;
