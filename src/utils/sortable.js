// @ts-check

import { getScrollableAncestors } from "./get-scrollable-ancestors.js";
import { resolveLayoutDirection } from "./inline-direction.js";
import { pointerDrag } from "./pointer-drag.js";
import {
  edgeScrollSpeed,
  indexToSlot,
  insertionSlot,
  liftedKeyAction,
  slotToIndex,
} from "./sortable-model.js";
import { uniqueId } from "./unique-id.js";

/**
 * @typedef {import("./sortable.js").SortableOptions} SortableOptions
 * @typedef {import("./sortable-model.js").SortDetail} SortDetail
 */

/**
 * @typedef {object} List
 * @property {HTMLElement} node
 * @property {SortableOptions} options
 * @property {string} name
 * @property {string} label
 * @property {boolean} disabled
 * @property {"vertical" | "horizontal"} orientation
 * @property {() => boolean} rtl
 * @property {() => HTMLElement[]} items
 * @property {() => number} count
 * @property {(item: HTMLElement, position: number) => number} indexOf
 * @property {(index: number) => HTMLElement | undefined} renderedAt
 * @property {(item: HTMLElement) => HTMLElement | null} targetOf
 * @property {() => HTMLElement[]} scrollers
 * @property {() => void} invalidate
 * @property {(item: HTMLElement) => string} labelOf
 * @property {(message: string) => void} announce
 * @property {(target: HTMLElement) => void} setActive
 */

/**
 * @typedef {object} Session
 * @property {"pointer" | "keyboard"} via
 * @property {List} origin
 * @property {List | null} dest
 * @property {HTMLElement} item
 * @property {string | undefined} id
 * @property {string} label
 * @property {number} oldIndex
 * @property {number | null} index - Final index in `dest`, or `null` over nothing.
 * @property {number} x
 * @property {number} y
 * @property {HTMLElement | null} ghost
 * @property {HTMLElement | null} indicator
 * @property {number} frame
 * @property {number} placeFrame
 * @property {number} reveals - Scrolls left to try for the current keyboard move.
 * @property {boolean} rtl
 * @property {number} lastTime
 * @property {number} edgeSince
 * @property {{ x: number, y: number }} carry
 * @property {() => void} dispose
 */

const PAGE_STEP = 10;
const SCROLLABLE = /(auto|scroll)/;
// A windowed list renders after a scroll, so a keyboard move may need a few
// scrolls before the slot it landed on is in view.
const REVEAL_TRIES = 8;
const SETTLE_MS = 150;
// Carbon's productive standard curve and moderate-01 duration.
const SETTLE_EASING = "cubic-bezier(0.2, 0, 0.38, 0.9)";
const FIELD =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
const DEFAULT_ROLE_DESCRIPTION = "sortable item";
const DEFAULT_INSTRUCTIONS =
  "Press Space to pick up. Use the arrow keys to move, Space to drop, and Escape to cancel.";

/** @type {Map<string, Set<List>>} Connected lists by group. Client-only. */
const groups = new Map();
/** @type {Session | null} */
let session = null;

/** @param {HTMLElement} item */
function defaultGetId(item) {
  const carrier = item.matches("[data-sortable-id]")
    ? item
    : item.querySelector("[data-sortable-id]");
  return carrier?.getAttribute("data-sortable-id") ?? (item.id || undefined);
}

/**
 * The item's text without its handle, whose glyph or hidden name is not part
 * of what the item is.
 * @param {HTMLElement} item
 * @param {HTMLElement | null} handle
 */
function defaultGetLabel(item, handle) {
  const carrier = item.matches("[data-sortable-label]")
    ? item
    : item.querySelector("[data-sortable-label]");
  let text = carrier?.getAttribute("data-sortable-label");
  if (text === null || text === undefined) {
    text = "";
    const walker = item.ownerDocument.createTreeWalker(
      item,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode())
      if (!handle || handle === item || !handle.contains(node))
        text += node.textContent;
  }
  return text.replace(/\s+/g, " ").trim();
}

/** @type {WeakMap<Element, { status: HTMLElement, refs: number, flip: boolean }>} */
const regions = new WeakMap();

/**
 * One live region per host, shared by every list in it, so a move between
 * lists is announced from a single place.
 * @param {Element} host
 */
