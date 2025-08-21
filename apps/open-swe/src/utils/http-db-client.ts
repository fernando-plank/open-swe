import { GraphConfig, GraphState } from "@open-swe/shared/open-swe/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

async function makeRequest(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${errorText}`,
    );
  }

  return response.json();
}

// GraphState functions
export async function saveGraphState(
  threadId: string,
  state: GraphState,
): Promise<void> {
  await makeRequest(`${API_BASE_URL}/graph-state`, "POST", { threadId, state });
}

export async function getGraphState(threadId: string): Promise<GraphState> {
  return makeRequest(`${API_BASE_URL}/graph-state?threadId=${threadId}`, "GET");
}

// GraphConfig functions
export async function saveGraphConfig(
  threadId: string,
  config: GraphConfig,
): Promise<void> {
  await makeRequest(`${API_BASE_URL}/graph-config`, "POST", {
    threadId,
    config,
  });
}

export async function getGraphConfig(threadId: string): Promise<GraphConfig> {
  return makeRequest(
    `${API_BASE_URL}/graph-config?threadId=${threadId}`,
    "GET",
  );
}

// DocumentCache functions
export async function getDocumentFromCache(
  threadId: string,
  url: string,
): Promise<string | null> {
  try {
    const result = await makeRequest(
      `${API_BASE_URL}/document-cache?threadId=${threadId}&url=${encodeURIComponent(
        url,
      )}`,
      "GET",
    );
    return result.content;
  } catch (error) {
    // Assuming a 404 or other error means not found
    return null;
  }
}

export async function saveDocumentToCache(
  threadId: string,
  url: string,
  content: string,
): Promise<void> {
  await makeRequest(`${API_BASE_URL}/document-cache`, "POST", {
    threadId,
    url,
    content,
  });
}

export async function clearDocumentCache(threadId: string): Promise<void> {
  await makeRequest(`${API_BASE_URL}/document-cache`, "DELETE", { threadId });
}

