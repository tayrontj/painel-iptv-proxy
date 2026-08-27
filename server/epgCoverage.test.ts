import { describe, expect, it } from "vitest";
import { shouldRefreshEpg } from "./epgCoverage";
describe("shouldRefreshEpg", () => {
  const now = new Date("2026-08-27T00:00:00.000Z");
  it("atualiza quando a cobertura restante está abaixo do limiar", () => expect(shouldRefreshEpg({ coverageEndsAt: new Date("2026-08-27T05:59:00.000Z"), refreshThresholdHours: 6, now })).toBe(true));
  it("aguarda quando a cobertura futura é suficiente", () => expect(shouldRefreshEpg({ coverageEndsAt: new Date("2026-08-27T18:00:00.000Z"), refreshThresholdHours: 6, now })).toBe(false));
  it("atualiza depois de uma falha", () => expect(shouldRefreshEpg({ coverageEndsAt: new Date("2026-08-28T00:00:00.000Z"), refreshThresholdHours: 6, lastSyncFailed: true, now })).toBe(true));
});

