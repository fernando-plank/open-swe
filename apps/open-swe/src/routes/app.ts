import { Hono } from "hono";
import { issueWebhookHandler } from "./github/issue-webhook.js";

export const app = new Hono();

// Health check endpoint
app.get("/health", (c) => c.json({ 
  status: "healthy", 
  timestamp: new Date().toISOString(),
  version: "1.0.0"
}));

app.post("/webhooks/github", issueWebhookHandler);
