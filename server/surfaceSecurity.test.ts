import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function productionClientSources(directory: string): string[] { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => { const path = join(directory, entry.name); if (entry.isDirectory()) return productionClientSources(path); return /\.(ts|tsx|css|html)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [readFileSync(path, "utf8")] : []; }); }
const clientDirectory = fileURLToPath(new URL("../client", import.meta.url));

describe("superfície pública e administrativa", () => {
  it("não incorpora identificadores de segredos do servidor nas fontes do cliente", () => { const source = productionClientSources(clientDirectory).join("\n"); for (const sensitiveName of ["NEXUS_ADMIN_PASSWORD", "NEXUS_ADMIN_USERNAME", "NEON_DATABASE_URL", "POSTGRES_URL", "MERCADO_PAGO_WEBHOOK_SECRET", "PLAYBACK_TICKET_SECRET", "PLAYBACK_EDGE_RESOLVER_SECRET", "ANDROID_UPDATE_MANIFEST_PRIVATE_KEY", "secretCiphertext"]) expect(source).not.toContain(sensitiveName); });
  it("não mantém o registro OAuth herdado no servidor de produção", () => { const entry = readFileSync(fileURLToPath(new URL("./_core/index.ts", import.meta.url)), "utf8"); expect(entry).not.toContain("registerOAuthRoutes"); });
});
