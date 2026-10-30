<script>
  /**
   * @typedef {object} KanbanColumn
   * @property {string} id
   * @property {string} title
   * @property {number} [limit] - Work-in-progress limit: the most cards the column should hold.
   * @property {boolean} [collapsible] - Set to `false` to keep this column from collapsing when `collapsible` is on.
   */

  /**
   * @typedef {object} KanbanItem
   * @property {string} id
   * @property {string} column - Id of the column the card belongs to.
   * @property {string} [title]
   * @property {string} [description]
   * @property {Array<{ text: string; type?: string }>} [tags] - Tags shown on the card. `type` is any `Tag` type, such as `"blue"`.
   * @property {string} [assignee] - Full name, shown as a `UserAvatar`.
   */

  /**
   * @typedef {object} KanbanMoveDetail
   * @property {string} id - The card that moved.
   * @property {string} from - Id of the column it left.
   * @property {string} to - Id of the column it enters. Equal to `from` when the card is reordered.
   * @property {number} index - Where it lands among the other cards of `to`: `0` is the top.
   * @property {number} fromIndex - Where it was in `from`.
   * @property {"pointer" | "keyboard" | "menu"} source - How the user moved it.
   */

  /**
   * @typedef {object} KanbanAnnouncement
   * @property {string} label - The card's label.
   * @property {string} column - Title of the column the card is over.
   * @property {number} index - Zero-based position among the column's cards.
   * @property {number} count - Number of cards the column holds with this one in it.
   * @property {"pointer" | "keyboard" | "menu"} mode
   */

  /**
   * @template {KanbanItem} [Item=KanbanItem]
   * @restProps {div}
   * @event {KanbanMoveDetail} move - Dispatched when the user drops a card somewhere new, or picks "Move to" in its menu. Cancelable: call `preventDefault()` to refuse the move, for example to wait for a server. The component never edits your array or its cards; it assigns a new `items` array, which reaches you only through `bind:items`.
   * @slot {{ item: Item; column: KanbanColumn; index: number }} card - Replace the content of a card.
   * @slot {{ column: KanbanColumn; count: number; limit: number | undefined; overLimit: boolean; collapsed: boolean }} columnHeader - Replace a column's title and count.
   * @slot {{ column: KanbanColumn }} empty - Replace the text of an empty column.
   */

  /**
   * Specify the columns, in reading order.
   * @type {ReadonlyArray<KanbanColumn>}
   */
  export let columns = [];

  /**
   * Specify the cards. Each has a unique `id` and a `column`. The order of
   * the array is the order within a column.
   * @type {ReadonlyArray<Item>}
   */
  export let items = /** @type {ReadonlyArray<Item>} */ ([]);

  /**
   * Specify the ids of the collapsed columns.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let collapsedIds = [];

  /** Set to `true` to give each column a button that collapses it */
  export let collapsible = false;

  /**
   * Set what a column's `limit` does. `"warn"` marks a column that holds
   * more cards than its limit. `"block"` also keeps cards out of a full
   * column. Reordering inside a column is always allowed.
   * @type {"warn" | "block"}
   */
  export let limitMode = "warn";

  /** Set to `true` to prevent moving cards */
  export let disabled = false;

  /**
   * Set the heading level of the column titles.
   * @type {2 | 3 | 4 | 5 | 6}
   */
  export let headingLevel = 3;

  /**
   * Specify the text that names a card to assistive technology, in its drag
   * handle, menu and announcements.
   * @type {(item: Item) => string}
   */
  export let itemToString = defaultItemToString;

  /** Specify the text that tells keyboard users how to move a card */
  export let instructionsText =
    "Press Space or Enter to pick up. Use the arrow keys to move, Space or Enter to drop, Escape to cancel. Press Shift+F10 for the move menu.";

  /** Specify what a screen reader calls a card's drag handle */
  export let roleDescriptionText = "draggable card";

  /**
   * Specify the announcement when a card is picked up.
   * @type {(details: KanbanAnnouncement) => string}
   */
  export let pickedUpText = defaultPickedUpText;

  /**
   * Specify the announcement when a picked-up card is over a new place.
   * @type {(details: KanbanAnnouncement) => string}
   */
  export let movedText = defaultMovedText;

  /**
   * Specify the announcement when a card is dropped.
   * @type {(details: KanbanAnnouncement) => string}
   */
  export let droppedText = defaultDroppedText;

  /**
   * Specify the announcement when a move is cancelled.
   * @type {(details: KanbanAnnouncement) => string}
   */
  export let cancelledText = defaultCancelledText;

  /**
   * Specify the announcement when a hard limit keeps a card out of a column.
   * @type {(details: { column: string; limit: number }) => string}
   */
  export let fullText = defaultFullText;

  /**
   * Specify the announcement when a column ends up over its limit.
   * @type {(details: { column: string; count: number; limit: number }) => string}
   */
  export let overLimitText = defaultOverLimitText;

  /** Specify the tooltip of the button that opens a card's move menu */
  export let moveMenuText = "Move card";

  /**
   * Specify the accessible name of a card's move menu.
   * @type {(label: string) => string}
   */
  export let moveMenuLabel = defaultMoveMenuLabel;

  /**
   * Specify the move menu item that moves a card to a column.
   * @type {(column: string) => string}
   */
  export let moveToText = defaultMoveToText;

  /** Specify the move menu item that moves a card up a place */
  export let moveUpText = "Move up";

  /** Specify the move menu item that moves a card down a place */
  export let moveDownText = "Move down";

  /**
   * Specify the label of the button that collapses or expands a column.
   * @type {(details: { column: string; collapsed: boolean }) => string}
   */
  export let collapseText = defaultCollapseText;

  /**
   * Specify the label of a column's count when it has a limit.
   * @type {(details: { count: number; limit: number }) => string}
   */
  export let limitLabel = defaultLimitLabel;

  /** Specify the text of an empty column */
  export let emptyText = "No cards";

  /** Set an id for the top-level element. Inner ids derive from it. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, tick } from "svelte";
  import Layer from "../Layer/Layer.svelte";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
  import Tag from "../Tag/Tag.svelte";
  import Tile from "../Tile/Tile.svelte";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import {
    EDGE_SCROLL_RAMP_MS,
    TOUCH_LIFT_DELAY_MS,
  } from "../constants/timing.js";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import Draggable from "../icons/Draggable.svelte";
  import Warning from "../icons/Warning.svelte";
  import { focusQuietly } from "../utils/focus.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    applyKanbanMove,
    edgeSpeed,
    finalIndex,
    groupByColumn,
    hasRoom,
    slotAt,
    slotFor,
    stepTarget,
  } from "./kanban-model.js";

  /** Pixels a mouse must move before a press becomes a drag. */
  const DRAG_THRESHOLD = 4;
  /** Pixels a touch may drift during the long press. */
  const LONG_PRESS_SLOP = 10;
  /** Width of the band at each edge of a scroll box that scrolls it. */
  const EDGE_ZONE = 72;
  /** Edge scroll speed at the very edge, in px/s. */
  const EDGE_MAX_SPEED = 960;
  /** @type {Record<string, "up" | "down" | "start" | "end" | "previous" | "next">} */
  const STEP_KEYS = {
    ArrowUp: "up",
    ArrowDown: "down",
    Home: "start",
    End: "end",
    ArrowLeft: "previous",
    ArrowRight: "next",
  };
  const LIST = ".bx--kanban__list";
  const BODY = ".bx--kanban__body";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /**
   * @param {string | undefined} type
   * @returns {import("svelte").ComponentProps<Tag>["type"]}
   */
  function tagType(type) {
    return /** @type {import("svelte").ComponentProps<Tag>["type"]} */ (type);
  }

  /** @param {Item} item */
  function defaultItemToString(item) {
    return item.title ?? String(item.id);
  }

  /** @param {KanbanAnnouncement} details */
  function defaultPickedUpText({ label, column, index, count, mode }) {
    const where = `${label} picked up. Position ${index + 1} of ${count} in ${column}.`;
    return mode === "keyboard"
      ? `${where} Use the arrow keys to move, Space or Enter to drop, Escape to cancel.`
      : where;
  }

  /** @param {KanbanAnnouncement} details */
  function defaultMovedText({ column, index, count }) {
    return `${column}, position ${index + 1} of ${count}.`;
  }

  /** @param {KanbanAnnouncement} details */
  function defaultDroppedText({ label, column, index, count }) {
    return `${label} dropped. Position ${index + 1} of ${count} in ${column}.`;
  }

  /** @param {KanbanAnnouncement} details */
  function defaultCancelledText({ label, column, index, count }) {
    return `Move cancelled. ${label} is back at position ${index + 1} of ${count} in ${column}.`;
  }

  /** @param {{ column: string; limit: number }} details */
  function defaultFullText({ column, limit }) {
    return `${column} is full. Its limit is ${limit}.`;
  }

  /** @param {{ column: string; count: number; limit: number }} details */
  function defaultOverLimitText({ column, count, limit }) {
    return `${column} is over its limit: ${count} of ${limit}.`;
  }

  /** @param {string} label */
  function defaultMoveMenuLabel(label) {
    return `Move ${label}`;
  }

  /** @param {string} column */
  function defaultMoveToText(column) {
    return `Move to ${column}`;
  }

  /** @param {{ column: string; collapsed: boolean }} details */
  function defaultCollapseText({ column, collapsed }) {
    return `${collapsed ? "Expand" : "Collapse"} ${column}`;
  }

  /** @param {{ count: number; limit: number }} details */
  function defaultLimitLabel({ count, limit }) {
    return `${count} of ${limit} cards`;
  }

  /** @type {Map<string, string[]>} */
  let columnIds = new Map();
  /** @type {Map<string, Item>} */
  let byId = new Map();
  /** @type {null | string} */
  let tabStopId = null;
  // The card holding keyboard focus, to ring the whole card.
  /** @type {null | string} */
  let ringId = null;

  // The card being moved, how, where it began, and where it would land. The
  // dragged card stays in the DOM where it was (so keyboard focus never
  // moves); a line in the target column shows the drop place.
  /** @type {null | string} */
  let draggingId = null;
  /** @type {"pointer" | "keyboard"} */
  let dragMode = "pointer";
  /** @type {{ column: string; index: number }} */
  let dragFrom = { column: "", index: 0 };
  /** @type {null | { column: string; index: number; blocked: boolean }} */
  let target = null;
  /** @type {null | { column: string; top: number }} */
  let indicator = null;
  let announcement = "";

  /** @type {null | HTMLDivElement} */
  let scrollerRef = null;
  let builtColumns = new Set();

  /**
   * @param {ReadonlyArray<KanbanColumn>} columnList
   * @param {Map<string, string[]>} idsByColumn
   * @param {Set<string>} collapsed
   */
  function firstCard(columnList, idsByColumn, collapsed) {
    for (const column of columnList) {
      if (collapsed.has(column.id)) continue;
      const ids = idsByColumn.get(column.id);
      if (ids?.length) return ids[0];
    }
    return null;
  }

  /**
   * Build a column's cards the first time it is open, then keep them.
   * @param {ReadonlyArray<KanbanColumn>} columnList
   * @param {Set<string>} collapsed
   */
  function trackBuilt(columnList, collapsed) {
    let next = builtColumns;
    for (const column of columnList) {
      if (collapsed.has(column.id) || next.has(column.id)) continue;
      if (next === builtColumns) next = new Set(builtColumns);
      next.add(column.id);
    }
    builtColumns = next;
  }

  $: ({ ids: columnIds, byId } = groupByColumn(columns, items));
  $: collapsedSet = new Set(collapsedIds);
  $: columnsById = new Map(columns.map((column) => [column.id, column]));
  $: order = columns.map((column) => column.id);
  $: firstCardId = firstCard(columns, columnIds, collapsedSet);
  $: tabStop =
    tabStopId !== null && byId.has(tabStopId) ? tabStopId : firstCardId;
  $: trackBuilt(columns, collapsedSet);
  // A card the consumer removes mid-drag has nowhere to land.
  $: if (draggingId !== null && !byId.has(draggingId)) endDrag();

  /** @param {string} cardId */
  function handleId(cardId) {
    return `${id}-handle-${encodeURIComponent(cardId)}`;
  }

  /** @param {string} cardId */
  function focusHandle(cardId) {
    const handle = ref?.ownerDocument.getElementById(handleId(cardId));
    if (handle) focusQuietly(handle);
  }

  /** @param {string} text */
  function announce(text) {
    // The same words twice in a row are not announced twice.
    announcement = text === announcement ? `${text} ` : text;
  }

  /** @param {string} columnId */
  function titleOf(columnId) {
    return columnsById.get(columnId)?.title ?? columnId;
  }

  /** @param {string} columnId */
  function sizeWithout(columnId) {
    const length = columnIds.get(columnId)?.length ?? 0;
    return columnId === dragFrom.column ? length - 1 : length;
  }

  /**
   * @param {string} columnId
   * @returns {boolean}
   */
  function full(columnId) {
    return (
      limitMode === "block" &&
      !hasRoom(
        columnsById.get(columnId),
        columnIds.get(columnId)?.length ?? 0,
        columnId === dragFrom.column,
      )
    );
  }

  /**
   * @param {string} cardId
   * @param {"pointer" | "keyboard" | "menu"} mode
   * @param {{ column: string; index: number }} place
   * @returns {KanbanAnnouncement}
   */
  function describe(cardId, mode, place) {
    const item = byId.get(cardId);
    return {
      label: item ? itemToString(item) : cardId,
      column: titleOf(place.column),
      index: place.index,
      count: sizeWithout(place.column) + 1,
      mode,
    };
  }

  /**
   * @param {string} cardId
   * @param {"pointer" | "keyboard"} mode
   */
  function pickUp(cardId, mode) {
    const item = byId.get(cardId);
    const ids = item && columnIds.get(item.column);
    if (!item || !ids || disabled) return false;
    draggingId = cardId;
    dragMode = mode;
    dragFrom = { column: item.column, index: ids.indexOf(cardId) };
    target = { ...dragFrom, blocked: false };
    indicator = null;
    announce(pickedUpText(describe(cardId, mode, dragFrom)));
    return true;
  }

  function endDrag() {
    draggingId = null;
    target = null;
    indicator = null;
  }

  /**
   * @param {null | { column: string; index: number }} next
   * @param {boolean} blocked
   */
  function setTarget(next, blocked = false) {
    if (
      target?.column === next?.column &&
      target?.index === next?.index &&
      target?.blocked === blocked
    ) {
      return false;
    }
    target = next && { ...next, blocked };
    return true;
  }

  /** @param {string} columnId */
  function columnNode(columnId) {
    if (!scrollerRef) return null;
    for (const node of scrollerRef.children) {
      if (/** @type {HTMLElement} */ (node).dataset.kanbanColumn === columnId)
        return /** @type {HTMLElement} */ (node);
    }
    return null;
  }

  /**
   * Where the drop line sits for `slot` among a list's children, relative
   * to the column body that scrolls it.
   * @param {HTMLElement} list
   * @param {number} slot
   */
  function slotTop(list, slot) {
    const kids = /** @type {HTMLCollectionOf<HTMLElement>} */ (list.children);
    if (kids.length === 0) return 0;
    const half = (Number.parseFloat(getComputedStyle(list).rowGap) || 0) / 2;
    if (slot < kids.length) return kids[slot].offsetTop - half;
    const last = kids[kids.length - 1];
    return last.offsetTop + last.offsetHeight + half;
  }

  /**
   * Draw the drop line for `target`. A drop that leaves the card where it
   * is, or one that is refused, draws none.
   * @param {boolean} [reveal]
   */
  function placeIndicator(reveal = false) {
    if (draggingId === null || !target || target.blocked) {
      indicator = null;
      return;
    }
    const list = columnNode(target.column)?.querySelector(LIST);
    if (!(list instanceof HTMLElement)) {
      indicator = null;
      return;
    }
    const dragged = target.column === dragFrom.column ? dragFrom.index : -1;
    const slot = slotFor(target.index, dragged);
    if (dragged >= 0 && (slot === dragged || slot === dragged + 1)) {
      indicator = null;
    } else {
      const top = Math.round(slotTop(list, slot));
      if (indicator?.column !== target.column || indicator.top !== top) {
        indicator = { column: target.column, top };
      }
    }
    if (reveal) {
      const kids = list.children;
      const near = kids[Math.min(slot, kids.length - 1)];
      near?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  /**
   * @param {"pointer" | "keyboard" | "menu"} source
   * @param {string} cardId
   * @param {string} to
   * @param {number} index
   */
  function commit(source, cardId, to, index) {
    const item = byId.get(cardId);
    if (!item) return false;
    const fromIndex = columnIds.get(item.column)?.indexOf(cardId) ?? 0;
    /** @type {KanbanMoveDetail} */
    const detail = {
      id: cardId,
      from: item.column,
      to,
      index,
      fromIndex,
      source,
    };
    if (!dispatch("move", detail, { cancelable: true })) return false;
    items = /** @type {ReadonlyArray<Item>} */ (
      applyKanbanMove(items, { id: cardId, to, index })
    );
    return true;
  }

  /**
   * After a move the card may be a new element, so find it again.
   * @param {string} cardId
   */
  async function refocus(cardId) {
    await tick();
    focusHandle(cardId);
  }

  /** @param {boolean} drop */
  function dropOrCancel(drop) {
    const cardId = draggingId;
    const place = target;
    const mode = dragMode;
    if (cardId === null) return;
    const from = dragFrom;
    const label = describe(cardId, mode, from);
    endDrag();
    if (mode === "keyboard") refocus(cardId);
    if (!drop || !place) {
      announce(cancelledText(label));
      return;
    }
    if (place.blocked) {
      announce(
        fullText({
          column: titleOf(place.column),
          limit: columnsById.get(place.column)?.limit ?? 0,
        }),
      );
      return;
    }
    if (place.column === from.column && place.index === from.index) {
      announce(droppedText(label));
      return;
    }
    const landed = describe(cardId, mode, place);
    const limit = columnsById.get(place.column)?.limit;
    if (!commit(mode, cardId, place.column, place.index)) {
      announce(cancelledText(label));
      return;
    }
    announce(
      typeof limit === "number" && landed.count > limit
        ? `${droppedText(landed)} ${overLimitText({ column: landed.column, count: landed.count, limit })}`
        : droppedText(landed),
    );
  }

  // --- Keyboard ---

  /**
   * @param {string} cardId
   * @param {"up" | "down" | "start" | "end" | "previous" | "next"} key
   */
  function navigate(cardId, key) {
    const item = byId.get(cardId);
    const ids = item && columnIds.get(item.column);
    if (!item || !ids) return;
    const index = ids.indexOf(cardId);
    if (key === "up" || key === "down" || key === "start" || key === "end") {
      const next =
        key === "up"
          ? index - 1
          : key === "down"
            ? index + 1
            : key === "start"
              ? 0
              : ids.length - 1;
      const nextId = ids[next];
      if (nextId !== undefined && nextId !== cardId) focusHandle(nextId);
      return;
    }
    let position = order.indexOf(item.column) + (key === "previous" ? -1 : 1);
    while (position >= 0 && position < order.length) {
      const sibling = columnIds.get(order[position]);
      if (!collapsedSet.has(order[position]) && sibling?.length) {
        focusHandle(sibling[Math.min(index, sibling.length - 1)]);
        return;
      }
      position += key === "previous" ? -1 : 1;
    }
  }

  /**
   * @param {KeyboardEvent} event
   * @param {string} cardId
   */
  function handleKeydown(event, cardId) {
    if (disabled || hasModifierKey(event)) return;
    const { key } = event;
    const picked = draggingId === cardId && dragMode === "keyboard";
    const activate = key === " " || key === "Enter";

    if (!picked) {
      if (draggingId !== null) return;
      if (activate) {
        event.preventDefault();
        if (!event.repeat) pickUp(cardId, "keyboard");
        return;
      }
      if (key === "ContextMenu" || (key === "F10" && event.shiftKey)) {
        event.preventDefault();
        ref?.ownerDocument
          .getElementById(`${id}-menu-${encodeURIComponent(cardId)}`)
          ?.click();
        return;
      }
      const inline = inlineKey(key, $layoutDirection, ref);
      if (inline in STEP_KEYS) {
        event.preventDefault();
        navigate(cardId, STEP_KEYS[inline]);
      }
      return;
    }

    if (key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      dropOrCancel(false);
      return;
    }
    if (activate) {
      event.preventDefault();
      if (!event.repeat) dropOrCancel(true);
      return;
    }
    const inline = inlineKey(key, $layoutDirection, ref);
    if (!(inline in STEP_KEYS) || !target) return;
    event.preventDefault();
    const { target: next, blocked } = stepTarget({
      order,
      size: sizeWithout,
      from: target,
      key: STEP_KEYS[inline],
      skip: (column) => collapsedSet.has(column),
      full,
    });
    if (blocked !== undefined) {
      announce(
        fullText({
          column: titleOf(blocked),
          limit: columnsById.get(blocked)?.limit ?? 0,
        }),
      );
      return;
    }
    if (!next || !setTarget(next)) return;
    announce(movedText(describe(cardId, "keyboard", next)));
    tick().then(() => placeIndicator(true));
  }

  /**
   * @param {FocusEvent} event
   * @param {string} cardId
   */
  function handleFocus(event, cardId) {
    tabStopId = cardId;
    // A press focuses the handle too, and only keyboard focus draws the ring.
    try {
      const visible = /** @type {Element} */ (event.currentTarget).matches(
        ":focus-visible",
      );
      ringId = visible ? cardId : null;
    } catch {
      ringId = cardId;
    }
  }

  /**
   * @param {FocusEvent} event
   * @param {string} cardId
   */
  function handleFocusout(event, cardId) {
    const next = /** @type {Node | null} */ (event.relatedTarget);
    const card = /** @type {Element} */ (event.currentTarget).closest(
      "[data-kanban-item]",
    );
    if (next && card?.contains(next)) return;
    if (ringId === cardId) ringId = null;
    // Leaving the card by Tab or a click lets go of it.
    if (draggingId === cardId && dragMode === "keyboard") dropOrCancel(false);
  }

  // --- Pointer ---

  /**
   * @type {null | { id: string; node: HTMLElement; type: string; x: number; y: number; handle: boolean; timer: ReturnType<typeof setTimeout> | null; grabX: number; grabY: number; rect: DOMRect }}
   */
  let press = null;
  let pointer = { x: 0, y: 0 };
  /** @type {null | HTMLElement} */
  let ghost = null;
  /** @type {null | number} */
  let frameId = null;
  let lastFrame = 0;
  let pointerDirty = false;
  const edgeSince = {
    x: /** @type {null | number} */ (null),
    y: /** @type {null | number} */ (null),
  };
  /** @type {null | HTMLElement} */
  let hoverBody = null;

  const INTERACTIVE =
    'a[href], button, input, select, textarea, summary, [role="button"], [role="menuitem"], [contenteditable="true"], [data-kanban-no-drag]';

  /** @param {PointerEvent} event */
  function handlePointerStart(event) {
    if (disabled || draggingId !== null) return false;
    const node = /** @type {Element} */ (event.target).closest?.(
      "[data-kanban-item]",
    );
    if (!(node instanceof HTMLElement) || !ref?.contains(node)) return false;
    const control = /** @type {Element} */ (event.target).closest(INTERACTIVE);
    const handle = control?.classList.contains("bx--kanban__handle") ?? false;
    // Capturing the pointer retargets the click that follows, so a link or
    // button inside a card must keep its own press.
    if (control && !handle && node.contains(control)) return false;
    const rect = node.getBoundingClientRect();
    press = {
      id: node.dataset.kanbanItem ?? "",
      node,
      type: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      handle,
      timer: null,
      grabX: event.clientX - rect.left,
      grabY: event.clientY - rect.top,
      rect,
    };
    pointer = { x: event.clientX, y: event.clientY };
    if (event.pointerType !== "mouse") {
      // Non-passive so a lifted card can cancel the scroll; only for the
      // length of the press, since the compositor waits on such a listener.
      ref?.addEventListener("touchmove", handleTouchmove, { passive: false });
      if (!handle)
        press.timer = setTimeout(beginPointerDrag, TOUCH_LIFT_DELAY_MS);
    }
    return true;
  }

  /** @param {PointerEvent} event */
  function handlePointerMove(event) {
    if (!press) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (draggingId !== null) {
      pointerDirty = true;
      return;
    }
    const distance = Math.hypot(pointer.x - press.x, pointer.y - press.y);
    if (press.type !== "mouse" && !press.handle) {
      // The browser is about to pan; let it.
      if (distance > LONG_PRESS_SLOP) cancelPress();
    } else if (distance >= DRAG_THRESHOLD) {
      beginPointerDrag();
    }
  }

  function cancelPress() {
    if (press?.timer) clearTimeout(press.timer);
    if (press) press.timer = null;
  }

  function beginPointerDrag() {
    if (!press || draggingId !== null) return;
    cancelPress();
    const { node } = press;
    if (!pickUp(press.id, "pointer")) return;
    const layer = node.closest('[class*="bx--layer-"]');
    ghost = document.createElement("div");
    ghost.className = `bx--kanban__ghost ${[...(layer?.classList ?? [])].filter((name) => name.startsWith("bx--layer-")).join(" ")}`;
    const copy = /** @type {HTMLElement} */ (node.cloneNode(true));
    for (const el of copy.querySelectorAll("[id]")) el.removeAttribute("id");
    copy.removeAttribute("tabindex");
    copy.className = "";
    ghost.append(copy);
    ghost.setAttribute("aria-hidden", "true");
    // Physical on purpose: the transform measures from the window's corner.
    ghost.style.left = "0";
    ghost.style.top = "0";
    ghost.style.width = `${press.rect.width}px`;
    ghost.style.height = `${press.rect.height}px`;
    ref?.append(ghost);
    lastFrame = performance.now();
    pointerDirty = true;
    edgeSince.x = edgeSince.y = null;
    frameId = requestAnimationFrame(frame);
  }

  /** @param {number} now */
  function frame(now) {
    frameId = null;
    if (draggingId === null || dragMode !== "pointer" || !press) return;
    const dt = Math.min(now - lastFrame, 64) / 1000;
    lastFrame = now;

    let scrolled = false;
    if (scrollerRef) {
      const box = scrollerRef.getBoundingClientRect();
      const dx = edgeStep("x", pointer.x, box.left, box.right, now) * dt;
      if (dx) {
        const before = scrollerRef.scrollLeft;
        scrollerRef.scrollLeft += dx;
        scrolled ||= scrollerRef.scrollLeft !== before;
      }
    }
    if (hoverBody) {
      const box = hoverBody.getBoundingClientRect();
      const dy = edgeStep("y", pointer.y, box.top, box.bottom, now) * dt;
      if (dy) {
        const before = hoverBody.scrollTop;
        hoverBody.scrollTop += dy;
        scrolled ||= hoverBody.scrollTop !== before;
      }
    } else {
      edgeSince.y = null;
    }

    if (ghost) {
      ghost.style.transform = `translate3d(${pointer.x - press.grabX}px, ${pointer.y - press.grabY}px, 0)`;
    }
    if (pointerDirty || scrolled) {
      pointerDirty = false;
      hitTest(pointer.x, pointer.y);
    }
    frameId = requestAnimationFrame(frame);
  }

  /**
   * @param {"x" | "y"} axis
   * @param {number} point
   * @param {number} start
   * @param {number} end
   * @param {number} now
   */
  function edgeStep(axis, point, start, end, now) {
    const speed = edgeSpeed({
      point,
      start,
      end,
      zone: EDGE_ZONE,
      max: EDGE_MAX_SPEED,
    });
    if (speed === 0) {
      edgeSince[axis] = null;
      return 0;
    }
    edgeSince[axis] ??= now;
    return speed * Math.min(1, (now - edgeSince[axis]) / EDGE_SCROLL_RAMP_MS);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  function hitTest(x, y) {
    const hit = document.elementFromPoint(x, y);
    const node =
      hit && ref?.contains(hit) ? hit.closest("[data-kanban-column]") : null;
    if (!(node instanceof HTMLElement)) {
      hoverBody = null;
      if (setTarget(null)) indicator = null;
      return;
    }
    const columnId = node.dataset.kanbanColumn ?? "";
    const body = node.querySelector(BODY);
    hoverBody = body instanceof HTMLElement ? body : null;
    const list = node.querySelector(LIST);
    const blocked = full(columnId);
    let next;
    if (!(list instanceof HTMLElement) || collapsedSet.has(columnId)) {
      next = { column: columnId, index: sizeWithout(columnId) };
    } else {
      const kids = list.children;
      const dragged = columnId === dragFrom.column ? dragFrom.index : -1;
      const slot = slotAt(
        kids.length,
        (position) => {
          const box = kids[position].getBoundingClientRect();
          return box.top + box.height / 2;
        },
        y,
      );
      next = { column: columnId, index: finalIndex(slot, dragged) };
    }
    const columnChanged = target?.column !== next.column;
    if (setTarget(next, blocked) && columnChanged) {
      announce(
        blocked
          ? fullText({
              column: titleOf(columnId),
              limit: columnsById.get(columnId)?.limit ?? 0,
            })
          : movedText(describe(draggingId ?? "", "pointer", next)),
      );
    }
    placeIndicator();
  }

  /** @param {PointerEvent} event */
  function handlePointerEnd(event) {
    cancelPress();
    ref?.removeEventListener("touchmove", handleTouchmove);
    const active = draggingId !== null && dragMode === "pointer";
    press = null;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    ghost?.remove();
    ghost = null;
    hoverBody = null;
    if (!active) return;
    // The click that follows a drag isn't a click on the card.
    const swallow = (/** @type {Event} */ clickEvent) =>
      clickEvent.stopPropagation();
    ref?.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => ref?.removeEventListener("click", swallow, true), 0);
    dropOrCancel(event.type === "pointerup");
  }

  /** @param {TouchEvent} event */
  function handleTouchmove(event) {
    // A lifted card follows the finger instead of scrolling the board.
    if (draggingId !== null && dragMode === "pointer" && event.cancelable) {
      event.preventDefault();
    }
  }

  /** @param {Event} event */
  function handleContextmenu(event) {
    // A long press on touch would otherwise open the browser's menu.
    if (press && press.type !== "mouse") event.preventDefault();
  }

  // --- Menu and columns ---

  /**
   * @param {string} cardId
   * @param {string} to
   * @param {number} index
   */
  async function moveFromMenu(cardId, to, index) {
    const item = byId.get(cardId);
    if (!item) return;
    dragFrom = {
      column: item.column,
      index: columnIds.get(item.column)?.indexOf(cardId) ?? 0,
    };
    const label = describe(cardId, "menu", dragFrom);
    const landed = describe(cardId, "menu", { column: to, index });
    const limit = columnsById.get(to)?.limit;
    announce(
      commit("menu", cardId, to, index)
        ? typeof limit === "number" && landed.count > limit
          ? `${droppedText(landed)} ${overLimitText({ column: landed.column, count: landed.count, limit })}`
          : droppedText(landed)
        : cancelledText(label),
    );
    await refocus(cardId);
  }

  /**
   * @param {boolean} collapsed
   * @param {boolean} over
   * @param {boolean} targeted
   * @param {boolean} blocked
   */
  function columnClass(collapsed, over, targeted, blocked) {
    return [
      "bx--kanban__column",
      collapsed && "bx--kanban__column--collapsed",
      over && "bx--kanban__column--over-limit",
      targeted && "bx--kanban__column--target",
      blocked && "bx--kanban__column--blocked",
    ]
      .filter(Boolean)
      .join(" ");
  }

  /** @param {string} columnId */
  function toggleColumn(columnId) {
    collapsedIds = collapsedSet.has(columnId)
      ? collapsedIds.filter((value) => value !== columnId)
      : [...collapsedIds, columnId];
  }

  /**
   * Takes `enabled` as an argument: the template only re-runs a call when
   * one of the names in it changes.
   * @param {KanbanColumn} column
   * @param {boolean} enabled
   */
  function canCollapse(column, enabled) {
    return enabled && column.collapsible !== false;
  }

  /**
   * @param {KanbanColumn} column
   * @param {number} count
   */
  function isOver(column, count) {
    return typeof column.limit === "number" && count > column.limit;
  }
</script>

<div
  bind:this={ref}
  {id}
  role="group"
  class:bx--kanban={true}
  class:bx--kanban--disabled={disabled}
  {...$$restProps}
  use:pointerDrag={{
    enabled: !disabled,
    onStart: handlePointerStart,
    onMove: handlePointerMove,
    onEnd: handlePointerEnd,
  }}
  on:contextmenu={handleContextmenu}
  on:dragstart|preventDefault
>
  <span id="{id}-instructions" class:bx--visually-hidden={true}
    >{instructionsText}</span
  >
  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
  <div bind:this={scrollerRef} class:bx--kanban__scroller={true}>
    {#each columns as column (column.id)}
      {@const ids = columnIds.get(column.id) ?? []}
      {@const count = ids.length}
      {@const collapsed = collapsedSet.has(column.id)}
      {@const over = isOver(column, count)}
      {@const targeted =
        draggingId !== null &&
        target !== null &&
        target.column === column.id &&
        target.column !== dragFrom.column}
      {@const titleId = `${id}-${encodeURIComponent(column.id)}-title`}
      <Layer
        withBackground
        class={columnClass(
          collapsed,
          over,
          targeted,
          targeted && target?.blocked === true,
        )}
        data-kanban-column={column.id}
      >
        <div class:bx--kanban__header={true}>
          {#if canCollapse(column, collapsible)}
            <button
              type="button"
              class:bx--kanban__toggle={true}
              aria-expanded={collapsed ? "false" : "true"}
              aria-label={collapseText({ column: column.title, collapsed })}
              on:click={() => toggleColumn(column.id)}
            >
              {#if collapsed}
                <ChevronRight class="bx--kanban__toggle-icon" />
              {:else}
                <ChevronDown class="bx--kanban__toggle-icon" />
              {/if}
            </button>
          {/if}
          <svelte:element
            this={`h${headingLevel}`}
            id={titleId}
            class:bx--kanban__title={true}
          >
            <slot
              name="columnHeader"
              {column}
              {count}
              limit={column.limit}
              overLimit={over}
              {collapsed}
            >
              {column.title}
            </slot>
          </svelte:element>
          <Tag
            size="sm"
            type={over ? "red" : "gray"}
            icon={over ? Warning : undefined}
            id="{titleId}-count"
            class="bx--kanban__count"
          >
            <!-- An isolate keeps "3 / 4" in that order in right-to-left text. -->
            <bdi aria-hidden="true"
              >{typeof column.limit === "number"
                ? `${count} / ${column.limit}`
                : count}</bdi
            >
            <span class:bx--visually-hidden={true}
              >{typeof column.limit === "number"
                ? limitLabel({ count, limit: column.limit })
                : count}</span
            >
          </Tag>
        </div>
        {#if builtColumns.has(column.id)}
          <div class:bx--kanban__body={true} hidden={collapsed}>
            {#if indicator !== null && indicator.column === column.id}
              <div
                class:bx--kanban__indicator={true}
                aria-hidden="true"
                style:top="{indicator.top}px"
              ></div>
            {/if}
            {#if count === 0}
              <p class:bx--kanban__empty={true}>
                <slot name="empty" {column}>{emptyText}</slot>
              </p>
            {/if}
            <ul
              class:bx--kanban__list={true}
              aria-labelledby={titleId}
              hidden={count === 0 || undefined}
            >
              {#each ids as cardId, index (cardId)}
                {@const item = byId.get(cardId)}
                {#if item}
                  {@const label = itemToString(item)}
                  {@const stop = cardId === tabStop}
                  <li
                    class:bx--kanban__item={true}
                    class:bx--kanban__item--dragging={cardId === draggingId &&
                      dragMode === "pointer"}
                    class:bx--kanban__item--picked={cardId === draggingId &&
                      dragMode === "keyboard"}
                    class:bx--kanban__item--focus={cardId === ringId}
                    data-kanban-item={cardId}
                  >
                    <Tile noPadding class="bx--kanban__card">
                      <button
                        type="button"
                        id={handleId(cardId)}
                        class:bx--kanban__handle={true}
                        tabindex={stop ? 0 : -1}
                        aria-label={label}
                        aria-roledescription={roleDescriptionText}
                        aria-describedby="{id}-instructions"
                        aria-pressed={cardId === draggingId
                          ? "true"
                          : undefined}
                        aria-disabled={disabled ? "true" : undefined}
                        on:keydown={(event) => handleKeydown(event, cardId)}
                        on:focus={(event) => handleFocus(event, cardId)}
                        on:focusout={(event) => handleFocusout(event, cardId)}
                      >
                        <Draggable class="bx--kanban__handle-icon" />
                      </button>
                      <div class:bx--kanban__card-body={true}>
                        <slot name="card" {item} {column} {index}>
                          <p class:bx--kanban__card-title={true}>{label}</p>
                          {#if item.description}
                            <p class:bx--kanban__card-description={true}>
                              {item.description}
                            </p>
                          {/if}
                          {#if item.tags?.length || item.assignee}
                            <div class:bx--kanban__card-meta={true}>
                              {#each item.tags ?? [] as tag, tagIndex (tagIndex)}
                                <!-- A truncated tag's tooltip trigger
                                  would add a tab stop to the card. -->
                                <Tag
                                  size="sm"
                                  type={tagType(tag.type)}
                                  tabindex={-1}>{tag.text}</Tag
                                >
                              {/each}
                              {#if item.assignee}
                                <UserAvatar
                                  size="sm"
                                  name={item.assignee}
                                  backgroundColor="auto"
                                />
                              {/if}
                            </div>
                          {/if}
                        </slot>
                      </div>
                      {#if !disabled}
                        <OverflowMenu
                          size="sm"
                          flipped
                          portalMenu
                          id="{id}-menu-{encodeURIComponent(cardId)}"
                          iconDescription={moveMenuText}
                          aria-label={moveMenuLabel(label)}
                          tabindex={-1}
                          class="bx--kanban__menu"
                          on:close={(event) => {
                            // Escape and Tab return focus to the menu
                            // button, which is out of the tab order.
                            if (event.detail?.trigger === "escape-key") {
                              refocus(cardId);
                            }
                          }}
                        >
                          <OverflowMenuItem
                            text={moveUpText}
                            disabled={index === 0}
                            on:click={() =>
                              moveFromMenu(cardId, column.id, index - 1)}
                          />
                          <OverflowMenuItem
                            text={moveDownText}
                            disabled={index === count - 1}
                            on:click={() =>
                              moveFromMenu(cardId, column.id, index + 1)}
                          />
                          {#each columns as other (other.id)}
                            {#if other.id !== column.id}
                              <OverflowMenuItem
                                text={moveToText(other.title)}
                                disabled={limitMode === "block" &&
                                  !hasRoom(
                                    other,
                                    columnIds.get(other.id)?.length ?? 0,
                                    false,
                                  )}
                                on:click={() =>
                                  moveFromMenu(
                                    cardId,
                                    other.id,
                                    columnIds.get(other.id)?.length ?? 0,
                                  )}
                              />
                            {/if}
                          {/each}
                        </OverflowMenu>
                      {/if}
                    </Tile>
                  </li>
                {/if}
              {/each}
            </ul>
          </div>
        {/if}
      </Layer>
    {/each}
  </div>
</div>
