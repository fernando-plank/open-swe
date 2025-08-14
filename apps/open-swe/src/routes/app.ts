import { Hono } from "hono";
import { issueWebhookHandler } from "./github/issue-webhook.js";

export const app = new Hono();

// Health check endpoints for cloud platform monitoring
app.get("/health", (c) => {
  const port = process.env.PORT || "2024";
  const nodeEnv = process.env.NODE_ENV || "development";
  
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "open-swe-langgraph",
    port: port,
    environment: nodeEnv,
    uptime: process.uptime(),
    version: process.version,
  });
});

app.get("/status", (c) => {
  const port = process.env.PORT || "2024";
  const nodeEnv = process.env.NODE_ENV || "development";
  
  return c.json({
    status: "ok",
    service: "open-swe-langgraph",
    port: port,
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.post("/webhooks/github", issueWebhookHandler);