function acquireRegion(host) {
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

/** @type {NonNullable<SortableOptions["pickedUpText"]>} */
function defaultPickedUpText({ label, position, count }) {
  return `Picked up ${label}, position ${position} of ${count}.`;
}

/** @type {NonNullable<SortableOptions["movedText"]>} */
function defaultMovedText({ label, position, count, name, listChanged }) {
  const where = listChanged && name ? `${name}, ` : "";
  return `${label} moved to ${where}position ${position} of ${count}.`;
}

/** @type {NonNullable<SortableOptions["droppedText"]>} */
function defaultDroppedText({ label, position, count, name, listChanged }) {
  const where = listChanged && name ? `${name}, ` : "";
  return `Dropped ${label} at ${where}position ${position} of ${count}.`;
}

/** @type {NonNullable<SortableOptions["cancelledText"]>} */
function defaultCancelledText({ label, position, count }) {
  return `Cancelled. ${label} is back at position ${position} of ${count}.`;
}

/** @type {NonNullable<SortableOptions["handleLabelText"]>} */
function defaultHandleLabelText({ label }) {
  return `Reorder ${label}`;
}

/**
 * @param {Element} element
 * @param {string} name
 * @param {string} value
 */
function setAttribute(element, name, value) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/** @param {HTMLElement} element */
function scrolls(element) {
  const { overflow, overflowX, overflowY } = getComputedStyle(element);
  return SCROLLABLE.test(overflow + overflowX + overflowY);
}

/**
 * Svelte action: reorder the items of a list by pointer or keyboard, and
 * optionally move them between connected lists.
 *
 * The action never moves an element or touches your data. While an item is
 * lifted it only marks the item, draws a drop indicator and a drag preview,
 * and scrolls. A drop dispatches a cancelable `sort` event; apply the move to
 * your data in its handler (see `applySort`) and the keyed list re-renders.
 * The action then slides the items that moved into place, unless the user
 * prefers reduced motion.
 *
 * Because it reads positions from the DOM, it works on any markup and with a
 * windowed list: an item's index is its `aria-posinset` when it has one.
 *
 * @param {HTMLElement} node
 * @param {SortableOptions} [options]
 * @returns {{ update: (options?: SortableOptions) => void, destroy: () => void }}
 */
export function sortable(node, options = {}) {
  let current = options;
  const doc = node.ownerDocument;
  const uid = uniqueId("ccs-sortable");
  const instructionsId = `${uid}-instructions`;

  /** @type {HTMLElement[]} */
  let cache = [];
  let dirty = true;
  /** @type {HTMLElement | null} */
  let activeTarget = null;
  /** @type {HTMLElement | null} */
  let pending = null;
  let stampFrame = 0;
  /** @type {HTMLElement[] | null} */
  let scrollerCache = null;
  /** @type {string | undefined} */
  let registeredGroup;

  // Inside a dialog, so the announcement is not behind its inert backdrop.
  const host = hostOf(node);
  const region = acquireRegion(host);
  const instructions = doc.createElement("div");
  instructions.id = instructionsId;
  instructions.hidden = true;
  host.append(instructions);

  /** @type {List} */
  const list = {
    node,
    get options() {
      return current;
    },
    get name() {
      return current.name ?? "";
    },
    get label() {
      return current.label ?? current.name ?? "";
    },
    get disabled() {
      return current.disabled === true;
    },
    get orientation() {
      return current.orientation === "horizontal" ? "horizontal" : "vertical";
    },
    rtl: () => resolveLayoutDirection(undefined, node) === "rtl",
    items,
    count() {
      const first = items()[0];
      const size = Number(first?.getAttribute("aria-setsize"));
      return size > 0 ? size : items().length;
    },
    indexOf,
    renderedAt(index) {
      const rendered = items();
      if (rendered.length === 0) return undefined;
      const offset = index - indexOf(rendered[0], 0);
      const item = rendered[offset];
      return item && indexOf(item, offset) === index ? item : undefined;
    },
    targetOf,
    scrollers() {
      if (!scrollerCache) {
        // From an item, so a scroll box between the item and `node` counts.
        const base = items()[0] ?? node;
        scrollerCache = /** @type {HTMLElement[]} */ (
          getScrollableAncestors(base).filter((el) => el instanceof HTMLElement)
        );
        if (base === node && scrolls(node)) scrollerCache.unshift(node);
      }
      return scrollerCache;
    },
    invalidate() {
      scrollerCache = null;
    },
    labelOf: (item) =>
      current.getLabel
        ? current.getLabel(item)
        : defaultGetLabel(item, targetOf(item)),
    announce: region.say,
    setActive(target) {
      if (activeTarget === target) return;
      if (activeTarget?.isConnected)
        setAttribute(activeTarget, "tabindex", "-1");
      activeTarget = target;
      if (current.roving !== false) setAttribute(target, "tabindex", "0");
    },
  };

  function items() {
    if (dirty) {
      cache = current.itemSelector
        ? /** @type {HTMLElement[]} */ (
            Array.from(node.querySelectorAll(current.itemSelector))
          )
        : /** @type {HTMLElement[]} */ (Array.from(node.children));
      dirty = false;
    }
    return cache;
  }

  /**
   * @param {HTMLElement} item
   * @param {number} position - Place among the rendered items.
   */
  function indexOf(item, position) {
    const posinset = Number(item.getAttribute("aria-posinset"));
    return Number.isInteger(posinset) && posinset >= 1
      ? posinset - 1
      : position;
  }

  /**
   * @param {HTMLElement} item
   * @returns {HTMLElement | null}
   */
  function targetOf(item) {
    return current.handleSelector
      ? item.querySelector(current.handleSelector)
      : item;
  }

  /** @param {Element | null} element */
  function itemOf(element) {
    if (!element || !node.contains(element)) return null;
    if (current.itemSelector) {
      const item = element.closest(current.itemSelector);
      return item && item !== node && node.contains(item)
        ? /** @type {HTMLElement} */ (item)
        : null;
    }
    /** @type {Element | null} */
    let candidate = element;
    while (candidate && candidate.parentElement !== node)
      candidate = candidate.parentElement;
    return /** @type {HTMLElement | null} */ (candidate);
  }

  // Stamp the semantics onto each keyboard target. The action owns these
  // attributes, so a consumer who sets them by hand gets the action's value.
  function stamp() {
    stampFrame = 0;
    const rendered = items();
    if (activeTarget && !activeTarget.isConnected) activeTarget = null;
    const roving = current.roving !== false;
    const role = current.roleDescriptionText ?? DEFAULT_ROLE_DESCRIPTION;
    instructions.textContent = current.instructionsText ?? DEFAULT_INSTRUCTIONS;

    rendered.forEach((item, position) => {
      const target = targetOf(item);
      if (!target) return;
      setAttribute(target, "aria-roledescription", role);
      const describedby = target.getAttribute("aria-describedby") ?? "";
      if (!describedby.split(" ").includes(instructionsId))
        target.setAttribute(
          "aria-describedby",
          `${describedby} ${instructionsId}`.trim(),
        );
      if (current.handleSelector) {
        setAttribute(target, "data-sortable-handle", "");
        if (
          target.hasAttribute("data-sortable-labelled") ||
          (!target.hasAttribute("aria-label") &&
            !target.hasAttribute("aria-labelledby") &&
            !target.textContent?.trim())
        ) {
          setAttribute(target, "data-sortable-labelled", "");
          setAttribute(
            target,
            "aria-label",
            (current.handleLabelText ?? defaultHandleLabelText)({
              label: list.labelOf(item),
            }),
          );
        }
      }
      if (roving) {
        const active = activeTarget ? target === activeTarget : position === 0;
        setAttribute(target, "tabindex", active ? "0" : "-1");
      }
      if (
        session &&
        session.origin === list &&
        session.via === "pointer" &&
        indexOf(item, position) === session.oldIndex
      )
        session.item = item;
    });
    refreshLifted();
  }

  function unstamp() {
    for (const item of items()) {
      const target = targetOf(item);
      if (!target) continue;
      target.removeAttribute("aria-roledescription");
      target.removeAttribute("data-sortable-handle");
      target.removeAttribute("tabindex");
      if (target.hasAttribute("data-sortable-labelled")) {
        target.removeAttribute("data-sortable-labelled");
        target.removeAttribute("aria-label");
      }
      const rest = (target.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .filter((id) => id && id !== instructionsId);
      if (rest.length > 0)
        target.setAttribute("aria-describedby", rest.join(" "));
      else target.removeAttribute("aria-describedby");
    }
  }

  function scheduleStamp() {
    if (stampFrame) return;
    stampFrame = requestAnimationFrame(stamp);
  }

  // The lifted item may be recreated while a windowed list scrolls.
  function refreshLifted() {
    if (!session || session.origin !== list) return;
    const rendered = items();
    for (let position = 0; position < rendered.length; position++) {
      const item = rendered[position];
      const lifted = indexOf(item, position) === session.oldIndex;
      if (lifted) {
        session.item = item;
        setAttribute(item, "data-sortable-lifted", "");
      } else if (item.hasAttribute("data-sortable-lifted")) {
        item.removeAttribute("data-sortable-lifted");
      }
    }
  }

  const observer =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          dirty = true;
          scheduleStamp();
          if (session) schedulePlace(session);
        });
  // A windowed list stamps `aria-posinset` after it inserts rows, and the
  // index of every row depends on it.
  observer?.observe(node, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-posinset"],
  });

  function register() {
    const group = current.group;
    if (group === registeredGroup) return;
    if (registeredGroup !== undefined)
      groups.get(registeredGroup)?.delete(list);
    registeredGroup = group;
    if (group === undefined) return;
    const set = groups.get(group) ?? new Set();
    groups.set(group, set);
    set.add(list);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (list.disabled || event.defaultPrevented || event.isComposing) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const item = itemOf(target);
    if (!item || !target || targetOf(item) !== target) return;

    if (session) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === " " || event.key === "Enter") {
      if (item.getAttribute("aria-disabled") === "true") return;
      event.preventDefault();
      swallowSpaceKeyup(doc);
      lift(list, item, "keyboard");
      return;
    }
    if (current.roving === false) return;
    const rendered = items();
    const position = rendered.indexOf(item);
    const action = liftedKeyAction(event.key, list.orientation, list.rtl());
    /** @type {HTMLElement | undefined} */
    let next;
    if (action === "back") next = rendered[position - 1];
    else if (action === "forward") next = rendered[position + 1];
    else if (event.key === "Home") next = rendered[0];
    else if (event.key === "End") next = rendered[rendered.length - 1];
    else return;
    event.preventDefault();
    const nextTarget = next && targetOf(next);
    if (nextTarget) nextTarget.focus();
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const item = itemOf(target);
    if (item && target && targetOf(item) === target) list.setActive(target);
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    if (session?.via !== "keyboard" || session.origin !== list) return;
    const next = event.relatedTarget;
    // `null` is a re-render or a click on nothing; a press cancels on its own.
    if (next instanceof Node && !node.contains(next)) cancel(session);
  }

  /** @param {Event} event */
  function preventSelection(event) {
    event.preventDefault();
  }

  /** @param {PointerEvent} event */
  function handlePress(event) {
    if (list.disabled || session) return false;
    const target = event.target instanceof Element ? event.target : null;
    const item = itemOf(target);
    if (!item || !target) return false;
    if (item.getAttribute("aria-disabled") === "true") return false;
    if (current.handleSelector) {
      const handle = target.closest(current.handleSelector);
      if (!handle || !item.contains(handle)) return false;
    } else if (event.pointerType === "touch" || target.closest(FIELD)) {
      // A finger on the item scrolls; a field keeps its selection.
      return false;
    }
    pending = item;
    doc.addEventListener("selectstart", preventSelection);
    return true;
  }

  /** @param {PointerEvent} event */
  function handleDragStart(event) {
    if (!pending) return;
    const s = lift(list, pending, "pointer");
    s.x = event.clientX;
    s.y = event.clientY;
  }

  /** @param {PointerEvent} event */
  function handleDragMove(event) {
    if (session?.via !== "pointer" || session.origin !== list) return;
    session.x = event.clientX;
    session.y = event.clientY;
    scheduleFrame(session);
  }

  /**
   * @param {PointerEvent} event
   * @param {boolean} dragged
   */
  function handleDragEnd(event, dragged) {
    pending = null;
    doc.removeEventListener("selectstart", preventSelection);
    if (!dragged || session?.via !== "pointer" || session.origin !== list)
      return;
    if (event.type !== "pointerup") {
      cancel(session);
      return;
    }
    session.x = event.clientX;
    session.y = event.clientY;
    frame(session, performance.now());
    drop(session);
  }

  function dragOptions() {
    return {
      capture: /** @type {const} */ ("drag"),
      threshold: current.threshold,
      enabled: !list.disabled,
      onStart: handlePress,
      onDragStart: handleDragStart,
      onMove: handleDragMove,
      onEnd: handleDragEnd,
    };
  }

  const drag = pointerDrag(node, dragOptions());

  node.addEventListener("keydown", handleKeydown);
  node.addEventListener("focusin", handleFocusin);
  node.addEventListener("focusout", handleFocusout);
  register();
  stamp();

  return {
    update(next = {}) {
      const reselect =
        next.itemSelector !== current.itemSelector ||
        next.handleSelector !== current.handleSelector ||
        next.roving !== current.roving;
      if (reselect) {
        unstamp();
        dirty = true;
        scrollerCache = null;
      }
      current = next;
      drag.update(dragOptions());
      register();
      scheduleStamp();
    },
    destroy() {
      if (session && (session.origin === list || session.dest === list))
        session.dispose();
      drag.destroy();
      observer?.disconnect();
      if (stampFrame) cancelAnimationFrame(stampFrame);
      node.removeEventListener("keydown", handleKeydown);
      node.removeEventListener("focusin", handleFocusin);
      node.removeEventListener("focusout", handleFocusout);
      doc.removeEventListener("selectstart", preventSelection);
      if (registeredGroup !== undefined) {
        const set = groups.get(registeredGroup);
        set?.delete(list);
        if (set?.size === 0) groups.delete(registeredGroup);
      }
      unstamp();
      instructions.remove();
      region.release();
    },
  };
}

