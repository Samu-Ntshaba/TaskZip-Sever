import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./env";
import { verifyAccessToken } from "./utils/jwt";

const server = http.createServer(app);

const corsOrigins = env.CORS_ORIGIN === "*"
  ? true
  : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.user = payload;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Socket connected" });
});

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
