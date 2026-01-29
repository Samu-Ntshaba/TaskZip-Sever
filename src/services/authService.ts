import { prisma } from "../db";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateTokenPair, hashToken } from "../utils/tokens";
import { emailService } from "./emailService";
import { HttpError } from "../utils/errors";

export const registerUser = async (payload: {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  role?: "USER" | "RUNNER";
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new HttpError("Email already in use", 409);
  }

  const passwordHash = await hashPassword(payload.password);

  // Only allow USER or RUNNER via public registration
  const role = payload.role === "RUNNER" ? "RUNNER" : "USER";

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role, // ✅ now persists correct role
        profile: {
          create: {
            fullName: payload.fullName,
            phone: payload.phone ?? null,
          },
        },
      },
      include: { profile: true },
    });

    return user;
  });
};


export const loginUser = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { profile: true },
  });

  if (!user) {
    throw new HttpError("Invalid credentials", 401);
  }

  const isValid = await verifyPassword(payload.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError("Invalid credentials", 401);
  }

  return user;
};

export const createPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return;
  }

  const { token, tokenHash } = generateTokenPair();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
    },
  });

  await emailService.sendPasswordReset(email, token);
};

export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
) => {
  const searchHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: searchHash,
      resetTokenExpiresAt: { gt: new Date() },
    },
    include: { profile: true },
  });

  if (!user) {
    throw new HttpError("Invalid or expired reset token", 400);
  }

  const passwordHash = await hashPassword(newPassword);

  return prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    include: { profile: true },
  });
};
