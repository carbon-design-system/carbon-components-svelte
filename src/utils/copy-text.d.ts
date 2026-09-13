/**
 * Copy text to the clipboard.
 *
 * Tries `navigator.clipboard.writeText` first, then falls back to a
 * textarea + `document.execCommand("copy")` path. Rejects if both fail.
 */
export function copyText(text: string): Promise<void>;
