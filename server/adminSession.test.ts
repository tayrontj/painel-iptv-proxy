import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "@shared/const";

const mocks = vi.hoisted(() => ({ getUserByOpenId: vi.fn(), upsertUser: vi.fn() }));
vi.mock("./db", () => mocks);

process.env.JWT_SECRET = "test-local-session-secret";
import { authenticateAdminSession, createAdminSession } from "./adminSession";

const admin = { id: 1, openId: "admin:videlis", name: "Admin Videlis", email: null, loginMethod: "local", passwordHash: "hash", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("sessão administrativa local", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getUserByOpenId.mockResolvedValue(admin); mocks.upsertUser.mockResolvedValue(undefined); });

  it("aceita token assinado para administrador persistido", async () => {
    const token = await createAdminSession(admin);
    const user = await authenticateAdminSession({ headers: { cookie: `${COOKIE_NAME}=${token}` } } as any);
    expect(user?.openId).toBe("admin:videlis");
    expect(mocks.getUserByOpenId).toHaveBeenCalledWith("admin:videlis");
    expect(mocks.upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "admin:videlis", role: "admin" }));
  });

  it("rejeita token ausente ou adulterado antes de consultar permissões", async () => {
    await expect(authenticateAdminSession({ headers: {} } as any)).resolves.toBeNull();
    await expect(authenticateAdminSession({ headers: { cookie: `${COOKIE_NAME}=token-inválido` } } as any)).resolves.toBeNull();
    expect(mocks.getUserByOpenId).not.toHaveBeenCalled();
  });

  it("rejeita um usuário que perdeu a função administrativa", async () => {
    mocks.getUserByOpenId.mockResolvedValue({ ...admin, role: "user" });
    const token = await createAdminSession(admin);
    await expect(authenticateAdminSession({ headers: { cookie: `${COOKIE_NAME}=${token}` } } as any)).resolves.toBeNull();
  });
});
