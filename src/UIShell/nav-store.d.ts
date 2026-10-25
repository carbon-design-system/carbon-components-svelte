import type { Readable, Writable } from "svelte/store";

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

/** Context key for a `UIShellContainer`'s own nav stores. */
export declare const NAV_STORES_CONTEXT: "carbon:UIShellNav";

export interface NavStores {
  shouldRenderHamburgerMenu: Writable<boolean>;
  isSideNavCollapsed: Writable<boolean>;
  isSideNavRail: Writable<boolean>;
  isSideNavMobile: Writable<boolean>;
  sideNavWidth: Writable<number | undefined>;
  isHeaderRendered: Writable<boolean>;
  hamburgerMenuRef: Writable<HTMLButtonElement | null>;
  trackHeaderRendered: () => () => void;
  /** The container's width in pixels; `undefined` outside a container. */
  containerWidth: Readable<number | undefined>;
  contained: boolean;
  /** The default id of the shell's `Content`, which `SkipToContent` links to. */
  contentId: string;
}

/** Fresh stores for one contained shell. */
export declare function createNavStores(
  containerWidth: Readable<number | undefined>,
  contentId: string,
): NavStores;

/** The nav stores for the shell a component belongs to. Call during init. */
export declare function getNavStores(): NavStores;
