import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { HttpError } from "../utils/errors";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      return next(new HttpError(message, 400));
    }

    req.validated = result.data;
    return next();
  };
};
