// @ts-check

/**
 * @typedef {import("./tab-reorder.js").TabReorderDetail} TabReorderDetail
 * @typedef {import("./tab-reorder.js").TabReorderOptions} TabReorderOptions
 */

/** Pixels the pointer travels before a press becomes a drag, so a click still clicks. */
export const DRAG_THRESHOLD = 4;

/** Milliseconds a touch must rest before a drag starts, so a swipe still scrolls. */
export const TOUCH_HOLD_MS = 350;

/** Pixels from the list's edge where a drag starts to scroll it. */
const SCROLL_EDGE = 40;

/** Largest scroll step, in pixels per frame. */
const SCROLL_SPEED = 14;

const ITEM = ".bx--tabs__nav-item";
const LINK = ".bx--tabs__nav-link";
const CLOSE = ".bx--tabs__nav-item--close";

/**
 * The gap a pointer is over: how many tabs lie before it along the inline
 * axis. `0` is before the first tab and `centers.length` after the last.
 *
 * @param {ReadonlyArray<number>} centers - Each tab's center, in tab order.
 * @param {number} position - The pointer, in the same coordinates.
 * @param {boolean} [rtl] - Tab order runs right to left.
 * @returns {number}
 */
export function slotAt(centers, position, rtl = false) {
  let slot = 0;
  for (const center of centers) {
    if (rtl ? center > position : center < position) slot++;
  }
  return slot;
}

/**
 * The index a tab takes when dropped into `slot`. The tab leaves its place
 * first, so a slot after it counts one less.
 *
 * @param {number} slot
 * @param {number} oldIndex
 * @returns {number}
 */
export function slotToIndex(slot, oldIndex) {
  return slot > oldIndex ? slot - 1 : slot;
}

/**
 * The tabs that make room for a tab that moves from `oldIndex` to
 * `newIndex`, and which way each steps along the tab order: toward the
 * start when the tab moves past them, toward the end when it moves back.
 * `null` when it stays.
 *
 * @param {number} oldIndex
 * @param {number} newIndex
 * @returns {{ from: number; to: number; step: 1 | -1 } | null}
 */
export function makeRoom(oldIndex, newIndex) {
  if (newIndex > oldIndex) {
    return { from: oldIndex + 1, to: newIndex, step: -1 };
  }
  if (newIndex < oldIndex) {
    return { from: newIndex, to: oldIndex - 1, step: 1 };
  }
  return null;
}

/**
 * The index a move key sends a tab to, or `-1` for any other key. Arrow
 * keys move one place along the inline axis (`rtl` swaps them), Home and
 * End go to the ends. A move past an end stays put.
 *
 * @param {string} key
 * @param {number} oldIndex
 * @param {number} count
 * @param {boolean} [rtl]
 * @returns {number}
 */
export function keyboardIndex(key, oldIndex, count, rtl = false) {
  const last = count - 1;
  if (key === "Home") return 0;
  if (key === "End") return last;
  if (key !== "ArrowLeft" && key !== "ArrowRight") return -1;
  const forward = (key === "ArrowRight") !== rtl;
  return Math.min(last, Math.max(0, oldIndex + (forward ? 1 : -1)));
}

/**
 * The scroll step for a pointer near the edge of a list: zero in the
 * middle, ramping up toward the edge.
 *
 * @param {number} position - Pointer, in viewport coordinates.
 * @param {number} start - The list's left edge.
 * @param {number} end - The list's right edge.
 * @returns {number} Negative scrolls toward the left.
 */
export function edgeScrollStep(position, start, end) {
  if (position < start + SCROLL_EDGE) {
    return (
      -SCROLL_SPEED *
      Math.min(1, (start + SCROLL_EDGE - position) / SCROLL_EDGE)
    );
  }
  if (position > end - SCROLL_EDGE) {
    return (
      SCROLL_SPEED * Math.min(1, (position - (end - SCROLL_EDGE)) / SCROLL_EDGE)
    );
  }
  return 0;
}

/**
 * Svelte action for the tab list: reorder its tabs by pointer drag or
 * Ctrl/Cmd+Shift with an arrow key, Home or End.
 *
 * The action never moves a node. A drag slides the held tab under the
 * pointer with a transform, and the tabs it passes step aside to show where
 * it would land; the drop calls `onReorder`, and the owner of the data
 * decides whether to move it.
 *
 * Nothing captures the pointer until it has moved past `DRAG_THRESHOLD`,
 * since capture retargets the click that follows a press and a tab holds a
 * dismiss button. A drag that happened swallows its click.
 *
 * @param {HTMLElement} node
 * @param {TabReorderOptions} options
 * @returns {{ update: (options: TabReorderOptions) => void, destroy: () => void }}
 */
