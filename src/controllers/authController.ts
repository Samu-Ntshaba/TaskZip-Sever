import { Request, Response } from "express";
import {
  createPasswordReset,
  loginUser,
  registerUser,
  resetPasswordWithToken,
} from "../services/authService";
import { asyncHandler } from "../middleware/asyncHandler";
import { signAccessToken } from "../utils/jwt";
import { prisma } from "../db";
import { serializeUser } from "../utils/serialize";
import { HttpError } from "../utils/errors";

type ValidatedBody<T> = { body: T };

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, phone } = (req.validated as ValidatedBody<{
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }>).body;

  const user = await registerUser({ email, password, fullName, phone });
  const accessToken = signAccessToken({ userId: user.id, role: user.role });

  res.status(201).json({
    user: serializeUser(user),
    accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = (req.validated as ValidatedBody<{
    email: string;
    password: string;
  }>).body;

  const user = await loginUser({ email, password });
  const accessToken = signAccessToken({ userId: user.id, role: user.role });

  res.json({
    user: serializeUser(user),
    accessToken,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = (req.validated as ValidatedBody<{ email: string }>).body;

  await createPasswordReset(email);

  res.json({
    message: "If the account exists, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = (req.validated as ValidatedBody<{
    token: string;
    newPassword: string;
  }>).body;

  const user = await resetPasswordWithToken(token, newPassword);
  const accessToken = signAccessToken({ userId: user.id, role: user.role });

  res.json({
    user: serializeUser(user),
    accessToken,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { profile: true },
  });

  if (!user) {
    throw new HttpError("User not found", 404);
  }

  res.json({
    user: serializeUser(user),
  });
});
