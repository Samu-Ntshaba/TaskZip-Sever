import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/errors";

export const allowRoles = (...roles: string[]) => {
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
