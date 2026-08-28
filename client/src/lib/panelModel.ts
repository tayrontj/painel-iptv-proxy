/**
 * Modelo de apresentação do painel: centraliza regras pequenas para estados de
 * assinatura e os rótulos de VOD usados na interface administrativa.
 */
export type VodKind = "filme" | "serie" | "novela";
export type CustomerSubscriptionStatus = "active" | "attention" | "expired";

export type SubscriptionSignal = {
  tone: "stable" | "attention" | "expired";
  label: string;
  description: string;
};

const DAY_MS = 86_400_000;

export function getVodKindLabel(kind: VodKind) {
  return { filme: "Filme", serie: "Série", novela: "Novela" }[kind];
}

export function getDaysUntilExpiry(expiresAt: Date | string | number, now = Date.now()) {
  const expiry = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiry)) return Number.NaN;
  return Math.ceil((expiry - now) / DAY_MS);
}

export function getSubscriptionStatus(
  persistedStatus: CustomerSubscriptionStatus,
  expiresAt: Date | string | number,
  now = Date.now(),
): CustomerSubscriptionStatus {
  const expiry = new Date(expiresAt).getTime();
  const daysUntilExpiry = getDaysUntilExpiry(expiresAt, now);

  // A future expiration is authoritative over a stale persisted "expired" flag.
  if (Number.isFinite(expiry) && expiry <= now) return "expired";
  if (persistedStatus === "attention") return "attention";
  if (Number.isFinite(daysUntilExpiry) && daysUntilExpiry <= 3) return "attention";
  return "active";
}

export function getSubscriptionSignal(daysUntilExpiry: number): SubscriptionSignal {
  if (daysUntilExpiry < 0) {
    return {
      tone: "expired",
      label: "Vencida",
      description: "O acesso está suspenso até a confirmação de um novo PIX.",
    };
  }

  if (daysUntilExpiry <= 3) {
    return {
      tone: "attention",
      label: "Próxima do vencimento",
      description: `Vence em ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "dia" : "dias"}.`,
    };
  }

  return {
    tone: "stable",
    label: "Ativa",
    description: `Renovação prevista para daqui a ${daysUntilExpiry} dias.`,
  };
}

export function getCustomerSubscriptionSignal(
  persistedStatus: CustomerSubscriptionStatus,
  expiresAt: Date | string | number,
  now = Date.now(),
) {
  const daysUntilExpiry = getDaysUntilExpiry(expiresAt, now);
  const status = getSubscriptionStatus(persistedStatus, expiresAt, now);
  if (status === "expired") return getSubscriptionSignal(-1);
  if (status === "attention") return { tone: "attention" as const, label: "Próxima do vencimento", description: Number.isFinite(daysUntilExpiry) ? `Vence em ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "dia" : "dias"}.` : "A assinatura requer atenção." };
  return getSubscriptionSignal(Math.max(Number.isFinite(daysUntilExpiry) ? daysUntilExpiry : 4, 4));
}
