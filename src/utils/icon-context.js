// @ts-check
import { getContext, setContext } from "svelte";
import { ICON_CONTEXT_KEY } from "../constants/context-keys.js";

/** @type {import("./icon-context.js").IconContext} */
const BUILT_IN = Object.freeze({});

/**
 * Swap the icons that components draw themselves, such as a dropdown's
 * `ChevronDown` or a field's `WarningFilled`, for every component in this
 * component and below it. Keys are icon names as in `carbon-icons-svelte`;
 * a name that isn't set keeps the built-in icon. A swapped icon gets the
 * props and classes the built-in one gets, everywhere the library draws
 * it. A nested call adds to the icons set above it. Call during component
 * initialization, such as in the app's root layout.
 * @param {import("./icon-context.js").IconContext} icons
 * @example
 * setIconContext({ ChevronDown, WarningFilled });
 */
export function setIconContext(icons) {
  setContext(ICON_CONTEXT_KEY, { ...getIconContext(), ...icons });
}

/**
 * The icons set by the nearest `setIconContext`, or none. Call during
 * component initialization.
 * @returns {import("./icon-context.js").IconContext}
 */
export function getIconContext() {
  return getContext(ICON_CONTEXT_KEY) ?? BUILT_IN;
}
