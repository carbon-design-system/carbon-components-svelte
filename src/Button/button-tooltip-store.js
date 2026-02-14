import { writable } from "svelte/store";

/** @type {import('svelte/store').Writable<object | null>} */
export const activeButtonTooltip = writable(null);
