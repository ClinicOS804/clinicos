/**
 * Converts a doctor's name to a URL-safe booking slug.
 * Example: "Dr. Ahmed Rahman" → "dr-ahmed-rahman"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
