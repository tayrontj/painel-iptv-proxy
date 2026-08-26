/**
 * Criptografa credenciais fornecidas pelo administrador antes da persistência.
 * O navegador recebe apenas o indicador mascarado; o segredo nunca retorna via API.
 */
import { createCipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Chave de proteção do servidor não configurada");
  return createHash("sha256").update(secret).digest();
}

export function encryptIntegrationSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    hint: `••••${value.slice(-4)}`,
  };
}
