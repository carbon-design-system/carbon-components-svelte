// @ts-check
import { hasModifierKey } from "./has-modifier-key.js";

/**
 * Context key a menu trigger sets to a writable store holding the arrow key
 * that opened its `Menu`, so the menu focuses its first or last item.
 */
export const MENU_OPEN_KEY = "carbon:MenuOpenKey";

/**
 * Let ArrowDown and ArrowUp on a closed menu's trigger open it, as the APG
 * menu button pattern allows. `open` is called with the key and returns
 * whether it opened the menu; the key's default is prevented only then.
 *
 * @param {HTMLElement | null} trigger
 * @param {(key: "ArrowDown" | "ArrowUp") => boolean} open
 * @returns {() => void} Removes the listener.
 */
export function listenMenuArrowOpen(trigger, open) {
  if (!trigger) return () => {};
  /** @param {KeyboardEvent} event */
  const onKeydown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (hasModifierKey(event)) return;
    if (open(event.key)) event.preventDefault();
  };
  trigger.addEventListener("keydown", onKeydown);
  return () => trigger.removeEventListener("keydown", onKeydown);
}
