// @ts-check

/**
 * Marks a history entry the helper pushed, so `back()` knows whether going
 * back leaves the detail view or leaves the page.
 */
const PUSHED = "ccsSelectionPushed";

/**
 * @typedef {Object} SelectionUrlOptions
 * @property {string} [param] Name of the query parameter. Defaults to `"id"`.
 */

/**
 * @typedef {Object} SelectionUrl
 * @property {() => string} read Current id from the URL, or `""` when the
 *   parameter is missing and on the server.
 * @property {(id: string) => string} hrefFor Link to an id that keeps the
 *   other parameters and the hash. `""` links to the list.
 * @property {(id: string) => void} push Add a history entry for `id`.
 * @property {(id: string) => void} replace Change the current entry to `id`.
 * @property {() => boolean} back Leave the detail view. Steps back when
 *   the current entry was pushed by `push` and returns `true`; the new id
 *   then arrives through `listen`. Otherwise it replaces the entry with
 *   the list and returns `false`, so a deep link never leaves the page.
 * @property {(callback: (id: string) => void) => () => void} listen Call
 *   `callback` with the id after back and forward navigation. Returns a
 *   function that stops listening.
 */

/**
 * @param {unknown} state
 * @returns {Record<string, unknown>}
 */
function asObject(state) {
  return state !== null && typeof state === "object"
    ? /** @type {Record<string, unknown>} */ (state)
    : {};
}

/**
 * Keep one selected id in a URL query parameter, such as `?id=42`, so a
 * reload or a shared link restores it. Selecting adds a history entry
 * (`push`) or changes the current one (`replace`); back and forward
 * navigation arrives through `listen`.
 *
 * Every method is safe to call on the server: `read` returns `""` and the
 * rest do nothing. Read the initial id there from the request URL.
 *
 * @param {SelectionUrlOptions} [options]
 * @returns {SelectionUrl}
 */
export function syncSelectionToUrl(options = {}) {
  const param = options.param || "id";

  /** @param {string} id */
  function hrefFor(id) {
    if (typeof window === "undefined") {
      return id ? `?${param}=${encodeURIComponent(id)}` : "?";
    }
    const url = new URL(window.location.href);
    if (id) url.searchParams.set(param, id);
    else url.searchParams.delete(param);
    return `${url.search || "?"}${url.hash}`;
  }

  function read() {
    if (typeof window === "undefined") return "";
    return new URL(window.location.href).searchParams.get(param) ?? "";
  }

  /**
   * @param {string} id
   * @param {boolean} pushed
   */
  function write(id, pushed) {
    if (typeof window === "undefined") return;
    const href = hrefFor(id);
    const current = `${window.location.search || "?"}${window.location.hash}`;
    // Selecting what is already selected adds no entry.
    if (href === current) return;
    try {
      if (pushed) {
        history.pushState(
          { ...asObject(history.state), [PUSHED]: true },
          "",
          href,
        );
      } else {
        history.replaceState(history.state, "", href);
      }
    } catch {
      // Some embedding contexts (a sandboxed iframe) block history updates.
    }
  }

  return {
    read,
    hrefFor,
    push: (id) => write(id, true),
    replace: (id) => write(id, false),
    back() {
      if (typeof window === "undefined") return false;
      if (asObject(history.state)[PUSHED]) {
        history.back();
        return true;
      }
      write("", false);
      return false;
    },
    listen(callback) {
      if (typeof window === "undefined") return () => {};
      function handlePopstate() {
        callback(read());
      }
      window.addEventListener("popstate", handlePopstate);
      return () => window.removeEventListener("popstate", handlePopstate);
    },
  };
}
