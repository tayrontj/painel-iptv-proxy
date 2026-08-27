import { createApp } from "./app";

/** Aplicação Express empacotada no build e carregada pela única Function `/api`. */
const app = createApp();

export default app;