export function tabReorder(node, options) {
  let current = options;

  /**
   * @type {null | {
   *   pointerId: number,
   *   item: HTMLElement,
   *   startX: number,
   *   startY: number,
   *   touch: boolean,
   *   armed: boolean,
   *   dragging: boolean,
   *   oldIndex: number,
   *   items: HTMLElement[],
   *   centers: number[],
   *   listLeft: number,
   *   listRight: number,
   *   startScroll: number,
   *   clientX: number,
   *   slot: number,
   *   holdTimer: ReturnType<typeof setTimeout> | undefined,
   *   frame: number,
   *   pitch: number,
   *   shifted: Set<number>,
   * }}
   */
  let session = null;

  const rtl = () => current.rtl?.() === true;

  /** @param {Element | null} element */
  function itemOf(element) {
    const item = element?.closest(ITEM);
    return item instanceof HTMLElement && node.contains(item) ? item : null;
  }

  /** @param {HTMLElement} item */
  function idOf(item) {
    return item.querySelector(LINK)?.id ?? "";
  }

  function getItems() {
    return /** @type {HTMLElement[]} */ (
      Array.from(node.querySelectorAll(ITEM))
    );
  }

  /** @param {PointerEvent} event */
  function handlePointerdown(event) {
    if (current.enabled === false || session) return;
    if (event.button !== 0 || event.isPrimary === false) return;
    const target = event.target instanceof Element ? event.target : null;
    // The dismiss button is its own control.
    if (!target || target.closest(CLOSE)) return;
    const item = itemOf(target);
    if (!item || item.classList.contains("bx--tabs__nav-item--disabled")) {
      return;
    }

    const doc = node.ownerDocument;
    session = {
      pointerId: event.pointerId,
      item,
      startX: event.clientX,
      startY: event.clientY,
      touch: event.pointerType === "touch",
      armed: event.pointerType !== "touch",
      dragging: false,
      oldIndex: -1,
      items: [],
      centers: [],
      listLeft: 0,
      listRight: 0,
      startScroll: 0,
      clientX: event.clientX,
      slot: -1,
      holdTimer: undefined,
      frame: 0,
      pitch: 0,
      shifted: new Set(),
    };
    doc.addEventListener("pointermove", handlePointermove);
    doc.addEventListener("pointerup", handlePointerup);
    doc.addEventListener("pointercancel", handlePointercancel);
    doc.addEventListener("keydown", handleSessionKeydown, true);
    if (session.touch) {
      // A swipe scrolls the list, so a touch drags only after a hold. The
      // browser has to be told not to scroll once the hold has armed it.
      doc.addEventListener("touchmove", handleTouchmove, { passive: false });
      node.addEventListener("contextmenu", preventDefault);
      session.holdTimer = setTimeout(() => {
        if (session) session.armed = true;
      }, TOUCH_HOLD_MS);
    }
  }

  /** @param {Event} event */
  function preventDefault(event) {
    event.preventDefault();
  }

  /** @param {TouchEvent} event */
  function handleTouchmove(event) {
    if (session?.armed && event.cancelable) event.preventDefault();
  }

  /** @param {PointerEvent} event */
  function handlePointermove(event) {
    if (!session || event.pointerId !== session.pointerId) return;
    session.clientX = event.clientX;
    if (!session.dragging) {
      const moved = Math.hypot(
        event.clientX - session.startX,
        event.clientY - session.startY,
      );
      if (moved < DRAG_THRESHOLD) return;
      // A touch that moves before the hold is a scroll.
      if (!session.armed) return finish(false);
      begin(event);
    }
    update();
    if (edgeStep() !== 0 && !session.frame) {
      session.frame = requestAnimationFrame(scrollFrame);
    }
  }

  /** @param {PointerEvent} event */
  function begin(event) {
    if (!session) return;
    const items = getItems();
    const listRect = node.getBoundingClientRect();
    session.items = items;
    session.oldIndex = items.indexOf(session.item);
    session.listLeft = listRect.left;
    session.listRight = listRect.right;
    session.startScroll = node.scrollLeft;
    // Content coordinates: they do not move when the list scrolls.
    session.centers = items.map((item) => {
      const rect = item.getBoundingClientRect();
      return rect.left + rect.width / 2 - listRect.left + node.scrollLeft;
    });
    // A tab that makes room steps by the held tab's width and the gap.
    const rects = items.map((item) => item.getBoundingClientRect());
    const held = rects[session.oldIndex];
    const next = rects[session.oldIndex + 1] ?? rects[session.oldIndex - 1];
    const gap = next
      ? Math.max(
          0,
          next.left > held.left
            ? next.left - held.right
            : held.left - next.right,
        )
      : 0;
    session.pitch = held.width + gap;
    session.dragging = true;
    session.item.classList.add("bx--tabs__nav-item--dragging");
    node.classList.add("bx--tabs__nav--reordering");
    // Capture on the list, not the held tab: a captured element is the one
    // that matches `:hover`, and its hover rules outrank the held style.
    node.setPointerCapture?.(event.pointerId);
    current.onStart?.();
  }

  function edgeStep() {
    return session
      ? edgeScrollStep(session.clientX, session.listLeft, session.listRight)
      : 0;
  }

  function scrollFrame() {
    if (!session) return;
    session.frame = 0;
    const step = edgeStep();
    if (step === 0) return;
    node.scrollLeft += step;
    update();
    session.frame = requestAnimationFrame(scrollFrame);
  }

  function update() {
    if (!session?.dragging) return;
    const scrolled = node.scrollLeft - session.startScroll;
    session.item.style.transform = `translateX(${
      session.clientX - session.startX + scrolled
    }px)`;
    const position = session.clientX - session.listLeft + node.scrollLeft;
    const slot = slotAt(session.centers, position, rtl());
    if (slot === session.slot) return;
    session.slot = slot;
    makeRoomFor(slotToIndex(slot, session.oldIndex));
  }

  /** @param {number} newIndex */
  function makeRoomFor(newIndex) {
    if (!session) return;
    const room = makeRoom(session.oldIndex, newIndex);
    // `step` follows the tab order, which runs right to left in RTL.
    const sign = rtl() ? -1 : 1;
    /** @type {Set<number>} */
    const moving = new Set();
    if (room) {
      for (let i = room.from; i <= room.to; i++) {
        moving.add(i);
        session.items[i].style.transform = `translateX(${
          sign * room.step * session.pitch
        }px)`;
      }
    }
    for (const i of session.shifted) {
      if (!moving.has(i)) session.items[i].style.removeProperty("transform");
    }
    session.shifted = moving;
  }

  /** @param {PointerEvent} event */
  function handlePointerup(event) {
    if (!session || event.pointerId !== session.pointerId) return;
    finish(true);
  }

  /** @param {PointerEvent} event */
  function handlePointercancel(event) {
    if (!session || event.pointerId !== session.pointerId) return;
    finish(false);
  }

  /** @param {KeyboardEvent} event */
  function handleSessionKeydown(event) {
    if (event.key !== "Escape" || !session?.dragging) return;
    event.preventDefault();
    event.stopPropagation();
    finish(false);
  }

  /**
   * End the press. A drag that was dropped reports its move; either way the
   * tab springs back, since the owner moves the real node.
   *
   * @param {boolean} commit
   */
  function finish(commit) {
    if (!session) return;
    const ended = session;
    session = null;
    clearTimeout(ended.holdTimer);
    cancelAnimationFrame(ended.frame);
    const doc = node.ownerDocument;
    doc.removeEventListener("pointermove", handlePointermove);
    doc.removeEventListener("pointerup", handlePointerup);
    doc.removeEventListener("pointercancel", handlePointercancel);
    doc.removeEventListener("keydown", handleSessionKeydown, true);
    doc.removeEventListener("touchmove", handleTouchmove);
    node.removeEventListener("contextmenu", preventDefault);
    if (!ended.dragging) return;

    ended.item.classList.remove("bx--tabs__nav-item--dragging");
    ended.item.style.removeProperty("transform");
    node.classList.remove("bx--tabs__nav--reordering");
    for (const i of ended.shifted) {
      ended.items[i].style.removeProperty("transform");
    }
    if (node.hasPointerCapture?.(ended.pointerId)) {
      node.releasePointerCapture(ended.pointerId);
    }
    swallowClick();
    current.onEnd?.();

    if (!commit) return;
    const newIndex = slotToIndex(ended.slot, ended.oldIndex);
    if (ended.slot < 0 || newIndex === ended.oldIndex) return;
    current.onReorder?.({
      id: idOf(ended.item),
      oldIndex: ended.oldIndex,
      newIndex,
      source: "pointer",
    });
  }

  // The click that follows a drag would select the tab, or follow its link.
  function swallowClick() {
    /** @param {Event} event */
    const swallow = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    node.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => node.removeEventListener("click", swallow, true));
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (current.enabled === false) return;
    if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) {
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    const item = itemOf(target);
    if (!item) return;
    const items = getItems();
    const oldIndex = items.indexOf(item);
    const newIndex = keyboardIndex(event.key, oldIndex, items.length, rtl());
    if (newIndex < 0) return;
    event.preventDefault();
    if (newIndex === oldIndex) return;
    current.onReorder?.({
      id: idOf(item),
      oldIndex,
      newIndex,
      source: "keyboard",
    });
  }

  node.addEventListener("pointerdown", handlePointerdown);
  node.addEventListener("keydown", handleKeydown);
  // A tab is a link, and the browser starts a native drag of it that
  // cancels the pointer in Firefox and Safari.
  node.addEventListener("dragstart", preventDefault);

  return {
    update(next) {
      current = next;
      if (current.enabled === false) finish(false);
    },
    destroy() {
      finish(false);
      node.removeEventListener("pointerdown", handlePointerdown);
      node.removeEventListener("keydown", handleKeydown);
      node.removeEventListener("dragstart", preventDefault);
    },
  };
}
