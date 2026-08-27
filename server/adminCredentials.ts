import { scryptSync, timingSafeEqual } from "node:crypto";

export function adminOpenId(username: string) { return `admin:${username.trim().toLowerCase()}`; }

export function verifyAdminPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [scheme, salt, encodedHash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !encodedHash) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString("base64url"));
  const expected = Buffer.from(encodedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
