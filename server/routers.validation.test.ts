/**
 * Testa as validações de contrato nas rotas administrativas antes de qualquer
 * operação persistente de clientes, canais e catálogo VOD.
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("contratos administrativos", () => {
  it("rejeita cliente sem rótulo válido antes de persistir", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.customers.create({ label: "", plan: "Mensal", screenLimit: 1, expiresAt: new Date() })).rejects.toBeDefined();
  });

  it("rejeita URL de VOD malformada antes de persistir", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.vod.create({ title: "Conteúdo", kind: "filme", sourceUrl: "origem sem protocolo" })).rejects.toBeDefined();
  });
});
