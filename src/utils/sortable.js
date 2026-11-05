// @ts-check
// The list adapter of the drag and drop engine: a zone whose items are rows,
// columns or a wrapping grid, with cross-list moves by `group`.

import {
  indexToSlot,
  insertionSlot,
  nearestBox,
  slotToIndex,
  stepIndex,
} from "./dnd-math.js";
import { createTexts, DND_DEFAULT_TEXTS } from "./dnd-text.js";
import { getDnd, nextId } from "./dnd.js";
import { getScrollableAncestors } from "./get-scrollable-ancestors.js";
import { resolveLayoutDirection } from "./inline-direction.js";

/**
 * @typedef {import("./sortable.js").SortableOptions} SortableOptions
 * @typedef {import("./sortable-model.js").SortDetail} SortDetail
 * @typedef {import("./dnd.js").DndZone} DndZone
 * @typedef {import("./dnd.js").DndSession} DndSession
 * @typedef {import("./dnd.js").DndPosition} DndPosition
 * @typedef {DndPosition & { index: number }} ListPosition
 */

const SCROLLABLE = /(auto|scroll)/;
const SETTLE_MS = 150;
// Carbon's productive standard curve and moderate-01 duration.
const SETTLE_EASING = "cubic-bezier(0.2, 0, 0.38, 0.9)";
const TEXTS = {
  ...DND_DEFAULT_TEXTS,
  roleDescription: "sortable item",
};

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

/** @returns {boolean} */
function reducedMotion() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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
 * It is a thin adapter on the drag and drop engine (`dnd.js`), which does the
 * pressing, the frames, the scrolling, the keys and the announcements.
 *
 * @param {HTMLElement} node
 * @param {SortableOptions} [options]
 * @returns {{ update: (options?: SortableOptions) => void, destroy: () => void }}
 */
