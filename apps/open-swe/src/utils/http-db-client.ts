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

// Thread functions
export async function createThread(threadId: string): Promise<{ thread_id: string }> {
  return makeRequest(`${API_BASE_URL}/threads`, "POST", { thread_id: threadId });
}

// Run functions
export async function createRun(threadId: string, runId: string): Promise<{ run_id: string }> {
  return makeRequest(`${API_BASE_URL}/runs`, "POST", { thread_id: threadId, run_id: runId });
}

export async function updateRunStatus(runId: string, status: string): Promise<void> {
  await makeRequest(`${API_BASE_URL}/runs/${runId}`, "PUT", { status });
}

// GraphState functions
export async function saveGraphState(
  runId: string,
  state: GraphState,
): Promise<void> {
  await makeRequest(`${API_BASE_URL}/graph-state`, "POST", { runId, state });
}

export async function getGraphState(runId: string): Promise<GraphState> {
  return makeRequest(`${API_BASE_URL}/graph-state?runId=${runId}`, "GET");
}

// GraphConfig functions
export async function saveGraphConfig(
  runId: string,
  config: GraphConfig,
): Promise<void> {
  await makeRequest(`${API_BASE_URL}/graph-config`, "POST", {
    runId,
    config,
  });
}

export async function getGraphConfig(runId: string): Promise<GraphConfig> {
  return makeRequest(
    `${API_BASE_URL}/graph-config?runId=${runId}`,
    "GET",
  );
}

// DocumentCache functions
export async function getDocumentFromCache(
  runId: string,
  url: string,
): Promise<string | null> {
  try {
    const result = await makeRequest(
      `${API_BASE_URL}/document-cache?runId=${runId}&url=${encodeURIComponent(
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
  runId: string,
  url: string,
  content: string,
): Promise<void> {
  await makeRequest(`${API_BASE_URL}/document-cache`, "POST", {
    runId,
    url,
    content,
  });
}

export async function clearDocumentCache(runId: string): Promise<void> {
  await makeRequest(`${API_BASE_URL}/document-cache`, "DELETE", { runId });
}
