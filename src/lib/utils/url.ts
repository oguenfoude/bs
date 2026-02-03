/**
 * Simple Base URL Utility
 *
 * Automatically detects the correct base URL:
 * - Production: Uses Vercel URL
 * - Development: Uses localhost
 */

/**
 * Gets the base URL for the application.
 * Simple and automatic - no complex config needed.
 */
export function getBaseUrl(): string {
  // Production: Use Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Development: Use localhost
  return "http://localhost:3000";
}

/**
 * Gets the full image URL for a watch model.
 */
export function getWatchImageUrl(watchModelId: number): string {
  return `${getBaseUrl()}/images/watches/${watchModelId}.webp`;
}
