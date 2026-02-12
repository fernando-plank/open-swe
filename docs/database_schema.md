# Database Schema for Open-SWE Agent Persistence

This document outlines the proposed relational database schema to replace the in-memory storage of `GraphState` and `GraphConfig` in the Open-SWE agent. The schema is designed to be used with a PostgreSQL database, leveraging the `JSONB` data type for storing complex objects.

## 1. `threads` Table

This table stores the main information for each thread, which is equivalent to a session or a run of the agent.

**Columns:**

-   `thread_id` (VARCHAR(255), PRIMARY KEY): Unique identifier for the thread.
-   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Timestamp of when the thread was created.
-   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Timestamp of the last update.

**SQL Definition:**

```sql
CREATE TABLE threads (
    thread_id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2. `runs` Table

This table stores information about each run within a thread.

**Columns:**

-   `run_id` (VARCHAR(255), PRIMARY KEY): Unique identifier for the run.
-   `thread_id` (VARCHAR(255), FOREIGN KEY REFERENCES threads(thread_id)): The ID of the thread this run belongs to.
-   `status` (VARCHAR(255)): The status of the run (e.g., "running", "completed", "failed").
-   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Timestamp of when the run was created.
-   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Timestamp of the last update.

**SQL Definition:**

```sql
CREATE TABLE runs (
    run_id VARCHAR(255) PRIMARY KEY,
    thread_id VARCHAR(255) REFERENCES threads(thread_id),
    status VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. `graph_state` Table

This table stores the `GraphState` for each run.

**Columns:**

-   `run_id` (VARCHAR(255), PRIMARY KEY, FOREIGN KEY REFERENCES runs(run_id)): The ID of the run this state belongs to.
-   `messages` (JSONB): Stores the `BaseMessage[]` array.
-   `tasks` (JSONB): Stores the `Task[]` array.
-   `plan_revisions` (JSONB): Stores the `PlanRevision[]` array.
-   `model_token_data` (JSONB): Stores the `ModelTokenData[]` array.
-   `initial_prompt` (TEXT)
-   `problem_statement` (TEXT)
-   `ui_messages` (JSONB)
-   `last_updated_by` (VARCHAR(255))
-   `current_task_id` (VARCHAR(255))
-   `target_repository` (VARCHAR(255))
-   `pull_request_url` (VARCHAR(255))
-   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
-   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**SQL Definition:**

```sql
CREATE TABLE graph_state (
    run_id VARCHAR(255) PRIMARY KEY REFERENCES runs(run_id),
    messages JSONB,
    tasks JSONB,
    plan_revisions JSONB,
    model_token_data JSONB,
    initial_prompt TEXT,
    problem_statement TEXT,
    ui_messages JSONB,
    last_updated_by VARCHAR(255),
    current_task_id VARCHAR(255),
    target_repository VARCHAR(255),
    pull_request_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. `graph_config` Table

This table stores the `GraphConfig` for each run.

**Columns:**

-   `run_id` (VARCHAR(255), PRIMARY KEY, FOREIGN KEY REFERENCES runs(run_id)): The ID of the run this config belongs to.
-   `configurable` (JSONB): Stores the main configuration object.
-   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
-   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**SQL Definition:**

```sql
CREATE TABLE graph_config (
    run_id VARCHAR(255) PRIMARY KEY REFERENCES runs(run_id),
    configurable JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. `document_cache` Table

This table will replace the in-memory `documentCache`.

**Columns:**

-   `run_id` (VARCHAR(255), FOREIGN KEY REFERENCES runs(run_id)): The ID of the run this cache entry belongs to.
-   `url` (TEXT, PRIMARY KEY): The URL of the cached document.
-   `content` (TEXT): The content of the document.
-   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**SQL Definition:**

```sql
CREATE TABLE document_cache (
    run_id VARCHAR(255) REFERENCES runs(run_id),
    url TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (run_id, url)
);
```