/** @param {Element} node */
function hostOf(node) {
  return (
    node.closest("dialog, [role='dialog'], [aria-modal='true']") ??
    node.ownerDocument.body
  );
}

/**
 * The next enabled list of the group, in document order.
 * @param {List} from
 * @param {1 | -1} step
 * @returns {List | null}
 */
function neighborList(from, step) {
  const group = from.options.group;
  const set = group === undefined ? undefined : groups.get(group);
  if (!set) return null;
  const lists = [...set]
    .filter((candidate) => !candidate.disabled)
    .sort((a, b) =>
      a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    );
  const at = lists.indexOf(from);
  return at === -1 ? null : (lists[at + step] ?? null);
}

/**
 * @param {List} origin
 * @param {HTMLElement} item
 * @param {"pointer" | "keyboard"} via
 * @returns {Session}
 */
function lift(origin, item, via) {
  const doc = origin.node.ownerDocument;
  const rendered = origin.items();
  const oldIndex = origin.indexOf(item, rendered.indexOf(item));
  const label = origin.labelOf(item);
  const host = hostOf(origin.node);
  // Layout may have changed since the last drag.
  origin.invalidate();
  const group = origin.options.group;
  if (group !== undefined)
    for (const connected of groups.get(group) ?? []) connected.invalidate();

  const indicator = doc.createElement("div");
  indicator.className = "bx--sortable__indicator";
  indicator.setAttribute("aria-hidden", "true");
  indicator.hidden = true;
  indicator.dataset.orientation = origin.orientation;
  host.append(indicator);

  /** @type {HTMLElement | null} */
  let ghost = null;
  if (via === "pointer") {
    ghost = doc.createElement("div");
    ghost.className = "bx--sortable__ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = label;
    if (origin.rtl()) ghost.style.transform = "translateX(-100%)";
    host.append(ghost);
  }

  /** @param {KeyboardEvent} event */
  const onKeydown = (event) => {
    if (session === s) handleLiftedKey(event, s);
  };

  // A press while a keyboard move is under way abandons it.
  const cancelOnPress = () => {
    if (session === s && s.via === "keyboard") cancel(s);
  };

  /** @type {Session} */
  const s = {
    via,
    origin,
    dest: origin,
    item,
    id: (origin.options.getId ?? defaultGetId)(item),
    label,
    oldIndex,
    index: oldIndex,
    x: 0,
    y: 0,
    ghost,
    indicator,
    frame: 0,
    placeFrame: 0,
    reveals: 0,
    lastTime: 0,
    edgeSince: 0,
    carry: { x: 0, y: 0 },
    rtl: origin.rtl(),
    dispose() {
      if (session !== s) return;
      session = null;
      cancelAnimationFrame(s.frame);
      cancelAnimationFrame(s.placeFrame);
      ghost?.remove();
      indicator.remove();
      for (const lifted of origin.node.querySelectorAll(
        "[data-sortable-lifted]",
      ))
        lifted.removeAttribute("data-sortable-lifted");
      doc.removeEventListener("pointerdown", cancelOnPress, true);
      doc.removeEventListener("keydown", onKeydown, true);
    },
  };
  session = s;
  item.setAttribute("data-sortable-lifted", "");
  if (via === "keyboard") {
    doc.addEventListener("pointerdown", cancelOnPress, true);
    doc.addEventListener("keydown", onKeydown, true);
  }
  origin.announce(
    (origin.options.pickedUpText ?? defaultPickedUpText)({
      label,
      position: oldIndex + 1,
      count: origin.count(),
      name: origin.label,
      listChanged: false,
    }),
  );
  return s;
}

