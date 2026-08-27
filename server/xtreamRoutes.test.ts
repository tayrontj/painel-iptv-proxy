import express from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ exportM3u: vi.fn(), playbackChannel: vi.fn(), playbackVod: vi.fn(), xtreamPlayerApi: vi.fn() }));
vi.mock("./m3uExport", () => mocks);
import { registerXtreamRoutes } from "./xtreamRoutes";

const servers: ReturnType<typeof createServer>[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve())))); vi.clearAllMocks(); });

async function request(path: string) {
  const app = express(); registerXtreamRoutes(app); const server = createServer(app); servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve)); const address = server.address(); if (!address || typeof address === "string") throw new Error("Porta de teste indisponível");
  return fetch(`http://127.0.0.1:${address.port}${path}`);
}

describe("rotas HTTP Xtream montadas", () => {
  it("encaminha live, movie e series para os handlers corretos com credenciais na URL", async () => {
    mocks.playbackChannel.mockImplementation((_req, res) => res.sendStatus(200)); mocks.playbackVod.mockImplementation((_req, res) => res.sendStatus(200));
    await expect(request("/live/123456/987654/10.m3u8")).resolves.toMatchObject({ status: 200 });
    await expect(request("/movie/123456/987654/41.mkv")).resolves.toMatchObject({ status: 200 });
    await expect(request("/series/123456/987654/92.m3u8")).resolves.toMatchObject({ status: 200 });
    expect(mocks.playbackChannel).toHaveBeenCalledWith(expect.objectContaining({ params: expect.objectContaining({ username: "123456", password: "987654", channelId: "10.m3u8" }) }), expect.anything(), expect.anything());
    expect(mocks.playbackVod).toHaveBeenCalledTimes(2);
    expect(mocks.playbackVod.mock.calls[0][0].params).toMatchObject({ kind: "movie", itemId: "41.mkv" }); expect(mocks.playbackVod.mock.calls[1][0].params).toMatchObject({ kind: "series", itemId: "92.m3u8" });
  });

  it("preserva a resposta de negação do handler nas rotas live e VOD", async () => {
    mocks.playbackChannel.mockImplementation((_req, res) => res.sendStatus(401)); mocks.playbackVod.mockImplementation((_req, res) => res.sendStatus(401));
    await expect(request("/live/123456/000000/10.m3u8")).resolves.toMatchObject({ status: 401 });
    await expect(request("/movie/123456/000000/41.mkv")).resolves.toMatchObject({ status: 401 });
    await expect(request("/series/123456/000000/92.m3u8")).resolves.toMatchObject({ status: 401 });
  });
});
