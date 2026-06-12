import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nexus Chat API",
      version: "1.0.0",
      description: "Real-time Chat Application API — Nexus Chat",
    },
    servers: [
      { url: "http://localhost:5000/api", description: "Development" },
      { url: "https://your-domain.com/api", description: "Production" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            avatar: { type: "string" },
            isOnline: { type: "boolean" },
            lastSeen: { type: "string", format: "date-time" },
          },
        },
        Message: {
          type: "object",
          properties: {
            _id: { type: "string" },
            conversationId: { type: "string" },
            senderId: { type: "string" },
            type: { type: "string" },
            content: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Conversation: {
          type: "object",
          properties: {
            _id: { type: "string" },
            type: { type: "string", enum: ["direct", "group", "channel"] },
            name: { type: "string" },
            participants: { type: "array" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            timestamp: { type: "string" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.router.ts", "./src/modules/**/*.routes.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Nexus Chat API Docs",
  }));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
};