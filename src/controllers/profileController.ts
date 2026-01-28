import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { prisma } from "../db";
import { HttpError } from "../utils/errors";
import { uploadAvatar } from "../services/supabaseService";

export const uploadProfileAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new HttpError("Unauthorized", 401);
    }

    const file = req.file;
    if (!file) {
      throw new HttpError("Avatar file is required", 400);
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!profile) {
      throw new HttpError("Profile not found", 404);
    }

    const { path, publicUrl } = await uploadAvatar(
      file,
      req.user.userId,
      profile.avatarPath
    );

    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: { avatarPath: path },
    });

    res.json({
      profile: {
        ...updatedProfile,
        avatarUrl: publicUrl,
      },
    });
  }
);
