/// <reference types="vite/client" />

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
 * A framed example's route comes from its path, and `loadPage` checks it
 * against its file.
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

export const componentPages: Route[] = [...routes.values()]
  .filter((route) => route.parentName === "components")
  .sort((a, b) => a.name.localeCompare(b.name));

type Location = { pathname: string; search: string; hash: string };

const read = (): Location => ({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
});

export const location = writable<Location>(read());

export { route };

/**
 * Renders all lazy content at once when the page will scroll away from its
 * top. Safari doesn't anchor the scroll, so content that mounts above the
 * target would move the page.
 */
export const eagerContent = writable(false);

export function scrollsAwayFromTop(): boolean {
  return Boolean(get(location).hash) || (savedScroll()?.scrollY ?? 0) > 0;
}

export const params = derived(location, ($location) =>
  Object.fromEntries(new URLSearchParams($location.search)),
);

export const isActive = derived(
  location,
  ($location) =>
    (path: string, { recursive = true }: { recursive?: boolean } = {}) =>
      $location.pathname === path ||
      (recursive && $location.pathname.startsWith(`${path}/`)),
);

const beforeNavigateCallbacks = new Set<() => void>();

export function beforeNavigate(callback: () => void): () => void {
  beforeNavigateCallbacks.add(callback);
  return () => beforeNavigateCallbacks.delete(callback);
}

export type NavigateOptions = {
  /** Query parameters; the current ones are dropped. */
  query?: Record<string, string>;
  replace?: boolean;
};

export function goto(to: string, options: NavigateOptions = {}) {
  const url = new URL(to, window.location.href);
  if (options.query) url.search = new URLSearchParams(options.query).toString();
  for (const callback of beforeNavigateCallbacks) callback();
  const scroll = currentScroll();
  if (entry) scrolls.set(entry, scroll);
  history.replaceState({ ...history.state, ...scroll }, "");
  entry = newEntryKey();
  if (options.replace) history.replaceState({ key: entry }, "", url);
  else history.pushState({ key: entry }, "", url);
  location.set(read());
}

type SavedScroll = {
  scrollY: number;
  anchor?: { id: string; top: number };
};

type EntryState = Partial<SavedScroll> & { key?: string };

/**
 * On back or forward, `history.state` is already the next entry's, so the
 * entry left can't be written to. A link also writes to the entry, which
 * outlasts a reload.
 */
const scrolls = new Map<string, SavedScroll>();

let entry: string | undefined;

const newEntryKey = () => Math.random().toString(36).slice(2);

function entryKey(): string {
  const state = history.state as EntryState | null;
  if (state?.key) return state.key;
  const key = newEntryKey();
  history.replaceState({ ...state, key }, "");
  return key;
}

function leaveEntry() {
  if (entry) scrolls.set(entry, currentScroll());
}

/**
 * Saves the first heading on screen too: content above it, such as a code
 * view's "Show more", can change height before the reader comes back.
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
  const state = history.state as EntryState | null;
  const saved = (state?.key && scrolls.get(state.key)) || state;
  return saved?.scrollY === undefined ? undefined : (saved as SavedScroll);
}

const PREFETCH_HOVER_DELAY = 65;

function linkRoute(target: EventTarget | null): Route | undefined {
  const anchor = (target as Element | null)?.closest?.("a");
  if (!anchor?.href || anchor.hasAttribute("download")) return undefined;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return undefined;
  return routes.get(normalize(url.pathname));
}

const prefetched = new Set<Route>();

function prefetch(next: Route | undefined) {
  if (!next || prefetched.has(next) || next === get(route)) return;
  prefetched.add(next);
  loadPage(next).catch(() => prefetched.delete(next));
}

export function startRouter() {
  history.scrollRestoration = "manual";
  entry = entryKey();
  // A link to a heading on this page adds an entry that the browser
  // scrolls to before `popstate`, so the entry left is saved here.
  let leftByHashLink = false;

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
    if (url.pathname === window.location.pathname && url.hash) {
      // The same URL scrolls without adding an entry.
      if (url.href !== window.location.href) {
        leaveEntry();
        leftByHashLink = true;
      }
      return;
    }
    // Files such as `/llms.txt` and `/components/Button.md` load as files.
    if (!routes.has(normalize(url.pathname))) return;
    event.preventDefault();
    goto(url.href);
  };
  const onPopState = () => {
    for (const callback of beforeNavigateCallbacks) callback();
    if (!leftByHashLink) leaveEntry();
    leftByHashLink = false;
    entry = entryKey();
    location.set(read());
  };
  const onHashChange = () => {
    leftByHashLink = false;
    location.set(read());
  };

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
