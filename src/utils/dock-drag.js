// @ts-check

import { DRAG_THRESHOLD, edgeScrollStep, slotAt } from "./tab-reorder.js";

/**
 * @typedef {import("./dock-layout.js").DockPosition} DockPosition
 * @typedef {import("./dock-drag.js").DockDropTarget} DockDropTarget
 * @typedef {import("./dock-drag.js").DockDragOptions} DockDragOptions
 * @typedef {import("./dock-drag.js").DockZone} DockZone
 * @typedef {import("./dock-drag.js").Box} Box
 */

/** The share of a group's body, from each side, that docks to that edge. */
export const EDGE_RATIO = 0.25;

const GROUP = "[data-dock-group]";
const TAB = "[role='tab']";
const NAV = ".bx--tabs__nav";
const STRIP = ".bx--tabs";
const CLOSE = ".bx--tabs__nav-item--close";
const REORDERING = "bx--tabs__nav--reordering";

/**
 * Which part of a group a point is over. The tab strip joins the group;
 * the body docks to the nearest edge once the point is within
 * {@link EDGE_RATIO} of it, and joins the group in the middle. Sides are
 * physical: the caller maps `left` and `right` to `start` and `end`.
 *
 * @param {Box} box - The group's box.
 * @param {number} stripBottom - Where the tab strip ends.
 * @param {number} x
 * @param {number} y
 * @returns {DockZone}
 */
export function dropZone(box, stripBottom, x, y) {
  if (y < stripBottom) return "strip";
  const width = box.right - box.left;
  const height = box.bottom - stripBottom;
  if (width <= 0 || height <= 0) return "center";
  const fx = (x - box.left) / width;
  const fy = (y - stripBottom) / height;
  const nearX = Math.min(fx, 1 - fx);
  const nearY = Math.min(fy, 1 - fy);
  if (Math.min(nearX, nearY) >= EDGE_RATIO) return "center";
  if (nearX < nearY) return fx < 0.5 ? "left" : "right";
  return fy < 0.5 ? "top" : "bottom";
}

/**
 * The position a zone docks to. `left` is the inline end in a right-to-left
 * page, so the sides swap there.
 *
 * @param {DockZone} zone
 * @param {boolean} [rtl]
 * @returns {DockPosition}
 */
export function zonePosition(zone, rtl = false) {
  if (zone === "left") return rtl ? "end" : "start";
  if (zone === "right") return rtl ? "start" : "end";
  if (zone === "top" || zone === "bottom") return zone;
  return "center";
}

/**
 * The box a drop would fill: half of the group on an edge, all of it
 * otherwise.
 *
 * @param {Box} box
 * @param {DockZone} zone
 * @returns {Box}
 */
export function previewBox(box, zone) {
  const midX = (box.left + box.right) / 2;
  const midY = (box.top + box.bottom) / 2;
  if (zone === "left") return { ...box, right: midX };
  if (zone === "right") return { ...box, left: midX };
  if (zone === "top") return { ...box, bottom: midY };
  if (zone === "bottom") return { ...box, top: midY };
  return box;
}

/**
 * The edge of the tab at `slot`, where a tab dropped there would sit.
 *
 * @param {ReadonlyArray<number>} lefts - Each tab's left edge.
 * @param {ReadonlyArray<number>} rights - Each tab's right edge.
 * @param {number} slot
 * @param {boolean} [rtl]
 * @returns {number}
 */
export function slotEdge(lefts, rights, slot, rtl = false) {
  if (lefts.length === 0) return 0;
  if (rtl) {
    return slot === 0 ? rights[0] : lefts[Math.min(slot, lefts.length) - 1];
  }
  return slot === 0 ? lefts[0] : rights[Math.min(slot, lefts.length) - 1];
}

/**
 * @typedef {object} Measured
 * @property {string} id
 * @property {HTMLElement} element
 * @property {Box} box
 * @property {number} stripBottom
 * @property {number} count
 */

/**
 * Svelte action for the dock: while a tab is dragged by `tabReorder`, work
 * out which group and which part of it the pointer is over, show the drop
 * preview, and report the drop.
 *
 * It listens beside `tabReorder` and never takes the pointer: the strip
 * keeps reordering until the pointer leaves it. The elements it draws (the
 * drag label, the preview, the insertion mark) are written to directly, so
 * a move costs no component update, and `onTarget` fires only when the
 * target changes.
 *
 * @param {HTMLElement} node
 * @param {DockDragOptions} options
 * @returns {{ update: (options: DockDragOptions) => void, destroy: () => void }}
 */
