// @ts-check
import { writable } from "svelte/store";
import { batchStoreUpdates } from "../utils/batch-store-updates.js";
import { isImeComposition } from "../utils/ime-composition.js";
import {
  frontModal,
  isApplePlatform,
  isEditableTarget,
  isShortcutTarget,
  isShown,
  matchesShortcut,
  parseShortcut,
  shortcutKeys,
} from "../utils/keyboard-shortcut.js";
import { addPooledListener } from "../utils/window-listener-pool.js";

/**
 * @typedef {import("./shortcut-registry.js").ShortcutEntry} ShortcutEntry
 * @typedef {import("./shortcut-registry.js").ShortcutScope} ShortcutScope
 * @typedef {import("./shortcut-registry.js").ShortcutRoot} ShortcutRoot
 * @typedef {import("./shortcut-registry.js").ShortcutSpec} ShortcutSpec
 */

// Live providers by id, so the `shortcut` action can find its provider
// while it mounts: the provider's wrapper is not bound yet, and Svelte 5
// runs a child's actions before the parent's. Only written in the browser,
// so a server never holds one request's providers for the next.
/** @type {Map<string, ShortcutScope>} */
const scopesById = new Map();

/**
 * A shortcut with no `mod`, `meta` or `ctrl` is a typed character, so it is
 * left to a text field. `alt` does not exempt it: Option types symbols on
 * macOS.
 * @param {import("../utils/keyboard-shortcut.js").ParsedShortcut} parsed
 * @returns {boolean}
 */
function isTyped(parsed) {
  return !(parsed.mod || parsed.meta || parsed.ctrl);
}

/**
 * The same key combination on this platform, however it is written.
 * @param {string} keys
 * @returns {string}
 */
function canonical(keys) {
  return shortcutKeys(keys).join("+");
}

/**
 * @param {ShortcutScope} scope
 * @returns {boolean}
 */
function scopeAvailable(scope) {
  const element = scope.element;
  if (!element?.isConnected || element.closest("[inert]")) {
    return false;
  }
  // A wrapper is `display: contents`, which has no box to test, so test the
  // nearest element around it that has one.
  let host = element.parentElement;
  while (host && getComputedStyle(host).display === "contents") {
    host = host.parentElement;
  }
  return !host || isShown(host);
}

/**
 * Whether an entry's target can take its shortcut now. An entry with no
 * target is as available as its scope.
 * @param {ShortcutEntry} entry
 * @param {null | Element} modal
 * @returns {boolean}
 */
function canFire(entry, modal) {
  const node = entry.node;
  if (!node) return true;
  return isShortcutTarget(node) && (!modal || modal.contains(node));
}

/**
 * Scopes, innermost first. Of scopes at one depth, the newest comes first.
 * @param {ShortcutRoot} root
 * @returns {ShortcutScope[]}
 */
function innermostFirst(root) {
  return [...root.scopes].reverse().sort((a, b) => b.depth - a.depth);
}

/**
 * @param {ShortcutRoot} root
 * @param {Event} event
 */
function handleKeydown(root, event) {
  if (!(event instanceof KeyboardEvent)) return;
  if (event.defaultPrevented || event.repeat || isImeComposition(event)) {
    return;
  }
  const apple = isApplePlatform();
  const target = event.composedPath?.()[0] ?? event.target;
  const editable = isEditableTarget(target);
  /** @type {undefined | null | Element} */
  let modal;

  for (const scope of innermostFirst(root)) {
    /** @type {undefined | boolean} */
    let available;
    for (let i = scope.entries.length - 1; i >= 0; i--) {
      const entry = scope.entries[i];
      if (entry.typed && editable) continue;
      if (!matchesShortcut(event, entry.keys, { apple })) continue;
      available ??= scopeAvailable(scope);
      if (!available) break;
      if (entry.node && modal === undefined) modal = frontModal();
      if (!canFire(entry, modal ?? null)) continue;
      event.preventDefault();
      entry.onTrigger(event);
      return;
    }
  }
}

/**
 * @param {ShortcutScope} scope
 * @returns {string}
 */
function describeScope(scope) {
  return scope.name ? `the "${scope.name}" scope` : "the page scope";
}

/**
 * @returns {ShortcutRoot}
 */
function createRoot() {
  const store = writable(/** @type {ShortcutEntry[]} */ ([]));
  const batched = batchStoreUpdates(store);

  /** @type {ShortcutRoot} */
  const root = {
    scopes: [],
    entries: { subscribe: store.subscribe },
    notify() {
      batched(() => root.scopes.flatMap((scope) => scope.entries));
    },
    start() {
      return addPooledListener("keydown", (event) =>
        handleKeydown(root, event),
      );
    },
  };
  return root;
}

