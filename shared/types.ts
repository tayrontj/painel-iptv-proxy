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

/** Perfil editável pelo próprio assinante, sem credenciais ou dados administrativos. */
export type AppCustomerProfile = {
  label: string;
  email: string | null;
  phone: string | null;
  plan: string;
  screenLimit: number;
  usedScreens: number;
};

/** Dispositivo associado à conta do aplicativo, identificado apenas por dados seguros de apresentação. */
export type AppCustomerDevice = {
  id: number;
  slot: number;
  deviceName: string;
  lastSeenAt: Date;
  createdAt: Date;
};
