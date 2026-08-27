import express from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ playbackChannel: vi.fn(), playbackVod: vi.fn() }));
vi.mock("./m3uExport", () => mocks);
import { registerAppPlaybackRoutes } from "./appPlaybackRoutes";

let server: ReturnType<typeof createServer> | undefined;
afterEach(async () => { vi.clearAllMocks(); if (server) await new Promise<void>(resolve => server?.close(() => resolve())); server = undefined; });
async function request(path: string) { const app = express(); registerAppPlaybackRoutes(app); server = createServer(app); await new Promise<void>(resolve => server?.listen(0, "127.0.0.1", resolve)); const address = server.address(); if (!address || typeof address === "string") throw new Error("Porta de teste indisponível"); return { url: `http://127.0.0.1:${address.port}${path}`, headers: { "x-videlis-username": "123456", "x-videlis-password": "987654" } }; }

describe("rotas de reprodução do aplicativo", () => {
  it("encaminha live, filme e episódio sem credenciais na URL", async () => {
    mocks.playbackChannel.mockImplementation((_req, res) => res.sendStatus(200)); mocks.playbackVod.mockImplementation((_req, res) => res.sendStatus(200));
    const live = await request("/api/app/playback/live/9"); await expect(fetch(live.url, { headers: live.headers })).resolves.toMatchObject({ status: 200 });
    const movie = await request("/api/app/playback/movie/41"); await expect(fetch(movie.url, { headers: movie.headers })).resolves.toMatchObject({ status: 200 });
    const episode = await request("/api/app/playback/episode/92"); await expect(fetch(episode.url, { headers: episode.headers })).resolves.toMatchObject({ status: 200 });
    expect(mocks.playbackChannel.mock.calls[0][0].query).toMatchObject({ username: "123456", password: "987654" }); expect(mocks.playbackVod.mock.calls[0][0].params).toMatchObject({ kind: "movie", itemId: "41" }); expect(mocks.playbackVod.mock.calls[1][0].params).toMatchObject({ kind: "series", itemId: "92" });
  });
});
