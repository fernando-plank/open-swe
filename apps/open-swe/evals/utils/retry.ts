import { createLogger, LogLevel } from "../../src/utils/logger.js";

const logger = createLogger(LogLevel.DEBUG, "Retry");

const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  timeoutErrors: [
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EPIPE",
    "ENOTFOUND",
  ],
  connectionErrors: [
    "peer closed connection",
    "connection closed",
    "connection reset",
    "socket hang up",
    "network error",
    "fetch failed",
    "chunked encoding terminated unexpectedly",
    "premature close",
    "aborted",
  ],
};

/**
 * Check if an error is retryable based on error codes and messages
 */
function isRetryableError(error: any): boolean {
  // Check error codes (from error.cause.code or error.code)
  const errorCode = error?.cause?.code || error?.code;
  if (errorCode && RETRY_CONFIG.timeoutErrors.includes(errorCode)) {
    return true;
  }

  // Check error messages for connection-related issues
  const errorMessage = (error?.message || error?.toString() || "").toLowerCase();
  return RETRY_CONFIG.connectionErrors.some(connectionError =>
    errorMessage.includes(connectionError.toLowerCase())
  );
}

/**
 * Retry decorator with exponential backoff for LangGraph client
 * operations. Enhanced to handle network connection errors and
 * chunked transfer issues common in cloud deployments.
 */
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      const isRetryable = isRetryableError(error);

      if (isRetryable && attempt < RETRY_CONFIG.maxRetries - 1) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay *
            Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay,
        );
        logger.info(
          `Retrying operation in ${delay}ms. Attempt ${attempt + 1} of ${RETRY_CONFIG.maxRetries}`,
          {
            attempt,
            errorCode: error?.cause?.code || error?.code,
            errorMessage: error?.message,
            lastError,
          },
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        if (isRetryable) {
          logger.error(
            `Max retries (${RETRY_CONFIG.maxRetries}) exceeded for retryable error`,
            {
              errorCode: error?.cause?.code || error?.code,
              errorMessage: error?.message,
              totalAttempts: RETRY_CONFIG.maxRetries,
            },
          );
        }
        throw lastError;
      }
    }
  }

  throw lastError;
}


