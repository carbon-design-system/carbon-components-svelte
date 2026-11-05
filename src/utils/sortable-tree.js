// @ts-check
// The tree adapter of the drag and drop engine: a zone whose items are the
// rows of a tree, and whose drop positions are "before", "inside" or "after"
// a row. The data model stays the consumer's: a drop dispatches a cancelable
// `move`, and `applyTreeMove` returns the new nodes.

import { PAGE_STEP, treePosition } from "./dnd-math.js";
import { createTexts, DND_DEFAULT_TEXTS } from "./dnd-text.js";
import { getDnd, nextId } from "./dnd.js";
import { getScrollableAncestors } from "./get-scrollable-ancestors.js";
import { resolveLayoutDirection } from "./inline-direction.js";

/**
 * @typedef {import("./sortable-tree.js").SortableTreeOptions} SortableTreeOptions
 * @typedef {import("./sortable-tree.js").TreeMoveDetail} TreeMoveDetail
 * @typedef {import("./dnd.js").DndZone} DndZone
 * @typedef {import("./dnd.js").DndPosition} DndPosition
 * @typedef {import("./dnd.js").DndSession} DndSessionLike
 * @typedef {DndPosition & { targetId: string, position: "before" | "inside" | "after" | "home", row: HTMLElement }} TreePos
 */

const TEXTS = {
  ...DND_DEFAULT_TEXTS,
  roleDescription: "movable item",
  instructions:
    "Press Space to pick up. Use the up and down arrow keys to choose where it goes, Space to drop, and Escape to cancel.",
  handleLabel: "Move {label}",
  pickedUp: "Picked up {label}.",
  moved: "{label} is back in its place.",
  movedBefore: "{label} moved before {target}.",
  movedInside: "{label} moved inside {target}.",
  movedAfter: "{label} moved after {target}.",
  dropped: "Dropped {label} in its place.",
  droppedBefore: "Dropped {label} before {target}.",
  droppedInside: "Dropped {label} inside {target}.",
  droppedAfter: "Dropped {label} after {target}.",
  cancelled: "Cancelled. {label} is back in its place.",
};

const DEFAULT_ROW = "[role='treeitem']";
const DEFAULT_ID = "data-tree-row-id";
const LIFT_SHORTCUT = "Alt+M";

/**
 * @param {Element} element
 * @param {string} name
 * @param {string} value
 */
function setAttribute(element, name, value) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/**
 * Svelte action: move the rows of a tree by pointer or keyboard, to before,
 * inside or after another row.
 *
 * The action never moves an element or touches your data. A drop dispatches a
 * cancelable `move` with the row, the row it lands on, and the side; apply it
 * with `applyTreeMove` and the tree re-renders. A row cannot be dropped on
 * itself or inside its own descendants, and `canDrop` can veto any other.
 *
 * It reads the rows from the DOM (`role="treeitem"` and `data-tree-row-id`),
 * which `TreeView` renders, so it is an example of an adapter and not a
 * feature of `TreeView`: the same engine drives lists and grids.
 *
 * Pointer: press a row, or the handle inside it, and drag. Keyboard: press
 * Space or Enter on a handle, or Alt+M on a focused row, then the up and down
 * arrows to step through the places a row can go.
 *
 * @param {HTMLElement} node
 * @param {SortableTreeOptions} [options]
 * @returns {{ update: (options?: SortableTreeOptions) => void, destroy: () => void }}
 */
