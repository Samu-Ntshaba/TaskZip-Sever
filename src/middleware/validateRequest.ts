import { NextFunction, Request, Response } from "express";
import { z, ZodTypeAny } from "zod";
import { HttpError } from "../utils/errors";

export const validateRequest =
  <S extends ZodTypeAny>(schema: S) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      return next(new HttpError(message, 400));
    }

    req.validated = result.data as z.infer<S>;
    return next();
  };
