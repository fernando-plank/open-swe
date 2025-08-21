# Code Changes for In-Memory to HTTP API Migration

This document details the code modifications made to migrate from in-memory storage to an external HTTP API for managing `GraphState` and `GraphConfig`.

## 1. New HTTP Database Client

A new file, `apps/open-swe/src/utils/http-db-client.ts`, was created to handle all interactions with the external database via HTTP endpoints.

**File:** `apps/open-swe/src/utils/http-db-client.ts`

**Summary:**
This client provides functions for CRUD operations on `GraphState`, `GraphConfig`, and the `documentCache`. It uses `fetch` to communicate with a configurable base URL (`API_BASE_URL`).

**Key Functions:**
-   `saveGraphState(threadId, state)`
-   `getGraphState(threadId)`
-   `saveGraphConfig(threadId, config)`
-   `getGraphConfig(threadId)`
-   `getDocumentFromCache(threadId, url)`
-   `saveDocumentToCache(threadId, url, content)`

**Code Snippet:**
```typescript
import { GraphConfig, GraphState } from "@open-swe/shared/open-swe/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

async function makeRequest(url: string, method: string, body?: unknown) {
  // ... implementation ...
}

export async function saveGraphState(threadId: string, state: GraphState): Promise<void> {
  await makeRequest(`${API_BASE_URL}/graph-state`, "POST", { threadId, state });
}

export async function getDocumentFromCache(threadId: string, url: string): Promise<string | null> {
  try {
    const result = await makeRequest(
      `${API_BASE_URL}/document-cache?threadId=${threadId}&url=${encodeURIComponent(url)}`,
      "GET",
    );
    return result.content;
  } catch (error) {
    return null;
  }
}

// ... other functions
```

## 2. `url-content.ts` Modification

The `createGetURLContentTool` function was updated to use the new HTTP client for document caching instead of accessing the in-memory `documentCache`.

**File:** `apps/open-swe/src/tools/url-content.ts`

**Summary:**
-   Removed the `state` parameter from `createGetURLContentTool` and replaced it with `threadId`.
-   Replaced direct access to `state.documentCache` with calls to `getDocumentFromCache` and `saveDocumentToCache`.
-   Removed the `stateUpdates` from the return value, as the cache is now managed externally.

**Code Snippet (Before):**
```typescript
export function createGetURLContentTool(state: Pick<GraphState, "documentCache">) {
  // ...
  let documentContent = state.documentCache[parsedUrl];
  // ...
  const stateUpdates = { documentCache: { ... } };
  return { result: documentContent, status: "success", stateUpdates };
}
```

**Code Snippet (After):**
```typescript
export function createGetURLContentTool(threadId: string) {
  // ...
  let documentContent = await getDocumentFromCache(threadId, parsedUrl);
  // ...
  await saveDocumentToCache(threadId, parsedUrl, documentContent);
  return { result: documentContent, status: "success" };
}
```

## 3. `take-action.ts` Modification

The logic for merging `documentCache` updates in `take-action.ts` was removed.

**File:** `apps/open-swe/src/graphs/planner/nodes/take-action.ts`

**Summary:**
-   The `createGetURLContentTool` is now called with `config.thread_id`.
-   The `reduce` function that merged `documentCache` updates from tool calls was completely removed.

## 4. `types.ts` Modification

The `documentCache` field was removed from the `GraphAnnotation` Zod schema, officially removing it from the `GraphState`.

**File:** `packages/shared/src/open-swe/types.ts`

**Summary:**
-   The `documentCache` property and its associated reducer were deleted from the `GraphAnnotation` schema.
```