/**
 * Space activates a button on keyup, which would click the handle that just
 * took or gave up the item.
 * @param {Document} doc
 */
function swallowSpaceKeyup(doc) {
  doc.addEventListener(
    "keyup",
    (event) => {
      if (event.key === " ") event.preventDefault();
    },
    { capture: true, once: true },
  );
}

/**
 * Keys for a keyboard move. They are heard on the document, because a
 * windowed list can scroll the lifted item out of the DOM and take focus with
 * it.
 * @param {KeyboardEvent} event
 * @param {Session} s
 */
function handleLiftedKey(event, s) {
  const target = event.target;
  const doc = s.origin.node.ownerDocument;
  const inside =
    target === doc.body ||
    target === doc.documentElement ||
    (target instanceof Node &&
      (s.origin.node.contains(target) || s.dest?.node.contains(target)));
  if (!inside || event.isComposing) return;

  const key = event.key;
  if (key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    cancel(s);
    return;
  }
  if (key === " " || key === "Enter") {
    event.preventDefault();
    if (key === " ") swallowSpaceKeyup(doc);
    drop(s);
    return;
  }
  if (key === "Tab") {
    cancel(s);
    return;
  }
  const dest = s.dest ?? s.origin;
  const max = (dest === s.origin ? dest.count() - 1 : dest.count()) || 0;
  const index = s.index ?? s.oldIndex;
  let next = index;
  let nextDest = dest;
  const action = liftedKeyAction(key, dest.orientation, dest.rtl());
  if (action === "back") next = index - 1;
  else if (action === "forward") next = index + 1;
  else if (key === "Home") next = 0;
  else if (key === "End") next = max;
  else if (key === "PageUp") next = index - PAGE_STEP;
  else if (key === "PageDown") next = index + PAGE_STEP;
  else if (action === "prevList" || action === "nextList") {
    const neighbor = neighborList(dest, action === "nextList" ? 1 : -1);
    event.preventDefault();
    if (!neighbor) return;
    nextDest = neighbor;
  } else {
    // Other keys do nothing while an item is in the air.
    if (key.startsWith("Arrow")) event.preventDefault();
    return;
  }
  event.preventDefault();
  const nextMax =
    (nextDest === s.origin ? nextDest.count() - 1 : nextDest.count()) || 0;
  next = Math.min(Math.max(next, 0), nextMax);
  if (nextDest === dest && next === index) {
    // Already at the end: repeat the position so it is heard.
    announceMove(s, dest, index, false);
    return;
  }
  s.dest = nextDest;
  s.index = next;
  s.reveals = REVEAL_TRIES;
  announceMove(s, nextDest, next, nextDest !== dest);
  reveal(s);
  schedulePlace(s);
}