export function dockDrag(node, options) {
  let current = options;

  /**
   * @type {null | {
   *   pointerId: number,
   *   strip: HTMLElement,
   *   tabId: string,
   *   label: string,
   *   fromId: string,
   *   startX: number,
   *   startY: number,
   *   dragging: boolean,
   *   origin: { left: number, top: number },
   *   groups: Measured[],
   *   target: DockDropTarget | null,
   *   targetKey: string,
   *   x: number,
   *   y: number,
   *   nav: HTMLElement | null,
   *   frame: number,
   * }}
   */
  let session = null;
  const rtl = () => current.rtl?.() === true;

  /** @param {PointerEvent} event */
  function handlePointerdown(event) {
    if (current.enabled === false || session) return;
    if (event.button !== 0 || event.isPrimary === false) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(CLOSE)) return;
    const tab = target.closest(TAB);
    const group = target.closest(GROUP);
    if (!(tab instanceof HTMLElement) || !(group instanceof HTMLElement)) {
      return;
    }
    const strip = group.querySelector(NAV);
    if (!(strip instanceof HTMLElement) || !strip.contains(tab)) return;
    // The list's own id: a tab's link carries the tab's id.
    session = {
      pointerId: event.pointerId,
      strip,
      tabId: tab.id,
      label:
        tab.querySelector(".bx--tabs__nav-item-label")?.textContent?.trim() ??
        tab.textContent?.trim() ??
        "",
      fromId: group.dataset.dockGroup ?? "",
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      origin: { left: 0, top: 0 },
      groups: [],
      target: null,
      targetKey: "",
      x: event.clientX,
      y: event.clientY,
      nav: null,
      frame: 0,
    };
    const doc = node.ownerDocument;
    doc.addEventListener("pointermove", handlePointermove);
    doc.addEventListener("pointerup", handlePointerup);
    doc.addEventListener("pointercancel", handlePointercancel);
    doc.addEventListener("keydown", handleKeydown, true);
  }

  /** @param {PointerEvent} event */
  function handlePointermove(event) {
    if (!session || event.pointerId !== session.pointerId) return;
    session.x = event.clientX;
    session.y = event.clientY;
    if (!session.dragging) {
      // `tabReorder` decides when a press is a drag (and, for touch, waits
      // for the hold); it marks the list when it has begun.
      if (
        !session.strip.classList.contains(REORDERING) ||
        Math.hypot(
          event.clientX - session.startX,
          event.clientY - session.startY,
        ) < DRAG_THRESHOLD
      ) {
        return;
      }
      begin();
    }
    update();
  }

  function begin() {
    if (!session) return;
    session.dragging = true;
    const rootBox = node.getBoundingClientRect();
    // The drawn elements sit at the dock's inline start, so a right-to-left
    // page measures from the right.
    session.origin = {
      left: rtl() ? rootBox.right : rootBox.left,
      top: rootBox.top,
    };
    // A maximized dock covers the groups it keeps mounted, and marks them
    // inert: they take no drop.
    session.groups = Array.from(node.querySelectorAll(GROUP))
      .filter((el) => el instanceof HTMLElement && !el.hasAttribute("inert"))
      .map((el) => {
        const element = /** @type {HTMLElement} */ (el);
        const rect = element.getBoundingClientRect();
        const strip = element.querySelector(STRIP)?.getBoundingClientRect();
        // A plain box: a `DOMRect` has no own properties to spread.
        const box = {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
        };
        return {
          id: element.dataset.dockGroup ?? "",
          element,
          box,
          stripBottom: strip ? strip.bottom : box.top,
          count: element.querySelectorAll(TAB).length,
        };
      })
      .filter(({ box }) => box.right > box.left && box.bottom > box.top);
    const { ghost } = current.elements();
    if (ghost) ghost.textContent = session.label;
    current.onStart?.();
  }

  /** The group under the point, and what part of it. */
  function update() {
    if (!session?.dragging) return;
    const { x, y } = session;
    const { ghost } = current.elements();
    const over = session.groups.find(
      ({ box }) =>
        x >= box.left && x < box.right && y >= box.top && y < box.bottom,
    );
    const own = over?.id === session.fromId;
    const zone = over ? dropZone(over.box, over.stripBottom, x, y) : null;
    // Over its own strip the list reorders; the label shows elsewhere.
    const inOwnStrip = own && zone === "strip";
    // A tab let go anywhere else is not a reorder of its own strip, even
    // when no zone takes it: `tabReorder` reports a move by the pointer's
    // inline position alone.
    current.state.docking = !inOwnStrip;
    if (ghost) {
      ghost.classList.toggle("bx--dock__ghost--visible", !inOwnStrip);
      const inlineStart = rtl()
        ? node.ownerDocument.documentElement.clientWidth
        : 0;
      ghost.style.transform = `translate(${x - inlineStart}px, ${y}px)`;
    }

    /** @type {DockDropTarget | null} */
    let target = null;
    if (over && zone && !inOwnStrip) {
      const position = zonePosition(zone === "strip" ? "center" : zone, rtl());
      const proposed = {
        groupId: over.id,
        position,
        zone,
        index: undefined,
      };
      if (
        current.canDock?.({
          tabId: session.tabId,
          fromGroupId: session.fromId,
          groupId: over.id,
          position,
        }) !== false
      ) {
        target = proposed;
      }
    }
    if (target && over && target.zone === "strip") {
      const slot = measureStrip(over.element, x);
      target.index = slot?.slot;
      showMarker(slot);
      scrollStrip(over.element);
    } else {
      showMarker(null);
      stopScrolling();
    }

    const key = target
      ? `${target.groupId}:${target.zone}:${target.index ?? ""}`
      : "";
    showPreview(target, over);
    if (key === session.targetKey) return;
    session.targetKey = key;
    session.target = target;
    current.onTarget?.(target);
  }

  /**
   * Where a tab dropped on a strip lands: the slot, and the edge to mark.
   *
   * @param {HTMLElement} group
   * @param {number} x
   * @returns {{ slot: number, edge: number, top: number, height: number } | null}
   */
  function measureStrip(group, x) {
    const nav = group.querySelector(NAV);
    if (!(nav instanceof HTMLElement)) return null;
    const navBox = nav.getBoundingClientRect();
    const tabs = Array.from(nav.querySelectorAll(TAB)).map((tab) =>
      (tab.closest(".bx--tabs__nav-item") ?? tab).getBoundingClientRect(),
    );
    const centers = tabs.map((box) => (box.left + box.right) / 2);
    const slot = slotAt(centers, x, rtl());
    const edge = slotEdge(
      tabs.map((box) => box.left),
      tabs.map((box) => box.right),
      slot,
      rtl(),
    );
    return {
      slot,
      edge: tabs.length === 0 ? navBox.left : edge,
      top: navBox.top,
      height: navBox.height,
    };
  }

  /** @param {HTMLElement} group */
  function scrollStrip(group) {
    if (!session) return;
    const nav = group.querySelector(NAV);
    if (!(nav instanceof HTMLElement) || nav.scrollWidth <= nav.clientWidth) {
      return stopScrolling();
    }
    session.nav = nav;
    if (!session.frame) session.frame = requestAnimationFrame(scrollFrame);
  }

  function stopScrolling() {
    if (!session) return;
    cancelAnimationFrame(session.frame);
    session.frame = 0;
    session.nav = null;
  }

  function scrollFrame() {
    if (!session?.nav) return;
    session.frame = 0;
    const box = session.nav.getBoundingClientRect();
    const step = edgeScrollStep(session.x, box.left, box.right);
    if (step === 0) return;
    session.nav.scrollLeft += step;
    update();
    if (session?.nav) session.frame = requestAnimationFrame(scrollFrame);
  }

  /** @param {{ slot: number, edge: number, top: number, height: number } | null} slot */
  function showMarker(slot) {
    if (!session) return;
    const { marker } = current.elements();
    if (!marker) return;
    marker.classList.toggle("bx--dock__marker--visible", slot !== null);
    if (!slot) return;
    const { left, top } = session.origin;
    marker.style.transform = `translate(${slot.edge - left}px, ${slot.top - top}px)`;
    marker.style.height = `${slot.height}px`;
  }

  /**
   * @param {DockDropTarget | null} target
   * @param {Measured | undefined} over
   */
  function showPreview(target, over) {
    if (!session) return;
    const { preview } = current.elements();
    if (!preview) return;
    preview.classList.toggle("bx--dock__preview--visible", target !== null);
    if (!target || !over) return;
    const box = previewBox(
      over.box,
      target.zone === "strip" ? "center" : target.zone,
    );
    const { left, top } = session.origin;
    const edge = rtl() ? box.right : box.left;
    preview.style.transform = `translate(${edge - left}px, ${box.top - top}px)`;
    preview.style.width = `${box.right - box.left}px`;
    preview.style.height = `${box.bottom - box.top}px`;
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
  function handleKeydown(event) {
    // `tabReorder` ends its own drag on the same key.
    if (event.key === "Escape" && session?.dragging) finish(false);
  }

  /** @param {boolean} commit */
  function finish(commit) {
    if (!session) return;
    const ended = session;
    session = null;
    cancelAnimationFrame(ended.frame);
    const doc = node.ownerDocument;
    doc.removeEventListener("pointermove", handlePointermove);
    doc.removeEventListener("pointerup", handlePointerup);
    doc.removeEventListener("pointercancel", handlePointercancel);
    doc.removeEventListener("keydown", handleKeydown, true);
    if (!ended.dragging) return;

    const { ghost, preview, marker } = current.elements();
    ghost?.classList.remove("bx--dock__ghost--visible");
    preview?.classList.remove("bx--dock__preview--visible");
    marker?.classList.remove("bx--dock__marker--visible");
    current.onEnd?.();
    if (ended.target) current.onTarget?.(null);
    // `tabReorder` reports its own move around now; the owner reads
    // `state.docking` to refuse it, until the end of the task.
    const { state } = current;
    if (state.docking) {
      setTimeout(() => {
        state.docking = false;
      });
    }
    if (commit && ended.target) {
      current.onDrop({
        tabId: ended.tabId,
        fromGroupId: ended.fromId,
        groupId: ended.target.groupId,
        position: ended.target.position,
        index: ended.target.index,
      });
    }
  }

  node.addEventListener("pointerdown", handlePointerdown, true);

  return {
    update(next) {
      current = next;
      if (current.enabled === false) finish(false);
    },
    destroy() {
      finish(false);
      node.removeEventListener("pointerdown", handlePointerdown, true);
    },
  };
}
