/**
 * Modelo de apresentação do painel: centraliza regras pequenas para estados de
 * assinatura e os rótulos de VOD usados na interface administrativa.
 */
export type VodKind = "filme" | "serie" | "novela";

export type SubscriptionSignal = {
  tone: "stable" | "attention" | "expired";
  label: string;
  description: string;
};

export function getVodKindLabel(kind: VodKind) {
  return { filme: "Filme", serie: "Série", novela: "Novela" }[kind];
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
