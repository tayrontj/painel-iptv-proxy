/**
 * Garante que a camada de integrações produz material cifrado e nunca retorna
 * o token original como texto armazenável no banco.
 */
import { describe, expect, it } from "vitest";
import { encryptIntegrationSecret } from "./integrationSecrets";

describe("encryptIntegrationSecret", () => {
  it("cifra o token e expõe apenas os quatro últimos caracteres no indicador", () => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "chave-de-teste-apenas-para-validacao";
    const encrypted = encryptIntegrationSecret("token-super-secreto-1234");
    expect(encrypted.ciphertext).not.toContain("token-super-secreto-1234");
    expect(encrypted.hint).toBe("••••1234");
    process.env.JWT_SECRET = previous;
  });
});

