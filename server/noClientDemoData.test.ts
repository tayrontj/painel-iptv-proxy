import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const clientRoot = join(process.cwd(), "client", "src");
function sourceFiles(directory: string): string[] { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [join(directory, entry.name)] : []); }

describe("dados de produção do cliente", () => {
  it("não reintroduz coleções demonstrativas no frontend", () => {
    const productionSource = sourceFiles(clientRoot).map(file => readFileSync(file, "utf8")).join("\n");
    for (const forbidden of ["streamSeries", "subscriptionExamples", "proxyEvents", "Conta #A0198", "1.284", "4,7 TB", "Demonstração", "dados demonstrativos", "Catálogo demonstrativo"]) expect(productionSource).not.toContain(forbidden);
  });
});
