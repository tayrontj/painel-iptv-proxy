import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { androidUpdateDecision, canonicalAndroidManifest, createAndroidUpdateManifest, signAndroidManifest } from "./androidUpdates";

const release = { versionCode: 42, versionName: "2.4.0", apkUrl: "https://downloads.videlis.app/videlis-2.4.0.apk", apkSizeBytes: 22_000_000, sha256: "a".repeat(64), minimumSupportedVersionCode: 35, mandatory: false, releaseNotes: "Correções de estabilidade.", publishedAt: new Date("2026-08-27T12:00:00.000Z"), signingKeyId: null };
describe("manifesto de atualização Android", () => {
  afterEach(() => { delete process.env.ANDROID_UPDATE_MANIFEST_PRIVATE_KEY; delete process.env.ANDROID_UPDATE_MANIFEST_KEY_ID; });
  it("assina um manifesto canônico e exige atualização quando a versão mínima não é atendida", () => { const keys = generateKeyPairSync("ed25519"); process.env.ANDROID_UPDATE_MANIFEST_PRIVATE_KEY = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString(); process.env.ANDROID_UPDATE_MANIFEST_KEY_ID = "android-prod-1"; const signed = signAndroidManifest(release); const manifest = createAndroidUpdateManifest({ ...release, ...signed }); expect(manifest).toBeDefined(); expect(verify(null, Buffer.from(canonicalAndroidManifest(release, signed.signingKeyId)), keys.publicKey, Buffer.from(signed.manifestSignature, "base64url"))).toBe(true); expect(androidUpdateDecision(manifest!, 34)).toMatchObject({ available: true, mandatory: true }); expect(androidUpdateDecision(manifest!, 42)).toEqual({ available: false, mandatory: false, release: null }); });
});
