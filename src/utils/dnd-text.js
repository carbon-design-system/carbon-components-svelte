// @ts-check
// Strings and the live region for the drag and drop engine. Every string is
// a template that `translateWithId(id, values)` can replace, so an adapter
// needs one translation prop and no function props.

/**
 * @typedef {import("./dnd-text.js").DndTextValues} DndTextValues
 * @typedef {import("./dnd-text.js").DndTranslate} DndTranslate
 */

/**
 * Fill the `{name}` placeholders of a template.
 *
 * @param {string} template
 * @param {DndTextValues} values
 * @returns {string}
 */
export function formatText(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * A function that returns the string for an id: the translation from
 * `translateWithId` when it gives one, else the default template.
 *
 * @param {Record<string, string>} defaults
 * @param {() => DndTranslate | undefined} getTranslate
 * @returns {(id: string, values?: DndTextValues) => string}
 */
export function createTexts(defaults, getTranslate) {
  return (id, values = {}) => {
    const translated = getTranslate()?.(id, values);
    return translated ?? formatText(defaults[id] ?? id, values);
  };
}

/**
 * The strings every adapter shares. An adapter adds its own ids.
 */
export const DND_DEFAULT_TEXTS = {
  instructions:
    "Press Space to pick up. Use the arrow keys to move, Space to drop, and Escape to cancel.",
  handleLabel: "Reorder {label}",
  pickedUp: "Picked up {label}, position {position} of {count}.",
  moved: "{label} moved to position {position} of {count}.",
  movedList: "{label} moved to {name}, position {position} of {count}.",
  dropped: "Dropped {label} at position {position} of {count}.",
  droppedList: "Dropped {label} at {name}, position {position} of {count}.",
  cancelled: "Cancelled. {label} is back at position {position} of {count}.",
};

/** @type {WeakMap<Element, { status: HTMLElement, refs: number, flip: boolean }>} */
const regions = new WeakMap();

/**
 * One live region per host, shared by every zone in it, so a move between
 * zones is announced from a single place. The host is the nearest dialog, so
 * the announcement is not behind the dialog's inert backdrop.
 *
 * @param {Element} host
 */
export function acquireRegion(host) {
  let region = regions.get(host);
  if (!region) {
    const status = host.ownerDocument.createElement("div");
    status.className = "bx--visually-hidden";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "assertive");
    status.setAttribute("aria-atomic", "true");
    host.append(status);
    region = { status, refs: 0, flip: false };
    regions.set(host, region);
  }
  region.refs++;
  const shared = region;
  return {
    /** @param {string} message */
    say(message) {
      shared.flip = !shared.flip;
      // A repeated message is not announced again, so alternate its tail.
      shared.status.textContent = shared.flip ? message : `${message}​`;
    },
    release() {
      if (--shared.refs > 0) return;
      shared.status.remove();
      regions.delete(host);
    },
  };
}

/**
 * Where an overlay or live region goes: the nearest dialog, else the body.
 * @param {Element} node
 * @returns {Element}
 */
export function hostOf(node) {
  return (
    node.closest("dialog, [role='dialog'], [aria-modal='true']") ??
    node.ownerDocument.body
  );
}
