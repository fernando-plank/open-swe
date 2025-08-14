import { initApiPassthrough } from "langgraph-nextjs-api-passthrough";
import {
  GITHUB_TOKEN_COOKIE,
  GITHUB_INSTALLATION_ID_COOKIE,
  GITHUB_INSTALLATION_TOKEN_COOKIE,
  GITHUB_INSTALLATION_NAME,
  GITHUB_INSTALLATION_ID,
} from "@open-swe/shared/constants";
import {
  getGitHubInstallationTokenOrThrow,
  getInstallationNameFromReq,
  getGitHubAccessTokenOrThrow,
} from "./utils";
import { encryptSecret } from "@open-swe/shared/crypto";

// This file acts as a proxy for requests to your LangGraph server.
// Read the [Going to Production](https://github.com/langchain-ai/agent-chat-ui?tab=readme-ov-file#going-to-production) section for more information.

/**
 * Get the LangGraph API URL based on deployment environment
 */
function getLangGraphApiUrl(): string {
  const envUrl = process.env.LANGGRAPH_API_URL;
  const nodeEnv = process.env.NODE_ENV;
  
  // If explicitly set, use that URL
  if (envUrl) {
    return envUrl;
  }
  
  // Environment-based defaults
  if (nodeEnv === "production") {
    // In production, we expect the environment variable to be set
    // This is a fallback that should not be used in real deployments
    console.warn("LANGGRAPH_API_URL not set in production environment");
    return "http://localhost:2024";
  }
  
  // Development default
  return "http://localhost:2024";
}

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } =
  initApiPassthrough({
    apiUrl: getLangGraphApiUrl(),
    runtime: "edge", // default
    disableWarningLog: true,
    bodyParameters: (req, body) => {
      if (body.config?.configurable && "apiKeys" in body.config.configurable) {
        const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
        if (!encryptionKey) {
          throw new Error(
            "SECRETS_ENCRYPTION_KEY environment variable is required",
          );
        }

        const apiKeys = body.config.configurable.apiKeys;
        const encryptedApiKeys: Record<string, unknown> = {};

        // Encrypt each field in the apiKeys object
        for (const [key, value] of Object.entries(apiKeys)) {
          if (typeof value === "string" && value.trim() !== "") {
            encryptedApiKeys[key] = encryptSecret(value, encryptionKey);
          } else {
            encryptedApiKeys[key] = value;
          }
        }

        // Update the body with encrypted apiKeys
        body.config.configurable.apiKeys = encryptedApiKeys;
        return body;
      }
      return body;
    },
    headers: async (req) => {
      const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error(
          "SECRETS_ENCRYPTION_KEY environment variable is required",
        );
      }
      const installationIdCookie = req.cookies.get(
        GITHUB_INSTALLATION_ID_COOKIE,
      )?.value;

      if (!installationIdCookie) {
        throw new Error(
          "No GitHub installation ID found. GitHub App must be installed first.",
        );
      }
      const [installationToken, installationName] = await Promise.all([
        getGitHubInstallationTokenOrThrow(installationIdCookie, encryptionKey),
        getInstallationNameFromReq(req.clone(), installationIdCookie),
      ]);

      return {
        [GITHUB_TOKEN_COOKIE]: getGitHubAccessTokenOrThrow(req, encryptionKey),
        [GITHUB_INSTALLATION_TOKEN_COOKIE]: installationToken,
        [GITHUB_INSTALLATION_NAME]: installationName,
        [GITHUB_INSTALLATION_ID]: installationIdCookie,
      };
    },
  });

