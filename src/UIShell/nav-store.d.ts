import type { Writable } from "svelte/store";

export declare const shouldRenderHamburgerMenu: Writable<boolean>;
export declare const isSideNavCollapsed: Writable<boolean>;
export declare const isSideNavRail: Writable<boolean>;
export declare const isSideNavMobile: Writable<boolean>;

/**
 * The resizable `SideNav`'s rendered width in pixels, or `undefined` when
 * it isn't resizable.
 */
export declare const sideNavWidth: Writable<number | undefined>;

/** Whether a `Header` is currently mounted. */
export declare const isHeaderRendered: Writable<boolean>;

/** The most recently mounted `HamburgerMenu` trigger button. */
export declare const hamburgerMenuRef: Writable<HTMLButtonElement | null>;

/**
 * Count a mounted `Header` so `isHeaderRendered` stays `true` until the
 * last one unmounts. Returns the callback to run on unmount.
 */
export declare function trackHeaderRendered(): () => void;
