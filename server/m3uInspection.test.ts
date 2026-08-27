import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectM3uManifest } from "./m3uInspection";

describe("inspeção de manifestos M3U8", () => {
  afterEach(() => vi.restoreAllMocks());
  it("detecta playlist mestre pelas diretivas EXT-X-STREAM-INF", async () => { vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1800000,RESOLUTION=1920x1080\nhttps://media.exemplo/fhd.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=1280x720\nhttps://media.exemplo/hd.m3u8", { status: 200 })); const result = await inspectM3uManifest("https://origem.exemplo/master.m3u8"); expect(result).toMatchObject({ isMaster: true, variantCount: 2, variants: [{ resolution: "1920x1080", bandwidth: "1800000" }, { resolution: "1280x720", bandwidth: "800000" }] }); });
  it("aceita manifestos simples sem declarar variantes", async () => { vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("#EXTM3U\n#EXTINF:4,\nsegment.ts", { status: 200 })); await expect(inspectM3uManifest("https://origem.exemplo/stream.m3u8")).resolves.toMatchObject({ isMaster: false, variantCount: 0 }); });
});
