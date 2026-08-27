import { describe, expect, it } from "vitest";

describe("configuração pública de marca", () => {
  it("usa o título Videlis definido no ambiente gerenciado", () => {
    expect(process.env.VITE_APP_TITLE).toBe("Videlis — Painel IPTV");
  });
});
