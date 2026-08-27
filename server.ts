import { createVercelServer } from "./server/vercelServer";

/**
 * Entry-point de produção: a Vercel detecta este servidor Node e o captura
 * como uma única função, sem depender de imports TypeScript em `/api`.
 */
const server = createVercelServer();
server.listen(Number(process.env.PORT ?? 3000));
