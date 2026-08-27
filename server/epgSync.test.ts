import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectXmltvCoverage } from "./epgSync";

describe("inspectXmltvCoverage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calcula o fim da cobertura a partir do último programa futuro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(`<?xml version="1.0"?><tv><programme start="20260827010000 +0000" stop="20260827020000 +0000"><title>A</title></programme><programme start="20260827100000 +0000" stop="20260827120000 +0000"><title>B</title></programme></tv>`, { status: 200 })));
    await expect(inspectXmltvCoverage("https://epg.example/guide.xml", new Date("2026-08-27T00:00:00.000Z"))).resolves.toEqual({ programmeCount: 2, coverageEndsAt: new Date("2026-08-27T12:00:00.000Z") });
  });

  it("mantém a classificação XMLTV disponível para a sincronização sem afetar o resumo de cobertura", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(`<?xml version="1.0"?><tv><programme channel="canal.1" start="20260827010000 +0000" stop="20260827020000 +0000"><title>Programa adulto</title><rating system="BR"><value>18</value></rating></programme></tv>`, { status: 200 })));
    await expect(inspectXmltvCoverage("https://epg.example/guide.xml", new Date("2026-08-27T00:00:00.000Z"))).resolves.toEqual({ programmeCount: 1, coverageEndsAt: new Date("2026-08-27T02:00:00.000Z") });
  });
});