/**
 * Create a scope: the first scope of a new registry when `parent` is unset,
 * or an inner scope that shares its parent's registry.
 * @param {{ id: string; name?: string; parent?: ShortcutScope | null }} options
 * @returns {ShortcutScope}
 */
export function createShortcutScope({ id, name, parent = null }) {
  const root = parent ? parent.root : createRoot();

  /** @type {ShortcutScope} */
  const scope = {
    id,
    name,
    root,
    depth: parent ? parent.depth + 1 : 0,
    element: null,
    entries: [],

    register(spec, node = null) {
      /** @type {null | ShortcutEntry} */
      let entry = null;

      function remove() {
        if (!entry) return;
        scope.entries.splice(scope.entries.indexOf(entry), 1);
        entry = null;
        root.notify();
      }

      /** @param {ShortcutSpec} next */
      function update(next) {
        const parsed = parseShortcut(next.keys);
        if (!parsed) {
          console.warn(
            `[ShortcutProvider] "${next.keys}" is not a valid shortcut. Use modifiers and a key joined by "+", such as "mod+k".`,
          );
          remove();
          return;
        }
        if (entry && entry.keys === next.keys && entry.label === next.label) {
          entry.onTrigger = next.onTrigger;
          return;
        }
        // A changed shortcut is the latest registration, so it wins a tie.
        if (entry && entry.keys !== next.keys) remove();
        if (entry) {
          entry.label = next.label;
          entry.onTrigger = next.onTrigger;
        } else {
          const key = canonical(next.keys);
          const other = scope.entries.find((e) => canonical(e.keys) === key);
          if (other) {
            console.warn(
              `[ShortcutProvider] "${next.keys}" is registered twice in ${describeScope(scope)}: "${other.label}" and "${next.label}". The later one wins.`,
            );
          }
          entry = {
            keys: next.keys,
            label: next.label,
            scope,
            node,
            typed: isTyped(parsed),
            onTrigger: next.onTrigger,
          };
          scope.entries.push(entry);
        }
        root.notify();
      }

      update(spec);
      return { update, destroy: remove };
    },

    rekey(next) {
      if (typeof window === "undefined") return;
      if (scopesById.get(scope.id) === scope) scopesById.delete(scope.id);
      scope.id = next;
      scopesById.set(next, scope);
    },

    destroy() {
      if (typeof window !== "undefined" && scopesById.get(scope.id) === scope) {
        scopesById.delete(scope.id);
      }
      const index = root.scopes.indexOf(scope);
      if (index !== -1) root.scopes.splice(index, 1);
      if (scope.entries.length) {
        scope.entries = [];
        root.notify();
      }
    },
  };

  root.scopes.push(scope);
  if (typeof window !== "undefined") scopesById.set(id, scope);
  return scope;
}

/**
 * The scope of the `ShortcutProvider` around an element.
 * @param {Element} node
 * @returns {ShortcutScope | undefined}
 */
export function findShortcutScope(node) {
  const host = node.closest("[data-shortcut-scope]");
  return host ? scopesById.get(host.id) : undefined;
}

/**
 * The shortcuts a user can press now, grouped by scope, innermost scope
 * first: entries in open scopes whose target can take the key, minus those
 * an inner scope shadows. `list` is the registry's entries store.
 * @param {ShortcutRoot} root
 * @param {ReadonlyArray<ShortcutEntry>} list
 * @param {null | Element} [except] A dialog to ignore when looking for the modal in front, such as the help sheet.
 * @returns {Array<{ scope: string | undefined; entries: ShortcutEntry[] }>}
 */
export function activeShortcutGroups(root, list, except = null) {
  /** @type {Map<ShortcutScope, ShortcutEntry[]>} */
  const byScope = new Map();
  for (const entry of list) {
    const rows = byScope.get(entry.scope);
    if (rows) rows.push(entry);
    else byScope.set(entry.scope, [entry]);
  }

  const modal = typeof document === "undefined" ? null : frontModal(except);
  /** @type {Set<string>} */
  const claimed = new Set();
  /** @type {Array<{ scope: string | undefined; entries: ShortcutEntry[] }>} */
  const groups = [];

  for (const scope of innermostFirst(root)) {
    const rows = byScope.get(scope);
    if (!rows || !scopeAvailable(scope)) continue;
    /** @type {ShortcutEntry[]} */
    const shown = [];
    for (let i = rows.length - 1; i >= 0; i--) {
      const entry = rows[i];
      if (!canFire(entry, modal)) continue;
      const key = canonical(entry.keys);
      if (claimed.has(key)) continue;
      claimed.add(key);
      shown.unshift(entry);
    }
    if (!shown.length) continue;
    const group = groups.find((g) => g.scope === scope.name);
    if (group) group.entries.push(...shown);
    else groups.push({ scope: scope.name, entries: shown });
  }
  return groups;
}
