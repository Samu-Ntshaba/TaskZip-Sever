import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";

export const adminPing = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: "Admin access granted" });
});
