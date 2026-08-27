import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPrivateIntegrationSetting: vi.fn() }));
vi.mock("./db", () => mocks);

import { encryptIntegrationSecret } from "./integrationSecrets";
import { getVodMetadataByTmdbId } from "./externalIntegrations";

describe("metadados TMDB por ID", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = "segredo-de-teste-para-tmdb";
    const encrypted = encryptIntegrationSecret("token-privado-tmdb");
    mocks.getPrivateIntegrationSetting.mockResolvedValue({ enabled: true, baseUrl: "https://api.themoviedb.org/3", secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv, secretTag: encrypted.tag });
  });

  it("consulta o recurso movie pelo ID e retorna apenas metadados seguros", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: 550, title: "Clube da Luta", overview: "Sinopse", release_date: "1999-10-15", poster_path: "/capa.jpg" }), { status: 200 }));
    await expect(getVodMetadataByTmdbId({ tmdbId: 550, kind: "filme" })).resolves.toEqual({ providerId: "metadata-550", tmdbId: 550, title: "Clube da Luta", overview: "Sinopse", releaseYear: 1999, posterUrl: "https://image.tmdb.org/t/p/w500/capa.jpg" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/3/movie/550?language=pt-BR");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("Bearer token-privado-tmdb");
  });
});
