import { describe, expect, it } from "vitest";
import { resolveNeonDatabaseUrl } from "./databaseUrl";

describe("resolveNeonDatabaseUrl", () => {
  it("prioriza a variável específica do Neon", () => expect(resolveNeonDatabaseUrl({ NEON_DATABASE_URL: "postgresql://neon", DATABASE_URL: "postgresql://fallback" })).toBe("postgresql://neon"));
  it("aceita a URL padrão PostgreSQL da integração Vercel", () => expect(resolveNeonDatabaseUrl({ POSTGRES_URL: "postgres://vercel" })).toBe("postgres://vercel"));
  it("não aceita a URL MySQL herdada como conexão Neon", () => expect(resolveNeonDatabaseUrl({ DATABASE_URL: "mysql://local" })).toBeUndefined());
});
