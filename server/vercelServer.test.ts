import { describe, expect, it } from "vitest";
import { getVidelisStaticDirectory, shouldServeVidelisSpa } from "./vercelServer";

describe("servidor Node da Vercel", () => {
  it("mantém o build Vite fora do diretório de código-fonte", () => {
    expect(getVidelisStaticDirectory("/var/task")).toBe("/var/task/dist/public");
  });

  it("não deixa o fallback da SPA interceptar nenhuma rota de API", () => {
    expect(shouldServeVidelisSpa("/clientes")).toBe(true);
    expect(shouldServeVidelisSpa("/api/trpc/auth.login")).toBe(false);
    expect(shouldServeVidelisSpa("/api")).toBe(false);
  });
});
