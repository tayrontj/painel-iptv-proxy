/**
 * Testes unitários das regras puras que comunicam status de assinaturas e VOD.
 */
import { describe, expect, it } from "vitest";
import { getCustomerSubscriptionSignal, getSubscriptionSignal, getSubscriptionStatus, getVodKindLabel } from "./panelModel";

const NOW = Date.UTC(2026, 7, 27, 12, 0, 0);

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

describe("getSubscriptionStatus", () => {
  it("prioriza um vencimento futuro quando o status persistido está obsoleto", () => {
    const expiresAt = NOW + 14 * 86_400_000;
    expect(getSubscriptionStatus("expired", expiresAt, NOW)).toBe("active");
    expect(getCustomerSubscriptionSignal("expired", expiresAt, NOW)).toMatchObject({
      tone: "stable",
      label: "Ativa",
    });
  });

  it("marca como vencida somente depois da data de expiração", () => {
    const expiresAt = NOW - 1_000;
    expect(getSubscriptionStatus("active", expiresAt, NOW)).toBe("expired");
  });

  it("mantém a indicação de atenção para status manual de atenção", () => {
    const expiresAt = NOW + 14 * 86_400_000;
    expect(getSubscriptionStatus("attention", expiresAt, NOW)).toBe("attention");
  });
});

describe("getVodKindLabel", () => {
  it("traduz os tipos internos de catálogo", () => {
    expect(getVodKindLabel("serie")).toBe("Série");
  });
});
