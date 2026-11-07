/**
 * A deploy replaces the site's hashed chunks. A tab opened before it, or a
 * page cached from the old build, then asks for chunks that are gone, and
 * the page stays blank. A reload fetches the new build's HTML and chunks.
 */

const KEY = "docs:reloaded-for-new-build";

/** A CDN can serve the old HTML for a few minutes. Don't reload in a loop. */
const MIN_INTERVAL_MS = 10_000;

function reloadedJustNow(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY)) || 0;
    if (Date.now() - last < MIN_INTERVAL_MS) return true;
    sessionStorage.setItem(KEY, String(Date.now()));
    return false;
  } catch {
    // Without storage, a reload can't tell that it already ran.
    return true;
  }
}

/**
 * Reload for a chunk that failed to load, unless the page just did. The
 * promise never settles, so the caller doesn't render before the reload.
 */
export function reloadForNewBuild(error: unknown): Promise<never> {
  if (reloadedJustNow()) throw error;
  window.location.reload();
  return new Promise(() => {});
}
