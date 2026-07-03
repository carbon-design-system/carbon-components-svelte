// @ts-check

/** @type {boolean} */
const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** @type {ReadonlySet<string>} */
const MOD_ALIASES = new Set(["mod", "commandorcontrol", "cmdorctrl"]);

/**
 * Match a keyboard event against a "modifier+key" combination.
 *
 * @param {KeyboardEvent} event
 * @param {string} combo - e.g. `"meta+k"`, `"mod+k"`, `"ctrl+shift+p"`
 * @returns {boolean}
 */
export function matchesKeyboardCombo(event, combo) {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  const wantMod = modifiers.some((modifier) => MOD_ALIASES.has(modifier));
  const wantMeta =
    modifiers.includes("meta") ||
    modifiers.includes("cmd") ||
    modifiers.includes("command") ||
    (wantMod && isMac);
  const wantCtrl =
    modifiers.includes("ctrl") ||
    modifiers.includes("control") ||
    (wantMod && !isMac);
  const wantAlt = modifiers.includes("alt") || modifiers.includes("option");
  const wantShift = modifiers.includes("shift");
  return (
    event.metaKey === wantMeta &&
    event.ctrlKey === wantCtrl &&
    event.altKey === wantAlt &&
    event.shiftKey === wantShift &&
    event.key.toLowerCase() === key
  );
}
