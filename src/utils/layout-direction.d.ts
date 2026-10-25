import type { Readable } from "svelte/store";

/**
 * The `dir` of the nearest `LayoutDirection`, as a store. The store holds
 * `undefined` outside one. Call during component initialization.
 */
export function getLayoutDirection(): Readable<"ltr" | "rtl" | undefined>;

export { inlineKey, resolveLayoutDirection } from "./inline-direction.js";
