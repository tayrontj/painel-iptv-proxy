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
  it("rejeita cliente sem nome válido antes de persistir", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.customers.create({ label: "", email: "cliente@exemplo.com", phone: "11999999999", planId: 1, planCycleId: 1 })).rejects.toBeDefined();
  });

  it("rejeita e-mail inválido no cadastro do cliente antes de persistir", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.customers.create({ label: "Cliente Válido", email: "email-invalido", phone: "11999999999", planId: 1, planCycleId: 1 })).rejects.toBeDefined();
  });

  it("rejeita URL de VOD malformada antes de persistir", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.vod.create({ title: "Conteúdo", kind: "filme", sourceUrl: "origem sem protocolo" })).rejects.toBeDefined();
  });
});
