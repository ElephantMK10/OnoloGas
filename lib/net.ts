/**
 * Network utilities for timeout management and abort control
 */

import { log } from './supabase';

/**
 * Wrapper for operations with configurable timeout
 * Provides per-call abort control for fine-tuned timeout management
 */
export async function withAbortTimeout<T>(
  ms: number,
  run: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    log.warn(`Operation timed out after ${ms}ms`);
    controller.abort('timeout');
  }, ms);
  
  try {
    return await run(controller.signal);
  } catch (error: any) {
    if (controller.signal.aborted) {
      throw new Error(`Operation timed out after ${ms}ms - please check your connection and try again`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Predefined timeout configurations for different operation types
 */
export const TIMEOUTS = {
  // Read operations - shorter timeout for better UX
  READ: 8_000,
  // Write operations - longer timeout for mobile networks
  WRITE: 15_000,
  // Auth operations - medium timeout
  AUTH: 12_000,
  // Quick operations - for health checks, etc.
  QUICK: 5_000,
} as const;
