import { writable } from "svelte/store";

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

/**
 * The most recently mounted `HamburgerMenu` trigger button, so `SideNav` can
 * return focus to it when the overlay closes via Escape.
 * @type {import("svelte/store").Writable<HTMLButtonElement | null>}
 */
export const hamburgerMenuRef = writable(null);