export function sortable(node, options = {}) {
  let current = options;
  const doc = node.ownerDocument;
  const dnd = getDnd();
  const uid = nextId("ccs-sortable");
  const instructionsId = `${uid}-instructions`;
  const text = createTexts(TEXTS, () => current.translateWithId);

  /** @type {HTMLElement[]} */
  let cache = [];
  let dirty = true;
  /** @type {HTMLElement | null} */
  let activeTarget = null;
  let stampFrame = 0;
  /** @type {HTMLElement[] | null} */
  let scrollerCache = null;
  /** @type {DndSession | null} The session `gap` feedback is drawn for. */
  let gapSession = null;
  /** @type {Map<number, HTMLElement>} */
  let shifted = new Map();
  /** @type {{ sizes: number[], held: number } | null} */
  let gapMetrics = null;
  let gapKey = "";

  const instructions = doc.createElement("div");
  instructions.id = instructionsId;
  instructions.hidden = true;
  // Inside a dialog, so the text is not behind its inert backdrop.
  (
    node.closest("dialog, [role='dialog'], [aria-modal='true']") ?? doc.body
  ).append(instructions);

  /** @param {number} index */
  function position(index) {
    return /** @type {ListPosition} */ ({
      zone,
      key: `${uid}:${index}`,
      index,
    });
  }

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
   * @param {number} at - Place among the rendered items.
   */
  function indexOf(item, at) {
    const posinset = Number(item.getAttribute("aria-posinset"));
    return Number.isInteger(posinset) && posinset >= 1 ? posinset - 1 : at;
  }

  function count() {
    const first = items()[0];
    const size = Number(first?.getAttribute("aria-setsize"));
    return size > 0 ? size : items().length;
  }

  /** @param {number} index */
  function renderedAt(index) {
    const rendered = items();
    if (rendered.length === 0) return undefined;
    const offset = index - indexOf(rendered[0], 0);
    const item = rendered[offset];
    return item && indexOf(item, offset) === index ? item : undefined;
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

  /** @param {HTMLElement} item */
  function labelOf(item) {
    return current.getLabel
      ? current.getLabel(item)
      : defaultGetLabel(item, targetOf(item));
  }

  const orientation = () =>
    current.orientation === "horizontal" || current.orientation === "grid"
      ? current.orientation
      : "vertical";
  const rtl = () => resolveLayoutDirection(undefined, node) === "rtl";

  /** Whether the zone shows `gap` feedback: not for a grid or a windowed list. */
  function usesGap() {
    return (
      current.feedback === "gap" &&
      orientation() !== "grid" &&
      !items()[0]?.hasAttribute("aria-posinset")
    );
  }

  /** @param {HTMLElement} target */
  function setActive(target) {
    if (activeTarget === target) return;
    if (activeTarget?.isConnected) setAttribute(activeTarget, "tabindex", "-1");
    activeTarget = target;
    if (current.roving !== false) setAttribute(target, "tabindex", "0");
  }

  /**
   * Focus the keyboard target of the item at `index`. The consumer may apply
   * the move late, so wait for the item before giving up.
   * @param {number} index
   * @param {number} attempt
   */
  function focusIndex(index, attempt) {
    const item = renderedAt(index);
    const target = item && targetOf(item);
    if (target?.isConnected) {
      setActive(target);
      target.focus();
    } else if (attempt < 10) {
      setTimeout(() => focusIndex(index, attempt + 1), 50);
    }
  }

  // Stamp the semantics onto each keyboard target. The action owns these
  // attributes, so a consumer who sets them by hand gets the action's value.
  function stamp() {
    stampFrame = 0;
    const rendered = items();
    if (activeTarget && !activeTarget.isConnected) activeTarget = null;
    const roving = current.roving !== false;
    const role = text("roleDescription");
    instructions.textContent = text("instructions");

    rendered.forEach((item, at) => {
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
        setAttribute(target, "data-dnd-handle", "");
        if (
          target.hasAttribute("data-dnd-labelled") ||
          (!target.hasAttribute("aria-label") &&
            !target.hasAttribute("aria-labelledby") &&
            !target.textContent?.trim())
        ) {
          setAttribute(target, "data-dnd-labelled", "");
          setAttribute(
            target,
            "aria-label",
            text("handleLabel", { label: labelOf(item) }),
          );
        }
      }
      if (roving) {
        const active = activeTarget ? target === activeTarget : at === 0;
        setAttribute(target, "tabindex", active ? "0" : "-1");
      }
    });
    dnd.notify(zone);
  }

  function unstamp() {
    for (const item of items()) {
      const target = targetOf(item);
      if (!target) continue;
      target.removeAttribute("aria-roledescription");
      target.removeAttribute("data-dnd-handle");
      target.removeAttribute("tabindex");
      if (target.hasAttribute("data-dnd-labelled")) {
        target.removeAttribute("data-dnd-labelled");
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

  const observer =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          dirty = true;
          scheduleStamp();
        });
  // A windowed list stamps `aria-posinset` after it inserts rows, and the
  // index of every row depends on it.
  observer?.observe(node, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-posinset"],
  });

  // Feedback: the drop indicator --------------------------------------------

  /**
   * @param {number} slot
   * @returns {{ x: number, y: number, length: number } | null} In viewport
   *   pixels, or `null` when that gap is not rendered or is scrolled away.
   */
  function slotGeometry(slot) {
    const horizontal = orientation() !== "vertical";
    const flip = horizontal && rtl();
    const nextRect = renderedAt(slot)?.getBoundingClientRect();
    const prevRect = renderedAt(slot - 1)?.getBoundingClientRect();
    const rect =
      nextRect ??
      prevRect ??
      (items().length === 0 ? node.getBoundingClientRect() : null);
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
    // Between two items the line sits in the middle of the gap. In a wrapping
    // grid the neighbors may be on different rows, so it hugs the next one.
    let edge;
    const sameRow =
      nextRect &&
      prevRect &&
      (orientation() !== "grid" ||
        Math.abs(nextRect.top - prevRect.top) < nextRect.height / 2);
    if (sameRow && nextRect && prevRect)
      edge = (edgeOf(nextRect, true) + edgeOf(prevRect, false)) / 2;
    else edge = edgeOf(rect, Boolean(nextRect) || !prevRect);

    const visible = visibleBox();
    const from = horizontal ? visible.left : visible.top;
    const to = horizontal ? visible.right : visible.bottom;
    if (edge < from - 1 || edge > to + 1) return null;
    return horizontal
      ? { x: edge - 1, y: rect.top, length: rect.height }
      : { x: rect.left, y: edge - 1, length: rect.width };
  }

  function visibleBox() {
    const { left, top, right, bottom } = node.getBoundingClientRect();
    const visible = { left, top, right, bottom };
    for (const scroller of scrollers()) {
      const rect = scroller.getBoundingClientRect();
      visible.left = Math.max(visible.left, rect.left);
      visible.top = Math.max(visible.top, rect.top);
      visible.right = Math.min(visible.right, rect.right);
      visible.bottom = Math.min(visible.bottom, rect.bottom);
    }
    return visible;
  }

  function scrollers() {
    if (!scrollerCache) {
      // From an item, so a scroll box between the item and `node` counts.
      const base = items()[0] ?? node;
      scrollerCache = /** @type {HTMLElement[]} */ (
        getScrollableAncestors(base).filter((el) => el instanceof HTMLElement)
      );
      if (base === node && scrolls(node)) scrollerCache.unshift(node);
    }
    return scrollerCache;
  }

  // Feedback: neighbors step aside --------------------------------------------

  /** Where each item sits now, along the axis, for the `gap` feedback. */
  function measureGap(/** @type {DndSession} */ s) {
    const horizontal = orientation() === "horizontal";
    const rendered = items();
    const sizes = rendered.map((item) => {
      const rect = item.getBoundingClientRect();
      return horizontal ? rect.width : rect.height;
    });
    // The step between two neighbors, their margins and the gap included.
    let held = sizes[s.source.index] ?? 0;
    const a = rendered[s.source.index]?.getBoundingClientRect();
    const b = (
      rendered[s.source.index + 1] ?? rendered[s.source.index - 1]
    )?.getBoundingClientRect();
    if (a && b) {
      const space = horizontal
        ? Math.abs(b.left - a.left) - (b.left > a.left ? a.width : b.width)
        : Math.abs(b.top - a.top) - (b.top > a.top ? a.height : b.height);
      held += space;
    }
    gapMetrics = { sizes, held };
  }

  /**
   * Shift the items between the lifted item's place and `slotIndex` by the
   * lifted item's size, and move the lifted item's own placeholder by what
   * they were.
   * @param {DndSession} s
   * @param {number | null} target - The final index, or `null` to clear.
   * @param {boolean} sameList
   */
  function applyGap(s, target, sameList) {
    if (gapSession !== s) {
      gapSession = s;
      shifted = new Map();
      measureGap(s);
      gapKey = "";
    }
    const key = `${target}:${sameList}`;
    if (key === gapKey) return;
    gapKey = key;
    const metrics = gapMetrics;
    if (!metrics) return;
    const horizontal = orientation() === "horizontal";
    const sign = horizontal && rtl() ? -1 : 1;
    const axis = horizontal ? "translateX" : "translateY";
    const old = s.source.index;
    /** @type {Map<number, number>} */
    const wanted = new Map();
    let lifted = 0;
    if (target !== null) {
      if (sameList && target !== old) {
        const from = target > old ? old + 1 : target;
        const to = target > old ? target : old - 1;
        const step = target > old ? -1 : 1;
        for (let i = from; i <= to; i++) {
          wanted.set(i, step * metrics.held);
          lifted -=
            step * (metrics.sizes[i] + (metrics.held - metrics.sizes[old]));
        }
      } else if (!sameList) {
        for (let i = target; i < items().length; i++)
          wanted.set(i, metrics.held);
      }
    }
    const rendered = items();
    for (const [i, item] of shifted) {
      if (!wanted.has(i)) {
        item.style.removeProperty("transform");
        item.removeAttribute("data-dnd-shifted");
        shifted.delete(i);
      }
    }
    for (const [i, distance] of wanted) {
      const item = rendered[i];
      if (!item) continue;
      item.style.transform = `${axis}(${sign * distance}px)`;
      item.setAttribute("data-dnd-shifted", "");
      shifted.set(i, item);
    }
    const placeholder = rendered[old];
    if (placeholder && s.origin === zone) {
      if (lifted === 0) {
        placeholder.style.removeProperty("transform");
        placeholder.removeAttribute("data-dnd-shifted");
      } else {
        placeholder.style.transform = `${axis}(${sign * lifted}px)`;
        placeholder.setAttribute("data-dnd-shifted", "");
        shifted.set(old, placeholder);
      }
    }
  }

  function clearGap() {
    for (const item of shifted.values()) {
      item.style.removeProperty("transform");
      item.removeAttribute("data-dnd-shifted");
    }
    shifted = new Map();
    gapSession = null;
    gapMetrics = null;
    gapKey = "";
  }

  // The zone ------------------------------------------------------------------

  /** @type {DndZone} */
  const zone = {
    node,
    get group() {
      return current.group;
    },
    get name() {
      return current.name ?? "";
    },
    get disabled() {
      return current.disabled === true;
    },
    get orientation() {
      return orientation();
    },
    rtl,
    text,

    sourceAt(target, via, event) {
      const item = itemOf(target);
      if (!item) return null;
      if (item.getAttribute("aria-disabled") === "true") return null;
      if (via === "keyboard") {
        const key = /** @type {KeyboardEvent} */ (event);
        if (key.altKey || (key.key !== " " && key.key !== "Enter")) return null;
        if (targetOf(item) !== target) return null;
      } else if (current.handleSelector) {
        const handle = target.closest(current.handleSelector);
        if (!handle || !item.contains(handle)) return null;
      } else if (/** @type {PointerEvent} */ (event).pointerType === "touch") {
        // A finger on the item scrolls.
        return null;
      }
      const rendered = items();
      return {
        item,
        id: (current.getId ?? defaultGetId)(item),
        label: labelOf(item),
        index: indexOf(item, rendered.indexOf(item)),
      };
    },

    home: (source) => position(source.index),

    collide(x, y, s) {
      const rendered = items();
      const sameList = s.origin === zone;
      const horizontal = orientation() === "horizontal";
      const flip = horizontal && rtl();
      /** @type {number} */
      let slot = 0;
      if (rendered.length > 0) {
        /** @type {number} */
        let rendering;
        if (orientation() === "grid") {
          const rects = rendered.map((item) => item.getBoundingClientRect());
          const hit = nearestBox(rects, x, y, rtl());
          rendering = hit ? hit.index + (hit.after ? 1 : 0) : 0;
        } else {
          const pointer = horizontal ? (flip ? -x : x) : y;
          const midpoint = (/** @type {number} */ i) => {
            const rect = rendered[i].getBoundingClientRect();
            if (!horizontal) return (rect.top + rect.bottom) / 2;
            const mid = (rect.left + rect.right) / 2;
            return flip ? -mid : mid;
          };
          rendering = insertionSlot(rendered.length, midpoint, pointer);
        }
        slot =
          rendering < rendered.length
            ? indexOf(rendered[rendering], rendering)
            : indexOf(rendered[rendered.length - 1], rendered.length - 1) + 1;
      }
      return position(slotToIndex(slot, s.source.index, sameList));
    },

    step(s, from, intent) {
      const sameList = s.origin === zone;
      const max = (sameList ? count() - 1 : count()) || 0;
      const index = /** @type {ListPosition} */ (from).index;
      if (intent === "enter")
        return position(Math.min(Math.max(index, 0), max));
      if (intent === "up" || intent === "down") {
        const cols = columns();
        const row = intent === "down" ? cols : -cols;
        return position(Math.min(Math.max(index + row, 0), max));
      }
      return position(stepIndex(index, intent, max));
    },

    describe(s, p) {
      const { index } = /** @type {ListPosition} */ (p);
      const sameList = p.zone === s.origin;
      const total = p.zone === zone ? count() : 0;
      return {
        position: index + 1,
        count: sameList || p === s.home ? total : total + 1,
        name: current.label ?? current.name ?? "",
        variant: sameList ? "" : "List",
      };
    },

    indicate(s, p, indicator) {
      if (!p) {
        indicator.hidden = true;
        clearGap();
        return true;
      }
      const { index } = /** @type {ListPosition} */ (p);
      const sameList = s.origin === zone;
      const slot = indexToSlot(index, s.source.index, sameList);
      const geometry = slotGeometry(slot);
      if (usesGap()) {
        applyGap(s, index, sameList);
        indicator.hidden = true;
        return geometry !== null;
      }
      if (!geometry) return false;
      const horizontal = orientation() !== "vertical";
      indicator.dataset.orientation = horizontal ? "horizontal" : "vertical";
      indicator.style.left = `${geometry.x}px`;
      indicator.style.top = `${geometry.y}px`;
      indicator.style[horizontal ? "height" : "width"] = `${geometry.length}px`;
      return true;
    },

    reveal(s, p) {
      const { index } = /** @type {ListPosition} */ (p);
      const slot = indexToSlot(index, s.source.index, s.origin === zone);
      reveal(slot);
    },

    commit(s, p) {
      const { index } = /** @type {ListPosition} */ (p);
      /** @type {SortDetail} */
      const detail = {
        id: s.source.id,
        from: s.origin.name,
        to: current.name ?? "",
        oldIndex: s.source.index,
        newIndex: index,
        source: s.via,
      };
      return node.dispatchEvent(
        new CustomEvent("sort", { detail, bubbles: true, cancelable: true }),
      );
    },

    scrollers,
    invalidate() {
      scrollerCache = null;
    },

    snapshot(s) {
      /** @type {Map<Element, DOMRect>} */
      const rects = new Map();
      for (const item of items()) rects.set(item, item.getBoundingClientRect());
      // A pointer drop appears where it was released, not at the old place.
      if (s.via === "pointer") rects.delete(s.item);
      return rects;
    },

    settle(s, p, snapshot) {
      const rects = /** @type {Map<Element, DOMRect>} */ (snapshot);
      // Neighbors already stepped aside; sliding them again would jump.
      if (usesGap() && s.origin === p.zone) return;
      if (reducedMotion()) return;
      for (const item of items()) {
        const first = rects.get(item);
        if (!first || typeof item.animate !== "function") continue;
        const last = item.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        // Only items in view are animated, so moving across a long list
        // stays cheap.
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
    },

    restoreFocus(_s, p) {
      focusIndex(/** @type {ListPosition} */ (p).index, 0);
    },

    itemFor(s) {
      const rendered = items();
      for (let at = 0; at < rendered.length; at++)
        if (indexOf(rendered[at], at) === s.source.index) return rendered[at];
      return undefined;
    },
  };

  /** How many items share the first row of a wrapping grid. */
  function columns() {
    const rendered = items();
    if (rendered.length === 0) return 1;
    const top = rendered[0].getBoundingClientRect().top;
    let cols = 0;
    for (const item of rendered) {
      if (Math.abs(item.getBoundingClientRect().top - top) > 1) break;
      cols++;
    }
    return Math.max(cols, 1);
  }

  /**
   * Bring the slot a keyboard move landed on into view. A windowed list may
   * not have rendered it yet, so scroll to where the rows say it will be,
   * which puts it in the middle of the box and lets the list render around it.
   * @param {number} slot
   */
  function reveal(slot) {
    const anchor = renderedAt(slot) ?? renderedAt(slot - 1);
    if (anchor) {
      anchor.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      return;
    }
    const rendered = items();
    if (rendered.length === 0) return;
    const horizontal = orientation() === "horizontal";
    const sign = horizontal && rtl() ? -1 : 1;
    /** @param {DOMRect} box */
    const startOf = (box) => {
      if (!horizontal) return box.top;
      return sign === 1 ? box.left : box.right;
    };

    const lastAt = rendered.length - 1;
    const first = rendered[0].getBoundingClientRect();
    const last = rendered[lastAt].getBoundingClientRect();
    const firstIndex = indexOf(rendered[0], 0);
    const lastIndex = indexOf(rendered[lastAt], lastAt);
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

    const scroller = scrollers()[0] ?? doc.scrollingElement;
    if (!scroller) return;
    const view =
      scroller === doc.scrollingElement
        ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight }
        : scroller.getBoundingClientRect();
    const middle = horizontal
      ? (view.left + view.right) / 2
      : (view.top + view.bottom) / 2;
    if (horizontal) scroller.scrollLeft += target - middle;
    else scroller.scrollTop += target - middle;
  }

  // Idle keyboard: one tab stop, arrows move focus between the targets. -----

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (zone.disabled || event.defaultPrevented || event.isComposing) return;
    if (dnd.session || current.roving === false) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const item = itemOf(target);
    if (!item || !target || targetOf(item) !== target) return;

    const rendered = items();
    const at = rendered.indexOf(item);
    const horizontal = orientation() !== "vertical";
    const forwardKey = horizontal
      ? rtl()
        ? "ArrowLeft"
        : "ArrowRight"
      : "ArrowDown";
    const backKey = horizontal
      ? rtl()
        ? "ArrowRight"
        : "ArrowLeft"
      : "ArrowUp";
    /** @type {HTMLElement | undefined} */
    let next;
    if (event.key === backKey) next = rendered[at - 1];
    else if (event.key === forwardKey) next = rendered[at + 1];
    else if (orientation() === "grid" && event.key === "ArrowUp")
      next = rendered[at - columns()];
    else if (orientation() === "grid" && event.key === "ArrowDown")
      next = rendered[at + columns()];
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
    if (item && target && targetOf(item) === target) setActive(target);
  }

  const connection = dnd.connect(zone, { threshold: () => current.threshold });
  node.addEventListener("keydown", handleKeydown);
  node.addEventListener("focusin", handleFocusin);
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
      connection.refresh();
      scheduleStamp();
    },
    destroy() {
      connection.destroy();
      observer?.disconnect();
      if (stampFrame) cancelAnimationFrame(stampFrame);
      node.removeEventListener("keydown", handleKeydown);
      node.removeEventListener("focusin", handleFocusin);
      clearGap();
      unstamp();
      instructions.remove();
    },
  };
}
