import jwt from "jsonwebtoken";
import { env } from "../env";
import type { AccessTokenPayload, UserRole } from "../types/auth";

const isUserRole = (value: unknown): value is UserRole => {
  return value === "ADMIN" || value === "USER" || value === "RUNNER";
};

export const signAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid token payload");
  }

  const { userId, role } = payload as { userId?: unknown; role?: unknown };
  if (typeof userId !== "string" || !isUserRole(role)) {
    throw new Error("Invalid token payload");
  }

  return { userId, role };
};
