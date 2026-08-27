import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../drizzle/schema";
import * as db from "./db";

const ISSUER = "videlis-admin";
const SESSION_TYPE = "admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;
const loadJose = () => import("jose");

function sessionSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET é obrigatório para sessões administrativas.");
  return new TextEncoder().encode(secret);
}

function readSessionToken(req: Request) {
  const cookie = parseCookieHeader(req.headers.cookie || "")[COOKIE_NAME];
  if (cookie) return cookie;
  const authorization = req.headers.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ") ? authorization.slice(7) : undefined;
}

export async function createAdminSession(user: Pick<User, "openId" | "name">) {
  const { SignJWT } = await loadJose();
  return new SignJWT({ type: SESSION_TYPE, openId: user.openId, name: user.name || "Administrador Videlis" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS)
    .sign(sessionSecret());
}

export async function authenticateAdminSession(req: Request): Promise<User | null> {
  const token = readSessionToken(req);
  if (!token) return null;
  try {
    const { jwtVerify } = await loadJose();
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"], issuer: ISSUER });
    if (payload.type !== SESSION_TYPE || typeof payload.openId !== "string") return null;
    const user = await db.getUserByOpenId(payload.openId);
    if (!user || user.role !== "admin") return null;
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date(), role: "admin" });
    return user;
  } catch { return null; }
}
