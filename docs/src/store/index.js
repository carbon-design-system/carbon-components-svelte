import { writable } from "svelte/store";

export const sideNavToggled = writable(false);
export const appSwitcherToggled = writable(false);
export const theme = writable("g10");
