/// <reference types="vite/client" />

/**
 * The docs site's router: one route per page file under `src/pages`, the
 * URL in a store kept in step with the History API, and clicks on
 * same-origin links turned into in-page navigation.
 */
import type { Component } from "svelte";
import { derived, get, writable } from "svelte/store";
import { buildRoutes, type Route } from "./routes";

export type { Route };

const pages = import.meta.glob<{ default: Component }>([
  "./pages/**/*.svelte",
  "./pages/**/*.svx",
  "!./pages/**/_*.svelte",
]);

const { routes, notFound } = buildRoutes(Object.keys(pages));

const normalize = (pathname: string) =>
  decodeURI(pathname).replace(/(.)\/$/, "$1");

/** The route for `pathname`, ignoring a trailing slash, or the not-found route. */
export function matchRoute(pathname: string): Route | undefined {
  return routes.get(normalize(pathname)) ?? notFound;
}

export function loadPage(route: Route) {
  return pages[route.file]();
}

/** The component pages, by name, for the side navigation. */
export const componentPages: Route[] = [...routes.values()]
  .filter((route) => route.parentName === "components")
  .sort((a, b) => a.name.localeCompare(b.name));

// Location.

type Location = { pathname: string; search: string; hash: string };

const read = (): Location => ({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
});

export const location = writable<Location>(read());

/** The route whose page is showing, set once it has loaded. */
export const route = writable<Route | undefined>(undefined);

/** The query string, as an object. */
export const params = derived(location, ($location) =>
  Object.fromEntries(new URLSearchParams($location.search)),
);

/** Whether `path` is the current page, or with `recursive`, one it contains. */
export const isActive = derived(
  location,
  ($location) =>
    (path: string, { recursive = true }: { recursive?: boolean } = {}) =>
      $location.pathname === path ||
      (recursive && $location.pathname.startsWith(`${path}/`)),
);

const beforeNavigateCallbacks = new Set<() => void>();

/** Calls `callback` before each navigation, until the returned function is called. */
export function beforeNavigate(callback: () => void): () => void {
  beforeNavigateCallbacks.add(callback);
  return () => beforeNavigateCallbacks.delete(callback);
}

export type NavigateOptions = {
  /** Query parameters; the current ones are dropped. */
  query?: Record<string, string>;
  /** Replace the current history entry instead of adding one. */
  replace?: boolean;
};

/** Goes to `to`, a same-origin URL such as `/components/Button#basic`. */
export function goto(to: string, options: NavigateOptions = {}) {
  const url = new URL(to, window.location.href);
  if (options.query) url.search = new URLSearchParams(options.query).toString();
  for (const callback of beforeNavigateCallbacks) callback();
  // Remember where the page was scrolled, for the back button.
  history.replaceState({ ...history.state, scrollY: window.scrollY }, "");
  if (options.replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
  location.set(read());
}

/** Starts routing: links, the back and forward buttons, and hash changes. */
export function startRouter() {
  history.scrollRestoration = "manual";

  const onClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor || anchor.hasAttribute("download")) return;
    if (anchor.target && anchor.target !== "_self") return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    // A link to a heading on this page: the browser scrolls to it.
    if (url.pathname === window.location.pathname && url.hash) return;
    // Files such as `/llms.txt` and `/components/Button.md` load as files.
    if (!routes.has(normalize(url.pathname))) return;
    event.preventDefault();
    goto(url.href);
  };
  const onPopState = () => {
    for (const callback of beforeNavigateCallbacks) callback();
    location.set(read());
  };
  const onHashChange = () => location.set(read());

  document.addEventListener("click", onClick);
  window.addEventListener("popstate", onPopState);
  window.addEventListener("hashchange", onHashChange);
  return () => {
    document.removeEventListener("click", onClick);
    window.removeEventListener("popstate", onPopState);
    window.removeEventListener("hashchange", onHashChange);
  };
}

/**
 * After a page renders: back to where it was for the back and forward
 * buttons, to the URL's heading if it has one, or to the top.
 */
export function restoreScroll() {
  const { hash } = get(location);
  const target =
    hash && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (target) target.scrollIntoView();
  else
    window.scrollTo(
      0,
      (history.state as { scrollY?: number } | null)?.scrollY ?? 0,
    );
}
