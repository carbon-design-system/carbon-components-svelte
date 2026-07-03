// @ts-check

/** @type {Record<string, string>} */
const MODIFIER_ALIASES = {
  "⌘": "meta",
  cmd: "meta",
  command: "meta",
  "⌃": "ctrl",
  ctrl: "ctrl",
  control: "ctrl",
  "⌥": "alt",
  alt: "alt",
  option: "alt",
  "⇧": "shift",
  shift: "shift",
};

/**
 * @typedef {object} CommandShortcutFields
 * @property {ReadonlyArray<string>} [shortcut]
 * @property {string | ReadonlyArray<string>} [shortcutKeys]
 */

/**
 * Parse display shortcut badges into machine-readable combos.
 *
 * @param {ReadonlyArray<string>} segments
 * @returns {string[]}
 */
export function parseDisplayShortcut(segments) {
  if (!segments?.length) return [];

  /** @type {string[]} */
  const modifiers = [];
  let key = null;
  let sawCmdSymbol = false;

  for (const raw of segments) {
    const token = raw.trim();
    if (!token) continue;
    const alias = MODIFIER_ALIASES[token.toLowerCase()];
    if (alias) {
      if (alias === "meta")
        sawCmdSymbol =
          token === "⌘" ||
          token.toLowerCase() === "cmd" ||
          token.toLowerCase() === "command";
      if (!modifiers.includes(alias)) modifiers.push(alias);
      continue;
    }
    if (key !== null) return [];
    key = token.toLowerCase();
  }

  if (key === null) return [];

  const modifierPrefix = modifiers.length > 0 ? `${modifiers.join("+")}+` : "";
  /** @type {string[]} */
  const combos = [`${modifierPrefix}${key}`];

  if (sawCmdSymbol) {
    const withoutMeta = modifiers.filter((modifier) => modifier !== "meta");
    const ctrlPrefix =
      withoutMeta.length > 0
        ? `${[...withoutMeta, "ctrl"].join("+")}+`
        : "ctrl+";
    combos.push(`${ctrlPrefix}${key}`);
  }

  return combos;
}

/**
 * @param {CommandShortcutFields} command
 * @returns {string[]}
 */
export function getCommandCombos(command) {
  if (command.shortcutKeys) {
    const keys = Array.isArray(command.shortcutKeys)
      ? command.shortcutKeys
      : [command.shortcutKeys];
    return keys.map((combo) => combo.trim().toLowerCase()).filter(Boolean);
  }
  if (command.shortcut?.length) {
    return parseDisplayShortcut(command.shortcut);
  }
  return [];
}

/**
 * Build a lookup map from keyboard combo to command. First command wins on
 * duplicate combos (stable `commands` iteration order).
 *
 * @template T
 * @param {ReadonlyArray<T>} commands
 * @param {{ getCombos?: (command: T) => string[] }} [options]
 * @returns {Map<string, T>}
 */
export function buildCommandShortcutMap(commands, options = {}) {
  const getCombos = options.getCombos ?? getCommandCombos;
  /** @type {Map<string, T>} */
  const map = new Map();

  for (const command of commands) {
    for (const combo of getCombos(command)) {
      if (!map.has(combo)) map.set(combo, command);
    }
  }

  return map;
}
