// @ts-check
import { getContext } from "svelte";
import { readable } from "svelte/store";
import { LAYOUT_DIRECTION_CONTEXT_KEY } from "../constants/context-keys.js";

/** @typedef {"ltr" | "rtl"} Direction */

/** @type {import("svelte/store").Readable<Direction | undefined>} */
const outside = readable(undefined);

/**
 * The `dir` of the nearest `LayoutDirection`, as a store. The store holds
 * `undefined` outside one. Call during component initialization.
 * @returns {import("svelte/store").Readable<Direction | undefined>}
 */
export function getLayoutDirection() {
  return getContext(LAYOUT_DIRECTION_CONTEXT_KEY) ?? outside;
}

export {
  declaredDirection,
  inlineKey,
  resolveLayoutDirection,
} from "./inline-direction.js";
