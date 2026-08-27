import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ tryAcquireSchedulerLock: vi.fn(), releaseSchedulerLock: vi.fn(), runPersistedChannelMonitor: vi.fn(), syncEligibleEpgSources: vi.fn() }));
vi.mock("./db", () => ({ tryAcquireSchedulerLock: mocks.tryAcquireSchedulerLock, releaseSchedulerLock: mocks.releaseSchedulerLock }));
vi.mock("./channelMonitor", () => ({ runPersistedChannelMonitor: mocks.runPersistedChannelMonitor }));
vi.mock("./epgSync", () => ({ syncEligibleEpgSources: mocks.syncEligibleEpgSources }));
import { handleScheduledJob } from "./scheduledJobs";

function response() { return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any; }
function request(job: string, secret = "segredo") { return { body: { job }, header: (name: string) => name === "x-videlis-scheduler-secret" ? secret : new Date().toISOString() } as any; }
describe("endpoint consolidado do agendador", () => {
  beforeEach(() => { vi.clearAllMocks(); process.env.NEXUS_SCHEDULER_SECRET = "segredo"; mocks.runPersistedChannelMonitor.mockResolvedValue({ skipped: false, checked: 1 }); mocks.tryAcquireSchedulerLock.mockResolvedValue(true); mocks.syncEligibleEpgSources.mockResolvedValue([{ id: 1, result: "skipped" }]); mocks.releaseSchedulerLock.mockResolvedValue(undefined); }); afterEach(() => { delete process.env.NEXUS_SCHEDULER_SECRET; });
  it("rejeita segredo ausente ou inválido antes de executar jobs", async () => { const res = response(); await handleScheduledJob(request("monitor", "inválido"), res); expect(res.status).toHaveBeenCalledWith(401); expect(mocks.runPersistedChannelMonitor).not.toHaveBeenCalled(); });
  it("executa monitor e EPG sob o mesmo endpoint com locks separados", async () => { const monitorRes = response(); await handleScheduledJob(request("monitor"), monitorRes); expect(monitorRes.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, job: "monitor", checked: 1 })); const epgRes = response(); await handleScheduledJob(request("epg"), epgRes); expect(mocks.tryAcquireSchedulerLock).toHaveBeenCalledWith("epg-sync", 840000); expect(mocks.releaseSchedulerLock).toHaveBeenCalledWith("epg-sync"); expect(epgRes.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, job: "epg", skipped: false })); });
});
