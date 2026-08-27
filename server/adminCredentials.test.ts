import { randomBytes, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { adminOpenId, verifyAdminPassword } from "./adminCredentials";

function makeHash(password: string) {
  const salt = randomBytes(16).toString("base64url");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("base64url")}`;
}

describe("credenciais administrativas locais", () => {
  it("normaliza o identificador do administrador", () => expect(adminOpenId("  Painel.Admin ")).toBe("admin:painel.admin"));
  it("aceita somente a senha associada ao hash", () => {
    const hash = makeHash("senha-administrativa-segura");
    expect(verifyAdminPassword("senha-administrativa-segura", hash)).toBe(true);
    expect(verifyAdminPassword("outra-senha", hash)).toBe(false);
  });
  it("rejeita hashes ausentes ou inválidos", () => {
    expect(verifyAdminPassword("qualquer", null)).toBe(false);
    expect(verifyAdminPassword("qualquer", "sha256$invalido")).toBe(false);
  });
});
