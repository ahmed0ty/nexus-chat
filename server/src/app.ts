import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { errorHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/logger.middleware";
import { globalLimiter } from "./middlewares/rateLimiter.middleware";
import { setupSwagger } from "./config/swagger";
import authRouter from "./modules/auth/auth.router";
import messageRouter from "./modules/messages/message.router";
import conversationRouter from "./modules/conversations/conversation.router";
import userRouter from "./modules/users/user.router";
import mediaRouter from "./modules/media/media.router";
import notificationRouter from "./modules/notifications/notification.router";
import stickerRouter from "./modules/stickers/sticker.router";
import timeout from "connect-timeout";

const app = express();

app.use(helmet());
app.use(timeout("120s"));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      config.clientUrl,
      "https://nexus-chat-three-delta.vercel.app",
      "https://nexus-chat-oxqupxkfe-ahmeds-projects-231819ae.vercel.app",
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(requestLogger);
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(globalLimiter);


app.use(express.json({ limit: "600mb" }));
app.use(express.urlencoded({ extended: true, limit: "600mb" }));

setupSwagger(app);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date() })
);

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/users", userRouter);
app.use("/api/media", mediaRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/stickers", stickerRouter);

app.use(errorHandler);

export default app;