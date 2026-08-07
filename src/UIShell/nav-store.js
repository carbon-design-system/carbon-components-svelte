import { writable } from "svelte/store";

export const shouldRenderHamburgerMenu = writable(false);
export const isSideNavCollapsed = writable(false);
export const isSideNavRail = writable(false);
export const isSideNavMobile = writable(false);

/**
 * The most recently mounted `HamburgerMenu` trigger button, so `SideNav` can
 * return focus to it when the overlay closes via Escape.
 * @type {import("svelte/store").Writable<HTMLButtonElement | null>}
 */
export const hamburgerMenuRef = writable(null);
