<script>
  /**
   * @typedef {import("../utils/add-select.js").AddSelectKey} AddSelectKey
   * @typedef {import("../utils/add-select.js").AddSelectCrumb} AddSelectCrumb
   * @typedef {import("../utils/add-select.js").AddSelectRequest} AddSelectRequest
   * @typedef {import("../utils/add-select.js").AddSelectPage} AddSelectPage
   * @typedef {Object} AddSelectAvatar
   * @property {string} [name]
   * @property {string} [image]
   * @property {string} [initials]
   * @typedef {import("../utils/add-select.js").AddSelectItem & { icon?: import("../utils/icon-component.js").IconComponent; avatar?: AddSelectAvatar }} AddSelectItem
   * @typedef {Object} AddSelectFilterOption
   * @property {string} id
   * @property {string} labelText
   * @typedef {Object} AddSelectFilter
   * @property {string} id
   * @property {string} labelText
   * @property {ReadonlyArray<AddSelectFilterOption>} options
   * @property {boolean} [multiple] - Choose several options of the group. Defaults to `true`.
   */

  /**
   * @event {{ value: AddSelectKey | null | AddSelectKey[]; items: AddSelectItem[] }} change - Fires when the draft selection changes, before it is confirmed.
   * @event {{ value: AddSelectKey | null | AddSelectKey[]; items: AddSelectItem[] }} confirm - Fires when the selection is confirmed. `value` and `selectedItems` update first.
   * @event {null} cancel - Fires when the draft is thrown away and the selection goes back to `value`.
   * @event {{ path: AddSelectCrumb[] }} navigate - Fires when the level changes.
   * @event {{ item: AddSelectItem }} details - Fires when the details of a row are shown.
   * @restProps {div}
   * @slot {{ item: AddSelectItem; selected: boolean }} item - Replaces the text of a row.
   * @slot {{ item: AddSelectItem }} details - Details of an item, in the chosen column. Only `MultiAddSelect` has the column, so only it shows the "View details" action.
   * @slot {{ query: string }} empty - Shown when a level has no items.
   * @slot {{ query: string }} noResults - Shown when a search or a filter matches nothing.
   */

  /**
   * Set to `true` to choose several items. `MultiAddSelect` sets it. Read
   * once, when the component is created.
   */
  export let multiple = false;

  /**
   * Specify a flat array of items. An item has a `parentId` to sit under
   * another item and `hasChildren` to be opened. The array is searched,
   * filtered and paged in memory. Use `source` for a catalog that lives on a
   * server.
   * @type {ReadonlyArray<AddSelectItem> | undefined}
   */
  export let items = undefined;

  /**
   * Specify a function that answers a request for one page of one level:
   * `{ query, parentId, filters, scope }` in, `{ items, nextCursor, total }`
   * out. It gets an `AbortSignal`, which a newer request aborts, and the
   * `cursor` of the page. It may return a promise.
   * @type {((request: AddSelectRequest, context: { signal: AbortSignal; cursor?: number | null }) => AddSelectPage | Promise<AddSelectPage>) | undefined}
   */
  export let source = undefined;

  /**
   * The chosen keys. A key for `AddSelect`, an array of keys for
   * `MultiAddSelect`. It follows the confirmed selection: the draft in the
   * panel only becomes `value` on confirm (or at once with
   * `commit="change"`).
   * @type {AddSelectKey | null | AddSelectKey[] | undefined}
   * @bindable writable
   */
  export let value = undefined;

  /**
   * The chosen items, resolved. Pass the items for the initial `value` when
   * they are not in the first page. It updates when the selection is
   * confirmed.
   * @type {AddSelectItem[]}
   * @bindable writable
   */
  export let selectedItems = [];

  /**
   * Specify a function that finds items by key, for a `value` whose items
   * were never loaded. Without it, such a key shows as its own title.
   * @type {((keys: AddSelectKey[], context: { signal: AbortSignal }) => AddSelectItem[] | Promise<AddSelectItem[]>) | undefined}
   */
  export let resolveItems = undefined;

  /**
   * The levels opened, outermost first. An empty array is the top level.
   * @type {AddSelectCrumb[]}
   * @bindable writable
   */
  export let path = [];

  /**
   * The search text.
   * @bindable writable
   */
  export let query = "";

  /**
   * Specify the filters shown as chips.
   * @type {ReadonlyArray<AddSelectFilter>}
   */
  export let filters = [];

  /**
   * The chosen options of each filter, by filter id.
   * @type {Record<string, string[]>}
   * @bindable writable
   */
  export let filterValue = {};

  /**
   * Specify where a search looks. `"level"` searches the open level and
   * offers a button to search every level. `"all"` always searches every
   * level, and each result shows where it lives.
   * @type {"level" | "all"}
   */
  export let searchScope = "level";

  /**
   * Set to `true` to let an item that can be opened also be chosen. Off, it
   * can only be opened and its children are chosen.
   */
  export let selectParents = false;

  /**
   * Specify when the draft becomes `value`. `"confirm"` waits for the
   * confirm button. `"change"` follows every change and has no footer.
   * @type {"confirm" | "change"}
   */
  export let commit = "confirm";

  /** Specify how many items a request asks for, with `items` */
  export let pageSize = 40;

  /** Specify the milliseconds to wait after typing before searching */
  export let debounce = 200;

  /**
   * Specify whether the chosen items sit beside the list or below it.
   * `"split"` stacks them below `md` anyway.
   * @type {"split" | "stacked"}
   */
  export let layout = "split";

  /** Set to `true` to hide the footer, such as in a panel that has its own actions */
  export let hideActions = false;

  /** Specify the text above the list, which also names it */
  export let labelText = "Items";

  /** Specify the text above the chosen items */
  export let selectedLabelText = "Selected";

  /** Specify the search field label, read by assistive technology only */
  export let searchLabelText = "Search";

  /** Specify the search field placeholder */
  export let placeholder = "Search";

  /** Specify the name of the top level in the breadcrumb */
  export let rootText = "All items";

  /** Specify the breadcrumb's accessible name */
  export let breadcrumbLabelText = "Levels";

  /** Specify the confirm button text */
  export let confirmText = "Add";

  /** Specify the cancel button text */
  export let cancelText = "Cancel";

  /** Specify the text of the button that clears the chosen items */
  export let clearAllText = "Clear all";

  /** Specify the text of the button that clears the filters */
  export let clearFiltersText = "Clear filters";

  /** Specify the text of the button that searches every level */
  export let searchAllText = "Search all levels";

  /** Specify the text of the button that goes back to searching one level */
  export let searchLevelText = "Search this level";

  /** Specify the text shown when a level has no items */
  export let emptyText = "Nothing here yet.";

  /** Specify the text shown when a search or a filter matches nothing */
  export let noResultsText = "No results match.";

  /** Specify the text shown when the chosen items are none */
  export let noneSelectedText = "Nothing selected yet.";

  /** Specify the loading text */
  export let loadingText = "Loading";

  /** Specify the text shown when a request fails */
  export let errorText = "The items could not be loaded.";

  /** Specify the retry button text */
  export let retryText = "Try again";

  /** Specify the text of the button that loads the next page */
  export let loadMoreText = "Load more";

  /** Specify the text of the button that closes the details */
  export let closeDetailsText = "Close details";

  /** Specify the heading of the details */
  export let detailsLabelText = "Details";

  /**
   * Specify the text of the shortcut hint read with the list.
   */
  export let instructionsText =
    "Arrow keys move. Space chooses. Right Arrow opens a level, Left Arrow goes back. Alt and Enter show details.";

  /**
   * Build the text of the open button of a row.
   * @type {(item: AddSelectItem) => string}
   */
  export let openText = (item) => `Open ${item.title}`;

  /**
   * Build the text of the details button of a row.
   * @type {(item: AddSelectItem) => string}
   */
  export let detailsText = (item) => `View details of ${item.title}`;

  /**
   * Build the text of the remove button of a chosen item.
   * @type {(item: AddSelectItem) => string}
   */
  export let removeText = (item) => `Remove ${item.title}`;

  /**
   * Build the count shown on a row that can be opened.
   * @type {(count: number) => string}
   */
  export let childCountText = (count) =>
    `${count.toLocaleString()} ${count === 1 ? "item" : "items"}`;

  /**
   * Build the status under the list from the rows loaded and the total.
   * @type {(shown: number, total: number) => string}
   */
  export let rangeText = (shown, total) =>
    shown >= total
      ? `${total.toLocaleString()} ${total === 1 ? "item" : "items"}`
      : `${shown.toLocaleString()} of ${total.toLocaleString()} items`;

  /**
   * Build the message said when results arrive.
   * @type {(total: number) => string}
   */
  export let resultsText = (total) =>
    `${total.toLocaleString()} ${total === 1 ? "result" : "results"}`;

  /**
   * Build the message said when a page is added.
   * @type {(added: number) => string}
   */
  export let moreText = (added) => `${added.toLocaleString()} more loaded`;

  /**
   * Build the message said when the selection changes.
   * @type {(count: number) => string}
   */
  export let selectedCountText = (count) =>
    `${count.toLocaleString()} selected`;

  /**
   * Build the message said when a level opens.
   * @type {(crumb: AddSelectCrumb | undefined) => string}
   */
  export let levelText = (crumb) =>
    crumb ? `Opened ${crumb.title}` : "Back at the top level";

  /**
   * Build the confirm button text from the count of chosen items. Overrides
   * `confirmText`.
   * @type {((count: number) => string) | undefined}
   */
  export let confirmCountText = undefined;

  /**
   * Name the slots the consumer filled when they reach this component
   * through a wrapper, where every slot is present whether it is filled or
   * not. `MultiAddSelect` sets it.
   * @type {{ item?: boolean; details?: boolean; empty?: boolean; noResults?: boolean } | undefined}
   */
  export let slotsUsed = undefined;

  /** Set an id for the component */
  export let id = uniqueId();

  /**
   * Obtain a reference to the list element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let listRef = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import ActionSet from "../ActionSet/ActionSet.svelte";
  import Breadcrumb from "../Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "../Breadcrumb/BreadcrumbItem.svelte";
  import Button from "../Button/Button.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import Search from "../Search/Search.svelte";
  import SelectableTag from "../Tag/SelectableTag.svelte";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import Close from "../icons/Close.svelte";
  import Information from "../icons/Information.svelte";
  import { activeFilters, createItemsFetcher } from "../utils/add-select.js";
  // The batch 8 shared systems (C1 #5470, C2 #5471, C3 #5473), copied
  // unexported from their spike PRs.
  import {
    announceSourceStatus,
    createAnnouncerChannel,
  } from "../utils/announcer.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { createPagedSource } from "../utils/async-source.js";
  import { debounce as createDebounce } from "../utils/debounce.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import { createSelection } from "../utils/selection.js";
  import { uniqueId } from "../utils/unique-id.js";
  import AddSelectItemContent from "./AddSelectItemContent.svelte";

  /** The height of a row in pixels. Rows share one pitch so the list can window. */
  const ROW_HEIGHT = 64;
  const PAGE_STEP = 8;
  const CHOSEN_ROW_HEIGHT = 56;

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const announcer = createAnnouncerChannel(() => rootRef);

  /** @type {null | HTMLDivElement} */
  let rootRef = null;
  /** @type {null | HTMLElement} */
  let selectedRef = null;
  /** @type {null | HTMLInputElement} */
  let searchRef = null;
  let mounted = false;
  let listFocused = false;
  let listHeight = 480;
  let chosenHeight = 480;
  /** @type {null | HTMLDivElement} */
  let chosenRef = null;
  let searchAll = false;
  let debouncedQuery = query;
  /** @type {"level" | "all"} */
  let scope = "level";
  /** @type {AddSelectItem | undefined} */
  let detailsItem;
  /** @type {AddSelectKey | null} */
  let pendingFocus = null;

  /** @param {AddSelectKey | null | AddSelectKey[] | undefined} input */
  function toKeys(input) {
    if (input === null || input === undefined) return [];
    return Array.isArray(input) ? input : [input];
  }

  /** @param {AddSelectKey[]} keys */
  const signature = (keys) => JSON.stringify(keys);

  /** @type {ReadonlyArray<AddSelectItem>} */
  let rows = [];
  /** @type {Map<AddSelectKey, number>} */
  let rowIndex = new Map();

  /** @param {AddSelectItem} item */
  function isSelectable(item) {
    return !item.disabled && (!item.hasChildren || selectParents);
  }

  const selection = createSelection({
    mode: multiple ? "multiple" : "single",
    keys: () => rows,
    getKey: (/** @type {AddSelectItem} */ item) => item.id,
    initial: toKeys(value),
    isDisabled: (key) => {
      const index = rowIndex.get(key);
      return index === undefined || !isSelectable(rows[index]);
    },
    hidden: "keep",
    keyboard: { skipDisabled: false, pageSize: PAGE_STEP, enterSelects: true },
    announce: announcer.announce,
    texts: {
      selected: (count, outside) => selectedCountText(count + outside),
      cleared: () => selectedCountText(0),
    },
    id: `${id}-selection`,
  });

  let committedSignature = signature(toKeys(value));
  /** @param {AddSelectKey | null | AddSelectKey[] | undefined} next */
  function syncValue(next) {
    const keys = toKeys(next);
    const sig = signature(keys);
    if (sig === committedSignature) return;
    committedSignature = sig;
    selection.set(keys);
  }
  $: syncValue(value);

  /** @type {Map<AddSelectKey, AddSelectItem>} */
  let chosen = new Map();
  /** @param {ReadonlyArray<AddSelectItem>} known */
  function seedChosen(known) {
    for (const item of known)
      if (!chosen.has(item.id)) chosen.set(item.id, item);
  }
  seedChosen(selectedItems);

  /**
   * Keep the item of every chosen key, because the list holds one level and
   * a chosen item may live in another.
   * @param {ReadonlySet<AddSelectKey>} selected
   * @param {ReadonlyArray<AddSelectItem>} loaded
   */
  function syncChosen(selected, loaded) {
    let changed = false;
    for (const key of selected) {
      if (chosen.has(key)) continue;
      const index = rowIndex.get(key);
      if (index === undefined) continue;
      const item = loaded[index];
      // Remember where it was chosen from, for the chosen column.
      chosen.set(
        key,
        item.path || path.length === 0 ? item : { ...item, path },
      );
      changed = true;
    }
    for (const key of [...chosen.keys()]) {
      if (selected.has(key)) continue;
      chosen.delete(key);
      changed = true;
    }
    if (changed) chosen = chosen;
  }

  const itemsFetcherCache = {
    items: /** @type {unknown} */ (null),
    size: 0,
    run: /** @type {ReturnType<typeof createItemsFetcher> | null} */ (null),
  };

  /**
   * @param {AddSelectRequest} request
   * @param {{ signal: AbortSignal; cursor?: number | null }} context
   */
  function fetchPage(request, context) {
    if (source) return source(request, context);
    if (!items) return { items: [], nextCursor: null, total: 0 };
    if (
      itemsFetcherCache.items !== items ||
      itemsFetcherCache.size !== pageSize
    ) {
      itemsFetcherCache.items = items;
      itemsFetcherCache.size = pageSize;
      itemsFetcherCache.run = createItemsFetcher(items, { pageSize });
    }
    return /** @type {NonNullable<typeof itemsFetcherCache.run>} */ (
      itemsFetcherCache.run
    )(request, { cursor: context.cursor });
  }

  const paged = createPagedSource(fetchPage, {
    itemKey: (/** @type {AddSelectItem} */ item) => item.id,
    keepPrevious: true,
    cache: { max: 100, ttl: 0 },
  });

  let lastRequestKey = "";
  /** @type {AddSelectRequest | null} */
  let lastRequest = null;
  /** @type {unknown} */
  let lastData = items ?? source;

  /**
   * @param {AddSelectRequest} next
   * @param {boolean} ready
   */
  function syncSource(next, ready) {
    if (!ready) return;
    const key = JSON.stringify(next);
    if (key === lastRequestKey) return;
    // `keepPrevious` would leave the rows of the level just left under the
    // new breadcrumb, where a click would pick from the wrong level.
    if (
      lastRequest &&
      (lastRequest.parentId !== next.parentId ||
        lastRequest.scope !== next.scope)
    ) {
      paged.reset();
    }
    lastRequestKey = key;
    lastRequest = next;
    paged.set(next);
  }

  const setDebouncedQuery = createDebounce((/** @type {unknown} */ text) => {
    debouncedQuery = String(text);
  }, debounce);

  $: if (mounted) {
    if (query.trim() === "") {
      setDebouncedQuery.cancel();
      debouncedQuery = query;
    } else {
      setDebouncedQuery(query);
    }
  }

  $: scope =
    debouncedQuery.trim() !== "" && (searchScope === "all" || searchAll)
      ? "all"
      : "level";
  $: parentId =
    scope === "all" || path.length === 0 ? null : path[path.length - 1].id;
  /** @type {AddSelectRequest} */
  $: request = {
    query: debouncedQuery.trim(),
    parentId,
    filters: activeFilters(filterValue),
    scope,
  };

  // The source changes status inside `set`, so every statement that reads
  // `$paged` comes after this one: Svelte 3 and 4 run `$:` blocks in order.
  $: if (mounted && (items ?? source) !== lastData) {
    lastData = items ?? source;
    paged.invalidate();
    lastRequestKey = "";
    lastRequest = null;
  }
  $: syncSource(request, mounted || Boolean(items));

  $: rows = $paged.data ?? [];
  $: rowIndex = new Map(rows.map((row, index) => [row.id, index]));
  $: total = $paged.firstPage?.total ?? rows.length;
  $: status = $paged.status;
  $: busy = status === "loading" || $paged.stale;
  $: syncChosen($selection.selected, rows);
  $: selectedList = [...$selection.selected].map(
    (key) => chosen.get(key) ?? { id: key, title: String(key) },
  );
  $: cursorKey = rowIndex.has(/** @type {AddSelectKey} */ ($selection.focus))
    ? $selection.focus
    : (rows[0]?.id ?? null);
  $: cursorIndex = cursorKey === null ? -1 : (rowIndex.get(cursorKey) ?? -1);
  $: cursorItem = cursorIndex === -1 ? undefined : rows[cursorIndex];
  $: filtering = Object.keys(request.filters).length > 0;
  $: searching = request.query !== "";
  $: hierarchical = path.length > 0 || rows.some((row) => row.hasChildren);
  $: showScopeButton =
    searchScope === "level" && path.length > 0 && query.trim() !== "";
  $: used = slotsUsed ?? {
    item: Boolean($$slots.item),
    details: Boolean($$slots.details),
    empty: Boolean($$slots.empty),
    noResults: Boolean($$slots.noResults),
  };
  $: hasDetails = multiple && Boolean(used.details);
  $: showSelectedColumn = multiple;
  $: confirmLabel = confirmCountText
    ? confirmCountText($selection.selected.size)
    : confirmText;
  $: ensureCursor(rows);

  // The cursor is not DOM focus: it is the row the list's
  // `aria-activedescendant` points at, and it must always be a row that exists.
  /** @param {ReadonlyArray<AddSelectItem>} loaded */
  function ensureCursor(loaded) {
    if (loaded.length === 0) return;
    if (pendingFocus !== null && rowIndex.has(pendingFocus)) {
      const key = pendingFocus;
      pendingFocus = null;
      selection.moveFocus(key);
      scrollKeyIntoView(key);
      return;
    }
    const focus = selection.get().focus;
    if (focus === null || !rowIndex.has(focus)) {
      selection.moveFocus(loaded[0].id);
    }
  }

  /** @param {AddSelectKey} key */
  function scrollKeyIntoView(key) {
    const index = rowIndex.get(key);
    if (index === undefined || !listRef) return;
    const top = index * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;
    if (top < listRef.scrollTop) listRef.scrollTop = top;
    else if (bottom > listRef.scrollTop + listRef.clientHeight) {
      listRef.scrollTop = bottom - listRef.clientHeight;
    }
  }

  /** @param {number} index */
  function optionId(index) {
    return `${id}-option-${index}`;
  }

  function emitChange() {
    dispatch("change", {
      value: multiple ? selection.toArray() : (selection.toArray()[0] ?? null),
      items: currentItems(),
    });
    if (commit === "change") confirmSelection(false);
  }

  /** @returns {AddSelectItem[]} */
  function currentItems() {
    return selection
      .toArray()
      .map((key) => chosen.get(key) ?? { id: key, title: String(key) });
  }

  /**
   * Run a change to the selection and tell the host when it changed what is
   * chosen, not only where the cursor is.
   * @param {() => unknown} change
   */
  function applyChange(change) {
    const before = selection.get().selected;
    change();
    if (selection.get().selected !== before) {
      syncChosen(selection.get().selected, rows);
      emitChange();
    }
  }

  /**
   * @param {boolean} [emit]
   */
  function confirmSelection(emit = true) {
    const keys = selection.toArray();
    committedSignature = signature(keys);
    value = multiple ? keys : (keys[0] ?? null);
    selectedItems = currentItems();
    if (emit) dispatch("confirm", { value, items: selectedItems });
  }

  /** Confirm the draft: it becomes `value` and `selectedItems`. */
  export function confirm() {
    confirmSelection();
  }

  /** Throw the draft away and go back to `value`. */
  export function reset() {
    selection.set(toKeys(value));
    dispatch("cancel");
  }

  /** @param {AddSelectItem} item */
  function toggleItem(item) {
    if (!isSelectable(item)) return;
    applyChange(() =>
      multiple ? selection.toggle(item.id) : selection.select(item.id),
    );
  }

  /**
   * @param {AddSelectCrumb[]} crumbs
   * @param {AddSelectKey | null} [returnTo]
   */
  function navigate(crumbs, returnTo = null) {
    path = crumbs;
    searchAll = false;
    query = "";
    debouncedQuery = "";
    setDebouncedQuery.cancel();
    detailsItem = undefined;
    pendingFocus = returnTo;
    announcer.announce(levelText(crumbs[crumbs.length - 1]), { debounce: 0 });
    dispatch("navigate", { path: crumbs });
  }

  /** @param {AddSelectItem} item */
  function drill(item) {
    if (!item.hasChildren) return;
    navigate([...(item.path ?? path), { id: item.id, title: item.title }]);
  }

  function goUp() {
    if (path.length === 0) return;
    navigate(path.slice(0, -1), path[path.length - 1].id);
  }

  /** @param {AddSelectItem} item */
  function showDetails(item) {
    if (!hasDetails) return;
    detailsItem = item;
    dispatch("details", { item });
  }

  /**
   * @param {MouseEvent} event
   * @param {AddSelectItem} item
   */
  function onRowClick(event, item) {
    selection.onItemFocus(item.id);
    listRef?.focus();
    if (item.hasChildren && !selectParents) {
      drill(item);
      return;
    }
    if (multiple && event.shiftKey) {
      applyChange(() => selection.extendTo(item.id, "add"));
      return;
    }
    toggleItem(item);
  }

  /** @param {KeyboardEvent} event */
  function onListKeydown(event) {
    if (event.defaultPrevented || event.isComposing) return;
    const key = inlineKey(event.key, $layoutDirection, listRef);
    const plain =
      !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
    const item = cursorItem;

    if (event.altKey && !event.ctrlKey && !event.metaKey && key === "Enter") {
      if (item && hasDetails) {
        event.preventDefault();
        showDetails(item);
      }
      return;
    }
    if (
      plain &&
      item?.hasChildren &&
      (key === "ArrowRight" || key === "Enter")
    ) {
      event.preventDefault();
      drill(item);
      return;
    }
    if (
      plain &&
      (key === "ArrowLeft" || key === "Backspace") &&
      path.length > 0
    ) {
      event.preventDefault();
      goUp();
      return;
    }
    // Escape belongs to the panel around the list. The model would clear the
    // selection with it.
    if (event.key === "Escape") return;
    // Left and Right only drill; they do not move the cursor.
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") return;

    const before = selection.get().selected;
    const target = selection.onItemKeydown(event);
    if (selection.get().selected !== before) {
      syncChosen(selection.get().selected, rows);
      emitChange();
    }
    if (target !== null) {
      scrollKeyIntoView(target);
      const index = rowIndex.get(target) ?? 0;
      if (index >= rows.length - PAGE_STEP) loadMore();
    }
  }

  function loadMore() {
    if ($paged.hasMore && !$paged.loadingMore && status === "success") {
      paged.loadMore();
    }
  }

  function onListFocus() {
    listFocused = true;
    const focus = selection.get().focus;
    if ((focus === null || !rowIndex.has(focus)) && rows.length > 0) {
      selection.moveFocus(rows[0].id);
    }
  }

  /** @param {KeyboardEvent} event */
  function onSearchKeydown(event) {
    if (event.key === "ArrowDown" && !event.altKey && rows.length > 0) {
      event.preventDefault();
      listRef?.focus();
    }
  }

  /**
   * @param {AddSelectFilter} group
   * @param {string} optionId
   */
  function filterIsOn(group, optionId) {
    return (filterValue[group.id] ?? []).includes(optionId);
  }

  /**
   * @param {AddSelectFilter} group
   * @param {string} optionId
   */
  function toggleFilter(group, optionId) {
    const chosenIds = filterValue[group.id] ?? [];
    const on = chosenIds.includes(optionId);
    const next =
      group.multiple === false
        ? on
          ? []
          : [optionId]
        : on
          ? chosenIds.filter((entry) => entry !== optionId)
          : [...chosenIds, optionId];
    filterValue = { ...filterValue, [group.id]: next };
  }

  function clearFilters() {
    filterValue = {};
  }

  /**
   * Remove a chosen item and keep the keyboard where it was: on the next
   * chosen item, else the previous, else the column.
   * @param {AddSelectItem} item
   */
  async function removeChosen(item) {
    const keys = selection.toArray();
    const at = keys.indexOf(item.id);
    const neighbour = keys[at + 1] ?? keys[at - 1];
    applyChange(() => selection.toggle(item.id, false));
    await tick();
    const target =
      neighbour === undefined
        ? null
        : selectedRef?.querySelector(
            `[data-remove-key="${CSS.escape(String(neighbour))}"]`,
          );
    if (target instanceof HTMLElement) target.focus();
    else (selectedRef ?? searchRef)?.focus();
  }

  function clearChosen() {
    applyChange(() => selection.clear());
    (selectedRef ?? searchRef)?.focus();
  }

  async function retry() {
    await paged.refresh();
  }

  let resolving = 0;
  $: if (mounted && resolveItems) resolveMissing(selection.toArray());
  /** @param {AddSelectKey[]} keys */
  async function resolveMissing(keys) {
    const missing = keys.filter((key) => !chosen.has(key));
    if (missing.length === 0 || !resolveItems) return;
    const run = ++resolving;
    const controller = new AbortController();
    try {
      const found = await resolveItems(missing, { signal: controller.signal });
      if (run !== resolving) return;
      for (const item of found) chosen.set(item.id, item);
      chosen = chosen;
      if (selectedItems.length === 0) selectedItems = currentItems();
    } catch {
      // The keys stay as their own titles.
    }
  }

  onMount(() => {
    mounted = true;
    const release = announcer.connect();
    const stopStatus = announceSourceStatus(paged.onStatus, {
      channel: `${id}-source`,
      source: rootRef,
      results: () => resultsText(paged.get().firstPage?.total ?? 0),
      more: (added) => moreText(added),
      error: () => errorText,
    });
    return () => {
      stopStatus();
      release();
      setDebouncedQuery.cancel();
    };
  });

  $: instructionsId = `${id}-instructions`;
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: rootProps,
  } = splitAriaNaming($$restProps));
