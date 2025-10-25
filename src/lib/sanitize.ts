import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content
 * Removes all potentially dangerous HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize file name
 * Removes special characters and limits length
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
    .replace(/_{2,}/g, "_") // Remove consecutive underscores
    .substring(0, 255); // Limit length
}

/**
 * Sanitize user input text
 * Removes potentially dangerous characters
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize SQL-like input (prevent SQL injection in search)
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[;'"\\]/g, "") // Remove dangerous SQL chars
    .substring(0, 500);
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().substring(0, 255);
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
