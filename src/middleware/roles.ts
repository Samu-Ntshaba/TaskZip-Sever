import { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types/auth";
import { HttpError } from "../utils/errors";

export const allowRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError("Unauthorized", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError("Forbidden", 403));
    }

    return next();
  };
};