</script>

<div
  bind:this={rootRef}
  class:bx--add-select={true}
  class:bx--add-select--multiple={multiple}
  class:bx--add-select--stacked={layout === "stacked"}
  class:bx--add-select--no-footer={hideActions || commit === "change"}
  {id}
  {...rootProps}
>
  <div class:bx--add-select__main={true}>
    <div
      class:bx--add-select__search={true}
      on:keydown={onSearchKeydown}
      role="presentation"
    >
      <Search
        id="{id}-search"
        bind:ref={searchRef}
        bind:value={query}
        size="lg"
        labelText={searchLabelText}
        hideLabel
        {placeholder}
        loading={status === "loading" && searching}
      />
    </div>

    {#if showScopeButton || (searchAll && searchScope === "level")}
      <div class:bx--add-select__scope={true}>
        <Button
          kind="ghost"
          size="sm"
          on:click={() => (searchAll = !searchAll)}
        >
          {searchAll ? searchLevelText : searchAllText}
        </Button>
      </div>
    {/if}

    {#if filters.length > 0}
      <div class:bx--add-select__filters={true}>
        {#each filters as group, groupIndex (group.id)}
          <div
            class:bx--add-select__filter-group={true}
            role="group"
            aria-labelledby="{id}-filter-{groupIndex}"
          >
            <span
              id="{id}-filter-{groupIndex}"
              class:bx--add-select__filter-label={true}>{group.labelText}</span
            >
            {#each group.options as option, optionIndex (option.id)}
              <SelectableTag
                size="md"
                id="{id}-chip-{groupIndex}-{optionIndex}"
                selected={filterIsOn(group, option.id)}
                on:change={() => toggleFilter(group, option.id)}
              >
                {option.labelText}
              </SelectableTag>
            {/each}
          </div>
        {/each}
        {#if filtering}
          <Button kind="ghost" size="sm" on:click={clearFilters}>
            {clearFiltersText}
          </Button>
        {/if}
      </div>
    {/if}

    {#if hierarchical}
      <Breadcrumb
        class="bx--add-select__crumbs"
        noTrailingSlash
        labelText={breadcrumbLabelText}
      >
        <BreadcrumbItem isCurrentPage={path.length === 0} let:props>
          {#if path.length === 0}
            <span {...props}>{rootText}</span>
          {:else}
            <button type="button" {...props} on:click={() => navigate([])}>
              {rootText}
            </button>
          {/if}
        </BreadcrumbItem>
        {#each path as crumb, index (crumb.id)}
          <BreadcrumbItem isCurrentPage={index === path.length - 1} let:props>
            {#if index === path.length - 1}
              <span {...props}>{crumb.title}</span>
            {:else}
              <button
                type="button"
                {...props}
                on:click={() => navigate(path.slice(0, index + 1))}
              >
                {crumb.title}
              </button>
            {/if}
          </BreadcrumbItem>
        {/each}
      </Breadcrumb>
    {/if}

    <div class:bx--add-select__list-heading={true}>
      <span id="{id}-label" class:bx--add-select__list-label={true}>
        {labelText}
      </span>
      {#if rows.length > 0}
        <span class:bx--add-select__count={true}
          ><bdi>{rangeText(rows.length, total)}</bdi></span
        >
      {/if}
    </div>

    <div
      class:bx--add-select__body={true}
      class:bx--add-select__body--focused={listFocused}
      class:bx--add-select__body--busy={busy}
    >
      <span id={instructionsId} class:bx--visually-hidden={true}
        >{instructionsText}</span
      >
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div
        bind:this={listRef}
        bind:clientHeight={listHeight}
        class:bx--add-select__list={true}
        class:bx--add-select__list--empty={rows.length === 0}
        role="listbox"
        tabindex="0"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy ??
          (ariaLabel === undefined ? `${id}-label` : undefined)}
        aria-describedby={joinDescribedBy(instructionsId, ariaDescribedBy)}
        aria-multiselectable={multiple ? "true" : undefined}
        aria-busy={busy ? "true" : undefined}
        aria-activedescendant={cursorIndex === -1
          ? undefined
          : optionId(cursorIndex)}
        on:keydown={onListKeydown}
        on:focus={onListFocus}
        on:blur={() => (listFocused = false)}
      >
        <VirtualList
          items={rows}
          itemHeight={ROW_HEIGHT}
          containerHeight={listHeight}
          scrollElement={listRef}
          spacerTag="div"
          overscan={4}
          getKey={(row) => row.id}
          on:scrollend={loadMore}
          let:item
          let:index
        >
          {@const selected = $selection.selected.has(item.id)}
          {@const selectable = isSelectable(item)}
          <!-- svelte-ignore a11y-click-events-have-key-events, a11y-interactive-supports-focus -->
          <div
            id={optionId(index)}
            role="option"
            class:bx--add-select__option={true}
            class:bx--add-select__option--selected={selected}
            class:bx--add-select__option--active={index === cursorIndex}
            class:bx--add-select__option--parent={item.hasChildren}
            class:bx--add-select__option--disabled={item.disabled}
            aria-selected={selectable
              ? selected
                ? "true"
                : "false"
              : undefined}
            aria-disabled={item.disabled ? "true" : undefined}
            on:click={(event) => onRowClick(event, item)}
          >
            {#if selectable}
              <span
                class:bx--add-select__check={true}
                class:bx--add-select__check--radio={!multiple}
                aria-hidden="true"
              >
                {#if selected}<Checkmark />{/if}
              </span>
            {/if}
            {#if used.item}
              <slot name="item" {item} {selected} />
            {:else}
              <AddSelectItemContent {item} {childCountText} />
            {/if}
            {#if hasDetails && !item.disabled}
              <!-- A pointer shortcut for Alt+Enter. It is not a button: an
                option's children are presentational, so a focusable one
                inside it fails axe's nested-interactive even at tabindex -1. -->
              <!-- svelte-ignore a11y-click-events-have-key-events, a11y-no-static-element-interactions -->
              <span
                aria-hidden="true"
                class:bx--add-select__row-action={true}
                title={detailsText(item)}
                on:click|stopPropagation={() => showDetails(item)}
              >
                <Information />
              </span>
            {/if}
            {#if item.hasChildren}
              <!-- svelte-ignore a11y-click-events-have-key-events, a11y-no-static-element-interactions -->
              <span
                aria-hidden="true"
                class:bx--add-select__row-action={true}
                class:bx--add-select__row-action--drill={true}
                title={openText(item)}
                on:click|stopPropagation={() => drill(item)}
              >
                <ChevronRight />
              </span>
            {/if}
          </div>
        </VirtualList>
      </div>

      {#if rows.length === 0}
        <div class:bx--add-select__placeholder={true}>
          {#if status === "error"}
            <p class:bx--add-select__placeholder-text={true}>{errorText}</p>
            <Button kind="tertiary" size="sm" on:click={retry}
              >{retryText}</Button
            >
          {:else if status === "loading" || status === "idle"}
            <div class:bx--add-select__skeleton={true} aria-hidden="true">
              {#each [0, 1, 2, 3, 4] as line (line)}
                <div class:bx--add-select__skeleton-row={true}>
                  <span class:bx--skeleton__text={true}></span>
                  <span class:bx--skeleton__text={true}></span>
                </div>
              {/each}
            </div>
          {:else if searching || filtering}
            {#if used.noResults}
              <slot name="noResults" {query} />
            {:else}
              <p class:bx--add-select__placeholder-text={true}>
                {noResultsText}
              </p>
            {/if}
          {:else if used.empty}
            <slot name="empty" {query} />
          {:else}
            <p class:bx--add-select__placeholder-text={true}>{emptyText}</p>
          {/if}
        </div>
      {/if}
    </div>

    <div class:bx--add-select__status={true}>
      {#if status === "error" && rows.length > 0}
        <span class:bx--add-select__status-error={true}>{errorText}</span>
        <Button kind="ghost" size="sm" on:click={retry}>{retryText}</Button>
      {:else if $paged.loadingMore || (status === "loading" && rows.length > 0)}
        <InlineLoading description={loadingText} />
      {:else if $paged.hasMore}
        <Button kind="ghost" size="sm" on:click={loadMore}
          >{loadMoreText}</Button
        >
      {:else if $paged.moreError}
        <span class:bx--add-select__status-error={true}>{errorText}</span>
        <Button kind="ghost" size="sm" on:click={loadMore}>{retryText}</Button>
      {/if}
    </div>
  </div>

  {#if showSelectedColumn}
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <aside
      bind:this={selectedRef}
      class:bx--add-select__selected={true}
      aria-labelledby="{id}-selected-label"
      tabindex="-1"
    >
      {#if detailsItem && hasDetails}
        <section
          class:bx--add-select__details={true}
          aria-label={detailsLabelText}
        >
          <div class:bx--add-select__selected-heading={true}>
            <span class:bx--add-select__list-label={true}
              >{detailsLabelText}</span
            >
            <Button
              kind="ghost"
              size="sm"
              icon={Close}
              iconDescription={closeDetailsText}
              on:click={() => (detailsItem = undefined)}
            />
          </div>
          <div class:bx--add-select__details-body={true}>
            <slot name="details" item={detailsItem} />
          </div>
        </section>
      {/if}
      <div class:bx--add-select__selected-heading={true}>
        <span id="{id}-selected-label" class:bx--add-select__list-label={true}>
          {selectedLabelText}
        </span>
        <span class:bx--add-select__count={true}
          ><bdi>{$selection.selected.size.toLocaleString()}</bdi></span
        >
        {#if $selection.selected.size > 0}
          <Button kind="ghost" size="sm" on:click={clearChosen}
            >{clearAllText}</Button
          >
        {/if}
      </div>
      {#if selectedList.length === 0}
        <p class:bx--add-select__placeholder-text={true}>{noneSelectedText}</p>
      {:else}
        <!-- Windowed like the list: choosing a whole level of a big catalog
          would otherwise mount thousands of rows. -->
        <div
          bind:this={chosenRef}
          bind:clientHeight={chosenHeight}
          class:bx--add-select__chosen={true}
          role="list"
          aria-labelledby="{id}-selected-label"
        >
          <VirtualList
            items={selectedList}
            itemHeight={CHOSEN_ROW_HEIGHT}
            containerHeight={chosenHeight}
            scrollElement={chosenRef}
            spacerTag="div"
            overscan={4}
            getKey={(row) => row.id}
            let:item
          >
            <div role="listitem" class:bx--add-select__chosen-item={true}>
              <AddSelectItemContent {item} {childCountText} compact />
              <Button
                kind="ghost"
                size="sm"
                icon={Close}
                iconDescription={removeText(item)}
                tooltipPosition="left"
                data-remove-key={item.id}
                on:click={() => removeChosen(item)}
              />
            </div>
          </VirtualList>
        </div>
      {/if}
    </aside>
  {/if}

  {#if !hideActions && commit === "confirm"}
    <div class:bx--add-select__footer={true}>
      {#if !multiple}
        <span class:bx--add-select__footer-note={true}>
          {selectedList.length > 0 ? selectedList[0].title : noneSelectedText}
        </span>
      {/if}
      <ActionSet size="lg">
        <Button kind="secondary" on:click={reset}>{cancelText}</Button>
        <Button
          kind="primary"
          disabled={$selection.selected.size === 0}
          on:click={confirm}
        >
          {confirmLabel}
        </Button>
      </ActionSet>
    </div>
  {/if}
</div>
