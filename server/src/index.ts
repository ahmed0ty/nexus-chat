import { createServer } from "http";
import dns from "dns";

// أضف ده في أول حاجة قبل أي imports تانية
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import app from "./app";
import { config } from "./config";
import { connectDB } from "./DB";
import { getSocketManager } from "./sockets/socket.manager";
import { startJobs } from "./utils/jobs";

const bootstrap = async (): Promise<void> => {
  await connectDB();

  const server = createServer(app);
  getSocketManager(server);

  startJobs();

  server.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`📚 API Docs: http://localhost:${config.port}/api/docs`);
  });

  process.on("unhandledRejection", (err: Error) => {
    console.error("Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => process.exit(0));
  });
};

bootstrap().catch(console.error);