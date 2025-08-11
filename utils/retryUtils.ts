// Retry utility with exponential backoff
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public isRetryable: boolean = true,
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => {
      // Default retry condition: retry on network errors, timeouts, and server errors
      if (error instanceof RetryableError) {
        return error.isRetryable;
      }

      const message = error.message?.toLowerCase() || '';
      const retryableErrors = [
        'network',
        'timeout',
        'connection',
        'fetch',
        'offline',
        'unreachable',
        'server error',
        'internal server error',
        'service unavailable',
        'too many requests',
        'rate limit',
      ];

      return retryableErrors.some((retryableError) => message.includes(retryableError));
    },
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      // Don't retry if this is the last attempt or if the error is not retryable
      if (attempt === maxAttempts || !retryCondition(error)) {
        break;
      }

      // Wait before retrying
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
};

// Specific retry wrapper for Supabase operations
export const withSupabaseRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'Supabase operation',
): Promise<T> => {
  return withRetry(operation, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    retryCondition: (error) => {
      const message = error.message?.toLowerCase() || '';

      // Don't retry on validation errors or permission errors
      const nonRetryableErrors = [
        'invalid',
        'unauthorized',
        'forbidden',
        'not found',
        'permission denied',
        'duplicate',
        'constraint',
        'unique',
      ];

      if (nonRetryableErrors.some((nonRetryable) => message.includes(nonRetryable))) {
        console.log(`${operationName}: Non-retryable error detected:`, error.message);
        return false;
      }

      // Retry on network/server errors
      const retryableErrors = [
        'network',
        'timeout',
        'connection',
        'fetch',
        'server error',
        'service unavailable',
        'too many requests',
      ];

      const shouldRetry = retryableErrors.some((retryable) => message.includes(retryable));
      console.log(
        `${operationName}: Error is ${shouldRetry ? 'retryable' : 'non-retryable'}:`,
        error.message,
      );

      return shouldRetry;
    },
  });
};