/**
 * @param {Session} s
 * @param {List} dest
 * @param {number} index
 * @param {boolean} listChanged
 */
function announceMove(s, dest, index, listChanged) {
  const count = dest === s.origin ? dest.count() : dest.count() + 1;
  s.origin.announce(
    (s.origin.options.movedText ?? defaultMovedText)({
      label: s.label,
      position: index + 1,
      count,
      name: dest.label,
      listChanged,
    }),
  );
}

/** @param {Session} s */
function cancel(s) {
  if (session !== s) return;
  const { origin, label, oldIndex, via } = s;
  s.dispose();
  origin.announce(
    (origin.options.cancelledText ?? defaultCancelledText)({
      label,
      position: oldIndex + 1,
      count: origin.count(),
      name: origin.label,
      listChanged: false,
    }),
  );
  if (via === "keyboard") focusIndex(origin, oldIndex, 0);
}

/** @param {Session} s */
function drop(s) {
  if (session !== s) return;
  const { origin, dest, index, via, label } = s;
  if (!dest || index === null) {
    cancel(s);
    return;
  }
  const sameList = dest === origin;
  s.dispose();

  if (sameList && index === s.oldIndex) {
    origin.announce(
      (origin.options.droppedText ?? defaultDroppedText)({
        label,
        position: index + 1,
        count: origin.count(),
        name: origin.label,
        listChanged: false,
      }),
    );
    if (via === "keyboard") focusIndex(origin, index, 0);
    return;
  }

  const lists = sameList ? [origin] : [origin, dest];
  const firsts = measure(lists);
  // A pointer drop appears where it was released, not at the old place.
  if (via === "pointer") firsts.delete(s.item);
  const count = sameList ? origin.count() : dest.count() + 1;

  /** @type {SortDetail} */
  const detail = {
    id: s.id,
    from: origin.name,
    to: dest.name,
    oldIndex: s.oldIndex,
    newIndex: index,
    source: via,
  };
  const accepted = dest.node.dispatchEvent(
    new CustomEvent("sort", { detail, bubbles: true, cancelable: true }),
  );
  if (!accepted) {
    origin.announce(
      (origin.options.cancelledText ?? defaultCancelledText)({
        label,
        position: s.oldIndex + 1,
        count: origin.count(),
        name: origin.label,
        listChanged: false,
      }),
    );
    if (via === "keyboard") focusIndex(origin, s.oldIndex, 0);
    return;
  }
  origin.announce(
    (origin.options.droppedText ?? defaultDroppedText)({
      label,
      position: index + 1,
      count,
      name: dest.label,
      listChanged: !sameList,
    }),
  );
  requestAnimationFrame(() => {
    animateMoved(lists, firsts);
    if (via === "keyboard") focusIndex(dest, index, 0);
  });
}

