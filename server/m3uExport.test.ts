import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCustomerByXtreamCredentials: vi.fn(),
  getChannelSources: vi.fn(),
  getVodEpisodeById: vi.fn(),
  getVodItemById: vi.fn(),
  listChannels: vi.fn(),
  listVodEpisodes: vi.fn(),
  listVodItems: vi.fn(),
  listVodSeasons: vi.fn(),
}));

vi.mock("./db", () => mocks);
import { exportM3u, playbackChannel, playbackVod, xtreamPlayerApi } from "./m3uExport";

function response() {
  const result: any = { status: vi.fn(), type: vi.fn(), send: vi.fn(), sendStatus: vi.fn(), setHeader: vi.fn(), json: vi.fn() };
  result.status.mockReturnValue(result); result.type.mockReturnValue(result);
  return result;
}

const customer = { id: 1, status: "active", expiresAt: new Date(Date.now() + 86_400_000), trialEndsAt: null, usedScreens: 0, screenLimit: 2 };

describe("exportação Xtream V2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCustomerByXtreamCredentials.mockResolvedValue(customer);
    mocks.listChannels.mockResolvedValue([{ id: 10, isActive: true, name: "Canal Teste", groupTitle: "Ao vivo", epgId: "canal.teste", logoUrl: null, channelNumber: 10, updatedAt: new Date() }]);
    mocks.listVodEpisodes.mockResolvedValue([]);
    mocks.listVodSeasons.mockResolvedValue([]);
    mocks.listVodItems.mockResolvedValue([]);
  });

  it("gera a lista com credenciais Xtream numéricas, sem token legado", async () => {
    const res = response();
    await exportM3u({ query: { username: "1234567890", password: "987654321012" }, params: {}, protocol: "https", get: () => "painel.exemplo.com" } as any, res);
    expect(mocks.getCustomerByXtreamCredentials).toHaveBeenCalledWith("1234567890", "987654321012");
    expect(res.send.mock.calls[0][0]).toContain("/api/playback/10?username=1234567890&password=987654321012");
    expect(res.send.mock.calls[0][0]).not.toContain("token=");
  });

  it("omite canais marcados como indisponíveis da lista M3U", async () => {
    mocks.listChannels.mockResolvedValue([{ id: 10, isActive: true, healthStatus: "healthy", name: "Canal saudável", groupTitle: "Ao vivo", epgId: null, logoUrl: null, channelNumber: 10, updatedAt: new Date() }, { id: 11, isActive: true, healthStatus: "unavailable", name: "Canal indisponível", groupTitle: "Ao vivo", epgId: null, logoUrl: null, channelNumber: 11, updatedAt: new Date() }]);
    const res = response();
    await exportM3u({ query: { username: "1234567890", password: "987654321012" }, params: {}, protocol: "https", get: () => "painel.exemplo.com" } as any, res);
    expect(res.send.mock.calls[0][0]).toContain("Canal saudável");
    expect(res.send.mock.calls[0][0]).not.toContain("Canal indisponível");
  });

  it("nega uma lista quando as credenciais não autenticam", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue(undefined);
    const res = response();
    await exportM3u({ query: { username: "1234567890", password: "000000000000" }, params: {}, protocol: "https", get: () => "painel.exemplo.com" } as any, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.listChannels).not.toHaveBeenCalled();
  });

  it("expõe o handshake padrão do player API após autenticação", async () => {
    const res = response();
    await xtreamPlayerApi({ query: { username: "1234567890", password: "987654321012" }, params: {}, protocol: "https", get: () => "painel.exemplo.com" } as any, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user_info: expect.objectContaining({ auth: 1, username: "1234567890" }) }));
  });

  it("expõe filmes pelo endpoint Xtream intermediado, sem a origem cadastrada", async () => {
    mocks.listVodItems.mockResolvedValue([{ id: 41, kind: "filme", title: "Filme de teste", posterUrl: null, synopsis: null, sourceUrl: "https://origem.exemplo/arquivo.mkv?token=segredo", updatedAt: new Date() }]);
    const res = response();
    await xtreamPlayerApi({ query: { username: "1234567890", password: "987654321012", action: "get_vod_streams" }, params: {}, protocol: "https", get: () => "painel.exemplo.com" } as any, res);
    expect(res.json).toHaveBeenCalledWith([expect.objectContaining({ stream_id: 41, container_extension: "mkv", stream_url: "https://painel.exemplo.com/movie/1234567890/987654321012/41.mkv" })]);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("origem.exemplo");
  });

  it("organiza episódios Xtream por temporada", async () => {
    mocks.listVodItems.mockResolvedValue([{ id: 70, kind: "serie", title: "Série", posterUrl: null, synopsis: null, updatedAt: new Date() }]);
    mocks.listVodSeasons.mockResolvedValue([{ id: 12, seasonNumber: 2 }]);
    mocks.listVodEpisodes.mockResolvedValue([{ id: 91, seasonId: 12, episodeNumber: 1, title: "Episódio", sourceUrl: "https://origem/ep.m3u8", publishedAt: new Date() }]);
    const res = response();
    await xtreamPlayerApi({ query: { username: "1234567890", password: "987654321012", action: "get_series_info", series_id: "70" }, params: {}, protocol: "https", get: () => "painel.exemplo.com" } as any, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ episodes: { "2": [expect.objectContaining({ id: 91, episode_num: 1 })] } }));
  });

  it("nega reprodução HTTP sem credenciais Xtream válidas antes de consultar a origem", async () => {
    mocks.getCustomerByXtreamCredentials.mockResolvedValue(undefined);
    const fetchMock = vi.spyOn(globalThis, "fetch"); const res = response();
    await playbackChannel({ query: { username: "1234567890", password: "000000000000" }, params: { channelId: "10.m3u8" } } as any, res);
    await playbackVod({ query: { username: "1234567890", password: "000000000000" }, params: { itemId: "41.mkv", kind: "movie" } } as any, res);
    expect(res.sendStatus).toHaveBeenCalledWith(401); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reproduz o manifest do canal para credenciais Xtream autorizadas", async () => {
    mocks.getChannelSources.mockResolvedValue([{ quality: "AUTO", primaryUrl: "https://origem.exemplo/canal.m3u8", primaryOrigin: null, primaryReferer: null, fallbackUrl: null }]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("#EXTM3U", { status: 200, headers: { "content-type": "application/vnd.apple.mpegurl" } }));
    const res = response();
    await playbackChannel({ query: { username: "1234567890", password: "987654321012" }, params: { channelId: "10.m3u8" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200); expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/vnd.apple.mpegurl"); expect(res.send).toHaveBeenCalled();
  });

  it("reproduz filme e episódio Xtream autorizados sem divulgar a origem", async () => {
    mocks.getVodItemById.mockResolvedValue({ id: 41, sourceUrl: "https://origem.exemplo/filme.mkv" });
    mocks.getVodEpisodeById.mockResolvedValue({ id: 92, sourceUrl: "https://origem.exemplo/episodio.m3u8" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("filme", { status: 200, headers: { "content-type": "video/mp4" } })).mockResolvedValueOnce(new Response("episódio", { status: 200, headers: { "content-type": "application/vnd.apple.mpegurl" } }));
    const movieRes = response(); const seriesRes = response();
    await playbackVod({ query: { username: "1234567890", password: "987654321012" }, params: { itemId: "41.mkv", kind: "movie" } } as any, movieRes);
    await playbackVod({ query: { username: "1234567890", password: "987654321012" }, params: { itemId: "92.m3u8", kind: "series" } } as any, seriesRes);
    expect(mocks.getVodItemById).toHaveBeenCalledWith(41); expect(mocks.getVodEpisodeById).toHaveBeenCalledWith(92);
    expect(movieRes.send).toHaveBeenCalled(); expect(seriesRes.send).toHaveBeenCalled();
  });
});
