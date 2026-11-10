<script>
  /**
   * @typedef {import("../utils/dashboard-layout.js").DashboardGridLayoutItem} DashboardGridLayoutItem
   * @typedef {import("../Breakpoint/breakpoints.js").BreakpointSize} BreakpointSize
   * @typedef {Partial<Record<BreakpointSize, DashboardGridLayoutItem[]>>} DashboardGridLayouts
   * @typedef {Object} DashboardGridLayoutChange
   * @property {string} id - The widget that moved or resized.
   * @property {"move" | "resize"} type
   * @property {"pointer" | "keyboard"} source
   * @property {BreakpointSize | undefined} breakpoint - The breakpoint whose layout changed. `undefined` for a single `layout`.
   * @property {DashboardGridLayoutItem[]} layout - The new layout, in reading order.
   * @property {DashboardGridLayouts | undefined} layouts - Every layout, with `breakpoint`'s replaced. `undefined` for a single `layout`.
   * @typedef {Object} DashboardGridPosition
   * @property {string} label - The widget's title.
   * @property {number} column - The first column, counted from 1 at the inline start.
   * @property {number} row - The first row, counted from 1 at the top.
   * @property {number} width - Width in columns.
   * @property {number} height - Height in rows.
   */

  /**
   * A grid of widgets the user can drag and resize. Widgets are
   * `DashboardGridItem` children, placed by `layout` on a column grid with
   * CSS grid, so the server renders the final layout and it mirrors in
   * right-to-left languages.
   *
   * @restProps {div}
   * @slot {{}}
   * @event {DashboardGridLayoutChange} layoutchange - Fires once when the user drops or resizes a widget, and the layout changed. Cancelable: prevent it to keep the old layout.
   * @example
   * ```svelte
   * <DashboardGrid bind:layouts aria-label="Operations">
   *   <DashboardGridItem id="revenue" titleText="Revenue">…</DashboardGridItem>
   * </DashboardGrid>
   * ```
   */

  /**
   * Specify the layout of every widget on a grid with a fixed number of
   * columns, set with a numeric `cols`. Each item's `x`, `y`, `w` and `h`
   * count cells from 0 at the inline start and the top. Items beyond
   * the columns are fitted in, but the layout is otherwise drawn as it is: pass it
   * through `compactLayout` to settle one you wrote by hand.
   * @type {DashboardGridLayoutItem[]}
   * @bindable writable
   */
  export let layout = [];

  /**
   * Specify the layout at each breakpoint, as `{ sm, md, lg, xlg, max }`.
   * A breakpoint left out takes the nearest larger one's layout, fitted to
   * its columns. A move at one breakpoint changes that breakpoint's layout
   * only. Applies when `cols` is not a number.
   * @type {DashboardGridLayouts}
   * @bindable writable
   */
  export let layouts = {};

  /**
   * Specify the columns: a number for a grid that has that many at every
   * width and takes its layout from `layout`, or the columns at each
   * breakpoint, which take their layout from `layouts`. A breakpoint
   * left out keeps the Carbon grid's count.
   * @type {number | Partial<Record<BreakpointSize, number>>}
   */
  export let cols = { sm: 4, md: 8, lg: 16, xlg: 16, max: 16 };

  /** Specify the height of one row in px. */
  export let rowHeight = 96;

  /** Specify the gap between cells in px. */
  export let gap = 16;

  /**
   * `"vertical"` keeps every widget against the top or the widget above it,
   * so no gaps open when one moves. `"none"` leaves a widget where you put
   * it.
   * @type {"vertical" | "none"}
   */
  export let compact = "vertical";

  /**
   * `"push"` moves the widgets a dragged widget lands on out of its way.
   * `"prevent"` refuses a move onto another widget, so the widget stays at
   * the last free cell.
   * @type {"push" | "prevent"}
   */
  export let collision = "push";

  /** Set to `false` to stop widgets from being moved. */
  export let draggable = true;

  /** Set to `false` to stop widgets from being resized. */
  export let resizable = true;

  /**
   * Set the id of the grid. The widgets' instructions use it.
   * @type {string}
   */
  export let id = uniqueId("ccs-dashboard-grid");

  /**
   * Specify the name of a widget's drag handle. It is also the handle's tooltip.
   * @type {(position: { label: string }) => string}
   */
  export let handleLabelText = ({ label }) => `Move ${label}`;

  /**
   * Specify the instructions every handle is described by.
   */
  export let instructionsText =
    "Press Enter to pick up. Arrow keys move the widget, Shift and arrow keys resize it, Enter drops it, and Escape cancels.";

  /**
   * Specify what is announced when a widget is picked up.
   * @type {(position: DashboardGridPosition) => string}
   */
  export let pickedUpText = ({ label, column, row }) =>
    `Picked up ${label}, column ${column}, row ${row}.`;

  /**
   * Specify what is announced when a picked-up widget moves.
   * @type {(position: DashboardGridPosition) => string}
   */
  export let movedText = ({ label, column, row }) =>
    `Moved ${label} to column ${column}, row ${row}.`;

  /**
   * Specify what is announced when a picked-up widget is resized.
   * @type {(position: DashboardGridPosition) => string}
   */
  export let resizedText = ({ label, width, height }) =>
    `Resized ${label} to ${width} ${width === 1 ? "column" : "columns"} wide, ${height} ${height === 1 ? "row" : "rows"} high.`;

  /**
   * Specify what is announced when a picked-up widget is dropped.
   * @type {(position: DashboardGridPosition) => string}
   */
  export let droppedText = ({ label, column, row }) =>
    `Dropped ${label} at column ${column}, row ${row}.`;

  /**
   * Specify what is announced when a move is cancelled.
   * @type {(position: DashboardGridPosition) => string}
   */
  export let cancelledText = ({ label, column, row }) =>
    `Cancelled. ${label} is back at column ${column}, row ${row}.`;

  /**
   * Specify what is announced when a key press cannot move or resize the
   * widget any further.
   * @type {(position: DashboardGridPosition & { action: "move" | "resize" }) => string}
   */
  export let blockedText = ({ label, action }) =>
    `${label} cannot ${action} any further that way.`;

  /**
   * Obtain a reference to the grid element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";
  import {
    cellAt,
    cellSpan,
    edgeScrollSpeed,
    readGrid,
  } from "../utils/dashboard-grid-geometry.js";
  import {
    breakpointAt,
    DASHBOARD_BREAKPOINTS,
    layoutsEqual,
    moveLayoutItem,
    normalizeLayout,
    nudgeLayoutItem,
    placementStyles,
    resizeLayoutItem,
    resolveColumns,
    resolveLayouts,
    sortLayout,
  } from "../utils/dashboard-layout.js";
  import { getScrollableAncestors } from "../utils/get-scrollable-ancestors.js";
  import { inlineKey } from "../utils/inline-direction.js";
  import { getLayoutDirection } from "../utils/layout-direction.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** Pointer movement in px before a press becomes a drag. */
  const DRAG_THRESHOLD = 4;
  /** How long a widget pushed aside slides to its new cell. Carbon `moderate-01`. */
  const SLIDE_MS = 150;
  /** Carbon's productive standard easing. */
  const SLIDE_EASING = "cubic-bezier(0.2, 0, 0.38, 0.9)";

  /**
   * The viewport width, once the window reports it. It drives which
   * breakpoint's layout says whether a widget is `static`.
   * @type {number | undefined}
   */
  let innerWidth;

  /**
   * The breakpoint an interaction edits, read when it starts so that it
   * is right the moment after a resize.
   * @returns {BreakpointSize}
   */
  function currentKey() {
    return responsive ? breakpointAt(window.innerWidth) : "sm";
  }

  /**
   * @param {boolean} responsive
   * @param {DashboardGridLayoutItem[]} single
   * @param {DashboardGridLayouts} byBreakpoint
   * @param {Record<BreakpointSize, number>} columns
   * @param {"vertical" | "none"} mode
   * @returns {Record<BreakpointSize, DashboardGridLayoutItem[]>}
   */
  function buildLists(responsive, single, byBreakpoint, columns, mode) {
    if (responsive) return resolveLayouts(byBreakpoint ?? {}, columns, mode);
    const own = normalizeLayout(single ?? [], columns.sm);
    return { sm: own, md: own, lg: own, xlg: own, max: own };
  }

  /**
   * @param {Record<BreakpointSize, DashboardGridLayoutItem[]>} lists
   * @param {{ key: BreakpointSize; layout: DashboardGridLayoutItem[] } | null} draft
   * @param {boolean} responsive
   * @returns {Record<BreakpointSize, DashboardGridLayoutItem[]>}
   */
  function withDraft(lists, draft, responsive) {
    if (!draft) return lists;
    if (!responsive) {
      const own = draft.layout;
      return { sm: own, md: own, lg: own, xlg: own, max: own };
    }
    return { ...lists, [draft.key]: draft.layout };
  }

  /**
   * @param {Record<BreakpointSize, DashboardGridLayoutItem[]>} shown
   * @param {Map<string, string>} placements
   * @param {BreakpointSize} key
   * @returns {Map<string, import("./types.js").DashboardGridItemInfo>}
   */
  function buildInfo(shown, placements, key) {
    /** @type {Map<string, import("./types.js").DashboardGridItemInfo>} */
    const info = new Map();
    for (const item of shown[key])
      info.set(item.id, {
        style: placements.get(item.id) ?? "",
        locked: Boolean(item.static),
      });
    for (const [itemId, style] of placements)
      if (!info.has(itemId)) info.set(itemId, { style, locked: false });
    return info;
  }

  /**
   * @param {number} px
   * @returns {string}
   */
  function rem(px) {
    return `${(Number.isFinite(px) ? px : 0) / 16}rem`;
  }

  /** @type {import("svelte/store").Writable<Map<string, import("./types.js").DashboardGridItemInfo>>} */
  const info = writable(new Map());

  /** @type {import("svelte/store").Writable<{ draggable: boolean; resizable: boolean }>} */
  const options = writable({ draggable: true, resizable: true });

  /** @type {import("svelte/store").Writable<{ handleLabelText: (position: { label: string }) => string; instructionsId: string; gridId: string }>} */
  const texts = writable({
    handleLabelText: (position) => position.label,
    instructionsId: "",
    gridId: "",
  });

  /** @type {{ key: BreakpointSize; layout: DashboardGridLayoutItem[] } | null} */
  let draft = null;

  $: responsive = typeof cols !== "number";
  $: columns = resolveColumns(cols);
  $: lists = buildLists(responsive, layout, layouts, columns, compact);
  $: shown = withDraft(lists, draft, responsive);
  $: placements = placementStyles(shown);
  // The layout an interaction edits: the one at the width now. A single
  // layout is the same at every breakpoint.
  $: editKey = responsive ? breakpointAt(innerWidth ?? 1056) : "sm";
  $: info.set(buildInfo(shown, placements, editKey));
  $: texts.set({
    handleLabelText,
    instructionsId: `${id}-instructions`,
    gridId: id,
  });
  $: options.set({ draggable, resizable });

  $: style = [
    ...DASHBOARD_BREAKPOINTS.map(
      (bp) => `--ccs-dashboard-grid-cols-${bp}:${columns[bp]}`,
    ),
    `--ccs-dashboard-grid-gap:${rem(gap)}`,
    `--ccs-dashboard-grid-row-height:${rem(rowHeight)}`,
    $$restProps.style,
  ]
    .filter(Boolean)
    .join(";");

  /**
   * The widget being moved or resized, and how.
   * @type {import("svelte/store").Writable<import("./types.js").DashboardGridInteraction | null>}
   */
  const interaction = writable(null);

  /** @type {Map<string, import("./types.js").DashboardGridWidget>} */
  const registered = new Map();

  let message = "";
  let flip = false;

  /** @param {string} text */
  function announce(text) {
    flip = !flip;
    // A repeated message is not read again, so every other one ends in an
    // invisible character.
    message = flip ? text : `${text}​`;
  }

  /**
   * @param {DashboardGridLayoutItem | undefined} item
   * @param {string} label
   * @returns {DashboardGridPosition}
   */
  function positionOf(item, label) {
    return {
      label,
      column: (item?.x ?? 0) + 1,
      row: (item?.y ?? 0) + 1,
      width: item?.w ?? 1,
      height: item?.h ?? 1,
    };
  }

  /** @returns {{ cols: number; compact: "vertical" | "none"; collision: "push" | "prevent" }} */
  function model() {
    return { cols: columns[currentKey()], compact, collision };
  }

  /** @returns {boolean} */
  function reducedMotion() {
    return (
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /**
   * @param {string | undefined} skip
   * @returns {Map<string, DOMRect>}
   */
  function snapshot(skip) {
    /** @type {Map<string, DOMRect>} */
    const rects = new Map();
    for (const [itemId, entry] of registered)
      if (itemId !== skip)
        rects.set(itemId, entry.root.getBoundingClientRect());
    return rects;
  }

  /**
   * FLIP: slide every widget that moved from where it was to where it is.
   * @param {Map<string, DOMRect>} firsts
   */
  function slide(firsts) {
    if (reducedMotion()) return;
    queueMicrotask(() => {
      for (const [itemId, first] of firsts) {
        const root = registered.get(itemId)?.root;
        if (!root || typeof root.animate !== "function") continue;
        const last = root.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        root.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: SLIDE_MS, easing: SLIDE_EASING },
        );
      }
    });
  }

  /**
   * @param {BreakpointSize} key
   * @param {DashboardGridLayoutItem[]} next
   * @param {string} lifted - The widget that follows the pointer, which does not slide.
   */
  function setDraft(key, next, lifted) {
    const firsts = snapshot(lifted);
    draft = { key, layout: next };
    slide(firsts);
  }

  /**
   * Commit the draft: tell the consumer, and keep it unless they refuse.
   * @param {string} itemId
   * @param {"move" | "resize"} type
   * @param {"pointer" | "keyboard"} source
   * @returns {boolean} Whether the layout changed.
   */
  function commit(itemId, type, source) {
    const current = draft;
    draft = null;
    if (!current) return false;
    const before = lists[current.key];
    if (layoutsEqual(before, current.layout)) return false;
    const next = sortLayout(current.layout);
    /** @type {DashboardGridLayouts | undefined} */
    const nextLayouts = responsive
      ? { ...layouts, [current.key]: next }
      : undefined;
    const proceed = dispatch(
      "layoutchange",
      {
        id: itemId,
        type,
        source,
        breakpoint: responsive ? current.key : undefined,
        layout: next,
        layouts: nextLayouts,
      },
      { cancelable: true },
    );
    if (!proceed) return false;
    if (nextLayouts) layouts = nextLayouts;
    else layout = next;
    return true;
  }

  // ---- Pointer

  /** @type {import("./types.js").PointerSession | null} */
  let pointer = null;

  /**
   * @param {string} itemId
   * @param {"move" | "resize"} mode
   * @param {import("./types.js").DashboardGridEdge | null} edge
   * @param {PointerEvent} event
   * @param {HTMLElement} root
   * @param {HTMLElement} frame
   * @returns {boolean} `false` declines the drag.
   */
  function pointerStart(itemId, mode, edge, event, root, frame) {
    if (pointer || kb || !ref) return false;
    if (mode === "move" ? !draggable : !resizable) return false;
    const key = currentKey();
    const base = lists[key];
    const item = base.find((candidate) => candidate.id === itemId);
    const metrics = readGrid(ref);
    if (!item || item.static || !metrics) return false;
    pointer = {
      id: itemId,
      mode,
      edge,
      key,
      base,
      item,
      metrics,
      rect: root.getBoundingClientRect(),
      gridRect: ref.getBoundingClientRect(),
      root,
      frame,
      x0: event.clientX,
      y0: event.clientY,
      x: event.clientX,
      y: event.clientY,
      started: false,
      last: "",
      frameId: 0,
      lastTime: 0,
      edgeSince: 0,
      carry: { x: 0, y: 0 },
      scrollers: [],
    };
    return true;
  }

  /** @param {PointerEvent} event */
  function pointerMove(event) {
    const s = pointer;
    if (!s) return;
    s.x = event.clientX;
    s.y = event.clientY;
    if (!s.started) {
      if (Math.hypot(s.x - s.x0, s.y - s.y0) < DRAG_THRESHOLD) return;
      lift(s);
    }
    schedule(s);
  }

  /** @param {import("./types.js").PointerSession} s */
  function lift(s) {
    s.started = true;
    /** @type {Set<HTMLElement>} */
    const scrollers = new Set();
    for (const el of ref ? getScrollableAncestors(ref) : [])
      if (el instanceof HTMLElement) scrollers.add(el);
    const page = ref?.ownerDocument.scrollingElement;
    if (page instanceof HTMLElement) scrollers.add(page);
    s.scrollers = [...scrollers];
    // Pin the size, so the widget keeps it once it leaves the grid's flow.
    s.frame.style.inlineSize = `${s.rect.width}px`;
    s.frame.style.blockSize = `${s.rect.height}px`;
    interaction.set({ id: s.id, type: s.mode, source: "pointer" });
    ref?.ownerDocument.addEventListener("keydown", pointerKeydown, true);
  }

  /** @param {KeyboardEvent} event */
  function pointerKeydown(event) {
    if (event.key !== "Escape" || !pointer) return;
    event.preventDefault();
    event.stopPropagation();
    finishPointer(true);
  }

  /** @param {import("./types.js").PointerSession} s */
  function schedule(s) {
    if (s.frameId) return;
    s.frameId = requestAnimationFrame((now) => {
      s.frameId = 0;
      if (pointer === s) follow(s, now);
    });
  }

  /**
   * One animation frame of a drag: scroll near an edge, follow the pointer,
   * and move the placeholder to the cell the widget is over.
   * @param {import("./types.js").PointerSession} s
   * @param {number} now
   * @param {boolean} [scroll=true] - Set to `false` on release, which scrolls no more.
   */
  function follow(s, now, scroll = true) {
    const dt = s.lastTime ? Math.min(now - s.lastTime, 64) : 16;
    s.lastTime = now;
    const scrolling = scroll && autoScroll(s, dt, now);
    if (!ref) return;

    const { metrics, item, rect } = s;
    const grid = ref.getBoundingClientRect();
    // How far the grid has moved since the press: it scrolls with the page.
    const shiftX = grid.left - s.gridRect.left;
    const shiftY = grid.top - s.gridRect.top;
    // Where the first cell starts, found from where this widget started.
    const originX = metrics.rtl
      ? rect.right + shiftX + item.x * metrics.pitchX
      : rect.left + shiftX - item.x * metrics.pitchX;
    const originY = rect.top + shiftY - item.y * metrics.pitchY;
    const rootRect = s.root.getBoundingClientRect();
    const sign = metrics.rtl ? -1 : 1;

    /** @type {DashboardGridLayoutItem[]} */
    let next;
    let key;
    if (s.mode === "move") {
      const left = rect.left + (s.x - s.x0);
      const top = rect.top + (s.y - s.y0);
      const offset = metrics.rtl
        ? originX - (left + rect.width)
        : left - originX;
      const column = cellAt(offset, metrics.pitchX, metrics.cols - item.w + 1);
      const row = cellAt(
        top - originY,
        metrics.pitchY,
        Number.POSITIVE_INFINITY,
      );
      const baseLeft = metrics.rtl
        ? rootRect.right - rect.width
        : rootRect.left;
      s.frame.style.transform = `translate(${left - baseLeft}px, ${top - rootRect.top}px)`;
      key = `${column},${row}`;
      next =
        key === s.last
          ? s.base
          : moveLayoutItem(s.base, s.id, column, row, model());
    } else {
      const grow = s.edge !== "block";
      const taller = s.edge !== "inline";
      const width = grow
        ? Math.max(
            metrics.columnWidth * 0.5,
            rect.width + sign * (s.x - s.x0) - sign * shiftX,
          )
        : rect.width;
      const height = taller
        ? Math.max(metrics.rowHeight * 0.5, rect.height + (s.y - s.y0) - shiftY)
        : rect.height;
      s.frame.style.inlineSize = `${width}px`;
      s.frame.style.blockSize = `${height}px`;
      const w = cellSpan(width, metrics.columnWidth, metrics.gapX);
      const h = cellSpan(height, metrics.rowHeight, metrics.gapY);
      key = `${w}x${h}`;
      next =
        key === s.last ? s.base : resizeLayoutItem(s.base, s.id, w, h, model());
    }
    if (key !== s.last) {
      s.last = key;
      // A refused move gives the layout back, and the placeholder stays.
      if (next !== s.base) setDraft(s.key, next, s.id);
    }
    if (scrolling) schedule(s);
  }

  /**
   * Scroll the scroller the pointer presses against, innermost first.
   * @param {import("./types.js").PointerSession} s
   * @param {number} dt
   * @param {number} now
   * @returns {boolean} Whether another frame is needed.
   */
  function autoScroll(s, dt, now) {
    const held = s.edgeSince ? now - s.edgeSince : 0;
    let pressing = false;
    let moved = false;
    for (const axis of /** @type {const} */ (["y", "x"])) {
      for (const scroller of s.scrollers) {
        const isPage = scroller === scroller.ownerDocument.scrollingElement;
        const box = isPage
          ? {
              left: 0,
              top: 0,
              right: window.innerWidth,
              bottom: window.innerHeight,
            }
          : scroller.getBoundingClientRect();
        const along = axis === "y" ? s.y : s.x;
        const speed = edgeScrollSpeed({
          pointer: along,
          start: axis === "y" ? box.top : box.left,
          end: axis === "y" ? box.bottom : box.right,
          held,
        });
        if (speed === 0) continue;
        const room =
          axis === "y"
            ? scroller.scrollHeight - scroller.clientHeight
            : scroller.scrollWidth - scroller.clientWidth;
        const position =
          axis === "y" ? scroller.scrollTop : scroller.scrollLeft;
        const rtlX = axis === "x" && s.metrics.rtl;
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
          if (axis === "y") scroller.scrollTop = position + whole;
          else scroller.scrollLeft = position + whole;
          moved = true;
        }
        break;
      }
    }
    s.edgeSince = pressing ? s.edgeSince || now : 0;
    return pressing || moved;
  }

  /** @param {PointerEvent} event */
  function pointerEnd(event) {
    finishPointer(event.type === "pointercancel", event);
  }

  /**
   * @param {boolean} cancelled
   * @param {PointerEvent} [release] - The release, whose position is the last one.
   */
  function finishPointer(cancelled, release) {
    const s = pointer;
    if (!s) return;
    cancelAnimationFrame(s.frameId);
    // The last move may still wait for its frame, and a quick release is
    // the drop the user meant: settle at the release point first.
    if (s.started && !cancelled && release) {
      s.x = release.clientX;
      s.y = release.clientY;
      follow(s, performance.now(), false);
    }
    pointer = null;
    ref?.ownerDocument.removeEventListener("keydown", pointerKeydown, true);
    s.frame.style.inlineSize = "";
    s.frame.style.blockSize = "";
    s.frame.style.transform = "";
    interaction.set(null);
    if (!s.started || cancelled) {
      draft = null;
      return;
    }
    if (commit(s.id, s.mode, "pointer")) {
      const item = (responsive ? layouts[s.key] : layout)?.find(
        (candidate) => candidate.id === s.id,
      );
      const at = positionOf(item, labels.get(s.id) ?? s.id);
      announce(s.mode === "move" ? droppedText(at) : resizedText(at));
    }
  }

  // ---- Keyboard

  /** @type {Map<string, string>} */
  const labels = new Map();

  /** @type {import("./types.js").KeyboardSession | null} */
  let kb = null;

  /**
   * @param {DashboardGridLayoutItem[]} from
   * @param {string} itemId
   */
  function find(from, itemId) {
    return from.find((candidate) => candidate.id === itemId);
  }

  /**
   * @param {string} itemId
   * @param {string} label
   * @param {KeyboardEvent} event
   */
  function keydown(itemId, label, event) {
    if (pointer || event.defaultPrevented) return;
    const session = kb;
    if (!session) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!draggable && !resizable) return;
      const key = currentKey();
      const origin = find(lists[key], itemId);
      if (!origin || origin.static) return;
      event.preventDefault();
      labels.set(itemId, label);
      kb = { id: itemId, label, key, origin };
      draft = { key, layout: lists[key] };
      interaction.set({ id: itemId, type: "move", source: "keyboard" });
      announce(pickedUpText(positionOf(origin, label)));
      return;
    }
    if (session.id !== itemId) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancelKeyboard();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      dropKeyboard();
    } else if (event.key === "Tab") {
      cancelKeyboard();
    } else if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      const key = inlineKey(event.key, $layoutDirection, ref);
      stepKeyboard(
        session,
        key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0,
        key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0,
        event.shiftKey,
      );
    }
  }

  /**
   * @param {import("./types.js").KeyboardSession} session
   * @param {-1 | 0 | 1} dx
   * @param {-1 | 0 | 1} dy
   * @param {boolean} resize
   */
  function stepKeyboard(session, dx, dy, resize) {
    const current = draft?.layout;
    if (!current) return;
    const before = find(current, session.id);
    const action = resize ? "resize" : "move";
    if (resize ? !resizable : !draggable) {
      announce(blockedText({ ...positionOf(before, session.label), action }));
      return;
    }
    const next =
      before && resize
        ? resizeLayoutItem(
            current,
            session.id,
            before.w + dx,
            before.h + dy,
            model(),
          )
        : nudgeLayoutItem(current, session.id, dx, dy, model());
    const after = find(next, session.id);
    if (next === current || !after) {
      announce(blockedText({ ...positionOf(before, session.label), action }));
      return;
    }
    setDraft(session.key, next, "");
    const at = positionOf(after, session.label);
    announce(resize ? resizedText(at) : movedText(at));
    const root = registered.get(session.id)?.root;
    queueMicrotask(() =>
      root?.scrollIntoView?.({ block: "nearest", inline: "nearest" }),
    );
  }

  function dropKeyboard() {
    const session = kb;
    if (!session) return;
    kb = null;
    interaction.set(null);
    const dropped = find(draft?.layout ?? [], session.id);
    const resized =
      dropped !== undefined &&
      (dropped.w !== session.origin.w || dropped.h !== session.origin.h);
    const changed = commit(session.id, resized ? "resize" : "move", "keyboard");
    const item = find(
      changed
        ? responsive
          ? (layouts[session.key] ?? [])
          : layout
        : lists[session.key],
      session.id,
    );
    announce(droppedText(positionOf(item, session.label)));
    restoreFocus(session.id);
  }

  function cancelKeyboard() {
    const session = kb;
    if (!session) return;
    kb = null;
    draft = null;
    interaction.set(null);
    announce(cancelledText(positionOf(session.origin, session.label)));
  }

  /**
   * A keyed list that reorders its widgets moves the nodes, which drops
   * focus. Put it back on the handle.
   * @param {string} itemId
   */
  function restoreFocus(itemId) {
    requestAnimationFrame(() => {
      const handle = registered.get(itemId)?.handle;
      const active = handle?.ownerDocument.activeElement;
      if (handle && (!active || active === handle.ownerDocument.body))
        handle.focus({ preventScroll: true });
    });
  }

  /** @param {string} itemId */
  function blur(itemId) {
    if (kb?.id === itemId) cancelKeyboard();
  }

  /**
   * @param {string} itemId
   * @param {import("./types.js").DashboardGridWidget} entry
   * @returns {() => void}
   */
  function register(itemId, entry) {
    registered.set(itemId, entry);
    return () => {
      if (registered.get(itemId) === entry) registered.delete(itemId);
    };
  }

  onMount(() => () => {
    if (pointer) finishPointer(true);
    kb = null;
  });

  /** @type {import("./types.js").DashboardGridContext} */
  const context = {
    items: readonly(info),
    options: readonly(options),
    texts: readonly(texts),
    interaction: readonly(interaction),
    register,
    setLabel: (itemId, label) => {
      labels.set(itemId, label);
    },
    pointerStart,
    pointerMove,
    pointerEnd,
    keydown,
    blur,
  };

  setContext("carbon:DashboardGrid", context);
</script>

<svelte:window bind:innerWidth />

<div
  bind:this={ref}
  role="group"
  {...$$restProps}
  {id}
  class:bx--dashboard-grid={true}
  class:bx--dashboard-grid--interacting={$interaction !== null}
  {style}
>
  <slot />
  <div id="{id}-instructions" hidden>{instructionsText}</div>
  <div
    class="bx--visually-hidden"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {message}
  </div>
</div>
