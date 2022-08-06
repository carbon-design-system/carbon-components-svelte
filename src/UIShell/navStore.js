import { writable } from "svelte/store";

export const shouldRenderHamburgerMenu = writable(false);

export const isSideNavCollapsed = writable(false);