export function sortableTree(node, options = {}) {
  let current = options;
  const doc = node.ownerDocument;
  const dnd = getDnd();
  const uid = nextId("ccs-tree-dnd");
  const instructionsId = `${uid}-instructions`;
  const text = createTexts(TEXTS, () => current.translateWithId);
  const rowSelector = () => current.rowSelector ?? DEFAULT_ROW;
  const idAttribute = () => current.idAttribute ?? DEFAULT_ID;

  /** @type {HTMLElement | null} */
  let over = null;
  // Focus goes back to what had it: the handle, or the row itself.
  let liftedFromRow = false;
  /** @type {HTMLElement[] | null} */
  let scrollerCache = null;
  let stampFrame = 0;

  const instructions = doc.createElement("div");
  instructions.id = instructionsId;
  instructions.hidden = true;
  (
    node.closest("dialog, [role='dialog'], [aria-modal='true']") ?? doc.body
  ).append(instructions);

  /** @returns {HTMLElement[]} Every rendered row, in order. */
  function rows() {
    return /** @type {HTMLElement[]} */ (
      Array.from(node.querySelectorAll(rowSelector()))
    );
  }

  /**
   * The box of a row: its label, since a parent's own element holds its
   * children too.
   * @param {HTMLElement} row
   * @returns {HTMLElement}
   */
  function boxOf(row) {
    return /** @type {HTMLElement} */ (
      row.querySelector(":scope > .bx--tree-node__label") ?? row
    );
  }

  /** @param {HTMLElement} row */
  const idOf = (row) => row.getAttribute(idAttribute()) ?? row.id;

  /**
   * The row's own text, without its handle, whose hidden name is not part of
   * what the row is.
   * @param {HTMLElement} row
   */
  function labelOf(row) {
    if (current.getLabel) return current.getLabel(row);
    const box = boxOf(row);
    const handle = handleOf(row);
    let label = "";
    const walker = box.ownerDocument.createTreeWalker(
      box,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode())
      if (!handle?.contains(node)) label += node.textContent;
    return label.replace(/\s+/g, " ").trim();
  }

  /** @param {HTMLElement} row */
  function handleOf(row) {
    return current.handleSelector
      ? /** @type {HTMLElement | null} */ (
          boxOf(row).querySelector(current.handleSelector)
        )
      : null;
  }

  /** @param {Element | null} element */
  function rowOf(element) {
    const row = element?.closest(rowSelector());
    return row && node.contains(row) ? /** @type {HTMLElement} */ (row) : null;
  }

  /**
   * @param {HTMLElement} row
   * @returns {HTMLElement[]} The rows of its subtree, itself excluded.
   */
  function descendants(row) {
    return /** @type {HTMLElement[]} */ (
      Array.from(row.querySelectorAll(rowSelector()))
    );
  }

  /** @param {HTMLElement} row */
  const expanded = (row) =>
    row.getAttribute("aria-expanded") === "true" && descendants(row).length > 0;

  /**
   * @param {HTMLElement} row
   * @param {TreePos["position"]} position
   * @returns {TreePos}
   */
  function at(row, position) {
    const targetId = idOf(row);
    return /** @type {TreePos} */ ({
      zone,
      key: `${targetId}:${position}`,
      targetId,
      position,
      row,
    });
  }

  /**
   * A drop on `row`, reduced to the place it means. The bottom of an expanded
   * parent is before its first child, so every place has one name.
   * @param {HTMLElement} row
   * @param {"before" | "inside" | "after"} position
   */
  function placed(row, position) {
    if (position === "after" && expanded(row)) {
      const first = descendants(row)[0];
      return at(first, "before");
    }
    return at(row, position);
  }

  /**
   * @param {DndSessionLike} s
   * @param {TreePos} p
   */
  function allowed(s, p) {
    if (p.position === "home") return true;
    const source = s.item.closest(rowSelector());
    // Never into itself or its own subtree.
    if (source && (source === p.row || source.contains(p.row))) return false;
    if (!current.canDrop) return true;
    return current.canDrop(detailOf(s, p));
  }

  /**
   * @param {DndSessionLike} s
   * @param {TreePos} p
   * @returns {TreeMoveDetail}
   */
  function detailOf(s, p) {
    return {
      id: s.source.id ?? "",
      targetId: p.targetId,
      position: /** @type {"before" | "inside" | "after"} */ (p.position),
      source: s.via,
    };
  }

  /** The places the keyboard steps through, in order. */
  function sequence(/** @type {DndSessionLike} */ s) {
    const dragged = s.item.closest(rowSelector());
    const all = rows();
    /** @type {TreePos[]} */
    const seq = [];
    if (all[0] && all[0] !== dragged) seq.push(at(all[0], "before"));

    // The last row of a group can also leave it: after each ancestor.
    /** @param {HTMLElement} row */
    const pushLeaving = (row) => {
      /** @type {HTMLElement} */
      let walker = row;
      for (;;) {
        const parent = rowOf(walker.parentElement);
        if (!parent || parent === dragged) break;
        const kids = descendants(parent).filter(
          (r) => rowOf(r.parentElement) === parent,
        );
        if (kids[kids.length - 1] !== walker) break;
        seq.push(at(parent, "after"));
        walker = parent;
      }
    };

    for (let i = 0; i < all.length; i++) {
      const row = all[i];
      if (row === dragged) {
        seq.push(/** @type {TreePos} */ (s.home));
        pushLeaving(row);
        // Skip the subtree, which is moving with it.
        i += descendants(row).length;
        continue;
      }
      seq.push(at(row, "inside"));
      if (expanded(row)) {
        // Its first child's "before" is the place after its own label.
        const first = descendants(row)[0];
        if (first !== dragged) seq.push(at(first, "before"));
      } else {
        seq.push(at(row, "after"));
        pushLeaving(row);
      }
    }
    return seq;
  }

  /** @param {HTMLElement | null} next */
  function setOver(next) {
    if (over === next) return;
    over?.removeAttribute("data-dnd-over");
    over = next;
    over?.setAttribute("data-dnd-over", "");
  }

  // Stamp the handles and rows, like `sortable` does for a list.
  function stamp() {
    stampFrame = 0;
    instructions.textContent = text("instructions");
    const role = text("roleDescription");
    for (const row of rows()) {
      setAttribute(row, "aria-keyshortcuts", LIFT_SHORTCUT);
      const handle = handleOf(row);
      if (!handle) continue;
      setAttribute(handle, "aria-roledescription", role);
      setAttribute(handle, "data-dnd-handle", "");
      // The tree is one tab stop; a handle reaches by pointer and by touch.
      setAttribute(handle, "tabindex", "-1");
      const describedby = handle.getAttribute("aria-describedby") ?? "";
      if (!describedby.split(" ").includes(instructionsId))
        handle.setAttribute(
          "aria-describedby",
          `${describedby} ${instructionsId}`.trim(),
        );
      if (
        handle.hasAttribute("data-dnd-labelled") ||
        (!handle.hasAttribute("aria-label") &&
          !handle.hasAttribute("aria-labelledby") &&
          !handle.textContent?.trim())
      ) {
        setAttribute(handle, "data-dnd-labelled", "");
        setAttribute(
          handle,
          "aria-label",
          text("handleLabel", { label: labelOf(row) }),
        );
      }
    }
    dnd.notify(zone);
  }

  function unstamp() {
    for (const row of rows()) {
      row.removeAttribute("aria-keyshortcuts");
      const handle = handleOf(row);
      if (!handle) continue;
      handle.removeAttribute("aria-roledescription");
      handle.removeAttribute("data-dnd-handle");
      handle.removeAttribute("tabindex");
      if (handle.hasAttribute("data-dnd-labelled")) {
        handle.removeAttribute("data-dnd-labelled");
        handle.removeAttribute("aria-label");
      }
      const rest = (handle.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .filter((id) => id && id !== instructionsId);
      if (rest.length > 0)
        handle.setAttribute("aria-describedby", rest.join(" "));
      else handle.removeAttribute("aria-describedby");
    }
  }

  const observer =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          if (stampFrame) return;
          stampFrame = requestAnimationFrame(stamp);
        });
  observer?.observe(node, { childList: true, subtree: true });

  /** @type {DndZone} */
  const zone = {
    node,
    get group() {
      return undefined;
    },
    get name() {
      return current.name ?? "";
    },
    get disabled() {
      return current.disabled === true;
    },
    orientation: "vertical",
    rtl: () => resolveLayoutDirection(undefined, node) === "rtl",
    text,

    sourceAt(target, via, event) {
      const row = rowOf(target);
      if (!row || row.getAttribute("aria-disabled") === "true") return null;
      const handle = handleOf(row);
      if (via === "keyboard") {
        const key = /** @type {KeyboardEvent} */ (event);
        const onHandle = Boolean(handle) && handle === target;
        // A focused row lifts with Alt+M; a focused handle with Space or Enter.
        const onRow = target === row && key.altKey && key.code === "KeyM";
        const plain = !key.altKey && (key.key === " " || key.key === "Enter");
        if (!(onRow || (onHandle && plain))) return null;
        liftedFromRow = onRow;
      } else if (current.handleSelector) {
        const pressed = target.closest(current.handleSelector);
        if (!pressed || !row.contains(pressed)) return null;
      } else if (/** @type {PointerEvent} */ (event).pointerType === "touch") {
        // A finger on a row scrolls.
        return null;
      }
      return {
        item: boxOf(row),
        id: idOf(row),
        label: labelOf(row),
        index: rows().indexOf(row),
      };
    },

    home(source) {
      const row = /** @type {HTMLElement} */ (
        source.item.closest(rowSelector())
      );
      return at(row, "home");
    },

    collide(_x, y, s) {
      const all = rows();
      if (all.length === 0) return null;
      // The row under the pointer: the first whose box ends below it.
      let low = 0;
      let high = all.length;
      while (low < high) {
        const mid = (low + high) >> 1;
        if (boxOf(all[mid]).getBoundingClientRect().bottom <= y) low = mid + 1;
        else high = mid;
      }
      const row = all[Math.min(low, all.length - 1)];
      const rect = boxOf(row).getBoundingClientRect();
      const dragged = s.item.closest(rowSelector());
      if (row === dragged) return /** @type {TreePos} */ (s.home);
      const place = treePosition(rect.top, rect.height, y);
      const p = placed(row, place);
      // A place inside the moving subtree is no place.
      if (dragged?.contains(p.row)) return null;
      return allowed(s, p) ? p : null;
    },

    step(s, from, intent) {
      const seq = sequence(s);
      let at0 = seq.findIndex((p) => p.key === from.key);
      if (at0 === -1) at0 = seq.findIndex((p) => p.key === s.home.key);
      let next = at0;
      if (intent === "back") next = at0 - 1;
      else if (intent === "forward") next = at0 + 1;
      else if (intent === "start") next = 0;
      else if (intent === "end") next = seq.length - 1;
      else if (intent === "pageBack") next = at0 - PAGE_STEP;
      else if (intent === "pageForward") next = at0 + PAGE_STEP;
      else return null;
      // Skip places the consumer vetoes, in the direction of travel.
      const dir = next >= at0 ? 1 : -1;
      next = Math.min(Math.max(next, 0), seq.length - 1);
      while (next >= 0 && next < seq.length && !allowed(s, seq[next]))
        next += dir;
      return seq[next] ?? null;
    },

    describe(_s, p) {
      const pos = /** @type {TreePos} */ (p);
      const all = rows();
      return {
        position: all.indexOf(pos.row) + 1,
        count: all.length,
        name: current.label ?? current.name ?? "",
        target: pos.position === "home" ? "" : labelOf(pos.row),
        variant:
          pos.position === "home"
            ? ""
            : pos.position[0].toUpperCase() + pos.position.slice(1),
      };
    },

    indicate(_s, p, indicator) {
      const pos = /** @type {TreePos | null} */ (p);
      if (!pos) {
        setOver(null);
        indicator.hidden = true;
        return true;
      }
      const box = boxOf(pos.row);
      if (pos.position === "inside") {
        setOver(box);
        indicator.hidden = true;
        return true;
      }
      setOver(null);
      const rect = box.getBoundingClientRect();
      const view = visibleBox();
      const edge = pos.position === "before" ? rect.top : rect.bottom;
      if (edge < view.top - 1 || edge > view.bottom + 1) return false;
      indicator.dataset.orientation = "vertical";
      indicator.style.left = `${rect.left}px`;
      indicator.style.top = `${edge - 1}px`;
      indicator.style.width = `${rect.width}px`;
      return true;
    },

    reveal(_s, p) {
      /** @type {TreePos} */ (p).row.scrollIntoView?.({ block: "nearest" });
    },

    commit(s, p) {
      return node.dispatchEvent(
        new CustomEvent("move", {
          detail: detailOf(s, /** @type {TreePos} */ (p)),
          bubbles: true,
          cancelable: true,
        }),
      );
    },

    scrollers() {
      if (!scrollerCache) {
        const base = rows()[0] ?? node;
        scrollerCache = /** @type {HTMLElement[]} */ (
          getScrollableAncestors(base).filter((el) => el instanceof HTMLElement)
        );
      }
      return scrollerCache;
    },

    invalidate() {
      scrollerCache = null;
    },

    restoreFocus(s) {
      focusRow(s.source.id ?? "", 0);
    },

    itemFor(s) {
      const row = rows().find((r) => idOf(r) === s.source.id);
      return row ? boxOf(row) : undefined;
    },
  };

  function visibleBox() {
    const { left, top, right, bottom } = node.getBoundingClientRect();
    const visible = { left, top, right, bottom };
    for (const scroller of zone.scrollers()) {
      const rect = scroller.getBoundingClientRect();
      visible.top = Math.max(visible.top, rect.top);
      visible.bottom = Math.min(visible.bottom, rect.bottom);
    }
    return visible;
  }

  /**
   * Focus the row (or its handle) of a moved node. The consumer may apply the
   * move late, so wait for the row before giving up.
   * @param {string} id
   * @param {number} attempt
   */
  function focusRow(id, attempt) {
    const row = rows().find((r) => idOf(r) === id);
    if (row?.isConnected) {
      (liftedFromRow ? row : (handleOf(row) ?? row)).focus();
    } else if (attempt < 10) {
      setTimeout(() => focusRow(id, attempt + 1), 50);
    }
  }

  const connection = dnd.connect(zone, { threshold: () => current.threshold });
  stamp();

  return {
    update(next = {}) {
      const reselect =
        next.handleSelector !== current.handleSelector ||
        next.rowSelector !== current.rowSelector;
      if (reselect) unstamp();
      current = next;
      connection.refresh();
      if (!stampFrame) stampFrame = requestAnimationFrame(stamp);
    },
    destroy() {
      connection.destroy();
      observer?.disconnect();
      if (stampFrame) cancelAnimationFrame(stampFrame);
      setOver(null);
      unstamp();
      instructions.remove();
    },
  };
}