/**
 * Focus the keyboard target of the item at `index`. The consumer may apply
 * the move late, so wait for the item before giving up.
 * @param {List} list
 * @param {number} index
 * @param {number} attempt
 */
function focusIndex(list, index, attempt) {
  const item = list.renderedAt(index);
  const target = item && list.targetOf(item);
  if (target?.isConnected) {
    list.setActive(target);
    target.focus();
  } else if (attempt < 10) {
    setTimeout(() => focusIndex(list, index, attempt + 1), 50);
  }
}

/**
 * @param {List[]} lists
 * @returns {Map<Element, DOMRect>}
 */
function measure(lists) {
  const rects = new Map();
  for (const list of lists)
    for (const item of list.items())
      rects.set(item, item.getBoundingClientRect());
  return rects;
}

/**
 * FLIP: slide each item that moved from where it was to where it is. Only
 * items in view are animated, so moving across a long list stays cheap.
 * @param {List[]} lists
 * @param {Map<Element, DOMRect>} firsts
 */
function animateMoved(lists, firsts) {
  if (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  for (const list of lists) {
    for (const item of list.items()) {
      const first = firsts.get(item);
      if (!first || typeof item.animate !== "function") continue;
      const last = item.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      if (
        last.bottom < 0 ||
        last.top > innerHeight ||
        last.right < 0 ||
        last.left > innerWidth
      )
        continue;
      item.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: SETTLE_MS, easing: SETTLE_EASING },
      );
    }
  }
}

/** @param {Session} s */
function scheduleFrame(s) {
  if (s.frame) return;
  s.frame = requestAnimationFrame((now) => {
    s.frame = 0;
    if (session === s) frame(s, now);
  });
}

/** @param {Session} s */
function schedulePlace(s) {
  if (s.placeFrame) return;
  s.placeFrame = requestAnimationFrame(() => {
    s.placeFrame = 0;
    if (session === s) place(s);
  });
}

/**
 * One animation frame of a pointer drag: scroll near an edge, find the slot
 * under the pointer, and move the preview.
 * @param {Session} s
 * @param {number} now
 */
