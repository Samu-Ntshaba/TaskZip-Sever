export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const createNotFoundError = (message = "Not found") => {
  return new HttpError(message, 404);
};
