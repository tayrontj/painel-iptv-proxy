import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function userContext(role: "user" | "admin"): TrpcContext {
  const now = new Date();
  return { user: { id: 9, openId: "non-admin", name: "Conta comum", email: "conta@example.com", loginMethod: "manus", role, createdAt: now, updatedAt: now, lastSignedIn: now }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("autorização administrativa", () => {
  it("nega leitura de planos para conta autenticada sem papel admin", async () => {
    await expect(appRouter.createCaller(userContext("user")).plans.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("nega a listagem de clientes para conta autenticada sem papel admin", async () => {
    await expect(appRouter.createCaller(userContext("user")).customers.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("nega a listagem de canais para conta autenticada sem papel admin", async () => {
    await expect(appRouter.createCaller(userContext("user")).channels.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("nega EPG e VOD para conta autenticada sem papel admin", async () => {
    const caller = appRouter.createCaller(userContext("user"));
    await expect(caller.epg.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.vod.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("nega PIX e integrações para conta autenticada sem papel admin", async () => {
    const caller = appRouter.createCaller(userContext("user"));
    await expect(caller.billing.listForCustomer({ customerId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.integrations.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
