/**
 * Testes unitários das regras puras que comunicam status de assinaturas e VOD.
 */
import { describe, expect, it } from "vitest";
import { getSubscriptionSignal, getVodKindLabel } from "./panelModel";

describe("getSubscriptionSignal", () => {
  it("marca assinaturas expiradas quando a data já passou", () => {
    expect(getSubscriptionSignal(-1)).toMatchObject({
      tone: "expired",
      label: "Vencida",
    });
  });

  it("solicita atenção nos três dias anteriores ao vencimento", () => {
    expect(getSubscriptionSignal(2)).toMatchObject({
      tone: "attention",
      label: "Próxima do vencimento",
    });
  });

  it("mantém uma assinatura distante do vencimento como ativa", () => {
    expect(getSubscriptionSignal(12)).toMatchObject({
      tone: "stable",
      label: "Ativa",
    });
  });
});

describe("getVodKindLabel", () => {
  it("traduz os tipos internos de catálogo", () => {
    expect(getVodKindLabel("serie")).toBe("Série");
  });
});
