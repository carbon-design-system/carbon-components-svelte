// @ts-check
import { getContext } from "svelte";
import { readable, writable } from "svelte/store";

export const shouldRenderHamburgerMenu = writable(false);
export const isSideNavCollapsed = writable(false);
export const isSideNavRail = writable(false);
export const isSideNavMobile = writable(false);

/**
 * The resizable `SideNav`'s rendered width in pixels, so `Content` can
 * offset its left margin by it. `undefined` when the side nav isn't
 * resizable (or is a rail), leaving Carbon's fixed-width offset in place.
 * @type {import("svelte/store").Writable<number | undefined>}
 */
export const sideNavWidth = writable(undefined);

/**
 * Whether a `Header` is currently mounted, so unrelated components (for
 * example a sticky `Toolbar`) can default their offset below the fixed
 * header without requiring the consumer to wire it up manually.
 */
export const isHeaderRendered = writable(false);

let mountedHeaders = 0;

/**
 * Count a mounted `Header` so `isHeaderRendered` stays `true` until the
 * last one unmounts. Returns the callback to run on unmount.
 * @returns {() => void}
 */
export function trackHeaderRendered() {
  mountedHeaders += 1;
  isHeaderRendered.set(true);
  return () => {
    mountedHeaders -= 1;
    isHeaderRendered.set(mountedHeaders > 0);
  };
}

/**
 * The most recently mounted `HamburgerMenu` trigger button, so `SideNav` can
 * return focus to it when the overlay closes via Escape.
 * @type {import("svelte/store").Writable<HTMLButtonElement | null>}
 */
export const hamburgerMenuRef = writable(null);

/**
 * Context key for a `UIShellContainer`'s own nav stores.
 */
export const NAV_STORES_CONTEXT = "carbon:UIShellNav";

/**
 * @typedef {object} NavStores
 * @property {import("svelte/store").Writable<boolean>} shouldRenderHamburgerMenu
 * @property {import("svelte/store").Writable<boolean>} isSideNavCollapsed
 * @property {import("svelte/store").Writable<boolean>} isSideNavRail
 * @property {import("svelte/store").Writable<boolean>} isSideNavMobile
 * @property {import("svelte/store").Writable<number | undefined>} sideNavWidth
 * @property {import("svelte/store").Writable<boolean>} isHeaderRendered
 * @property {import("svelte/store").Writable<HTMLButtonElement | null>} hamburgerMenuRef
 * @property {() => () => void} trackHeaderRendered
 * @property {import("svelte/store").Readable<number | undefined>} containerWidth
 *   The container's width in pixels; `undefined` outside a container, where
 *   the shell follows the window instead.
 * @property {boolean} contained
 * @property {string} contentId The default id of the shell's `Content`,
 *   which `SkipToContent` links to: `"main-content"` on a page, and unique
 *   per container, so two contained shells don't share it.
 */

/** The page-wide stores, for a shell fixed to the window. @type {NavStores} */
const windowStores = {
  shouldRenderHamburgerMenu,
  isSideNavCollapsed,
  isSideNavRail,
  isSideNavMobile,
  sideNavWidth,
  isHeaderRendered,
  hamburgerMenuRef,
  trackHeaderRendered,
  containerWidth: readable(undefined),
  contained: false,
  contentId: "main-content",
};

/**
 * Fresh stores for one contained shell, so shells on the same page don't
 * share their open, collapsed or mobile state. Its header never offsets
 * page content: inside a container, `Content` scrolls below it.
 * @param {import("svelte/store").Readable<number | undefined>} containerWidth
 * @param {string} contentId
 * @returns {NavStores}
 */
export function createNavStores(containerWidth, contentId) {
  return {
    shouldRenderHamburgerMenu: writable(false),
    isSideNavCollapsed: writable(false),
    isSideNavRail: writable(false),
    isSideNavMobile: writable(false),
    sideNavWidth: writable(undefined),
    isHeaderRendered: writable(false),
    hamburgerMenuRef: writable(null),
    trackHeaderRendered: () => () => {},
    containerWidth,
    contained: true,
    contentId,
  };
}

/**
 * The nav stores for the shell a component belongs to: its
 * `UIShellContainer`'s, or the page-wide ones. Call during component init.
 * @returns {NavStores}
 */
export function getNavStores() {
  return getContext(NAV_STORES_CONTEXT) ?? windowStores;
}
