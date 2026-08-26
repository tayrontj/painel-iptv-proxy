/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/** Estado de assinatura que o aplicativo final deve interpretar para controlar acesso e alertas. */
export type AppSubscriptionState = "active" | "attention" | "expired";

/** Contrato enxuto para o aplicativo renderizar o ciclo de assinatura e o CTA correto. */
export type AppSubscriptionSnapshot = {
  state: AppSubscriptionState;
  expiresAt: number;
  showExpiryPopup: boolean;
  accessAllowed: boolean;
  message: string;
};

/** Dados de cobrança que podem ser exibidos no aplicativo após criação segura pelo servidor. */
export type AppPixCharge = {
  paymentId: string;
  status: "pending" | "approved" | "expired" | "cancelled";
  qrCode: string | null;
  qrCodeBase64: string | null;
  expiresAt: number;
};
