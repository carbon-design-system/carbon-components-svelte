/// <reference types="vite/client" />

/**
 * The docs site's router: one route per page file under `src/pages`, the
 * URL in a store kept in step with the History API, and clicks on
 * same-origin links turned into in-page navigation.
 */
import type { Component } from "svelte";
import { derived, get, writable } from "svelte/store";
import { route } from "./current-route";
import {
  buildRoutes,
  FRAMED_PREFIX,
  framedRoute,
  normalizePath as normalize,
  type Route,
} from "./routes";

export type { Route };

// The framed examples have their own map, in `framed-pages.ts`.
const pages = import.meta.glob<{ default: Component }>([
  "./pages/**/*.svelte",
  "./pages/**/*.md",
  "!./pages/**/_*.svelte",
  "!./pages/framed/**",
]);

const { routes, notFound } = buildRoutes(Object.keys(pages));

const framedRoutes = new Map<string, Route>();

/**
 * The route for `pathname`, ignoring a trailing slash, or the not-found
 * route. A framed example's route is read from its path, and checked
 * against its file when it loads.
 */
export function matchRoute(pathname: string): Route | undefined {
  const path = normalize(pathname);
  if (!path.startsWith(FRAMED_PREFIX)) return routes.get(path) ?? notFound;
  let framed = framedRoutes.get(path);
  if (!framed) {
    framed = framedRoute(path);
    framedRoutes.set(path, framed);
  }
  return framed;
}

/** The page for `route`, or the not-found page if it has no file. */
export async function loadPage(
  route: Route,
): Promise<{ route: Route; component: Component } | undefined> {
  const load = route.path.startsWith(FRAMED_PREFIX)
    ? (await import("./framed-pages")).framedPages[route.file]
    : pages[route.file];
  if (load) return { route, component: (await load()).default };
  if (notFound && route !== notFound) return loadPage(notFound);
  return undefined;
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

export { route };

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
  history.replaceState({ ...history.state, ...currentScroll() }, "");
  if (options.replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
  location.set(read());
}

type SavedScroll = {
  scrollY: number;
  /** The first heading on screen, and how far from the top it was. */
  anchor?: { id: string; top: number };
};

/**
 * Where the page is scrolled to, by its first heading on screen as well as
 * by offset: anything above that heading that changes height before the
 * reader comes back, such as a code view's "Show more", would make the
 * offset land elsewhere.
 */
function currentScroll(): SavedScroll {
  for (const heading of document.querySelectorAll<HTMLElement>(
    "h2[id], h3[id]",
  )) {
    const { top } = heading.getBoundingClientRect();
    if (top >= 0) {
      return { scrollY: window.scrollY, anchor: { id: heading.id, top } };
    }
  }
  return { scrollY: window.scrollY };
}

function savedScroll(): SavedScroll | undefined {
  return (history.state as SavedScroll | null) ?? undefined;
}

/** How long the pointer rests on a link before its page is fetched. */
const PREFETCH_HOVER_DELAY = 65;

/** The route a link goes to in this app, if any. */
function linkRoute(target: EventTarget | null): Route | undefined {
  const anchor = (target as Element | null)?.closest?.("a");
  if (!anchor?.href || anchor.hasAttribute("download")) return undefined;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return undefined;
  return routes.get(normalize(url.pathname));
}

const prefetched = new Set<Route>();

/** Starts loading `route`'s page so following its link is instant. */
function prefetch(next: Route | undefined) {
  if (!next || prefetched.has(next) || next === get(route)) return;
  prefetched.add(next);
  loadPage(next).catch(() => prefetched.delete(next));
}

/**
 * Starts routing: links, the back and forward buttons, and hash changes.
 * A link's page starts loading when the pointer rests on it, it gets
 * focus, or a touch starts on it.
 */
export function startRouter() {
  history.scrollRestoration = "manual";

  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  const onPointerOver = (event: PointerEvent) => {
    clearTimeout(hoverTimer);
    const next = linkRoute(event.target);
    if (next) hoverTimer = setTimeout(prefetch, PREFETCH_HOVER_DELAY, next);
  };
  const onPointerOut = () => clearTimeout(hoverTimer);
  const onIntent = (event: Event) => prefetch(linkRoute(event.target));

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
  document.addEventListener("pointerover", onPointerOver, { passive: true });
  document.addEventListener("pointerout", onPointerOut, { passive: true });
  document.addEventListener("focusin", onIntent);
  document.addEventListener("touchstart", onIntent, { passive: true });
  window.addEventListener("popstate", onPopState);
  window.addEventListener("hashchange", onHashChange);
  return () => {
    clearTimeout(hoverTimer);
    document.removeEventListener("click", onClick);
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("focusin", onIntent);
    document.removeEventListener("touchstart", onIntent);
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
  if (target) {
    target.scrollIntoView();
    return;
  }
  const saved = savedScroll();
  const anchor = saved?.anchor && document.getElementById(saved.anchor.id);
  if (anchor && saved?.anchor) {
    window.scrollBy(0, anchor.getBoundingClientRect().top - saved.anchor.top);
  } else {
    window.scrollTo(0, saved?.scrollY ?? 0);
  }
}