/**
 * Apply a `move` event to `TreeView`-shaped nodes (`{ id, nodes? }`) without
 * mutating them. The node and its children move to before, inside (as the
 * last child) or after the target. An unknown id, or a target inside the
 * moved node, leaves the nodes as they were.
 *
 * @template {{ id: string | number }} T
 * @param {ReadonlyArray<T>} nodes
 * @param {TreeMoveDetail} detail
 * @param {string} [childrenKey] - The property that holds a node's children.
 * @returns {T[]}
 */
export function applyTreeMove(nodes, detail, childrenKey = "nodes") {
  const { id, targetId, position } = detail;
  if (String(id) === String(targetId)) return nodes.slice();
  /** @param {T} node @returns {T[] | undefined} */
  const kids = (node) =>
    /** @type {T[] | undefined} */ (
      /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (node))[
        childrenKey
      ]
    );
  /** @param {T} node @param {T[]} children @returns {T} */
  const withKids = (node, children) => ({ ...node, [childrenKey]: children });
  /** @type {T | undefined} */
  let moved;
  /** @param {ReadonlyArray<T>} list @returns {T[]} */
  const withoutMoved = (list) => {
    /** @type {T[]} */
    const kept = [];
    for (const node of list) {
      if (String(node.id) === String(id)) {
        moved = node;
        continue;
      }
      const children = kids(node);
      kept.push(children ? withKids(node, withoutMoved(children)) : node);
    }
    return kept;
  };
  const trimmed = withoutMoved(nodes);
  if (!moved) return nodes.slice();
  const item = moved;
  let inserted = false;
  /** @param {ReadonlyArray<T>} list @returns {T[]} */
  const insert = (list) => {
    /** @type {T[]} */
    const next = [];
    for (const node of list) {
      const hit = String(node.id) === String(targetId);
      const children = kids(node);
      if (hit && position === "before") {
        next.push(item);
        inserted = true;
      }
      if (hit && position === "inside") {
        next.push(withKids(node, [...(children ?? []), item]));
        inserted = true;
        continue;
      }
      next.push(children && !hit ? withKids(node, insert(children)) : node);
      if (hit && position === "after") {
        next.push(item);
        inserted = true;
      }
    }
    return next;
  };
  const result = insert(trimmed);
  return inserted ? result : nodes.slice();
}
