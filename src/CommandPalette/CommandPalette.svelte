<script>
  /**
   * @template {CommandPaletteItem<any>} [Item=CommandPaletteItem<any>]
   */

  /**
   * @typedef {object} CommandPaletteItem<Id=any>
   * @property {Id} id
   * @property {string} text
   * @property {string} [description] - Secondary text under the label. Matched and highlighted like `text`.
   * @property {ReadonlyArray<string>} [keywords] - Extra search terms. Matched but not shown.
   * @property {string} [group] - Group label. Items sharing a label render together under a header, ungrouped items first. While filtering, groups follow their best match.
   * @property {any} [icon] - Icon component shown before the label
   * @property {string} [shortcut] - Keyboard shortcut to display, such as `"mod+shift+p"`. `mod` reads ⌘ on Apple platforms and Ctrl elsewhere. Display only: run it with `onShortcut`.
   * @property {string} [href] - Render the command as a link. Selecting it follows the link unless `select` is canceled.
   * @property {boolean} [disabled] - Whether the command is disabled
   * @event {{ item: Item }} select The "select" event is cancelable. Call `event.preventDefault()` to keep the palette open and, for a link, stay on the page.
   * @event {null} open
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select" | "programmatic"} trigger
   * @event {string} search Dispatched with the query the results filter by, after `debounce` ms.
   * @restProps {input}
   * @slot {{ item: Item; index: number; highlighted: boolean; segments: Array<{ text: string; match: boolean }>; }}
   * @slot {{ group: string; items: ReadonlyArray<Item>; }} group
   * @slot {{ value: string; }} empty
   * @slot {{}} footer
   */

  /**
   * Set to `true` to open the command palette.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the commands.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Specify the search value. Cleared when the palette closes.
   * @bindable writable
   */
  export let value = "";

  /**
   * Set to `false` to show every item whatever is typed, for example
   * results a server already filtered. Matches stay highlighted.
   */
  export let shouldFilter = true;

  /**
   * Override how the query is matched against an item's `text`,
   * `description` and `keywords`. Returns whether it `matched`, an optional
   * `score` from 0 to 1 that ranks results, and the `indices` of characters
   * to highlight. Defaults to fuzzy matching. A description needs a score
   * of 0.5 or more, which the default gives only to a substring.
   * @type {(text: string, query: string) => { matched: boolean; score?: number; indices?: number[] }}
   */
  export let match = fuzzyMatch;

  /** Set to `false` to stop emphasizing matched characters */
  export let highlightMatches = true;

  /**
   * Milliseconds to wait after the last keystroke before the results filter
   * and `search` fires. `value` updates at once; clearing the field applies
   * at once.
   */
  export let debounce = 0;

  /**
   * Set to `true` while results load, for example after `search`. Shows a
   * loading row after the results and marks the list busy.
   */
  export let loading = false;

  /** Specify the text of the loading row */
  export let loadingText = "Loading...";

  /**
   * Specify the message shown when no command matches. Pass a function to
   * build it from the search value.
   * @type {string | ((value: string) => string)}
   */
  export let emptyText = "No results found";

  /**
   * Build the message announced to screen readers when the number of
   * results changes while the user types.
   * @type {(count: number) => string}
   */
  export let filterResultsText = function filterResultsText(count) {
    return count === 0
      ? "No results"
      : `${count} result${count === 1 ? "" : "s"} available`;
  };

  /**
   * Set the size of the search field and the result rows: 32px, 40px or
   * 48px, as Carbon v11's Search and list box sizes.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Render only the rows in view. Turns on by itself above 100 items.
   * Set to `false` to render every row, or pass an object to tune it, as
   * in `ComboBox`. `containerHeight` defaults to 384.
   * @type {undefined | boolean | { itemHeight?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number, optimizeFastScroll?: boolean }}
   */
  export let virtualize = undefined;

  /** Specify the placeholder text */
  export let placeholder = "Search commands";

  /**
   * Specify the label of the search field. It is visually hidden and also
   * names the dialog and the result list.
   */
  export let labelText = "Search commands";

  /** Specify the clear button label text */
  export let closeButtonLabelText = "Clear search input";

  /** Set to `true` to keep the palette open on an outside click */
  export let preventCloseOnClickOutside = false;

  /** Set an id for the search input */
  export let id = uniqueId();

  /**
   * Obtain a reference to the search input element.
   * @type {null | HTMLInputElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { readable, writable } from "svelte/store";
  import {
    LAYER_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import ListBoxMenuStatus from "../ListBox/ListBoxMenuStatus.svelte";
  import {
    MENU_PAGE_STEP,
    shouldVirtualizeMenu,
  } from "../ListBox/list-box-utils.js";
  import {
    createGroupRows,
    orderByGroup,
    splitGroupRuns,
  } from "../ListBox/menu-groups.js";
  import { createStatusAnnouncer } from "../ListBox/menu-status.js";
  import { createMenuWindow } from "../ListBox/menu-window.js";
  import { trackModal } from "../Modal/modal-store.js";
  import Search from "../Search/Search.svelte";
  import { clampIndex } from "../utils/clamp-index.js";
  import { debounce as debounceFn } from "../utils/debounce.js";
  import { createDialogLifecycle } from "../utils/dialog-lifecycle.js";
  import { restoreFocus } from "../utils/focus.js";
  import { fuzzyMatch } from "../utils/fuzzy-match.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isApplePlatform } from "../utils/keyboard-shortcut.js";
  import { moveIndex } from "../utils/move-index.js";
  import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import VirtualWindow from "../VirtualList/VirtualWindow.svelte";
  import CommandPaletteRows from "./CommandPaletteRows.svelte";

  /** Rows shown before the list scrolls: 9.6 rows at 40px, so one peeks. */
  const LIST_HEIGHT = 384;
  const SEARCH_SIZES = { sm: "sm", md: "lg", lg: "xl" };
  /** `fuzzyMatch` scores a substring 0.5 or more, scattered letters less. */
  const CONTIGUOUS_SCORE = 0.5;
  const NO_INDICES = [];
  const NO_MATCHES = new Map();

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();
  const buildGroupRows = createGroupRows();

  /** @type {null | HTMLDivElement} */
  let rootRef = null;
  /** @type {null | HTMLDivElement} */
  let containerRef = null;
  /** @type {null | HTMLDivElement} */
  let listRef = null;

  /** Whether the results render: while open, and while the exit runs. */
  let rendered = open;
  let apple = false;
  let query = String(value ?? "");
  let prevValue = query;
  let highlightedIndex = -1;
  let prevList = null;
  let listScrollTop = 0;
  let statusText = "";

  /** @type {import("../ListBox/menu-window.js").MenuWindowState} */
  let menuState;

  const menuWindow = createMenuWindow({
    getContainer: () => listRef,
    onScrollTop: (scrollTop) => {
      listScrollTop = scrollTop;
    },
    onState: (state) => {
      menuState = state;
    },
  });

  const lifecycle = createDialogLifecycle({
    dispatch,
    setOpen: (next) => {
      open = next;
    },
    preventCloseOnClickOutside: () => preventCloseOnClickOutside,
    passive: () => true,
    saveFocusReturn: focusReturn.save,
    restoreFocusReturn: finishClose,
    getContainer: () => containerRef,
    focus: () => ref?.focus(),
    getOpen: () => open,
  });
  const { close, outsideDismiss } = lifecycle;

  const sharedOpen = writable(open);
  $: $sharedOpen = open;
  trackModal(sharedOpen);

  setContext(MODAL_CONTEXT_KEY, { isInitialFocus: () => false });
  // As a modal does, the palette starts a layer wherever it renders, so a
  // `Layer` in a row sits one level up.
  setContext(LAYER_CONTEXT_KEY, readable(1));

  const announceStatus = createStatusAnnouncer((text) => (statusText = text));
  const announceResults = debounceFn((count) => {
    announceStatus(filterResultsText(count));
  }, 800);

  /** @type {null | ReturnType<typeof debounceFn>} */
  let pendingQuery = null;
  $: {
    pendingQuery?.cancel();
    pendingQuery = debounce > 0 ? debounceFn(applyQuery, debounce) : null;
  }

  onMount(() => {
    apple = isApplePlatform();
    lifecycle.setMounted();
    if (open) ref?.focus();
    return () => {
      pendingQuery?.cancel();
      announceResults.cancel();
      menuWindow.destroy();
    };
  });

  $: lifecycle.syncOpen(open);
  $: if (open) rendered = true;

  $: syncQuery(String(value ?? ""));

  /** @param {string} next */
  function syncQuery(next) {
    if (next === prevValue) return;
    prevValue = next;
    if (pendingQuery && next !== "") pendingQuery(next);
    else {
      pendingQuery?.cancel();
      applyQuery(next);
    }
  }

  /** @param {string} next */
  function applyQuery(next) {
    query = next;
    if (open) dispatch("search", next);
  }

  /**
   * The results for `query`: matched items ranked by score, then grouped,
   * with the character indices to highlight. Runs only while rendered.
   * @param {ReadonlyArray<Item>} source
   * @param {string} search
   * @param {boolean} filter
   * @param {typeof match} matcher
   * @param {boolean} isGrouped
   */
  function computeResults(source, search, filter, matcher, isGrouped) {
    const needle = search.trim();
    if (needle === "") {
      return {
        list: isGrouped ? orderByGroup(source, getGroup) : source,
        matches: NO_MATCHES,
      };
    }

    /** @type {Map<Item["id"], { text: number[]; description: number[] }>} */
    const matches = new Map();
    const ranked = [];
    for (let index = 0; index < source.length; index++) {
      const item = source[index];
      const text = runMatch(matcher, item.text, needle);
      // Scattered letters in a long description match almost any query,
      // so a description has to hold the query as one run.
      const description = item.description
        ? runMatch(matcher, item.description, needle, CONTIGUOUS_SCORE)
        : null;
      let keywordScore = -1;
      for (const keyword of item.keywords ?? []) {
        const result = runMatch(matcher, keyword, needle);
        if (result.matched) keywordScore = Math.max(keywordScore, result.score);
      }
      // The label outranks a keyword, and a keyword the description.
      const score = Math.max(
        text.matched ? text.score : -1,
        keywordScore === -1 ? -1 : keywordScore * 0.9,
        description?.matched ? description.score * 0.8 : -1,
      );
      if (filter && score === -1) continue;
      matches.set(item.id, {
        text: text.matched ? text.indices : NO_INDICES,
        description: description?.matched ? description.indices : NO_INDICES,
      });
      ranked.push({ item, score, index });
    }
    if (filter) ranked.sort((a, b) => b.score - a.score || a.index - b.index);
    const list = ranked.map((entry) => entry.item);
    return {
      list: isGrouped ? orderByGroup(list, getGroup) : list,
      matches,
    };
  }

  /**
   * @param {typeof match} matcher
   * @param {string} text
   * @param {string} needle
   * @param {number} [minScore]
   */
  function runMatch(matcher, text, needle, minScore = 0) {
    const result = matcher(String(text ?? ""), needle);
    const score = result?.matched ? (result.score ?? 1) : 0;
    const matched = Boolean(result?.matched) && score >= minScore;
    return {
      matched,
      score: matched ? score : 0,
      indices: result?.indices ?? NO_INDICES,
    };
  }

  /** @param {Item} item */
  function getGroup(item) {
    return item.group;
  }

  /**
   * @param {ReadonlyArray<Item>} list
   * @returns {number}
   */
  function firstEnabledIndex(list) {
    return list.findIndex((item) => !item.disabled);
  }

  /**
   * Bring the highlighted option into view after a key moved it. Moving up
   * onto a group's first option brings its header too.
   */
  function scrollToHighlight() {
    const index = highlightedIndex;
    tick().then(() => {
      if (!listRef || index < 0) return;
      const row = groupRows ? groupRows.rowIndexByItem[index] : index;
      const target = groupRows?.itemIndexByRow[row - 1] === -1 ? row - 1 : row;
      if (isVirtualized) {
        menuWindow.scrollIntoView(target, "nearest");
        return;
      }
      const item = results.list[index];
      const node = item ? document.getElementById(`${id}-${item.id}`) : null;
      if (node instanceof HTMLElement) {
        const header = target === row ? null : node.previousElementSibling;
        if (header instanceof HTMLElement) scrollIntoViewWithin(header);
        scrollIntoViewWithin(node);
      }
    });
  }

  /** @param {1 | -1} step */
  function move(step) {
    const count = results.list.length;
    if (count === 0) return;
    highlightedIndex = moveIndex(highlightedIndex, step, count);
    scrollToHighlight();
  }

  /** @param {1 | -1} direction */
  function movePage(direction) {
    const count = results.list.length;
    if (count === 0) return;
    highlightedIndex = clampIndex(
      highlightedIndex,
      direction * MENU_PAGE_STEP,
      count,
    );
    scrollToHighlight();
  }

  /** @param {number} index */
  function highlight(index) {
    highlightedIndex = index;
  }

  /**
   * @param {Item} item
   * @param {Event} [event]
   */
  function select(item, event) {
    if (item.disabled) {
      event?.preventDefault();
      return;
    }
    const proceed = dispatch("select", { item }, { cancelable: true });
    if (!proceed) {
      event?.preventDefault();
      return;
    }
    close("select");
  }

  /** @param {KeyboardEvent} event */
  function handleInputKeydown(event) {
    // Keys during an IME composition belong to the IME.
    if (isImeComposition(event)) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1);
        break;
      case "PageDown":
      case "PageUp":
        event.preventDefault();
        movePage(event.key === "PageDown" ? 1 : -1);
        break;
      case "Enter": {
        event.preventDefault();
        const item = results.list[highlightedIndex];
        if (!item || item.disabled) return;
        const node = document.getElementById(`${id}-${item.id}`);
        // A click follows a link's `href`, as a pointer would.
        if (node instanceof HTMLElement && listRef?.contains(node))
          node.click();
        else select(item);
        break;
      }
      case "Escape":
        // Close rather than let Search clear the field on Escape.
        event.preventDefault();
        event.stopImmediatePropagation();
        close("escape-key");
        break;
    }
  }

  /** @param {KeyboardEvent} event */
  function handleRootKeydown(event) {
    if (!open) return;
    if (event.key === "Escape") {
      if (isImeComposition(event)) return;
      // Nested dialogs close one at a time.
      event.stopPropagation();
      close("escape-key");
    } else if (event.key === "Tab" && !event.defaultPrevented && containerRef) {
      trapFocus({ container: containerRef, event });
    }
  }

  /**
   * After the exit: drop the results and the query, and give focus back.
   */
  function finishClose() {
    if (open) return;
    rendered = false;
    value = "";
    highlightedIndex = -1;
    listScrollTop = 0;
    menuWindow.reset();
    focusReturn.restore(rootRef);
  }

  /** @param {Event} event */
  function handleListScroll(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    listScrollTop = target.scrollTop;
    menuWindow.noteScroll(target.scrollTop);
  }

  $: grouped = items.some((item) => Boolean(item.group));
  $: results = rendered
    ? computeResults(items, query, shouldFilter, match, grouped)
    : { list: [], matches: NO_MATCHES };
  // A new result list starts at the top with its first command highlighted,
  // so Enter runs the best match.
  $: if (results.list !== prevList) {
    prevList = results.list;
    highlightedIndex = firstEnabledIndex(results.list);
    listScrollTop = 0;
    if (listRef) listRef.scrollTop = 0;
  }
  $: groupRows = grouped && rendered ? buildGroupRows(results.list) : null;
  $: menuRows = groupRows ? groupRows.rows : results.list;
  $: shouldVirtualize = shouldVirtualizeMenu({ items, virtualize });
  $: windowConfig = shouldVirtualize
    ? {
        containerHeight: LIST_HEIGHT,
        ...(typeof virtualize === "object" ? virtualize : {}),
      }
    : virtualize;
  // Headers and descriptions make rows unequal, so measure them.
  $: measuredRows = grouped || items.some((item) => Boolean(item.description));
  $: menuState = menuWindow.update({
    items: menuRows,
    getKey: (row) => row.id,
    shouldVirtualize,
    virtualize: windowConfig,
    wrapOptions: measuredRows,
    size,
    scrollTop: listScrollTop,
  });
  $: ({
    itemsToRender,
    isVirtualized,
    startIndex,
    offsetY,
    totalHeight,
    menuMaxHeight,
    isMeasured,
    isPinned,
  } = menuState);
  $: menuRuns = splitGroupRuns(
    itemsToRender,
    isVirtualized ? startIndex : 0,
    groupRows,
  );
  $: if (rendered && menuRuns) tick().then(() => menuWindow.sync());

  $: highlightedItem = results.list[highlightedIndex];
  $: highlightedId =
    highlightedItem == null ? undefined : `${id}-${highlightedItem.id}`;
  $: hasQuery = query.trim() !== "";
  $: if (open && hasQuery && shouldFilter) {
    announceResults(results.list.length);
  } else {
    announceResults.cancel();
  }
  $: if (!open) statusText = "";
  $: noResults = rendered && !loading && results.list.length === 0;
  $: emptyMessage = noResults
    ? typeof emptyText === "function"
      ? emptyText(query)
      : emptyText
    : "";
  $: showEmpty = noResults && ($$slots.empty || emptyMessage !== "");
  $: listId = `${id}-list`;
  $: labelId = `${id}-search`;
  $: searchSize = SEARCH_SIZES[size] ?? "lg";
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={rootRef}
  role="presentation"
  class:bx--command-palette={true}
  class:bx--layer-one={true}
  class:bx--command-palette--open={open}
  class:bx--command-palette--sm={size === "sm"}
  class:bx--command-palette--md={size === "md"}
  class:bx--command-palette--lg={size === "lg"}
  inert={open ? undefined : true}
  on:keydown={handleRootKeydown}
  on:mousedown={(event) => {
    if (event.target === event.currentTarget) outsideDismiss.pressOutside();
  }}
  on:mouseup={outsideDismiss.release}
  on:transitionend={(event) => {
    if (event.target === containerRef && event.propertyName === "transform") {
      finishClose();
    }
  }}
