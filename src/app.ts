import express from "express";
import cors from "cors";
import { env } from "./env";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import profileRoutes from "./routes/profileRoutes";
import healthRoutes from "./routes/healthRoutes";
import runnerRoutes from "./routes/runnerRoutes";
import locationRoutes from "./routes/locationRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { createNotFoundError } from "./utils/errors";

const app = express();
const apiBasePath = "/api/v1";

const corsOrigins = env.CORS_ORIGIN === "*"
  ? true
  : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get(apiBasePath, (_req, res) => {
  res.json({ message: "TaskZip API" });
});

app.use(`${apiBasePath}/auth`, authRoutes);
app.use(`${apiBasePath}/admin`, adminRoutes);
app.use(`${apiBasePath}/profile`, profileRoutes);
app.use(`${apiBasePath}/runner`, runnerRoutes);
app.use(`${apiBasePath}/locations`, locationRoutes);
app.use(`${apiBasePath}/health`, healthRoutes);

app.use((_req, _res, next) => {
  next(createNotFoundError("Route not found"));
});

app.use(errorHandler);

export default app;
