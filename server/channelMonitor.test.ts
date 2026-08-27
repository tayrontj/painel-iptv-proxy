import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ tryAcquireSchedulerLock: vi.fn(), releaseSchedulerLock: vi.fn(), listChannelSourcesForMonitor: vi.fn(), saveChannelSourceHealth: vi.fn(), saveChannelHealth: vi.fn() }));
vi.mock("./db", () => mocks);
import { runPersistedChannelMonitor, SOURCE_CHECK_TIMEOUT_MS } from "./channelMonitor";

describe("monitor persistente de canais", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.releaseSchedulerLock.mockResolvedValue(undefined); mocks.saveChannelSourceHealth.mockResolvedValue(undefined); mocks.saveChannelHealth.mockResolvedValue(undefined); });
  afterEach(() => vi.unstubAllGlobals());

  it("ignora uma nova rodada quando o lock durável ainda está ativo", async () => {
    mocks.tryAcquireSchedulerLock.mockResolvedValue(false);
    await expect(runPersistedChannelMonitor()).resolves.toMatchObject({ skipped: true, checked: 0 });
    expect(mocks.listChannelSourcesForMonitor).not.toHaveBeenCalled(); expect(mocks.releaseSchedulerLock).not.toHaveBeenCalled();
  });

  it("define dez segundos como limite de cada consulta de fonte", () => {
    expect(SOURCE_CHECK_TIMEOUT_MS).toBe(10_000);
  });

  it("testa fontes em ordem, usa fallback saudável e persiste a saúde por rota e canal", async () => {
    mocks.tryAcquireSchedulerLock.mockResolvedValue(true);
    mocks.listChannelSourcesForMonitor.mockResolvedValue([{ id: 1, channelId: 10, primaryUrl: "https://origem/10", primaryOrigin: "https://origem", primaryReferer: null, fallbackUrl: null, fallbackOrigin: null, fallbackReferer: null }, { id: 2, channelId: 20, primaryUrl: "https://origem/20", primaryOrigin: null, primaryReferer: null, fallbackUrl: "https://fallback/20", fallbackOrigin: null, fallbackReferer: "https://fallback", }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("ok", { status: 200 })).mockResolvedValueOnce(new Response("falha", { status: 503 })).mockResolvedValueOnce(new Response("ok", { status: 200 })));
    await expect(runPersistedChannelMonitor()).resolves.toEqual({ skipped: false, checked: 2, healthy: 1, fallback: 1, unavailable: 0 });
    expect(mocks.saveChannelSourceHealth).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 1, selectedRoute: "primary" })); expect(mocks.saveChannelSourceHealth).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 2, selectedRoute: "fallback" }));
    expect(mocks.saveChannelHealth).toHaveBeenCalledWith({ channelId: 10, healthStatus: "healthy", healthMessage: null }); expect(mocks.saveChannelHealth).toHaveBeenCalledWith({ channelId: 20, healthStatus: "fallback", healthMessage: null }); expect(mocks.releaseSchedulerLock).toHaveBeenCalledWith("channel-monitor");
  });
});