function frame(s, now) {
  const dt = s.lastTime ? Math.min(now - s.lastTime, 64) : 16;
  s.lastTime = now;
  const scrolling = autoScroll(s, dt, now);

  const dest = listAt(s);
  if (dest) {
    const rendered = dest.items();
    const horizontal = dest.orientation === "horizontal";
    const flip = horizontal && dest.rtl();
    const pointer = horizontal ? (flip ? -s.x : s.x) : s.y;
    const midpoint = (/** @type {number} */ i) => {
      const rect = rendered[i].getBoundingClientRect();
      if (!horizontal) return (rect.top + rect.bottom) / 2;
      const mid = (rect.left + rect.right) / 2;
      return flip ? -mid : mid;
    };
    const rendering = insertionSlot(rendered.length, midpoint, pointer);
    let slot = 0;
    if (rendered.length > 0) {
      slot =
        rendering < rendered.length
          ? dest.indexOf(rendered[rendering], rendering)
          : dest.indexOf(rendered[rendered.length - 1], rendered.length - 1) +
            1;
    }
    s.dest = dest;
    s.index = slotToIndex(slot, s.oldIndex, dest === s.origin);
  } else {
    s.dest = null;
    s.index = null;
  }
  place(s);
  if (scrolling) scheduleFrame(s);
}

/**
 * @param {List} list
 * @returns {{ left: number, top: number, right: number, bottom: number }}
 */
function visibleRect(list) {
  const { left, top, right, bottom } = list.node.getBoundingClientRect();
  const visible = { left, top, right, bottom };
  for (const scroller of list.scrollers()) {
    const rect = scroller.getBoundingClientRect();
    visible.left = Math.max(visible.left, rect.left);
    visible.top = Math.max(visible.top, rect.top);
    visible.right = Math.min(visible.right, rect.right);
    visible.bottom = Math.min(visible.bottom, rect.bottom);
  }
  return visible;
}

/** How far outside a list a drop still counts as inside it. */
const DROP_SLACK = 24;

/**
 * @param {Session} s
 * @returns {List | null}
 */
function listAt(s) {
  const group = s.origin.options.group;
  /** @type {Set<List>} */
  const candidates = new Set([s.dest ?? s.origin]);
  const connected =
    group === undefined ? [s.origin] : [...(groups.get(group) ?? [])];
  for (const list of connected) candidates.add(list);
  for (const list of candidates) {
    if (list.disabled || !list.node.isConnected) continue;
    const rect = visibleRect(list);
    if (
      s.x >= rect.left - DROP_SLACK &&
      s.x <= rect.right + DROP_SLACK &&
      s.y >= rect.top - DROP_SLACK &&
      s.y <= rect.bottom + DROP_SLACK
    )
      return list;
  }
  return null;
}

/**
 * Scroll whichever container the pointer is pressing against, innermost
 * first, then the page. Returns whether another frame is needed.
 * @param {Session} s
 * @param {number} dt
 * @param {number} now
 */
function autoScroll(s, dt, now) {
  const list = s.dest ?? s.origin;
  const page = list.node.ownerDocument.scrollingElement;
  const scrollers = page ? [...list.scrollers(), page] : list.scrollers();
  const held = s.edgeSince ? now - s.edgeSince : 0;
  let pressing = false;
  let moved = false;

  for (const axis of /** @type {const} */ (["y", "x"])) {
    for (const el of scrollers) {
      const rect =
        el === page
          ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight }
          : el.getBoundingClientRect();
      const along = axis === "y" ? s.y : s.x;
      const across = axis === "y" ? s.x : s.y;
      const crossStart = axis === "y" ? rect.left : rect.top;
      const crossEnd = axis === "y" ? rect.right : rect.bottom;
      if (across < crossStart - DROP_SLACK || across > crossEnd + DROP_SLACK)
        continue;
      const speed = edgeScrollSpeed({
        pointer: along,
        start: axis === "y" ? rect.top : rect.left,
        end: axis === "y" ? rect.bottom : rect.right,
        held,
      });
      if (speed === 0) continue;
      const room =
        axis === "y"
          ? el.scrollHeight - el.clientHeight
          : el.scrollWidth - el.clientWidth;
      const position = axis === "y" ? el.scrollTop : el.scrollLeft;
      // A right-to-left scroller counts from 0 down to -room.
      const rtlX = axis === "x" && s.rtl;
      const min = rtlX ? -room : 0;
      const max = rtlX ? 0 : room;
      if (
        (speed < 0 && position <= min + 0.5) ||
        (speed > 0 && position >= max - 0.5)
      )
        continue;
      pressing = true;
      s.carry[axis] += (speed * dt) / 1000;
      const whole = Math.trunc(s.carry[axis]);
      s.carry[axis] -= whole;
      if (whole !== 0) {
        if (axis === "y") el.scrollTop = position + whole;
        else el.scrollLeft = position + whole;
        moved = true;
      }
      break;
    }
  }
  s.edgeSince = pressing ? s.edgeSince || now : 0;
  return pressing || moved;
}

