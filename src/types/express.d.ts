import "express";
import type { UserRole } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
      validated?: unknown;
    }
  }
}

export {};
