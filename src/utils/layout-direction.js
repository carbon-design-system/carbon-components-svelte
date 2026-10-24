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

/**
 * Resolve the writing direction: the nearest `LayoutDirection` first, then
 * the element's computed direction, then the document's. Returns `"ltr"`
 * on the server.
 * @param {Direction | undefined} contextDirection - From `getLayoutDirection`.
 * @param {Element | null} [node]
 * @returns {Direction}
 */
export function resolveLayoutDirection(contextDirection, node) {
  if (contextDirection) return contextDirection;
  if (typeof document === "undefined") return "ltr";
  const element = node?.isConnected ? node : document.documentElement;
  return getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";
}

/**
 * The arrow key as an LTR page reads it. In RTL, ArrowLeft and ArrowRight
 * swap, so "ArrowRight" always points to the inline end. Other keys pass
 * through, and only the two inline arrows resolve the direction.
 * @param {string} key - A `KeyboardEvent` key.
 * @param {Direction | undefined} contextDirection - From `getLayoutDirection`.
 * @param {Element | null} [node]
 * @returns {string}
 */
export function inlineKey(key, contextDirection, node) {
  if (key !== "ArrowLeft" && key !== "ArrowRight") return key;
  if (resolveLayoutDirection(contextDirection, node) !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
}
