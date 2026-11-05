// @ts-check
// The shared drag and drop engine. It owns what every drag needs and no
// adapter should write twice: the press that becomes a drag, one session at a
// time, pointer tracking batched to the frame, edge auto-scroll of every
// scroll box in the way, the drag preview and drop indicator, a keyboard move
// with announcements, cancel on Escape, and a cancelable commit.
//
// It never moves a node or touches your data. An adapter describes a "zone"
// (a list, a tree, a set of drop areas): which element a press lifts, which
// drop position is under a point, which position a key steps to, how to draw
// it, and what event a drop dispatches. See `sortable` and `sortableTree`.

import { createAutoScroll, EDGE_SLACK } from "./dnd-auto-scroll.js";
import { keyIntent } from "./dnd-math.js";
import { acquireRegion, hostOf } from "./dnd-text.js";
import { pointerDrag } from "./pointer-drag.js";

/**
 * @typedef {import("./dnd.js").DndZone} DndZone
 * @typedef {import("./dnd.js").DndPosition} DndPosition
 * @typedef {import("./dnd.js").DndSession} DndSession
 * @typedef {import("./dnd.js").DndSource} DndSource
 */

// A windowed list renders after a scroll, so a keyboard move may need a few
// scrolls before the position it landed on is in view.
const REVEAL_TRIES = 8;
const FIELD =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

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

/** @param {Event} event */
function preventDefault(event) {
  event.preventDefault();
}

/**
 * Create an engine. One is shared by default (`getDnd`); a separate one keeps
 * its zones and its session apart, which is what a test wants.
 */
