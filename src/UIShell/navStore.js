import { writable } from "svelte/store";

export const shouldRenderHamburgerMenu = writable(false);

export const isPersistentHamburgerMenu = writable(false);
