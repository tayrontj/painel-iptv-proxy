import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (file: string) => resolve(process.cwd(), file);

describe("contrato de implantação Vite + Function", () => {
  it("gera e inclui o bundle Express na única função de API", () => {
    const packageJson = JSON.parse(readFileSync(projectFile("package.json"), "utf8")) as { scripts: { build: string } };
    const vercelConfig = JSON.parse(readFileSync(projectFile("vercel.json"), "utf8")) as {
      functions: Record<string, { includeFiles: string }>;
      rewrites: Array<{ source: string; destination: string }>;
    };
    const handler = readFileSync(projectFile("api/index.ts"), "utf8");

    expect(packageJson.scripts.build).toContain("server/vercelFunctionApp.ts");
    expect(packageJson.scripts.build).toContain("dist/videlis-api.cjs");
    expect(packageJson.scripts.build).toContain("--supported:dynamic-import=true");
    expect(vercelConfig.functions["api/index.ts"].includeFiles).toBe("dist/videlis-api.cjs");
    expect(vercelConfig.rewrites[0]).toEqual({
      source: "/api/:videlis_api_path*",
      destination: "/api?__videlis_api_path=:videlis_api_path*",
    });
    expect(handler).toContain('require("../dist/videlis-api.cjs")');
  });
});
