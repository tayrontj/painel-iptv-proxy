import { describe, expect, it } from "vitest";
import { isMediaSourceUrl } from "./mediaSource";

describe("isMediaSourceUrl", () => {
  it.each(["https://media.example/filme.mp4", "https://media.example/serie/episodio.mkv", "https://media.example/novela/capitulo.avi", "https://media.example/live/manifest.m3u8"])('aceita URL de mídia com extensão livre: %s', value => expect(isMediaSourceUrl(value)).toBe(true));
  it.each(["file:///media/arquivo.mp4", "ftp://media.example/arquivo.mkv", "origem sem protocolo"])('rejeita esquema não permitido: %s', value => expect(isMediaSourceUrl(value)).toBe(false));
});
