<script context="module">
  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultResultsText(count) {
    if (count === 0) return "No results";
    return count === 1 ? "1 result" : `${count} results`;
  }

  /**
   * Group the rows of the rendered window by section, so each section
   * renders as one named group.
   * @param {ReadonlyArray<import("../utils/grid-layout.js").GridRow>} rows
   * @param {number} startIndex - Index of the first row of `rows` in the layout.
   * @returns {{ section: number, rows: { row: import("../utils/grid-layout.js").GridRow, index: number }[] }[]}
   */
  function groupBySection(rows, startIndex) {
    /** @type {{ section: number, rows: { row: import("../utils/grid-layout.js").GridRow, index: number }[] }[]} */
    const groups = [];
    rows.forEach((row, offset) => {
      let group = groups[groups.length - 1];
      if (!group || group.section !== row.section) {
        group = { section: row.section, rows: [] };
        groups.push(group);
      }
      group.rows.push({ row, index: startIndex + offset });
    });
    return groups;
  }
</script>

<script>
  /**
   * @template {PickerGridItem} [Item=PickerGridItem]
   */

  /**
   * @typedef {object} PickerGridItem
   * @property {string} id - Names the item in `selectedId`, `selectedIds` and `recent`. Unique in `items`.
   * @property {string} label - The name of the item. It is what search matches, what assistive technology reads, and what the cell shows when it has no `cell` slot.
   * @property {string} [category] - The `id` of the category the item belongs to. Items with none follow the categories.
   * @property {ReadonlyArray<string>} [keywords] - More words search matches, such as synonyms.
   * @property {boolean} [disabled] - Set to `true` to keep the item from being chosen. It stays focusable.
   */

  /**
   * @typedef {object} PickerGridCategory
   * @property {string} id
   * @property {string} [label] - Defaults to `id`.
   */

  /**
   * A searchable grid of options in categories, windowed by row so thousands
   * of cells stay cheap. It is a listbox whose arrow keys move in two
   * dimensions. DOM focus stays in the search field, or in the grid itself
   * when `searchable` is `false`, and the cell the keys reach is named by
   * `aria-activedescendant`.
   * @restProps {div}
   * @slot {{ item: Item; selected: boolean; highlighted: boolean; }} cell - The content of a cell. Defaults to the item's `label`.
   * @slot {{ item: Item; }} preview - The preview of the cell under the pointer, or else the one the keyboard reached.
   * @slot {{ query: string; }} noResults - Shown when the search matches nothing.
   * @slot {{}} empty - Shown when there are no `items`.
   * @event {{ id: string; item: Item; selected: boolean; }} select
   * @event {{ id: string; item: Item; }} highlight
   * @event {{ recent: string[]; }} recent:change
   * @event {{ items: Item[]; scrolling: boolean; }} window:change - The cells now rendered: the ones in view and a few rows around them. `scrolling` is `true` when the grid scrolled to them, `false` for a first render, a search or a jump. Use it to load what a cell shows.
   */

  /**
   * Specify the items. A change of this array rebuilds the search index, so
   * assign a new array only when the items change.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Specify the order and the labels of the categories. A category that is
   * not listed follows the listed ones, in order of first appearance.
   * @type {ReadonlyArray<PickerGridCategory>}
   */
  export let categories = [];

  /**
   * Set to `"multiple"` to let the user choose several items. A click or
   * Enter then toggles the item.
   * @type {"single" | "multiple"}
   */
  export let selectionMode = "single";

  /**
   * Specify the `id` of the chosen item, in single selection.
   * @type {string | undefined}
   * @bindable writable
   */
  export let selectedId = undefined;

  /**
   * Specify the `id`s of the chosen items, in multiple selection.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let selectedIds = [];

  /**
   * Specify the search text.
   * @bindable writable
   */
  export let query = "";

  /** Set to `false` to remove the search field. The grid then takes the tab stop, and typing jumps to the next item whose label starts with the typed text. */
  export let searchable = true;

  /**
   * Specify the `id`s of the items used most recently, newest first. The
   * grid adds each item the user chooses. Persist it with `LocalStorage`.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let recent = [];

  /** Specify how many recent items to keep. Set to `0` to hide the recent section. */
  export let recentLimit = 12;

  /**
   * Specify the number of cells in a row. Left unset, the grid fits as many
   * as its width holds, and the server renders eight.
   * @type {number | undefined}
   */
  export let columns = undefined;

  /** Specify the least width and the height of a cell, in pixels. Use a multiple of 4. */
  export let cellSize = 40;

  /** Specify the most height the scrolling grid takes, in pixels. A short set takes less. */
  export let height = 288;

  /** Set to `false` to remove the preview of the cell under the pointer or the keyboard */
  export let preview = true;

  /** Specify the accessible name of the grid */
  export let labelText = "Options";

  /** Specify the label of the search field */
  export let searchLabelText = "Search";

  /** Specify the placeholder of the search field */
  export let searchPlaceholder = "Search";

  /** Specify the accessible name of the category buttons */
  export let categoriesLabelText = "Categories";

  /** Specify the header of the recent section */
  export let recentText = "Recent";

  /** Specify the header of the items that have no category, shown when others have one */
  export let otherText = "All";

  /**
   * Build the announcement of the number of matches, read after the user
   * stops typing.
   * @type {(count: number) => string}
   */
  export let resultsText = defaultResultsText;

  /** Specify the text shown when the search matches nothing */
  export let noResultsText = "No results";

  /** Specify the text shown when there are no items */
  export let emptyText = "Nothing to choose from";

  /** Specify an id for the grid. Ids inside it derive from it. */
  export let id = uniqueId();

  /**
   * Move focus to the search field, or to the grid when `searchable` is
   * `false`.
   * @type {() => void}
   */
  export function focus() {
    if (searchable && searchRef) searchRef.focus({ preventScroll: true });
    else viewportRef?.focus({ preventScroll: true });
  }

  /**
   * Clear the search, move the cursor to the chosen item and scroll to it.
   * @type {() => void}
   */
  export function reset() {
    query = "";
    shownRecent = recent;
    tick().then(() => {
      resetHighlight();
      scrollToSelected();
    });
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Search from "../Search/Search.svelte";
  import VirtualWindow from "../VirtualList/VirtualWindow.svelte";
  import { PICKER_ANNOUNCE_DELAY_MS } from "../constants/timing.js";
  import Checkmark from "../icons/Checkmark.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { debounce } from "../utils/debounce.js";
  import {
    buildGridLayout,
    columnsForWidth,
    gridRowHeights,
    rowAtOffset,
    rowOffsets,
    sectionAtRow,
  } from "../utils/grid-layout.js";
  import { gridNav } from "../utils/grid-navigation.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import {
    createPickerIndex,
    searchPickerIndex,
  } from "../utils/picker-search.js";
  import { buildPickerSections } from "../utils/picker-sections.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    getBoundedScrollTop,
    scrollHighlightedIntoView,
    virtualize,
  } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const typeahead = createTypeaheadBuffer();

  /** Height of a section header, in pixels. */
  const HEADER_HEIGHT = 32;
  /** Rows rendered beyond the viewport on each side. */
  const OVERSCAN = 2;

  /** @type {null | HTMLDivElement} */
  let rootRef = null;
  /** @type {null | HTMLDivElement} */
  let viewportRef = null;
  /** @type {null | HTMLInputElement} */
  let searchRef = null;
  /** @type {null | HTMLDivElement} */
  let categoriesRef = null;

  let scrollTop = 0;
  /** How far, and which way, the last scroll moved. */
  let scrollDelta = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;
  let highlightedIndex = -1;
  let hoveredIndex = -1;
  let searchFocused = false;
  let viewportFocused = false;
  // Left and right, Home and End belong to the caret until the user reaches
  // for the grid with Up or Down.
  let engaged = false;
  let announcement = "";
  let mounted = false;
  let idleHeight = height;
  let jumped = -1;
  let jumpedTop = 0;
  let categoryStop = 0;
  /** @type {ReadonlyArray<string>} */
  let shownRecent = recent;
  /** @type {ReadonlyArray<string> | undefined} */
  let emittedRecent;
  /** @type {ReadonlyArray<Item>} */
  let prevItems = items;
  let prevQuery = query;
  /** @type {Item[]} */
  let prevWindow = [];

  const announce = debounce((text) => {
    announcement = String(text);
  }, PICKER_ANNOUNCE_DELAY_MS);

  // A consumer name or description belongs on the listbox, which carries the
  // role. The rest of the props go on the root.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: rootProps,
  } = splitAriaNaming($$restProps));
  $: index = createPickerIndex(items);
  $: itemsById = new Map(items.map((item) => [item.id, item]));
  $: hasQuery = query.trim() !== "";
  $: results = hasQuery ? searchPickerIndex(index, query) : items;
  // An id the items no longer hold is skipped, and stays in `recent`.
  $: recentItems =
    recentLimit > 0 && !hasQuery
      ? shownRecent
          .slice(0, recentLimit)
          .flatMap((recentId) => itemsById.get(recentId) ?? [])
      : [];
  $: sections = buildPickerSections({
    items: results,
    categories,
    recent: recentItems,
    recentText,
    otherText,
    grouped: !hasQuery,
  });
  $: list = sections.list;
  $: gridColumns =
    columns ?? columnsForWidth({ width: viewportWidth, cell: cellSize });
  $: layout = buildGridLayout({
    counts: sections.counts,
    columns: gridColumns,
    headers: sections.headers,
  });
  $: rowHeights = gridRowHeights(layout.rows, {
    cell: cellSize,
    header: HEADER_HEIGHT,
  });
  $: offsets = rowOffsets(rowHeights);
  // A short set takes the room it needs, and `height` is the most the grid
  // takes. A search keeps the height it had, so the grid does not shrink
  // and grow under the pointer while the user types.
  $: if (!hasQuery) {
    idleHeight = Math.min(height, offsets[layout.rows.length] || height);
  }
  $: containerHeight = viewportHeight || height;
  $: windowed = virtualize({
    items: layout.rows,
    itemHeight: cellSize,
    containerHeight,
    scrollTop,
    overscan: OVERSCAN,
    threshold: 0,
    measured: true,
    heights: rowHeights,
    scrollDelta,
  });
  $: groups = groupBySection(windowed.visibleItems, windowed.startIndex);
  $: selectedSet = new Set(
    selectionMode === "multiple"
      ? selectedIds
      : selectedId === undefined
        ? []
        : [selectedId],
  );
  $: topRow = rowAtOffset(offsets, scrollTop);
  $: atEnd =
    scrollTop > 0 &&
    scrollTop + containerHeight >= offsets[layout.rows.length] - 1;
  // The section a category button jumped to stays current until the user
  // scrolls away, since a section at the end, or a short set, cannot reach
  // the top of the grid.
  $: activeSection =
    layout.rows.length === 0
      ? -1
      : jumped >= 0 && jumped < sections.ids.length
        ? jumped
        : atEnd
          ? sections.ids.length - 1
          : sectionAtRow(layout.rows, topRow);
  $: showCategories = !hasQuery && sections.ids.length > 1;
  $: previewIndex = hoveredIndex >= 0 ? hoveredIndex : highlightedIndex;
  $: previewItem = list[previewIndex];
  $: activeDescendant =
    highlightedIndex >= 0 && highlightedIndex < list.length
      ? optionId(id, highlightedIndex)
      : undefined;
  $: navActive = searchFocused || viewportFocused;
  $: empty = layout.itemCount === 0;

  // Rebuild what depends on the items, or on the search, from the top: a
  // cursor and a scroll offset into the old results point past the new ones.
  $: syncSource(items, query);

  // `recent` changes from outside (storage, another picker) show at once.
  // Its own changes wait for the next search, so a cell does not move out
  // from under the pointer in multiple selection.
  $: if (recent !== emittedRecent) shownRecent = recent;

  $: announce(hasQuery ? resultsText(layout.itemCount) : "");

  // Not before mount: Svelte 3 and 4 attach a parent's listeners after the
  // child's first update, so an event dispatched then is lost.
  $: if (mounted) {
    reportWindow(windowed.visibleItems, list, scrollDelta !== 0);
  }

  $: if (categoriesRef && activeSection >= 0) {
    categoryStop = activeSection;
    revealCategory(activeSection);
  }

  /**
   * @param {string} gridId
   * @param {number} flat
   */
  function optionId(gridId, flat) {
    return `${gridId}-option-${flat}`;
  }

  /**
   * @param {ReadonlyArray<Item>} nextItems
   * @param {string} nextQuery
   */
  function syncSource(nextItems, nextQuery) {
    const itemsChanged = nextItems !== prevItems;
    const queryChanged = nextQuery !== prevQuery;
    prevItems = nextItems;
    prevQuery = nextQuery;
    if (!itemsChanged && !queryChanged) return;
    if (queryChanged) shownRecent = recent;
    engaged = false;
    jumped = -1;
    typeahead.clear();
    if (viewportRef) {
      viewportRef.scrollTop = 0;
      scrollTop = 0;
      scrollDelta = 0;
    }
    // The sections rebuild in this flush, so aim at the new list after it.
    tick().then(resetHighlight);
  }

  function resetHighlight() {
    if (list.length === 0) {
      highlightedIndex = -1;
      return;
    }
    const selected = hasQuery ? -1 : firstSelectedIndex();
    highlightedIndex = Math.max(selected, 0);
  }

  function firstSelectedIndex() {
    if (selectedSet.size === 0) return -1;
    return list.findIndex((item) => selectedSet.has(item.id));
  }

  /**
   * Report the cells in the rendered window, once per change of window.
   * @param {ReadonlyArray<import("../utils/grid-layout.js").GridRow>} rows
   * @param {ReadonlyArray<Item>} cells
   * @param {boolean} scrolling - Whether the window moved because the grid scrolled.
   */
  function reportWindow(rows, cells, scrolling) {
    const first = rows.find((row) => row.type === "cells");
    const last = [...rows].reverse().find((row) => row.type === "cells");
    const visible =
      first && last ? cells.slice(first.start, last.start + last.length) : [];
    if (
      visible.length === prevWindow.length &&
      visible.every((item, at) => item === prevWindow[at])
    ) {
      return;
    }
    prevWindow = visible;
    dispatch("window:change", { items: visible, scrolling });
  }

  /** @param {number} section */
  function revealCategory(section) {
    const chip = categoriesRef?.children[section];
    if (!(chip instanceof HTMLElement) || !categoriesRef) return;
    const bar = categoriesRef.getBoundingClientRect();
    const box = chip.getBoundingClientRect();
    if (box.left < bar.left) categoriesRef.scrollLeft += box.left - bar.left;
    else if (box.right > bar.right)
      categoriesRef.scrollLeft += box.right - bar.right;
  }

  function scrollToSelected() {
    if (!viewportRef || hasQuery) return;
    const at = firstSelectedIndex();
    if (at < 0) return;
    const next = getBoundedScrollTop({
      index: layout.lineRows[layout.itemLine[at]],
      itemHeight: cellSize,
      containerHeight,
      itemCount: layout.rows.length,
      heights: rowHeights,
    });
    viewportRef.scrollTop = next;
    scrollTop = next;
  }

  /** @param {number} row */
  function rowScroll(row) {
    return scrollHighlightedIntoView({
      highlightedIndex: row,
      currentScrollTop: viewportRef?.scrollTop ?? 0,
      itemCount: layout.rows.length,
      itemHeight: cellSize,
      containerHeight,
      overscan: OVERSCAN,
      heights: rowHeights,
    });
  }

  /**
   * Bring a cell fully into view, and the header above it when it starts a
   * section and the grid is scrolling up.
   * @param {number} at
   */
  function scrollToIndex(at) {
    if (!viewportRef || layout.itemCount === 0) return;
    const row = layout.lineRows[layout.itemLine[at]];
    const current = viewportRef.scrollTop;
    let next = rowScroll(row);
    if (layout.rows[row - 1]?.type === "header") {
      const header = rowScroll(row - 1);
      if (header !== null && header < (next ?? current)) next = header;
    }
    if (next === null) return;
    scrollDelta = next - scrollTop;
    viewportRef.scrollTop = next;
    scrollTop = next;
  }

  /**
   * @param {number} at
   */
  function highlight(at) {
    highlightedIndex = at;
    const item = list[at];
    if (item) dispatch("highlight", { id: item.id, item });
    scrollToIndex(at);
  }

  /** @param {number} at */
  function choose(at) {
    const item = list[at];
    if (!item || item.disabled) return;
    if (selectionMode === "multiple") {
      const selected = !selectedSet.has(item.id);
      selectedIds = selected
        ? [...selectedIds, item.id]
        : selectedIds.filter((chosen) => chosen !== item.id);
      dispatch("select", { id: item.id, item, selected });
      if (selected) pushRecent(item.id);
    } else {
      selectedId = item.id;
      dispatch("select", { id: item.id, item, selected: true });
      pushRecent(item.id);
    }
  }

  /** @param {string} itemId */
  function pushRecent(itemId) {
    if (recentLimit <= 0) return;
    recent = [itemId, ...recent.filter((other) => other !== itemId)].slice(
      0,
      recentLimit,
    );
    emittedRecent = recent;
    dispatch("recent:change", { recent });
  }

  /** @param {number} section */
  function jumpTo(section) {
    if (!viewportRef) return;
    const next = Math.min(
      offsets[layout.sectionRows[section]],
      Math.max(0, offsets[layout.rows.length] - containerHeight),
    );
    scrollDelta = next - scrollTop;
    viewportRef.scrollTop = next;
    scrollTop = next;
    jumped = section;
    jumpedTop = next;
    const row = layout.rows.find(
      (candidate) =>
        candidate.section === section && candidate.type === "cells",
    );
    if (row) highlightedIndex = row.start;
    focus();
  }

  function handleScroll() {
    if (!viewportRef) return;
    if (Math.abs(viewportRef.scrollTop - jumpedTop) > 1) jumped = -1;
    scrollDelta = viewportRef.scrollTop - scrollTop;
    scrollTop = viewportRef.scrollTop;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const target = event.target;
    if (target !== searchRef && target !== viewportRef) return;
    if (event.key === "Enter") {
      // Enter that commits an IME composition is not a choice.
      if (isImeComposition(event) || highlightedIndex < 0) return;
      event.preventDefault();
      choose(highlightedIndex);
    } else if (target === viewportRef && event.key === " ") {
      event.preventDefault();
      if (highlightedIndex >= 0) choose(highlightedIndex);
    } else if (target === viewportRef && isTypeaheadKey(event)) {
      const text = typeahead.push(event.key);
      // A longer query may still match the current cell, so start before it.
      const from = text.length > 1 ? highlightedIndex - 1 : highlightedIndex;
      const found = typeaheadIndex({
        items: list,
        query: text,
        itemToString: (item) => item.label,
        index: from,
        isDisabled: () => false,
      });
      if (found !== from && found !== highlightedIndex) highlight(found);
    }
  }

  /** @param {KeyboardEvent} event */
  function shouldNavigate(event) {
    const target = event.target;
    if (target !== searchRef && target !== viewportRef) return false;
    if (layout.itemCount === 0) return false;
    if (target === viewportRef) return true;
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "PageUp" ||
      event.key === "PageDown"
    ) {
      return true;
    }
    return engaged || query === "";
  }

  /** @param {number} at */
  function handleMove(at) {
    engaged = true;
    highlight(at);
  }

  /**
   * @param {Event} event
   * @returns {number}
   */
  function optionIndex(event) {
    const option =
      event.target instanceof Element
        ? event.target.closest("[role='option']")
        : null;
    return option ? Number(option.getAttribute("data-index")) : -1;
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    const at = optionIndex(event);
    if (at < 0) return;
    highlightedIndex = at;
    // Before the choice, so a picker that moves focus on a choice keeps it.
    focus();
    choose(at);
  }

  /** @param {MouseEvent} event */
  function handleMousedown(event) {
    // Keep focus where it is: in the search field, or in the grid.
    if (optionIndex(event) >= 0) event.preventDefault();
  }

  /** @param {MouseEvent} event */
  function handleMouseover(event) {
    hoveredIndex = optionIndex(event);
  }

  function handleInput() {
    engaged = false;
  }

  function handleSearchBlur() {
    searchFocused = false;
    engaged = false;
  }

  onMount(() => {
    const stop = viewportRef
      ? observeResize(viewportRef, (entry) => {
          viewportWidth = entry.contentRect.width;
          viewportHeight = entry.contentRect.height;
        })
      : undefined;
    resetHighlight();
    scrollToSelected();
    mounted = true;
    return () => {
      stop?.();
      announce.cancel();
      typeahead.clear();
    };
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={rootRef}
  {id}
  class:bx--picker-grid={true}
  class:bx--picker-grid--active={navActive}
  style:--ccs-picker-grid-cell="{cellSize}px"
  style:--ccs-picker-grid-columns={layout.columns}
  style:--ccs-picker-grid-header="{HEADER_HEIGHT}px"
  use:gridNav={{
    getLayout: () => layout,
    getIndex: () => highlightedIndex,
    onMove: handleMove,
    rtl: () => resolveLayoutDirection($layoutDirection, rootRef) === "rtl",
    getPageRows: () => Math.max(1, Math.floor(containerHeight / cellSize) - 1),
    shouldHandle: shouldNavigate,
  }}
  {...rootProps}
  on:keydown={handleKeydown}
>
  {#if searchable}
    <div class:bx--picker-grid__search={true}>
      <Search
        bind:ref={searchRef}
        bind:value={query}
        id="{id}-search"
        size="sm"
        hideLabel
        labelText={searchLabelText}
        placeholder={searchPlaceholder}
        role="combobox"
        tabindex={0}
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls="{id}-grid"
        aria-activedescendant={activeDescendant}
        on:focus={() => (searchFocused = true)}
        on:blur={handleSearchBlur}
        on:input={handleInput}
      />
    </div>
  {/if}
  {#if showCategories}
    <div
      bind:this={categoriesRef}
      role="toolbar"
      aria-label={categoriesLabelText}
      class:bx--picker-grid__categories={true}
      use:rovingFocus={{
        selector: "button",
        orientation: "horizontal",
        wrap: false,
        getActiveIndex: () => categoryStop,
        onMove: (next) => {
          categoryStop = next;
        },
        focusOnMove: true,
        rtl: () => resolveLayoutDirection($layoutDirection, rootRef) === "rtl",
      }}
    >
      {#each sections.labels as label, section (sections.ids[section])}
        <button
          type="button"
          class:bx--picker-grid__category={true}
          aria-current={section === activeSection ? "true" : undefined}
          tabindex={section === categoryStop ? 0 : -1}
          on:click={() => jumpTo(section)}
        >
          {label}
        </button>
      {/each}
    </div>
  {/if}
  <!-- Keys reach the grid through the search field or the grid itself, and
    the root handles them. -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    bind:this={viewportRef}
    role="listbox"
    id="{id}-grid"
    aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : labelText)}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    aria-multiselectable={selectionMode === "multiple" ? "true" : undefined}
    aria-activedescendant={searchable ? undefined : activeDescendant}
    tabindex={searchable ? -1 : 0}
    hidden={empty}
    class:bx--picker-grid__viewport={true}
    style:height="{idleHeight}px"
    on:scroll={handleScroll}
    on:click={handleClick}
    on:mousedown={handleMousedown}
    on:mouseover={handleMouseover}
    on:mouseleave={() => (hoveredIndex = -1)}
    on:focus={() => (viewportFocused = true)}
    on:blur={() => (viewportFocused = false)}
  >
    <VirtualWindow
      totalHeight={offsets[layout.rows.length]}
      offsetY={windowed.offsetY}
      {scrollTop}
      measured
    >
      {#each groups as group (group.section)}
        <div
          role={sections.labels[group.section] ? "group" : "presentation"}
          aria-label={sections.labels[group.section] || undefined}
        >
          {#each group.rows as { row, index: rowIndex } (rowIndex)}
            {#if row.type === "header"}
              <div aria-hidden="true" class:bx--picker-grid__header={true}>
                {sections.labels[row.section]}
              </div>
            {:else}
              <div role="presentation" class:bx--picker-grid__row={true}>
                {#each { length: row.length } as _, offset (row.start + offset)}
                  {@const flat = row.start + offset}
                  {@const item = list[flat]}
                  {@const selected = selectedSet.has(item.id)}
                  <div
                    role="option"
                    id={optionId(id, flat)}
                    data-index={flat}
                    aria-selected={selected}
                    aria-disabled={item.disabled ? "true" : undefined}
                    aria-label={item.label}
                    aria-posinset={flat + 1}
                    aria-setsize={list.length}
                    class:bx--picker-grid__cell={true}
                    class:bx--picker-grid__cell--selected={selected}
                    class:bx--picker-grid__cell--disabled={item.disabled}
                    class:bx--picker-grid__cell--highlighted={navActive &&
                      flat === highlightedIndex}
                    class:bx--picker-grid__cell--hovered={flat === hoveredIndex}
                  >
                    <slot
                      name="cell"
                      {item}
                      {selected}
                      highlighted={flat === highlightedIndex}
                    >
                      <span class:bx--picker-grid__label={true}
                        >{item.label}</span
                      >
                    </slot>
                    {#if selected}
                      <span
                        aria-hidden="true"
                        class:bx--picker-grid__check={true}
                      >
                        <Checkmark size={16} />
                      </span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {/each}
        </div>
      {/each}
    </VirtualWindow>
  </div>
  {#if empty}
    <div class:bx--picker-grid__empty={true} style:height="{idleHeight}px">
      {#if items.length === 0}
        <slot name="empty">{emptyText}</slot>
      {:else}
        <slot name="noResults" {query}>{noResultsText}</slot>
      {/if}
    </div>
  {/if}
  {#if preview}
    <div aria-hidden="true" class:bx--picker-grid__preview={true}>
      {#if previewItem}
        <slot name="preview" item={previewItem}>
          <span class:bx--picker-grid__preview-label={true}
            >{previewItem.label}</span
          >
        </slot>
      {/if}
    </div>
  {/if}
  <div role="status" class:bx--visually-hidden={true}>{announcement}</div>
</div>
