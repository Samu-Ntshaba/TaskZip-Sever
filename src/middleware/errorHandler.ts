import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/errors";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isMulterError = err.name === "MulterError";
  const statusCode =
    err instanceof HttpError ? err.statusCode : isMulterError ? 400 : 500;
  const message = statusCode >= 500 ? "Internal server error" : err.message;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
};