/**
 * Where the drop indicator goes for `slot` of `list`, in viewport pixels, or
 * `null` when that gap is not rendered or is scrolled out of view.
 * @param {List} list
 * @param {number} slot
 */
function slotGeometry(list, slot) {
  const horizontal = list.orientation === "horizontal";
  const flip = horizontal && list.rtl();
  const nextRect = list.renderedAt(slot)?.getBoundingClientRect();
  const prevRect = list.renderedAt(slot - 1)?.getBoundingClientRect();
  const rect =
    nextRect ??
    prevRect ??
    (list.items().length === 0 ? list.node.getBoundingClientRect() : null);
  if (!rect) return null;

  /**
   * @param {DOMRect} box
   * @param {boolean} leading - The edge where the item starts, else ends.
   */
  const edgeOf = (box, leading) => {
    if (!horizontal) return leading ? box.top : box.bottom;
    if (flip) return leading ? box.right : box.left;
    return leading ? box.left : box.right;
  };
  // Between two items the line sits in the middle of the gap.
  let edge;
  if (nextRect && prevRect)
    edge = (edgeOf(nextRect, true) + edgeOf(prevRect, false)) / 2;
  else edge = edgeOf(rect, Boolean(nextRect) || !prevRect);

  const visible = visibleRect(list);
  const from = horizontal ? visible.left : visible.top;
  const to = horizontal ? visible.right : visible.bottom;
  if (edge < from - 1 || edge > to + 1) return null;
  return horizontal
    ? { x: edge - 1, y: rect.top, length: rect.height }
    : { x: rect.left, y: edge - 1, length: rect.width };
}

/** @param {Session} s */
function place(s) {
  const { ghost, indicator, dest, index } = s;
  if (ghost) {
    ghost.style.left = `${s.rtl ? s.x - 12 : s.x + 12}px`;
    ghost.style.top = `${s.y + 12}px`;
  }
  if (!indicator) return;
  const moved =
    dest && index !== null && !(dest === s.origin && index === s.oldIndex);
  const geometry = moved
    ? slotGeometry(dest, indexToSlot(index, s.oldIndex, dest === s.origin))
    : null;
  if (!geometry || !dest) {
    indicator.hidden = true;
    if (moved && s.via === "keyboard" && s.reveals > 0) {
      s.reveals--;
      reveal(s);
      schedulePlace(s);
    }
    return;
  }
  s.reveals = 0;
  const horizontal = dest.orientation === "horizontal";
  indicator.hidden = false;
  indicator.dataset.orientation = dest.orientation;
  indicator.style.left = `${geometry.x}px`;
  indicator.style.top = `${geometry.y}px`;
  indicator.style[horizontal ? "height" : "width"] = `${geometry.length}px`;
}

/**
 * Bring the slot a keyboard move landed on into view. A windowed list may not
 * have rendered it yet, so scroll to where the rows say it will be, which
 * puts it in the middle of the box and lets the list render around it.
 * @param {Session} s
 */
function reveal(s) {
  const dest = s.dest;
  if (!dest || s.index === null) return;
  const slot = indexToSlot(s.index, s.oldIndex, dest === s.origin);
  const anchor = dest.renderedAt(slot) ?? dest.renderedAt(slot - 1);
  if (anchor) {
    anchor.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    return;
  }
  const rendered = dest.items();
  if (rendered.length === 0) return;
  const horizontal = dest.orientation === "horizontal";
  const sign = horizontal && dest.rtl() ? -1 : 1;
  /** @param {DOMRect} box */
  const startOf = (box) => {
    if (!horizontal) return box.top;
    return sign === 1 ? box.left : box.right;
  };

  const lastAt = rendered.length - 1;
  const first = rendered[0].getBoundingClientRect();
  const last = rendered[lastAt].getBoundingClientRect();
  const firstIndex = dest.indexOf(rendered[0], 0);
  const lastIndex = dest.indexOf(rendered[lastAt], lastAt);
  // How far each row advances, margins and gaps included.
  const advance =
    lastAt > 0
      ? (sign * (startOf(last) - startOf(first))) / (lastIndex - firstIndex)
      : horizontal
        ? first.width
        : first.height;
  const before = slot < firstIndex;
  const edge = before ? startOf(first) : startOf(last);
  const edgeIndex = before ? firstIndex : lastIndex;
  const target = edge + sign * (slot - edgeIndex) * advance;

  const scroller =
    dest.scrollers()[0] ?? dest.node.ownerDocument.scrollingElement;
  if (!scroller) return;
  const view =
    scroller === dest.node.ownerDocument.scrollingElement
      ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight }
      : scroller.getBoundingClientRect();
  const middle = horizontal
    ? (view.left + view.right) / 2
    : (view.top + view.bottom) / 2;
  if (horizontal) scroller.scrollLeft += target - middle;
  else scroller.scrollTop += target - middle;
}