>
  <div
    bind:this={containerRef}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby={labelId}
    class:bx--command-palette__container={true}
    on:mousedown={outsideDismiss.pressInside}
  >
    <Search
      bind:ref
      bind:value
      {id}
      size={searchSize}
      {placeholder}
      {labelText}
      hideLabel
      {closeButtonLabelText}
      searchClass="bx--command-palette__search"
      role="combobox"
      tabindex="0"
      aria-autocomplete="list"
      aria-expanded={true}
      aria-controls={listId}
      aria-activedescendant={highlightedId}
      {...$$restProps}
      on:keydown={handleInputKeydown}
      on:keydown
      on:input
      on:focus
      on:blur
      on:clear
    />
    <div
      bind:this={listRef}
      id={listId}
      role="listbox"
      tabindex="-1"
      aria-labelledby={labelId}
      aria-busy={loading || undefined}
      class:bx--command-palette__list={true}
      class:bx--command-palette__list--empty={results.list.length === 0}
      style:max-height={isVirtualized ? menuMaxHeight : undefined}
      on:scroll={handleListScroll}
      on:mousedown={(event) => {
        // Keep focus in the field, so the arrow keys still move the
        // highlight after a click on a header or the scrollbar.
        event.preventDefault();
      }}
    >
      {#if isVirtualized}
        <VirtualWindow
          {totalHeight}
          {offsetY}
          scrollTop={listScrollTop}
          pinned={isPinned}
          measured={isMeasured}
        >
          <CommandPaletteRows
            runs={menuRuns}
            {groupRows}
            {id}
            {highlightedId}
            matches={results.matches}
            {highlightMatches}
            count={results.list.length}
            measured={isMeasured}
            {apple}
            customRow={$$slots.default}
            onSelect={select}
            onHighlight={highlight}
            let:row
            let:index
            let:highlighted
            let:segments
          >
            <slot item={row} {index} {highlighted} {segments} />
            <svelte:fragment slot="group" let:group let:items={groupItems}>
              <slot name="group" {group} items={groupItems}>{group}</slot>
            </svelte:fragment>
          </CommandPaletteRows>
        </VirtualWindow>
      {:else}
        <CommandPaletteRows
          runs={menuRuns}
          {groupRows}
          {id}
          {highlightedId}
          matches={results.matches}
          {highlightMatches}
          count={results.list.length}
          measured={isMeasured}
          {apple}
          customRow={$$slots.default}
          onSelect={select}
          onHighlight={highlight}
          let:row
          let:index
          let:highlighted
          let:segments
        >
          <slot item={row} {index} {highlighted} {segments} />
          <svelte:fragment slot="group" let:group let:items={groupItems}>
            <slot name="group" {group} items={groupItems}>{group}</slot>
          </svelte:fragment>
        </CommandPaletteRows>
      {/if}
    </div>
    {#if showEmpty}
      <ListBoxMenuStatus>
        <slot name="empty" value={query}>{emptyMessage}</slot>
      </ListBoxMenuStatus>
    {/if}
    {#if loading}
      <ListBoxMenuStatus>
        <InlineLoading description={loadingText} />
      </ListBoxMenuStatus>
    {/if}
    {#if $$slots.footer}
      <div class:bx--command-palette__footer={true}>
        <slot name="footer" />
      </div>
    {/if}
    {#if groupRows}
      {#each groupRows.headers as header, groupIndex (header.id)}
        <span id="{id}-group-{groupIndex}" hidden>{header.group}</span>
      {/each}
    {/if}
    <!-- Always rendered, so assistive tech registers the region before its
         text changes. -->
    <span role="status" aria-live="polite" class:bx--visually-hidden={true}
      >{statusText}</span
    >
  </div>
</div>