export function createDnd() {
  /** @type {Map<string, Set<DndZone>>} Connected zones by group. */
  const groups = new Map();
  /** @type {Map<DndZone, { say: (message: string) => void }>} */
  const voices = new Map();
  /** @type {DndSession | null} */
  let session = null;

  /**
   * The next enabled zone of the group, in document order.
   * @param {DndZone} from
   * @param {1 | -1} step
   * @returns {DndZone | null}
   */
  function neighborZone(from, step) {
    const set = from.group === undefined ? undefined : groups.get(from.group);
    if (!set) return null;
    const zones = [...set]
      .filter((zone) => !zone.disabled)
      .sort((a, b) =>
        a.node.compareDocumentPosition(b.node) &
        Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
    const at = zones.indexOf(from);
    return at === -1 ? null : (zones[at + step] ?? null);
  }

  /**
   * @param {DndSession} s
   * @param {"pickedUp" | "moved" | "dropped" | "cancelled"} id
   * @param {DndPosition} position
   */
  function announce(s, id, position) {
    const { origin } = s;
    const described = position.zone.describe(s, position);
    const { variant = "", ...values } = described;
    voices
      .get(origin)
      ?.say(
        origin.text(`${id}${variant}`, { label: s.source.label, ...values }),
      );
  }

  // Frames ------------------------------------------------------------------

  /** @param {DndSession} s */
  function scheduleFrame(s) {
    if (s.frame) return;
    s.frame = requestAnimationFrame((now) => {
      s.frame = 0;
      if (session === s) frame(s, now);
    });
  }

  /** @param {DndSession} s */
  function schedulePlace(s) {
    if (s.placeFrame) return;
    s.placeFrame = requestAnimationFrame(() => {
      s.placeFrame = 0;
      if (session === s) place(s);
    });
  }

  /**
   * The visible part of a zone: its box clipped by every scroll box around it.
   * @param {DndZone} zone
   */
  function visibleBox(zone) {
    const { left, top, right, bottom } = zone.node.getBoundingClientRect();
    const visible = { left, top, right, bottom };
    for (const scroller of zone.scrollers()) {
      const rect = scroller.getBoundingClientRect();
      visible.left = Math.max(visible.left, rect.left);
      visible.top = Math.max(visible.top, rect.top);
      visible.right = Math.min(visible.right, rect.right);
      visible.bottom = Math.min(visible.bottom, rect.bottom);
    }
    return visible;
  }

  /**
   * The zone under the pointer: the one it is in now, then the others of the
   * group, with a little slack so a drop at the very edge still counts.
   * @param {DndSession} s
   * @returns {DndZone | null}
   */
  function zoneAt(s) {
    /** @type {Set<DndZone>} */
    const candidates = new Set([s.zone ?? s.origin]);
    const connected =
      s.origin.group === undefined
        ? [s.origin]
        : [...(groups.get(s.origin.group) ?? [])];
    for (const zone of connected) candidates.add(zone);
    for (const zone of candidates) {
      if (zone.disabled || !zone.node.isConnected) continue;
      const rect = visibleBox(zone);
      if (
        s.x >= rect.left - EDGE_SLACK &&
        s.x <= rect.right + EDGE_SLACK &&
        s.y >= rect.top - EDGE_SLACK &&
        s.y <= rect.bottom + EDGE_SLACK
      )
        return zone;
    }
    return null;
  }

  /**
   * One animation frame of a pointer drag: scroll near an edge, find the zone
   * and the position under the pointer, and move the preview.
   * @param {DndSession} s
   * @param {number} now
   */
  function frame(s, now) {
    const dt = s.lastTime ? Math.min(now - s.lastTime, 64) : 16;
    s.lastTime = now;
    const scrolling = (s.zone ?? s.origin).node.isConnected
      ? s.scroll.step({
          doc: s.origin.node.ownerDocument,
          x: s.x,
          y: s.y,
          dt,
          now,
          scrollers: (s.zone ?? s.origin).scrollers(),
          rtl: s.rtl,
        })
      : false;

    const zone = zoneAt(s);
    s.zone = zone;
    s.position = zone ? zone.collide(s.x, s.y, s) : null;
    place(s);
    if (scrolling) scheduleFrame(s);
  }

  /** @param {DndSession} s */
  function place(s) {
    const { ghost, indicator, position, home } = s;
    if (ghost) {
      ghost.style.left = `${s.rtl ? s.x - 12 : s.x + 12}px`;
      ghost.style.top = `${s.y + 12}px`;
    }
    const zone = position?.zone ?? null;
    // Clear the feedback a zone drew when the drag leaves it.
    if (s.shown && s.shown !== zone) s.shown.indicate(s, null, indicator);
    s.shown = zone;
    if (!zone || !position) {
      indicator.hidden = true;
      return;
    }
    const moved = position.key !== home.key;
    // A zone that draws its own feedback hides the line again.
    indicator.hidden = !moved;
    const visible = zone.indicate(s, moved ? position : null, indicator);
    if (!visible) indicator.hidden = true;
    if (moved && !visible && s.via === "keyboard" && s.reveals > 0) {
      s.reveals--;
      zone.reveal?.(s, position);
      schedulePlace(s);
    } else if (visible) {
      s.reveals = 0;
    }
  }

  // Session -----------------------------------------------------------------

  /**
   * @param {DndZone} origin
   * @param {DndSource} source
   * @param {"pointer" | "keyboard"} via
   * @returns {DndSession}
   */
  function lift(origin, source, via) {
    const doc = origin.node.ownerDocument;
    // The window, in capture, hears a key before any widget on the page. A
    // Button closes its tooltip on Escape from a document listener, and a
    // tree moves its own focus on an arrow.
    const keys = doc.defaultView ?? doc;
    const host = hostOf(origin.node);
    // Layout may have changed since the last drag.
    origin.invalidate();
    if (origin.group !== undefined)
      for (const connected of groups.get(origin.group) ?? [])
        connected.invalidate();

    const indicator = doc.createElement("div");
    indicator.className = "bx--dnd__indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.hidden = true;
    host.append(indicator);

    /** @type {HTMLElement | null} */
    let ghost = null;
    if (via === "pointer") {
      ghost = doc.createElement("div");
      ghost.className = "bx--dnd__ghost";
      ghost.setAttribute("aria-hidden", "true");
      ghost.textContent = source.label;
      if (origin.rtl()) ghost.style.transform = "translateX(-100%)";
      host.append(ghost);
    }

    /** @param {Event} raw */
    const onKeydown = (raw) => {
      const event = /** @type {KeyboardEvent} */ (raw);
      if (session !== s) return;
      if (s.via === "pointer") {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        cancel(s);
        return;
      }
      handleLiftedKey(event, s);
    };

    // A press while a keyboard move is under way abandons it.
    const cancelOnPress = () => {
      if (session === s && s.via === "keyboard") cancel(s);
    };

    // `null` is a re-render or a click on nothing; a press cancels on its own.
    /** @param {FocusEvent} event */
    const cancelOnBlur = (event) => {
      const next = event.relatedTarget;
      if (
        session === s &&
        s.via === "keyboard" &&
        next instanceof Node &&
        !origin.node.contains(next) &&
        !(s.zone ?? s.origin).node.contains(next)
      )
        cancel(s);
    };

    /** @type {DndSession} */
    const s = {
      via,
      origin,
      zone: origin,
      source,
      item: source.item,
      home: origin.home(source),
      position: null,
      x: 0,
      y: 0,
      rtl: origin.rtl(),
      ghost,
      indicator,
      shown: null,
      frame: 0,
      placeFrame: 0,
      reveals: 0,
      lastTime: 0,
      scroll: createAutoScroll(),
      dispose() {
        if (session !== s) return;
        session = null;
        cancelAnimationFrame(s.frame);
        cancelAnimationFrame(s.placeFrame);
        s.shown?.indicate(s, null, indicator);
        ghost?.remove();
        indicator.remove();
        for (const lifted of origin.node.querySelectorAll("[data-dnd-lifted]"))
          lifted.removeAttribute("data-dnd-lifted");
        doc.removeEventListener("pointerdown", cancelOnPress, true);
        keys.removeEventListener("keydown", onKeydown, true);
        doc.removeEventListener("focusout", cancelOnBlur, true);
      },
    };
    s.position = s.home;
    session = s;
    source.item.setAttribute("data-dnd-lifted", "");
    keys.addEventListener("keydown", onKeydown, true);
    if (via === "keyboard") {
      doc.addEventListener("pointerdown", cancelOnPress, true);
      doc.addEventListener("focusout", cancelOnBlur, true);
    }
    announce(s, "pickedUp", s.home);
    return s;
  }

  /**
   * Keys for a keyboard move. They are heard on the document, because a
   * windowed list can scroll the lifted item out of the DOM and take focus
   * with it.
   * @param {KeyboardEvent} event
   * @param {DndSession} s
   */
  function handleLiftedKey(event, s) {
    const target = event.target;
    const doc = s.origin.node.ownerDocument;
    const inside =
      target === doc.body ||
      target === doc.documentElement ||
      (target instanceof Node &&
        (s.origin.node.contains(target) ||
          (s.zone?.node.contains(target) ?? false)));
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
      event.stopPropagation();
      if (key === " ") swallowSpaceKeyup(doc);
      drop(s);
      return;
    }
    if (key === "Tab") {
      cancel(s);
      return;
    }
    const zone = s.zone ?? s.origin;
    const from = s.position ?? s.home;
    const intent = keyIntent(key, zone.orientation, zone.rtl());
    if (!intent) {
      // Other keys do nothing while an item is in the air.
      if (key.startsWith("Arrow")) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    // A widget around the item, such as a tree, must not also move its focus.
    event.preventDefault();
    event.stopPropagation();
    /** @type {DndPosition | null} */
    let next;
    if (intent === "prevZone" || intent === "nextZone") {
      const neighbor = neighborZone(zone, intent === "nextZone" ? 1 : -1);
      if (!neighbor) return;
      next = neighbor.step(s, from, "enter");
    } else {
      next = zone.step(s, from, intent);
    }
    if (!next || next.key === from.key) {
      // Already at the end: repeat the position so it is heard.
      announce(s, "moved", from);
      return;
    }
    s.zone = next.zone;
    s.position = next;
    s.reveals = REVEAL_TRIES;
    announce(s, "moved", next);
    next.zone.reveal?.(s, next);
    schedulePlace(s);
  }

  /** @param {DndSession} s */
  function cancel(s) {
    if (session !== s) return;
    const { origin, home, via } = s;
    s.dispose();
    announce(s, "cancelled", home);
    if (via === "keyboard") origin.restoreFocus?.(s, home);
  }

  /** @param {DndSession} s */
  function drop(s) {
    if (session !== s) return;
    const { origin, position, home, via } = s;
    const zone = position?.zone;
    if (!zone || !position) {
      cancel(s);
      return;
    }
    s.dispose();

    if (position.key === home.key) {
      announce(s, "dropped", home);
      if (via === "keyboard") origin.restoreFocus?.(s, home);
      return;
    }

    /** @type {DndZone[]} */
    const touched = zone === origin ? [origin] : [origin, zone];
    const snapshots = touched.map((z) => z.snapshot?.(s));
    const accepted = zone.commit(s, position);
    if (!accepted) {
      announce(s, "cancelled", home);
      if (via === "keyboard") origin.restoreFocus?.(s, home);
      return;
    }
    announce(s, "dropped", position);
    requestAnimationFrame(() => {
      touched.forEach((z, i) => {
        z.settle?.(s, position, snapshots[i]);
      });
      if (via === "keyboard") zone.restoreFocus?.(s, position);
    });
  }

  // Zones -------------------------------------------------------------------

  /**
   * Connect a zone: lifting by pointer and keyboard, and the group it belongs
   * to. Returns `refresh` for when its group or `disabled` changed, and
   * `destroy`.
   * @param {DndZone} zone
   * @param {{ threshold?: () => number | undefined }} [config]
   */
  function connect(zone, config = {}) {
    const node = zone.node;
    const doc = node.ownerDocument;
    const region = acquireRegion(hostOf(node));
    voices.set(zone, region);
    /** @type {string | undefined} */
    let registeredGroup;
    /** @type {DndSource | null} */
    let pending = null;

    function register() {
      const group = zone.group;
      if (group === registeredGroup) return;
      if (registeredGroup !== undefined)
        groups.get(registeredGroup)?.delete(zone);
      registeredGroup = group;
      if (group === undefined) return;
      const set = groups.get(group) ?? new Set();
      groups.set(group, set);
      set.add(zone);
    }

    /** @param {PointerEvent} event */
    function handlePress(event) {
      if (zone.disabled || session) return false;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return false;
      // A field keeps its selection.
      if (target.closest(FIELD)) return false;
      const source = zone.sourceAt(target, "pointer", event);
      if (!source) return false;
      pending = source;
      doc.addEventListener("selectstart", preventDefault);
      return true;
    }

    /** @param {PointerEvent} event */
    function handleDragStart(event) {
      if (!pending) return;
      const s = lift(zone, pending, "pointer");
      s.x = event.clientX;
      s.y = event.clientY;
    }

    /** @param {PointerEvent} event */
    function handleDragMove(event) {
      if (session?.via !== "pointer" || session.origin !== zone) return;
      session.x = event.clientX;
      session.y = event.clientY;
      scheduleFrame(session);
    }

    /**
     * @param {PointerEvent | undefined} event - `undefined` when the zone was
     *   disabled mid-drag.
     * @param {boolean} dragged
     */
    function handleDragEnd(event, dragged) {
      pending = null;
      doc.removeEventListener("selectstart", preventDefault);
      if (!dragged || session?.via !== "pointer" || session.origin !== zone)
        return;
      if (!event || event.type !== "pointerup") {
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
        threshold: config.threshold?.(),
        enabled: !zone.disabled,
        onStart: handlePress,
        onDragStart: handleDragStart,
        onMove: handleDragMove,
        onEnd: handleDragEnd,
      };
    }

    const drag = pointerDrag(node, dragOptions());

    /** @param {KeyboardEvent} event */
    function handleKeydown(event) {
      if (zone.disabled || event.defaultPrevented || event.isComposing) return;
      if (session || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const source = target && zone.sourceAt(target, "keyboard", event);
      if (!source) return;
      event.preventDefault();
      // The handle may sit inside a widget that has its own Space and Enter.
      event.stopPropagation();
      swallowSpaceKeyup(doc);
      lift(zone, source, "keyboard");
    }

    // Capture, so a widget around the handle does not act on the key first.
    node.addEventListener("keydown", handleKeydown, true);
    register();

    return {
      refresh() {
        drag.update(dragOptions());
        register();
      },
      destroy() {
        if (session && (session.origin === zone || session.zone === zone))
          session.dispose();
        drag.destroy();
        node.removeEventListener("keydown", handleKeydown, true);
        doc.removeEventListener("selectstart", preventDefault);
        if (registeredGroup !== undefined) {
          const set = groups.get(registeredGroup);
          set?.delete(zone);
          if (set?.size === 0) groups.delete(registeredGroup);
        }
        voices.delete(zone);
        region.release();
      },
    };
  }

  return {
    connect,
    /** The drag in progress, if any. */
    get session() {
      return session;
    },
    /** Zones connected under a group. */
    zonesOf(/** @type {string} */ group) {
      return [...(groups.get(group) ?? [])];
    },
    /** Abandon the drag in progress. */
    cancel() {
      if (session) cancel(session);
    },
    /**
     * Tell the engine a zone re-rendered, so it can find the lifted item
     * again: a windowed list recreates it as it scrolls.
     * @param {DndZone} zone
     */
    notify(zone) {
      const s = session;
      if (!s) return;
      if (s.origin === zone) {
        const item = zone.itemFor?.(s);
        if (item && item !== s.item) {
          s.item.removeAttribute("data-dnd-lifted");
          s.item = item;
        }
        s.item.setAttribute("data-dnd-lifted", "");
      }
      schedulePlace(s);
    },
  };
}

let counter = 0;

/**
 * A page-unique id for an adapter's hidden nodes and position keys. A counter,
 * not a random number: nothing here needs to be unguessable.
 * @param {string} prefix
 */
export function nextId(prefix) {
  counter++;
  return `${prefix}-${counter}`;
}

/** @type {ReturnType<typeof createDnd> | null} */
let shared = null;

/**
 * The engine adapters share, created on first use in the browser, so no
 * module state is touched on the server.
 */
export function getDnd() {
  shared ??= createDnd();
  return shared;
}
