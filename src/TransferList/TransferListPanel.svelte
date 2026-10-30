<script>
  /**
   * Internal. One list of a `TransferList`: its heading, search field and
   * multi-select listbox. It owns the cursor, the marked rows and the keys;
   * the `TransferList` owns the data and moves rows between the lists.
   * @template {import("./transfer-list-utils.js").TransferListRow} [Row=import("./transfer-list-utils.js").TransferListRow]
   * @event {{ ids: Array<string | number> }} move
   * @event {{ ids: Array<string | number>; direction: "up" | "down" }} reorder
   * @event {{ ids: Array<string | number>; event: PointerEvent }} dragstart
   * @event {{ ids: Array<string | number>; event: PointerEvent }} dragmove
   * @event {{ ids: Array<string | number>; event: PointerEvent }} dragend
   * @slot {{}} actions
   */

  /**
   * Specify the id of the listbox. The option ids derive from it.
   * @type {string}
   */
  export let id;

  /** Specify the heading */
  export let title = "";

  /** Specify the text that counts the rows, such as `"3 of 12 selected"` */
  export let countLabel = "";

  /**
   * The rows to show: what the search leaves.
   * @type {ReadonlyArray<Row>}
   */
  export let rows = [];

  /**
   * The position of every item in the full `items`, for the option ids.
   * @type {ReadonlyMap<string | number, number>}
   */
  export let ordinals = new Map();

  /**
   * The ids of the marked rows.
   * @type {ReadonlySet<string | number>}
   * @bindable writable
   */
  export let marked = new Set();

  /** Specify the text typed into the search field */
  export let search = "";

  /** Set to `true` to show a search field */
  export let filterable = false;

  /** Specify the accessible name of the search field */
  export let searchLabelText = "Search";

  /** Specify the placeholder of the search field */
  export let searchPlaceholder = "Search";

  /** Specify the text of the search field's clear button */
  export let clearSearchText = "Clear search input";

  /** Specify the text shown when the list has no rows */
  export let emptyText = "";

  /**
   * Specify the size of the rows.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Specify the number of rows the list shows before it scrolls */
  export let visibleRows = 8;

  /** Set to `true` to disable the list */
  export let disabled = false;

  /** Set to `true` to mark rows without being able to move them */
  export let readonly = false;

  /** Set to `true` to let the Delete and Backspace keys move the marked rows */
  export let deletes = false;

  /** Set to `true` to let Alt with the up and down arrow keys reorder */
  export let reorderable = false;

  /** Set to `true` to drag rows out of this list */
  export let draggable = false;

  /**
   * The row index a drag would drop in front of, or `null`.
   * @type {number | null}
   */
  export let dropAt = null;

  /** Set to `true` while a drag could drop on this list */
  export let dropTarget = false;

  /**
   * Obtain a reference to the listbox element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * The `id` of the element that describes the listbox, other than its count.
   * @type {string | undefined}
   */
  export let describedBy = undefined;

  /** Set to `true` to mark the listbox invalid */
  export let invalid = false;

  /**
   * The `id` of the invalid message.
   * @type {string | undefined}
   */
  export let errorId = undefined;

  /**
   * The text to announce when a search changes the rows.
   * @type {string}
   */
  export let searchStatus = "";

  /**
   * Put focus on the listbox.
   * @returns {void}
   */
  export function focus() {
    ref?.focus({ preventScroll: true });
  }

  /**
   * The row index a drop at a pointer height would land in front of.
   * @param {number} clientY
   * @returns {number | null}
   */
  export function dropIndexAt(clientY) {
    if (!ref) return null;
    const rect = ref.getBoundingClientRect();
    const offset = clientY - rect.top - ref.clientTop + ref.scrollTop;
    return dropIndex(offset, itemHeight, rows.length);
  }

  /**
   * Scroll a row, by its id, into view. Scrolls the active row by default.
   * @param {string | number | null} [rowId]
   * @returns {void}
   */
  export function reveal(rowId = activeId) {
    if (rowId === null) return;
    const index = rowIndex.get(rowId);
    if (index !== undefined) scrollToIndex(index);
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import { MENU_ITEM_HEIGHT } from "../ListBox/list-box-utils.js";
  import Search from "../Search/Search.svelte";
  import { VirtualList } from "../VirtualList";
  import Checkmark from "../icons/Checkmark.svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import {
    dropIndex,
    enabledIds,
    enabledIndexFrom,
    rangeIds,
  } from "./transfer-list-utils.js";

  const dispatch = createEventDispatcher();
  const typeahead = createTypeaheadBuffer();

  /** A list this long is windowed. */
  const WINDOW_THRESHOLD = 100;
  /** Pixels a pressed pointer travels before it is a drag. */
  const DRAG_DISTANCE = 4;

  /** @type {Record<"sm" | "md" | "lg", "sm" | "lg" | "xl">} */
  const SEARCH_SIZE = { sm: "sm", md: "lg", lg: "xl" };

  /** The id of the row the cursor is on. */
  let activeId = /** @type {string | number | null} */ (null);
  /** The row a Shift range grows from. */
  let anchorId = /** @type {string | number | null} */ (null);
  let focused = false;
  /** Where the active row sat when it left the rows. */
  let lastActiveIndex = 0;
  /** Height of one row and of the list as laid out, 0 until measured. */
  let measuredItem = 0;
  let measuredList = 0;
  /** @type {null | { index: number; x: number; y: number; dragging: boolean }} */
  let press = null;
  let suppressClick = false;

  // The CSS sizes rows in rem, so a root font size other than 16px makes
  // them differ from the px table. The window follows the laid-out boxes.
  $: itemHeight = measuredItem || MENU_ITEM_HEIGHT[size];
  $: listHeight = measuredList || itemHeight * visibleRows;

  /** @type {ReadonlyMap<string | number, number>} */
  let rowIndex = new Map();
  $: rowIndex = new Map(rows.map((row, index) => [row.id, index]));

  // Marks and the cursor follow the rows: a row a search hides, or a move
  // takes away, is no longer marked, and the cursor lands where it was.
  // Runs before `activeIndex` reads the cursor: a `$:` block does not run
  // again in a flush when a later block assigns what it read.
  $: reconcile(rows);

  /** @type {number} */
  let activeIndex = -1;
  $: activeIndex = activeId === null ? -1 : (rowIndex.get(activeId) ?? -1);

  /** @param {string | number} rowId */
  function optionId(rowId) {
    return `${id}-o${ordinals.get(rowId)}`;
  }

  $: activeOptionId =
    activeIndex === -1 ? undefined : optionId(rows[activeIndex].id);

  /** @param {ReadonlyArray<Row>} next */
  function reconcile(next) {
    if (marked.size > 0) {
      const kept = next.filter((row) => marked.has(row.id));
      if (kept.length !== marked.size) {
        marked = new Set(kept.map((row) => row.id));
      }
    }
    if (activeId !== null && !next.some((row) => row.id === activeId)) {
      const at = Math.min(lastActiveIndex, next.length - 1);
      const forward = enabledIndexFrom(next, at, 1);
      const index = forward === -1 ? enabledIndexFrom(next, at, -1) : forward;
      activeId = index === -1 ? null : next[index].id;
    }
    if (anchorId !== null && !next.some((row) => row.id === anchorId)) {
      anchorId = null;
    }
  }

  $: if (activeIndex !== -1) lastActiveIndex = activeIndex;

  /** @param {number} index */
  function scrollToIndex(index) {
    if (!ref) return;
    const top = index * itemHeight;
    const bottom = top + itemHeight;
    if (top < ref.scrollTop) ref.scrollTop = top;
    else if (bottom > ref.scrollTop + ref.clientHeight) {
      ref.scrollTop = bottom - ref.clientHeight;
    }
  }

  /**
   * Put the cursor on a row, and keep it in view.
   * @param {number} index
   */
  function moveCursor(index) {
    if (index < 0 || index >= rows.length) return;
    activeId = rows[index].id;
    scrollToIndex(index);
  }

  /** @param {ReadonlyArray<string | number>} ids */
  function setMarked(ids) {
    marked = new Set(ids);
  }

  /** @param {string | number} rowId */
  function toggleMark(rowId) {
    const next = new Set(marked);
    if (next.has(rowId)) next.delete(rowId);
    else next.add(rowId);
    marked = next;
    anchorId = rowId;
  }

  /**
   * Mark the rows from the anchor to `index`, and nothing else. With no
   * anchor, the range grows from where the cursor was.
   * @param {number} index
   * @param {number} cursor The cursor's row before it moved.
   */
  function markRangeTo(index, cursor) {
    const anchor =
      anchorId === null ? cursor : (rowIndex.get(anchorId) ?? cursor);
    if (anchor === -1) {
      setMarked(rangeIds(rows, index, index));
      anchorId = rows[index]?.id ?? null;
      return;
    }
    anchorId = rows[anchor].id;
    setMarked(rangeIds(rows, anchor, index));
  }

  /**
   * The rows a move acts on: the marked ones, or else the one under the cursor.
   * @returns {Array<string | number>}
   */
  function targets() {
    const ids = rows
      .filter((row) => marked.has(row.id) && !row.disabled)
      .map((row) => row.id);
    if (ids.length > 0) return ids;
    const row = rows[activeIndex];
    return row && !row.disabled ? [row.id] : [];
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.target !== ref || disabled) return;
    const { key, shiftKey } = event;
    const last = rows.length - 1;
    const page = Math.max(1, Math.floor(listHeight / itemHeight) - 1);
    /** @type {1 | -1 | 0} */
    let step = 0;

    if (event.altKey && (key === "ArrowUp" || key === "ArrowDown")) {
      if (!reorderable || readonly) return;
      event.preventDefault();
      const ids = targets();
      if (ids.length > 0) {
        dispatch("reorder", {
          ids,
          direction: key === "ArrowUp" ? "up" : "down",
        });
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === "a") {
      event.preventDefault();
      setMarked(enabledIds(rows));
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (key === "ArrowDown") step = 1;
    else if (key === "ArrowUp") step = -1;

    if (step !== 0) {
      event.preventDefault();
      const from =
        activeIndex === -1 ? (step === 1 ? 0 : last) : activeIndex + step;
      const index = enabledIndexFrom(rows, from, step);
      if (index === -1) return;
      const cursor = activeIndex;
      moveCursor(index);
      if (shiftKey) markRangeTo(index, cursor);
    } else if (
      key === "Home" ||
      key === "End" ||
      key === "PageUp" ||
      key === "PageDown"
    ) {
      event.preventDefault();
      /** @type {number} */
      let from = 0;
      /** @type {1 | -1} */
      let direction = 1;
      if (key === "Home") from = 0;
      else if (key === "End") {
        from = last;
        direction = -1;
      } else if (key === "PageUp") {
        from = Math.max(0, activeIndex - page);
      } else {
        from = Math.min(last, activeIndex + page);
        direction = -1;
      }
      const index = enabledIndexFrom(rows, from, direction);
      if (index === -1) return;
      const cursor = activeIndex;
      moveCursor(index);
      if (shiftKey) markRangeTo(index, cursor);
    } else if (key === " ") {
      event.preventDefault();
      if (activeIndex === -1 || rows[activeIndex].disabled) return;
      if (shiftKey) markRangeTo(activeIndex, activeIndex);
      else toggleMark(rows[activeIndex].id);
    } else if (key === "Enter" && !readonly) {
      event.preventDefault();
      const ids = targets();
      if (ids.length > 0) dispatch("move", { ids });
    } else if (
      (key === "Delete" || key === "Backspace") &&
      deletes &&
      !readonly
    ) {
      event.preventDefault();
      const ids = targets();
      if (ids.length > 0) dispatch("move", { ids });
    } else if (key === "Escape" && marked.size > 0) {
      event.preventDefault();
      event.stopPropagation();
      setMarked([]);
    } else if (isTypeaheadKey(event)) {
      const query = typeahead.push(key);
      const index = typeaheadIndex({
        items: rows,
        query,
        itemToString: (row) => row.text,
        index: activeIndex,
      });
      if (index !== activeIndex) moveCursor(index);
    }
  }

  /**
   * The row index under a pointer event, read from the option it hit.
   * @param {EventTarget | null} target
   * @returns {number}
   */
  function indexOfOption(target) {
    if (!(target instanceof Element)) return -1;
    const option = target.closest('[role="option"]');
    const index = Number(option?.getAttribute("data-row"));
    return option && Number.isInteger(index) ? index : -1;
  }

  /** @param {MouseEvent} event */
  function handleMousedown(event) {
    if (disabled || indexOfOption(event.target) === -1) return;
    // Keep focus on the listbox: the options take it otherwise.
    event.preventDefault();
    ref?.focus({ preventScroll: true });
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (disabled) return;
    // A drag captures the pointer, so the click lands on the drag's host.
    const index = indexOfOption(event.target);
    selectRow(index === -1 ? (press?.index ?? -1) : index, event);
    press = null;
  }

  /**
   * @param {number} index
   * @param {MouseEvent} event
   */
  function selectRow(index, event) {
    const row = rows[index];
    if (!row || row.disabled) return;
    const cursor = activeIndex;
    activeId = row.id;
    if (event.shiftKey) markRangeTo(index, cursor);
    else toggleMark(row.id);
  }

  /** @param {MouseEvent} event */
  function handleDblclick(event) {
    if (disabled || readonly) return;
    const index = indexOfOption(event.target);
    const row = rows[index === -1 ? (press?.index ?? -1) : index];
    if (row && !row.disabled) dispatch("move", { ids: [row.id] });
  }

  function handleFocus() {
    focused = true;
    if (activeIndex === -1) {
      const first = rows.findIndex((row) => marked.has(row.id));
      const index = enabledIndexFrom(rows, Math.max(first, 0), 1);
      if (index !== -1) activeId = rows[index].id;
    }
  }

  function handleBlur() {
    focused = false;
    typeahead.clear();
  }

  /** @type {Array<string | number>} */
  let dragIds = [];

  /** @type {import("../utils/pointer-drag.js").PointerDragOptions} */
  let dragOptions;
  $: dragOptions = {
    enabled: draggable && !disabled && !readonly,
    onStart(event) {
      // A touch drag is a scroll; touch users move rows with the buttons.
      if (event.pointerType === "touch") return false;
      const index = indexOfOption(event.target);
      const row = rows[index];
      if (!row || row.disabled) return false;
      press = { index, x: event.clientX, y: event.clientY, dragging: false };
      return true;
    },
    onMove(event) {
      if (!press) return;
      if (!press.dragging) {
        const distance = Math.hypot(
          event.clientX - press.x,
          event.clientY - press.y,
        );
        if (distance < DRAG_DISTANCE) return;
        press.dragging = true;
        const row = rows[press.index];
        dragIds = marked.has(row.id) ? targets() : [row.id];
        // The press focused the list; put the cursor on the lifted row.
        activeId = row.id;
        dispatch("dragstart", { ids: dragIds, event });
      }
      dispatch("dragmove", { ids: dragIds, event });
    },
    onEnd(event) {
      if (press?.dragging) {
        // The click that follows a drag is not a selection.
        suppressClick = true;
        setTimeout(() => {
          suppressClick = false;
        });
        dispatch("dragend", { ids: dragIds, event });
        press = null;
      }
    },
  };

  /** @param {Event} event */
  function handleSearchKeydown(event) {
    const { key } = /** @type {KeyboardEvent} */ (event);
    if (
      key !== "ArrowDown" ||
      hasModifierKey(/** @type {KeyboardEvent} */ (event))
    )
      return;
    event.preventDefault();
    focus();
    if (activeIndex === -1) handleFocus();
  }

  onMount(() => {
    const stop = ref ? observeResize(ref, () => measure()) : () => {};
    tick().then(measure);
    return () => {
      stop();
      typeahead.clear();
    };
  });

  /** Read the box the browser laid out, which rem sizes can make differ from px. */
  function measure() {
    if (!ref) return;
    measuredList = ref.clientHeight;
    const row = ref.querySelector('[role="option"]');
    if (row instanceof HTMLElement) measuredItem = row.offsetHeight;
  }
</script>

<div
  class:bx--transfer-list__panel={true}
  class:bx--transfer-list__panel--drop-target={dropTarget}
  data-transfer-list-panel={id}
>
  <div class:bx--transfer-list__header={true}>
    <div class:bx--transfer-list__heading={true}>
      <span id="{id}-title" class:bx--transfer-list__title={true}>{title}</span>
      <!-- `bdi` takes its direction from the count's own text, so "3 items"
        keeps its order on a right-to-left page. -->
      <bdi id="{id}-count" class:bx--transfer-list__count={true}
        >{countLabel}</bdi
      >
    </div>
    <slot name="actions" />
  </div>
  {#if filterable}
    <div class:bx--transfer-list__search={true}>
      <Search
        bind:value={search}
        size={SEARCH_SIZE[size]}
        placeholder={searchPlaceholder}
        labelText={searchLabelText}
        hideLabel
        closeButtonLabelText={clearSearchText}
        {disabled}
        {readonly}
        on:keydown={(event) => handleSearchKeydown(event)}
      />
    </div>
  {/if}
  <!-- The options take no handlers of their own; this host receives theirs
    as they bubble, and holds the pointer for a drag. -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--transfer-list__list={true}
    class:bx--transfer-list__list--dropping={dropAt !== null}
    class:bx--transfer-list__list--disabled={disabled}
    class:bx--transfer-list__list--invalid={invalid}
    class:bx--transfer-list__list--cursor={focused && activeIndex !== -1}
    style:--ccs-transfer-list-rows={visibleRows}
    style:--ccs-transfer-list-drop="{dropAt === null
      ? 0
      : dropAt * itemHeight}px"
    use:pointerDrag={dragOptions}
    on:keydown={handleKeydown}
    on:mousedown={handleMousedown}
    on:click={handleClick}
    on:dblclick={handleDblclick}
    on:focusin={(event) => {
      if (event.target === ref) handleFocus();
    }}
    on:focusout={(event) => {
      if (event.target === ref) handleBlur();
    }}
  >
    <ListBoxMenu
      bind:ref
      {id}
      highlightedId={focused ? activeOptionId : null}
      highlightScroll={false}
      aria-labelledby="{id}-title"
      aria-describedby={[`${id}-count`, describedBy].filter(Boolean).join(" ")}
      aria-multiselectable="true"
      aria-readonly={readonly ? "true" : undefined}
      aria-disabled={disabled ? "true" : undefined}
      aria-invalid={invalid ? "true" : undefined}
      aria-errormessage={invalid ? errorId : undefined}
      aria-activedescendant={activeOptionId}
      tabindex={disabled ? undefined : 0}
    >
      <VirtualList
        items={rows}
        {itemHeight}
        containerHeight={listHeight}
        overscan={5}
        threshold={WINDOW_THRESHOLD}
        scrollElement={ref}
        spacerTag="div"
        getKey={(row) => row.id}
        let:item
        let:index
      >
        <ListBoxMenuItem
          id={optionId(item.id)}
          data-row={index}
          active={marked.has(item.id)}
          disabled={item.disabled}
        >
          {item.text}
          {#if marked.has(item.id)}
            <Checkmark class="bx--list-box__menu-item__selected-icon" />
          {/if}
        </ListBoxMenuItem>
      </VirtualList>
    </ListBoxMenu>
    {#if rows.length === 0 && emptyText}
      <div class:bx--transfer-list__empty={true} aria-hidden="true">
        {emptyText}
      </div>
    {/if}
  </div>
  <span class:bx--visually-hidden={true} role="status" aria-live="polite"
    >{searchStatus}</span
  >
</div>
