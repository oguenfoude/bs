/**
 * Utility Functions
 * 
 * PURPOSE: Shared utility functions for retry logic, class name merging, and common helpers.
 * 
 * RETRY LOGIC:
 * Implements exponential backoff retry mechanism for unreliable operations.
 * WHY: Network requests (Google Sheets, SMTP) can fail due to temporary issues.
 * Retrying automatically improves success rate without user intervention.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names intelligently.
 * 
 * WHY: Prevents class conflicts and allows conditional classes.
 * Uses clsx for conditional logic and tailwind-merge for conflict resolution.
 * 
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retry wrapper with exponential backoff.
 * 
 * HOW IT WORKS:
 * 1. Attempts to execute the function
 * 2. On failure, waits with exponential backoff (1s, 2s, 4s)
 * 3. Retries up to maxRetries times
 * 4. Throws last error if all retries fail
 * 
 * WHY: Network operations (Google Sheets API, SMTP) can fail due to:
 * - Temporary network issues
 * - Rate limiting
 * - Service unavailability
 * 
 * Retrying automatically handles transient failures without user intervention.
 * 
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise with function result
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      
      console.warn(
        `⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted, throw last error
  console.error(`❌ All ${maxRetries + 1} attempts failed`);
  throw lastError;
}

/**
 * Delays execution for a specified number of milliseconds.
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

