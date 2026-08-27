import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("seeder demonstrativo Videlis", () => {
  it("mantém os dados de demonstração no seeder e gera credenciais numéricas em tempo de execução", () => {
    const source = readFileSync(join(process.cwd(), "server", "seed.mjs"), "utf8");
    expect(source).toContain("ensureDemoCustomer"); expect(source).toContain("numericCredential(10)"); expect(source).toContain("numericCredential(12)"); expect(source).toContain("demo@videlis.local"); expect(source).not.toContain("xtreamPassword = \"123");
  });
});
