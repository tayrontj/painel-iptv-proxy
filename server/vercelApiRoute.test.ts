import { describe, expect, it } from "vitest";
import { restoreVercelApiPath } from "./vercelApiRoute";

describe("restoreVercelApiPath", () => {
  it("reconstrói a rota tRPC e preserva sua query após o rewrite da Vercel", () => {
    expect(restoreVercelApiPath("/api?__videlis_api_path=trpc%2Fauth.login&batch=1&input=%7B%7D")).toBe("/api/trpc/auth.login?batch=1&input=%7B%7D");
  });

  it("não aceita segmentos de navegação no caminho encaminhado", () => {
    expect(restoreVercelApiPath("/api?__videlis_api_path=..%2Fprivate")).toBe("/api?__videlis_api_path=..%2Fprivate");
  });
});
