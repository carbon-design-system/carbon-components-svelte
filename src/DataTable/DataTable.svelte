<script>
  /**
   * @template {DataTableRow} [Row=DataTableRow]
   */

  /**
   * @typedef {any} DataTableValue
   * @typedef {{ id: Id; [key: string]: DataTableValue; }} DataTableRow<Id=any>
   * @typedef {(
   *   [keyof import('./data-table-utils.d.ts').KeysWithoutIndexSignature<Row>] extends [never]
   *     ? import('./data-table-utils.d.ts').PropertyPath<Row>
   *     : keyof import('./data-table-utils.d.ts').KeysWithoutIndexSignature<Row> extends "id"
   *       ? import('./data-table-utils.d.ts').PropertyPath<Row>
   *       : Row extends DataTableRow
   *         ? import('./data-table-utils.d.ts').PropertyPathIgnoringIndexSignatures<Row>
   *         : import('./data-table-utils.d.ts').PropertyPath<Row>
   * )} DataTableKey<Row=DataTableRow> Path keys for sort, headers, and cells; mirrors PropertyPath / PropertyPathIgnoringIndexSignatures in ./data-table-utils.d.ts.
   * @typedef {import('./data-table-utils.d.ts').DataTableSortValue<Row>} DataTableSortValue<Row=DataTableRow>
   * @typedef {object} DataTableEmptyHeader<Row=DataTableRow>
   * @property {DataTableKey<Row> | (string & {})} key
   * @property {true} empty - Whether the header is empty
   * @property {(item: DataTableValue, row: Row) => DataTableValue} [display]
   * @property {false | ((a: DataTableSortValue<Row>, b: DataTableSortValue<Row>) => number)} [sort]
   * @property {(value: DataTableValue, filterValue: any, row: Row) => boolean} [filter] - Override the default predicate for this column's entry in `filters`
   * @property {boolean} [sortAlways] - Override table-level sortAlways for this column
   * @property {boolean} [columnMenu] - Whether the column menu is enabled
   * @property {boolean} [columnHidden] - Whether the column is skipped in render while remaining in `headers`
   * @property {string} [width]
   * @property {string} [minWidth]
   * @typedef {object} DataTableNonEmptyHeader<Row=DataTableRow>
   * @property {DataTableKey<Row>} key
   * @property {false} [empty]
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: Row) => DataTableValue} [display]
   * @property {false | ((a: DataTableSortValue<Row>, b: DataTableSortValue<Row>) => number)} [sort]
   * @property {(value: DataTableValue, filterValue: any, row: Row) => boolean} [filter] - Override the default predicate for this column's entry in `filters`
   * @property {boolean} [sortAlways] - Override table-level sortAlways for this column
   * @property {boolean} [columnMenu] - Whether the column menu is enabled
   * @property {boolean} [columnHidden] - Whether the column is skipped in render while remaining in `headers`
   * @property {string} [width]
   * @property {string} [minWidth]
   * @property {"start" | "end"} [columnAlign] - Horizontal alignment of the column header and cells. Logical, so `end` is the right edge in LTR and the left edge in RTL. Defaults to `"start"`.
   * @typedef {DataTableNonEmptyHeader<Row> | DataTableEmptyHeader<Row>} DataTableHeader<Row=DataTableRow>
   * @typedef {object} DataTableCell<Row=DataTableRow>
   * @property {DataTableKey<Row> | (string & {})} key
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: DataTableRow) => DataTableValue} [display]
   * @slot {{ expanded: boolean; row: Row | undefined; props: { "aria-hidden": "true" | "false"; class: string; }; }} expandIcon
   * @slot {{ row: Row; rowSelected: boolean; }} expandedRow
   * @slot {{ header: DataTableNonEmptyHeader; }} cellHeader
   * @slot {{ row: Row; cell: DataTableCell<Row>; rowIndex: number; cellIndex: number; rowSelected: boolean; rowExpanded: boolean; }} cell
   * @slot {{ header: DataTableNonEmptyHeader; index: number; }} footerCell
   * @event click
   * @type {object}
   * @property {DataTableHeader<Row>} [header]
   * @property {Row} [row]
   * @property {DataTableCell<Row>} [cell]
   * @event click:header--expand
   * @type {object}
   * @property {boolean} expanded
   * @event click:header
   * @type {object}
   * @property {DataTableHeader<Row>} header
   * @property {"ascending" | "descending" | "none"} [sortDirection] - The intended next sort direction for this click, reported regardless of whether the `sort` event was cancelled.
   * @property {EventTarget} target
   * @property {EventTarget} currentTarget
   * @event click:header--select
   * @type {object}
   * @property {boolean} indeterminate
   * @property {boolean} selected
   * @event click:row
   * @type {object}
   * @property {Row} row
   * @property {EventTarget} target
   * @property {EventTarget} currentTarget
   * @event {Row} mouseenter:row
   * @event {Row} mouseleave:row
   * @event click:row--expand
   * @type {object}
   * @property {boolean} expanded
   * @property {Row} row
   * @event click:row--select
   * @type {object}
   * @property {boolean} selected
   * @property {Row} row
   * @event {{ key: null; direction: "none" } | { key: DataTableKey<Row>; direction: "ascending" | "descending" }} sort - Dispatched when a sortable column header would change the active sort. The event is cancelable: call `preventDefault()` to skip updating `sortKey` / `sortDirection` and skip client side sorting for that click (for example full server side sorting while still reading `detail.key` / `detail.direction` for your API). If not cancelled, the table applies the new sort and sorts the current `rows` client side. Typical uses: server side sorting, URL or query string sync, analytics, and persisting sort preferences.
   * @property {DataTableKey<Row> | null} key - Proposed sort column (`header.key`), or `null` when the proposed `direction` is `none`.
   * @property {"ascending" | "descending" | "none"} direction - Proposed sort direction for this click (applied internally unless the event is cancelled).
   * @event {{ key: null; value: null; filters: Record<string, any> } | { key: DataTableKey<Row>; value: any; filters: Record<string, any> }} filter - Dispatched when the resolved `filters` change. There is no built-in filter UI, so this is not a click handler: it fires whenever a column filter value changes, including from a control bound into `filters`. The event is cancelable: call `preventDefault()` to skip client side filtering for that change (for example server side filtering, where you read `detail.filters` for your API and hand back new `rows`). If not cancelled, the table narrows the current `rows` client side. Typical uses: server side filtering, URL or query string sync, and persisting filter preferences.
   * @property {DataTableKey<Row> | null} key - Column whose filter value changed (`header.key`), or `null` when more than one entry changed in a single assignment.
   * @property {any} value - New filter value for `key`, or `null` when `key` is `null`.
   * @property {Record<string, any>} filters - The whole filter map after the change.
   * @event click:cell
   * @type {object}
   * @property {DataTableCell<Row>} cell
   * @property {EventTarget} target
   * @property {EventTarget} currentTarget
   * @typedef {{ row: Row, rowIndex: number, selected: boolean, expanded: boolean }} DataTableRowClassArgs<Row=DataTableRow>
   * @typedef {string | ((row: DataTableRowClassArgs<Row>) => string | undefined)} DataTableRowClass<Row=DataTableRow>
   * @type {object}
   * @property {DataTableRowClass<Row>} [rowClass]
   * @restProps {div}
   */

  /**
   * Specify the data table headers.
   * @type {ReadonlyArray<DataTableHeader<Row>>}
   */
  export let headers = [];

  /**
   * Specify the rows the data table should render.
   * Keys defined in `headers` are used for the row ids.
   * @type {ReadonlyArray<Row>}
   */
  export let rows = [];

  /**
   * Set the size of the data table.
   * @type {"compact" | "short" | "medium" | "tall"}
   */
  export let size = undefined;

  /** Specify the title of the data table */
  export let title = "";

  /** Specify the description of the data table */
  export let description = "";

  /**
   * Specify a custom class name for each row.
   * Provide a function to return a class name based
   * on row properties, allowing conditional classes
   * based on selected/expanded state.
   * @example
   * ```svelte
   * <DataTable rowClass={({ row, rowIndex, selected, expanded }) => {
   *   return `row-${rowIndex} ${selected ? 'selected' : ''} ${expanded ? 'expanded' : ''}`;
   * }} />
   * ```
   * @type {DataTableRowClass<Row>}
   */
  export let rowClass = undefined;

  /**
   * Specify a name attribute for the input elements
   * in a selectable data table (radio or checkbox).
   * When the table is inside a form, this name will
   * be included in the form data on submit.
   */
  export let inputName = `ccs-${Math.random().toString(36)}`;

  /** Set to `true` to use zebra styles */
  export let zebra = false;

  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /**
   * Specify the header key to sort by.
   * @type {DataTableKey<Row>}
   * @bindable writable
   */
  export let sortKey = null;

  /**
   * Specify the sort direction.
   * @type {"none" | "ascending" | "descending"}
   * @bindable writable
   */
  export let sortDirection = "none";

  /**
   * Set to `true` to only toggle between "ascending" and
   * "descending" sort directions, skipping "none".
   */
  export let sortAlways = false;

  /**
   * Specify a default sort comparator for all sortable columns.
   * Per-header `sort` functions take precedence over this prop.
   *
   * With a typed row generic, `a` and `b` are {@link DataTableSortValue} (the union of cell value types over every {@link DataTableKey} on `Row`). Narrow using `context.key` (typed as {@link DataTableKey}) or runtime checks.
   *
   * @example
   * ```svelte
   * <DataTable
   *   sort={(a, b, { key }) => {
   *     switch (key) {
   *       case "expireDate":
   *         return new Date(a) - new Date(b);
   *       case "port":
   *         return a - b;
   *       default:
   *         return String(a).localeCompare(String(b));
   *     }
   *   }}
   * />
   * ```
   * @type {(a: DataTableSortValue<Row>, b: DataTableSortValue<Row>, context: { key: DataTableKey<Row>; ascending: boolean; row_a: Row; row_b: Row }) => number}
   */
  export let sort = undefined;

  /**
   * Set to `true` for the expandable variant.
   * Automatically set to `true` if `batchExpansion` is `true`.
   * @bindable writable
   */
  export let expandable = false;

  /**
   * Set to `true` to enable batch expansion.
   */
  export let batchExpansion = false;

  /**
   * Specify the row ids to be expanded.
   * @type {ReadonlyArray<Row["id"]>}
   * @bindable writable
   */
  export let expandedRowIds = [];

  /**
   * Specify the ids for rows that should not be expandable.
   * @type {ReadonlyArray<Row["id"]>}
   */
  export let nonExpandableRowIds = [];

  /** Set to `true` for the radio selection variant */
  export let radio = false;

  /**
   * Set to `true` for the selectable variant.
   * Automatically set to `true` if `radio` or `batchSelection` are `true`.
   * Shift-clicking a row checkbox extends selection to every row between it and the last row clicked (not supported with `radio`).
   * @bindable writable
   */
  export let selectable = false;

  /** Set to `true` to enable batch selection */
  export let batchSelection = false;

  /**
   * Specify the row ids to be selected.
   * @type {ReadonlyArray<Row["id"]>}
   * @bindable writable
   */
  export let selectedRowIds = [];

  /**
   * Specify the ids of rows that should not be selectable.
   * @type {ReadonlyArray<Row["id"]>}
   */
  export let nonSelectableRowIds = [];

  /**
   * Specify the row ids to highlight.
   * Adds `bx--data-table--highlighted-row`. The highlighted row class is themed by default.
   * @type {ReadonlyArray<Row["id"]>}
   * @bindable writable
   */
  export let highlightedRowIds = [];

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /**
   * Override the maximum height of the sticky header table, replacing the
   * default `300px`. Only applies when `stickyHeader` is `true`. Pass a number
   * (interpreted as `px`) or a CSS length string (e.g. `"100%"`, `"24rem"`).
   * @type {number | string}
   */
  export let stickyHeaderMaxHeight = undefined;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  /**
   * Set the filtering strategy used by `ToolbarSearch`.
   * - `"remove"`: remove non-matching rows from the DOM and recreate them when the
   *   filter clears.
   * - `"hide"`: keep all rows mounted and hide non-matching rows with the `hidden`
   *   attribute, preserving focus, inputs, and open menus.
   *
   * `"hide"` falls back to `"remove"` when `pageSize` is set or `virtualize` is enabled.
   * @type {"remove" | "hide"}
   */
  export let filterMode = "remove";

  /**
   * Specify per-column filter values, keyed by `header.key`.
   *
   * An entry is skipped when its value is `undefined`, `null`, a blank string, or an
   * empty array. Active entries combine with `AND` across columns and with the
   * `ToolbarSearch` value. A column matches on a case-insensitive substring for a
   * string value, on membership for an array value, and on strict equality otherwise;
   * set `header.filter` to override the predicate for that column.
   * @example
   * ```svelte
   * <Select bind:selected={filters.status} …/>
   * <DataTable bind:filters bind:filteredRowIds {headers} {rows} />
   * ```
   * @type {Record<string, any>}
   * @bindable writable
   */
  export let filters = {};

  /**
   * The row ids matching the column filters and the `ToolbarSearch` value.
   * Bind to this rather than to `ToolbarSearch.filteredRowIds` when column
   * filters are in play; with no column filters the two agree.
   * @type {ReadonlyArray<Row["id"]>}
   * @bindable readonly
   */
  export let filteredRowIds = [];

  /** Specify the number of items to display in a page */
  export let pageSize = 0;

  /** Set to `number` to set current page */
  export let page = 0;

  /**
   * Enable virtualization for large row lists. Virtualization renders only the rows currently visible in the viewport, improving performance for large datasets.
   *
   * Virtualization is opt-in. Set `virtualize={true}` to enable with default settings, or pass a configuration object to customize.
   * Virtualized tables are intended for use with `stickyHeader={true}` so the header stays visible while scrolling. Pagination is ignored when virtualization is enabled.
   * Virtualization assumes a uniform row height; combining it with `expandable` rows is not supported and may cause incorrect scroll-spacer sizing when rows are expanded mid-list.
   *
   * Provide an object to customize virtualization behavior:
   * - `itemHeight` (default: 48 for medium size, adjusted for size variant): The height in pixels of each row. Specify a custom value when using custom slots with multi-line content or different heights.
   * - `maxVisibleRows` (default: 10): The maximum number of rows to display in the viewport. The container height will be calculated as `itemHeight * maxVisibleRows`. Overridden by `containerHeight` if explicitly provided.
   * - `containerHeight` (default: calculated from maxVisibleRows): The maximum height in pixels of the table body container. If not provided, calculated from `itemHeight * maxVisibleRows`.
   * - `overscan` (default: 3): The number of extra rows to render above and below the viewport for smoother scrolling. Higher values may cause more flickering during very fast scrolling.
   * - `threshold` (default: 100): The minimum number of rows required before virtualization activates. Tables with fewer rows will render all rows normally without virtualization.
   * - `maxItems` (default: undefined): The maximum number of rows to render. When undefined, all visible rows are rendered.
   * @type {undefined | boolean | { itemHeight?: number, maxVisibleRows?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number }}
   */
  export let virtualize = undefined;

  /**
   * Obtain a reference to the table wrapper element. When virtualization is enabled and `stickyHeader` is false, this element is the scroll container—use `bind:scrollContainerRef` to programmatically control scroll position (e.g. `scrollContainerRef.scrollTop = 0`).
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let scrollContainerRef = null;

  /**
   * Override the default table header translation ids.
   * @type {(id: import("./TableHeader.svelte").TableHeaderTranslationId) => string}
   */
  export let tableHeaderTranslateWithId = undefined;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import InlineCheckbox from "../Checkbox/InlineCheckbox.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import RadioButton from "../RadioButton/RadioButton.svelte";
  import { virtualize as virtualizeUtil } from "../utils/virtualize.js";
  import {
    compareValues,
    createColumnFilterPredicate,
    formatHeaderWidth,
    getDisplayedRows,
    isColumnFilterActive,
    resolvePath,
    shouldIgnoreRowClick,
  } from "./data-table-utils.js";
  import Table from "./Table.svelte";
  import TableBody from "./TableBody.svelte";
  import TableCell from "./TableCell.svelte";
  import TableContainer from "./TableContainer.svelte";
  import TableFoot from "./TableFoot.svelte";
  import TableHead from "./TableHead.svelte";
  import TableHeader from "./TableHeader.svelte";
  import TableRow from "./TableRow.svelte";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<Row["id"]>>}
   */
  const batchSelectedIds = writable([]);
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<Row>>}
   */
  const tableRows = writable(rows);
  /**
   * Exposes the table size to slotted content (e.g. `Toolbar`)
   * so it can derive a matching size unless explicitly overridden.
   * @type {import("svelte/store").Writable<"compact" | "short" | "medium" | "tall" | undefined>}
   */
  const tableSize = writable(size);
  $: $tableSize = size;

  /** Default row heights based on size variant */
  const DEFAULT_ROW_HEIGHTS = {
    compact: 24,
    short: 32,
    medium: 48,
    tall: 64,
  };

  const expandIconProps = {
    "aria-hidden": "true",
    class: "bx--table-expand__svg",
  };

  let tableBodyScrollTop = 0;
  let prevExpandedRowIds = [];
  let tableRef = null;
  let scrollListenerCleanup = null;

  // Clean up scroll listener when virtualization or sticky header is disabled
  $: if ((!virtualConfig || !stickyHeader) && scrollListenerCleanup) {
    scrollListenerCleanup();
    scrollListenerCleanup = null;
  }

  // Set up scroll listener for sticky header container
  $: if (
    virtualConfig &&
    stickyHeader &&
    tableRef &&
    calculatedContainerHeight
  ) {
    if (scrollListenerCleanup) {
      scrollListenerCleanup();
      scrollListenerCleanup = null;
    }
    const container = tableRef;
    container.style.maxHeight = `${calculatedContainerHeight}px`;
    container.style.overflowY = "auto";
    function handleScroll() {
      tableBodyScrollTop = container.scrollTop || 0;
    }
    container.addEventListener("scroll", handleScroll, { passive: true });
    scrollListenerCleanup = () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }

  onMount(() => {
    return () => {
      if (scrollListenerCleanup) scrollListenerCleanup();
    };
  });

  // Internal ID prefix for radio buttons, checkboxes, etc.
  // since there may be multiple `DataTable` instances that have overlapping row ids.
  const id = `ccs-${Math.random().toString(36)}`;

  // Label the table with its title/description. Only when the default
  // heading markup renders (not overridden via the titleChildren /
  // descriptionChildren slots, whose custom markup we don't control ids for).
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  $: hasTitle = !!title && !$$slots.titleChildren;
  $: hasDescription = !!description && !$$slots.descriptionChildren;

  // A columnHidden header stays in `headers`, the column definition, and is
  // skipped everywhere the rendered column set is meant.
  $: visibleHeaders = headers.filter((header) => !header.columnHidden);

  // Store a copy of the original rows for filter restoration.
  let prevRows_ref = rows;
  let originalRows = [...rows];
  // Row ids that match the active filter. In "hide" mode this toggles `hidden` on rows
  // instead of shrinking `tableRows`.
  let matchedRowIdsSet = new Set(originalRows.map((row) => row.id));
  // Last search applied via `filterRows`, replayed when `rows` changes so
  // an active search is not silently dropped on row reassignment.
  let lastSearchValue = "";
  let lastCustomFilter = undefined;
  // Column filters as of the last pass, so that assigning `filters` from within an
  // `on:filter` handler cannot loop. Compared by value rather than by reference: a
  // control bound to `filters.someKey` mutates the map in place.
  let appliedFilters = snapshotFilters(filters);

  /**
   * @type {(source: Record<string, DataTableValue>) => Record<string, DataTableValue>}
   */
  function snapshotFilters(source) {
    const snapshot = {};
    for (const [key, value] of Object.entries(source ?? {})) {
      snapshot[key] = Array.isArray(value) ? [...value] : value;
    }
    return snapshot;
  }

  /**
   * @type {(a: DataTableValue, b: DataTableValue) => boolean}
   */
  function filterValuesEqual(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((value, i) => value === b[i]);
    }
    return a === b;
  }

  /**
   * Keys whose filter value differs from the last applied pass.
   * @type {(next: Record<string, DataTableValue>) => string[]}
   */
  function getChangedFilterKeys(next) {
    const changed = [];
    const keys = new Set([
      ...Object.keys(next),
      ...Object.keys(appliedFilters),
    ]);

    for (const key of keys) {
      if (!filterValuesEqual(next[key], appliedFilters[key])) {
        changed.push(key);
      }
    }

    return changed;
  }

  /**
   * Active column filters paired with their resolved predicates.
   * @type {() => Array<{ key: string; predicate: (cellValue: DataTableValue, row: Row) => boolean }>}
   */
  function getActiveColumnFilters() {
    const active = [];
    /** @type {Map<string, DataTableHeader<Row>> | null} */
    let headersByKey = null;

    for (const [key, filterValue] of Object.entries(filters ?? {})) {
      if (!isColumnFilterActive(filterValue)) continue;
      if (headersByKey === null) {
        headersByKey = new Map(headers.map((header) => [header.key, header]));
      }
      active.push({
        key,
        predicate: createColumnFilterPredicate(
          filterValue,
          headersByKey.get(key)?.filter,
        ),
      });
    }

    return active;
  }

  /**
   * Recompute the matched rows from `originalRows` using the stored search state and
   * the active column filters, which combine with `AND`. "hide" mode keeps every row
   * in `tableRows` and lets `matchedRowIdsSet` carry the truth; otherwise the
   * rendered set shrinks to the matches.
   * @type {() => ReadonlyArray<Row["id"]>}
   */
  function applyFilters() {
    const searchValue = String(lastSearchValue ?? "")
      .trim()
      .toLowerCase();
    const activeColumnFilters = getActiveColumnFilters();
    let filteredRows = originalRows;

    if (searchValue.length > 0) {
      if (typeof lastCustomFilter === "function") {
        filteredRows = filteredRows.filter((row) =>
          lastCustomFilter(row, searchValue),
        );
      } else {
        // Get searchable keys from headers (non-empty headers with keys).
        // Hidden columns are excluded: matching on a column the user cannot
        // see produces results they cannot explain.
        const searchableKeys = visibleHeaders
          .filter((header) => !header.empty && header.key)
          .map((header) => header.key);

        // Default filter checks fields defined in headers
        // for a basic, case-insensitive match (non-fuzzy).
        // This supports nested keys like "contact.company".
        filteredRows = filteredRows.filter((row) =>
          searchableKeys.some((searchKey) => {
            const cellValue = resolvePath(row, searchKey);
            if (
              typeof cellValue === "string" ||
              typeof cellValue === "number"
            ) {
              return `${cellValue}`.toLowerCase().includes(searchValue);
            }
            return false;
          }),
        );
      }
    }

    if (activeColumnFilters.length > 0) {
      filteredRows = filteredRows.filter((row) =>
        activeColumnFilters.every(({ key, predicate }) =>
          predicate(resolvePath(row, key), row),
        ),
      );
    }

    const ids = filteredRows.map((row) => row.id);
    matchedRowIdsSet = new Set(ids);
    filteredRowIds = ids;
    tableRows.set(hideMode ? originalRows : filteredRows);
    return ids;
  }

  /**
   * Record the search state from `ToolbarSearch` and recompute the matched rows.
   * @type {(searchValue: string, customFilter?: (row: Row, value: string) => boolean) => ReadonlyArray<Row["id"]>}
   */
  function filterRows(searchValue, customFilter) {
    lastSearchValue = searchValue;
    lastCustomFilter = customFilter;
    return applyFilters();
  }

  /**
   * Dispatch the cancelable `filter` event, then filter client side unless the
   * consumer cancelled. Mirrors the `sort` dispatch: compute the next state, dispatch,
   * and only apply when the dispatch returns truthy.
   * @type {(next: Record<string, DataTableValue>) => void}
   */
  function syncColumnFilters(next) {
    const changedKeys = getChangedFilterKeys(next);
    if (changedKeys.length === 0) return;

    // Record the change before dispatching so a handler that assigns `filters`
    // is treated as a new change instead of re-entering this one.
    appliedFilters = snapshotFilters(next);
    const key = changedKeys.length === 1 ? changedKeys[0] : null;
    const applyFilter = dispatch(
      "filter",
      { key, value: key === null ? null : next[key], filters: next },
      { cancelable: true },
    );

    if (applyFilter) applyFilters();
  }

  // Seed `filteredRowIds` and apply any column filters passed at mount.
  applyFilters();

  $: syncColumnFilters(filters ?? {});

  $: if (rows !== prevRows_ref) {
    originalRows = [...rows];
    prevRows_ref = rows;
    applyFilters();
  }

  // Replay the active filter when the strategy flips so the rendered set and the
  // matched ids stay consistent (for example switching to "remove" must re-shrink
  // `tableRows`, and switching to "hide" must restore the full mounted set).
  let prevHideModeRef = hideMode;
  $: if (hideMode !== prevHideModeRef) {
    prevHideModeRef = hideMode;
    applyFilters();
  }

  /**
   * @type {() => void}
   */
  function resetSelectedRowIds() {
    selectAll = false;
    selectedRowIds = [];
    lastSelectedRowId = null;
  }

  /** Anchor row id for shift+click range selection; cleared when the anchor no longer exists in the current row order. */
  let lastSelectedRowId = null;

  /**
   * Apply `checked` to every selectable row between the anchor row and `targetIndex` (inclusive),
   * where `targetIndex` is a position in `rowsToVirtualize`. Returns `false` if the anchor row
   * is no longer present (for example, filtered out), so the caller can fall back to a single toggle.
   * @type {(targetIndex: number, checked: boolean) => boolean}
   */
  function selectRowRange(targetIndex, checked) {
    const anchorIndex = rowsToVirtualize.findIndex(
      (row) => row.id === lastSelectedRowId,
    );
    if (anchorIndex === -1) return false;

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);
    const next = new Set(selectedRowIds);
    for (const row of rowsToVirtualize.slice(start, end + 1)) {
      if (nonSelectableRowIdsSet.has(row.id)) continue;
      if (checked) {
        next.add(row.id);
      } else {
        next.delete(row.id);
      }
    }
    selectedRowIds = [...next];
    return true;
  }

  setContext("carbon:DataTable", {
    batchSelectedIds,
    tableRows,
    tableSize,
    resetSelectedRowIds,
    filterRows,
    refreshRow,
    refreshCells,
  });

  let expanded = false;
  let parentRowId = null;

  $: expandedRowIdsSet = new Set(expandedRowIds);

  let prevBatchSelected = [];
  $: if (
    prevBatchSelected.length !== selectedRowIds.length ||
    selectedRowIds.some((id, i) => id !== prevBatchSelected[i])
  ) {
    prevBatchSelected = selectedRowIds;
    batchSelectedIds.set(selectedRowIds);
  }
  // In "hide" mode `tableRows` holds every row; selection, "select all", and the empty
  // state must reflect only the rows matching the active filter.
  $: matchedRows = hideMode
    ? $tableRows.filter((row) => matchedRowIdsSet.has(row.id))
    : $tableRows;
  $: rowIds = matchedRows.map((row) => row.id);

  // Use Sets for faster row lookups.
  $: selectedRowIdsSet = new Set(selectedRowIds);
  $: highlightedRowIdsSet = new Set(highlightedRowIds);
  $: nonSelectableRowIdsSet = new Set(nonSelectableRowIds);
  $: nonExpandableRowIdsSet = new Set(nonExpandableRowIds);

  $: expandableRowIds = rowIds.filter((id) => !nonExpandableRowIdsSet.has(id));
  $: selectableRowIds = rowIds.filter((id) => !nonSelectableRowIdsSet.has(id));
  $: selectAll =
    selectableRowIds.length > 0 &&
    selectedRowIds.length === selectableRowIds.length;
  $: indeterminate =
    selectedRowIds.length > 0 &&
    selectedRowIds.length < selectableRowIds.length;
  $: if (batchExpansion) {
    expandable = true;
    expanded = expandedRowIds.length === expandableRowIds.length;
  }
  $: if (radio || batchSelection) selectable = true;

  let tableCellsByRowId = {};
  let prevRows;
  let prevVisibleHeaders;

  const alignClasses = {
    start: "bx--table-column--align-start",
    end: "bx--table-column--align-end",
  };

  function formatAlignClass(columnAlign) {
    return alignClasses[columnAlign];
  }

  /** Build cell objects for one row. Always new objects so `display` columns re-run. */
  function computeRowCells(row) {
    const cells = [];

    // Index into `headers` rather than the visible subset so hiding a preceding
    // column does not renumber the generated keys the `{#each}` blocks key on.
    headers.forEach((header, index) => {
      if (header.columnHidden) return;
      cells.push({
        key: header.key ?? `key-${index}`,
        value: header.key ? resolvePath(row, header.key) : undefined,
        display: header.display,
        empty: header.empty,
        columnMenu: header.columnMenu,
        columnAlign: header.columnAlign,
      });
    });

    return cells;
  }

  /**
   * Rebuild cells for a single row after an in-place edit to `rows`.
   * @type {(id: Row["id"]) => void}
   * @example
   * ```svelte
   * <DataTable bind:this={dataTable} {headers} {rows} />
   * <NumberInput min={0} bind:value={row.qty} on:input={() => dataTable.refreshRow(row.id)} />
   * ```
   */
  export function refreshRow(id) {
    const row = rows.find((row) => row.id === id);
    if (!row) return;
    tableCellsByRowId = {
      ...tableCellsByRowId,
      [id]: computeRowCells(row),
    };
  }

  /**
   * Rebuild cells for every row after batch in-place edits to `rows`.
   * @type {() => void}
   * @example
   * ```svelte
   * <DataTable bind:this={dataTable} {headers} {rows} />
   * <button on:click={() => dataTable.refreshCells()}>Refresh table</button>
   * ```
   */
  export function refreshCells() {
    const next = {};
    for (const row of rows) next[row.id] = computeRowCells(row);
    tableCellsByRowId = next;
  }

  // Compare against `visibleHeaders`, not `headers`: it is a fresh array on every
  // `headers` invalidation, so toggling `columnHidden` in place still rebuilds the cells.
  $: if (rows !== prevRows || visibleHeaders !== prevVisibleHeaders) {
    const next = {};

    for (const row of rows) {
      const prevCells = tableCellsByRowId[row.id];
      const newCells = computeRowCells(row);

      if (prevCells && prevCells.length === newCells.length) {
        let allEqual = true;
        for (let i = 0; i < newCells.length; i++) {
          const a = prevCells[i];
          const b = newCells[i];
          if (
            a.key === b.key &&
            a.value === b.value &&
            a.display === b.display &&
            a.empty === b.empty &&
            a.columnMenu === b.columnMenu &&
            a.columnAlign === b.columnAlign
          ) {
            newCells[i] = a;
          } else {
            allEqual = false;
          }
        }
        next[row.id] = allEqual ? prevCells : newCells;
      } else {
        next[row.id] = newCells;
      }
    }

    tableCellsByRowId = next;
    prevRows = rows;
    prevVisibleHeaders = visibleHeaders;
  }

  $: ascending = sortDirection === "ascending";
  $: sorting = sortable && sortKey != null;
  $: sortingHeader = headers.find((header) => header.key === sortKey);
  $: sortedRows =
    sorting && sortDirection !== "none"
      ? [...$tableRows].sort((a, b) => {
          const itemA = resolvePath(a, sortKey);
          const itemB = resolvePath(b, sortKey);
          const headerSort = sortingHeader?.sort;

          if (headerSort) {
            return compareValues(itemA, itemB, ascending, headerSort);
          }

          if (sort) {
            const result = sort(itemA, itemB, {
              key: sortKey,
              ascending,
              row_a: a,
              row_b: b,
            });
            return ascending ? result : -result;
          }
          return compareValues(itemA, itemB, ascending);
        })
      : $tableRows;
  $: defaultRowHeight = DEFAULT_ROW_HEIGHTS[size] || DEFAULT_ROW_HEIGHTS.medium;
  $: virtualConfig = virtualize
    ? {
        itemHeight: defaultRowHeight,
        maxVisibleRows: 10,
        containerHeight: undefined,
        overscan: 3,
        threshold: 100,
        maxItems: undefined,
        ...(typeof virtualize === "object" ? virtualize : {}),
      }
    : null;

  // "hide" filtering keeps every row mounted; it is incompatible with strategies that
  // already render a bounded subset (pagination, virtualization), so fall back to
  // "remove" when either is active.
  $: hideMode = filterMode === "hide" && !virtualConfig && !(pageSize > 0);

  $: calculatedContainerHeight = virtualConfig
    ? (virtualConfig.containerHeight ??
      virtualConfig.itemHeight * virtualConfig.maxVisibleRows)
    : null;

  $: virtualScrollContainer = virtualConfig && !stickyHeader;

  // Ignore pagination when virtualization is enabled.
  $: displayedRows = virtualConfig
    ? $tableRows
    : getDisplayedRows($tableRows, page, pageSize);
  $: displayedSortedRows = virtualConfig
    ? sortedRows
    : getDisplayedRows(sortedRows, page, pageSize);

  $: rowsToVirtualize = sorting ? displayedSortedRows : displayedRows;
  $: virtualData = virtualConfig
    ? virtualizeUtil({
        items: rowsToVirtualize,
        scrollTop: tableBodyScrollTop,
        itemHeight: virtualConfig.itemHeight,
        containerHeight: calculatedContainerHeight,
        overscan: virtualConfig.overscan,
        threshold: virtualConfig.threshold,
        maxItems: virtualConfig.maxItems,
      })
    : null;

  // Recalculate virtual data when expanded rows change
  $: if (virtualConfig && prevExpandedRowIds.length !== expandedRowIds.length) {
    prevExpandedRowIds = [...expandedRowIds];
    tick().then(() => {
      const scrollContainer = stickyHeader ? tableRef : scrollContainerRef;
      if (scrollContainer) {
        tableBodyScrollTop = scrollContainer.scrollTop || 0;
      }
    });
  }

  $: rowsToRender = virtualData?.isVirtualized
    ? virtualData.visibleItems
    : rowsToVirtualize;

  // In "hide" mode hidden rows still occupy `:nth-child` positions, which breaks
  // Carbon's CSS zebra striping. Recompute parity over the visible (matched) rows and
  // drive striping with a data attribute the stylesheet keys off instead.
  $: zebraVisibleEvenIds =
    hideMode && zebra
      ? (() => {
          const set = new Set();
          let visibleIndex = 0;
          for (const row of rowsToRender) {
            if (!matchedRowIdsSet.has(row.id)) continue;
            visibleIndex += 1;
            if (visibleIndex % 2 === 0) set.add(row.id);
          }
          return set;
        })()
      : null;

  $: hasCustomHeaderWidth = visibleHeaders.some(
    (header) => header.width ?? header.minWidth,
  );

  // Calculate total columns for spacer rows and expanded row cells
  $: totalColumns =
    (expandable ? 1 : 0) + (selectable ? 1 : 0) + visibleHeaders.length;
</script>

<TableContainer {useStaticWidth} {...$$restProps}>
  {#if title || $$slots.titleChildren || description || $$slots.descriptionChildren}
    <div class:bx--data-table-header={true}>
      {#if title || $$slots.titleChildren}
        <slot
          name="titleChildren"
          props={{ class: "bx--data-table-header__title" }}
        >
          <h4 id={titleId} class:bx--data-table-header__title={true}>
            {title}
          </h4>
        </slot>
      {/if}
      {#if description || $$slots.descriptionChildren}
        <slot
          name="descriptionChildren"
          props={{ class: "bx--data-table-header__description" }}
        >
          <p id={descriptionId} class:bx--data-table-header__description={true}>
            {description}
          </p>
        </slot>
      {/if}
    </div>
  {/if}
  <slot />
  <div
    bind:this={scrollContainerRef}
    style:max-height={virtualScrollContainer
      ? `${calculatedContainerHeight}px`
      : undefined}
    style:overflow-y={virtualScrollContainer ? "auto" : undefined}
    on:scroll={virtualScrollContainer
      ? (event) => { tableBodyScrollTop = event.target.scrollTop || 0; }
      : undefined}
  >
    <Table
      bind:ref={tableRef}
      zebra={zebra && !hideMode}
      {size}
      {stickyHeader}
      {sortable}
      {useStaticWidth}
      labelledBy={hasTitle ? titleId : undefined}
      describedBy={hasDescription ? descriptionId : undefined}
      tableStyle={[
        hasCustomHeaderWidth && "table-layout: fixed",
        stickyHeader &&
          stickyHeaderMaxHeight != null &&
          `max-height: ${typeof stickyHeaderMaxHeight === "number" ? `${stickyHeaderMaxHeight}px` : stickyHeaderMaxHeight}`,
      ]
        .filter(Boolean)
        .join("; ") || undefined}
    >
      <TableHead
        style={virtualScrollContainer
          ? "position: sticky; top: 0;"
          : undefined}
      >
        <TableRow>
          {#if expandable}
            <th
              scope="col"
              id="{id}-expand"
              class:bx--table-expand={true}
              data-previous-value={expanded ? "collapsed" : undefined}
            >
              {#if batchExpansion}
                <button
                  type="button"
                  class:bx--table-expand__button={true}
                  aria-label={expanded
                    ? "Collapse all rows"
                    : "Expand all rows"}
                  aria-expanded={expanded}
                  aria-controls={expandableRowIds
                    .map((rid) => `${id}-expandable-row-${rid}`)
                    .join(" ")}
                  on:click={() => {
                    expanded = !expanded;
                    expandedRowIds = expanded ? expandableRowIds : [];

                    dispatch("click:header--expand", { expanded });
                  }}
                >
                  <slot
                    name="expandIcon"
                    {expanded}
                    row={undefined}
                    props={expandIconProps}
                  >
                    <ChevronRight {...expandIconProps} />
                  </slot>
                </button>
              {:else}
                <span class:bx--visually-hidden={true}>Expand rows</span>
              {/if}
            </th>
          {/if}
          {#if selectable && !batchSelection}
            <th scope="col">
              <span class:bx--visually-hidden={true}>Select row</span>
            </th>
          {/if}
          {#if batchSelection && !radio}
            <th scope="col" class:bx--table-column-checkbox={true}>
              <InlineCheckbox
                aria-label="Select all rows"
                name="{id}-select-all"
                value="all"
                checked={selectAll}
                {indeterminate}
                on:change={(event) => {
                  dispatch("click:header--select", {
                    indeterminate,
                    selected: !indeterminate && event.target.checked,
                  });

                  if (indeterminate) {
                    event.target.checked = false;
                    selectAll = false;
                    selectedRowIds = [];
                    return;
                  }

                  if (event.target.checked) {
                    selectedRowIds = selectableRowIds;
                  } else {
                    selectedRowIds = [];
                  }
                }}
              />
            </th>
          {/if}
          {#each visibleHeaders as header (header.key)}
            {#if header.empty}
              {#if header.columnMenu}
                <th
                  scope="col"
                  class:bx--table-column-menu={true}
                  style={formatHeaderWidth(header)}
                ></th>
              {:else}
                <th scope="col" style={formatHeaderWidth(header)}>
                  <div class:bx--table-header-label={true}></div>
                </th>
              {/if}
            {:else}
              <TableHeader
                id="{id}-{header.key}"
                class={formatAlignClass(header.columnAlign)}
                style={formatHeaderWidth(header)}
                sortable={sortable && header.sort !== false}
                sortDirection={sortKey === header.key ? sortDirection : "none"}
                active={sortKey === header.key}
                {...(tableHeaderTranslateWithId
                  ? { translateWithId: tableHeaderTranslateWithId }
                  : {})}
                on:click={(event) => {
                  dispatch("click", { header });

                  if (header.sort === false) {
                    dispatch("click:header", {
                      header,
                      target: event.target,
                      currentTarget: event.currentTarget,
                    });
                  } else {
                    const currentSortDirection =
                      sortKey === header.key ? sortDirection : "none";
                    const effectiveSortAlways =
                      header.sortAlways ?? sortAlways;
                    const sortDirectionMap = effectiveSortAlways
                      ? {
                          none: "ascending",
                          ascending: "descending",
                          descending: "ascending",
                        }
                      : {
                          none: "ascending",
                          ascending: "descending",
                          descending: "none",
                        };
                    const nextSortDirection =
                      sortDirectionMap[currentSortDirection];
                    const nextSortKey =
                      nextSortDirection === "none"
                        ? null
                        : header.key;
                    const applySort = dispatch(
                      "sort",
                      { key: nextSortKey, direction: nextSortDirection },
                      { cancelable: true },
                    );
                    if (applySort) {
                      sortDirection = nextSortDirection;
                      sortKey = nextSortKey;
                    }
                    dispatch("click:header", {
                      header,
                      sortDirection: nextSortDirection,
                      target: event.target,
                      currentTarget: event.currentTarget,
                    });
                  }
                }}
              >
                <slot name="cellHeader" {header}>{header.value}</slot>
              </TableHeader>
            {/if}
          {/each}
        </TableRow>
      </TableHead>
      <TableBody>
        {#if virtualData?.isVirtualized}
          <!-- Spacer row for offset -->
          {#if virtualData.startIndex > 0}
            <tr style:height="{virtualData.offsetY}px">
              <td colspan={totalColumns}></td>
            </tr>
          {/if}

          <!-- Visible rows -->
          {#each rowsToRender as row, index (row.id)}
            {@const actualIndex = virtualData.startIndex + index}
            {@const isSelected = selectedRowIdsSet.has(row.id)}
            {@const isExpanded = expandedRowIdsSet.has(row.id)}
            {@const isHighlighted = highlightedRowIdsSet.has(row.id)}
            {@const rowClassValue =
              typeof rowClass === "function"
                ? rowClass({ row, rowIndex: actualIndex, selected: isSelected, expanded: isExpanded })
                : rowClass}
            <TableRow
              data-row={row.id}
              data-parent-row={expandable ? true : undefined}
              class="{isSelected
                ? 'bx--data-table--selected'
                : ''} {isExpanded ? 'bx--expandable-row' : ''} {expandable ? 'bx--parent-row' : ''} {expandable &&
              parentRowId === row.id
                ? 'bx--expandable-row--hover'
                : ''} {isHighlighted ? 'bx--data-table--highlighted-row' : ''} {rowClassValue ?? ''}"
              on:click={(event) => {
                // forgo "click", "click:row" events if target
                // resembles an overflow menu, a checkbox, or radio button
                if (shouldIgnoreRowClick(event.target)) {
                  return;
                }
                dispatch("click", { row });
                dispatch("click:row", {
                  row,
                  target: event.target,
                  currentTarget: event.currentTarget,
                });
              }}
              on:mouseenter={() => {
                dispatch("mouseenter:row", row);
              }}
              on:mouseleave={() => {
                dispatch("mouseleave:row", row);
              }}
            >
              {#if expandable}
                <TableCell
                  class="bx--table-expand"
                  headers="{id}-expand"
                  data-previous-value={!nonExpandableRowIdsSet.has(row.id) &&
                  expandedRowIdsSet.has(row.id)
                    ? "collapsed"
                    : undefined}
                >
                  {#if !nonExpandableRowIdsSet.has(row.id)}
                    <button
                      type="button"
                      class:bx--table-expand__button={true}
                      aria-controls="{id}-expandable-row-{row.id}"
                      aria-label={expandedRowIdsSet.has(row.id)
                        ? "Collapse current row"
                        : "Expand current row"}
                      aria-expanded={expandedRowIdsSet.has(row.id)}
                      on:click|stopPropagation={() => {
                        const rowExpanded = expandedRowIdsSet.has(row.id);

                        expandedRowIds = rowExpanded
                          ? expandedRowIds.filter((id) => id !== row.id)
                          : [...expandedRowIds, row.id];

                        dispatch("click:row--expand", {
                          row,
                          expanded: !rowExpanded,
                        });
                      }}
                    >
                      <slot
                        name="expandIcon"
                        expanded={expandedRowIdsSet.has(row.id)}
                        {row}
                        props={expandIconProps}
                      >
                        <ChevronRight {...expandIconProps} />
                      </slot>
                    </button>
                  {/if}
                </TableCell>
              {/if}
              {#if selectable}
                <td
                  class:bx--table-column-checkbox={true}
                  class:bx--table-column-radio={radio}
                >
                  {#if !nonSelectableRowIdsSet.has(row.id)}
                    {@const inputId = `${id}-${row.id}`}
                    {#if radio}
                      <RadioButton
                        id={inputId}
                        name={inputName}
                        checked={selectedRowIdsSet.has(row.id)}
                        value={row.id}
                        on:change={() => {
                          selectedRowIds = [row.id];
                          dispatch("click:row--select", {
                            row,
                            selected: true,
                          });
                        }}
                      />
                    {:else}
                      <InlineCheckbox
                        id={inputId}
                        name={inputName}
                        aria-label="Select row"
                        checked={selectedRowIdsSet.has(row.id)}
                        value={row.id}
                        on:click={(event) => {
                          const checked = event.target.checked;
                          const usedRange =
                            event.shiftKey &&
                            lastSelectedRowId !== null &&
                            selectRowRange(actualIndex, checked);

                          if (!usedRange) {
                            const next = new Set(selectedRowIds);
                            if (checked) {
                              next.add(row.id);
                            } else {
                              next.delete(row.id);
                            }
                            selectedRowIds = [...next];
                          }

                          lastSelectedRowId = row.id;
                          dispatch("click:row--select", { row, selected: checked });
                        }}
                      />
                    {/if}
                  {/if}
                </td>
              {/if}
              {#each tableCellsByRowId[row.id] as cell, j (cell.key)}
                {#if cell.empty}
                  <td
                    class={formatAlignClass(cell.columnAlign)}
                    class:bx--table-column-menu={cell.columnMenu}
                  >
                    <slot
                      name="cell"
                      {row}
                      {cell}
                      rowIndex={actualIndex}
                      cellIndex={j}
                      rowSelected={isSelected}
                      rowExpanded={isExpanded}
                    >
                      {cell.display
                        ? cell.display(cell.value, row)
                        : cell.value}
                    </slot>
                  </td>
                {:else}
                  <TableCell
                    class={formatAlignClass(cell.columnAlign)}
                    headers="{id}-{cell.key}"
                    on:click={(event) => {
                      dispatch("click", { row, cell });
                      dispatch("click:cell", {
                        cell,
                        target: event.target,
                        currentTarget: event.currentTarget,
                      });
                    }}
                  >
                    <slot
                      name="cell"
                      {row}
                      {cell}
                      rowIndex={actualIndex}
                      cellIndex={j}
                      rowSelected={isSelected}
                      rowExpanded={isExpanded}
                    >
                      {cell.display
                        ? cell.display(cell.value, row)
                        : cell.value}
                    </slot>
                  </TableCell>
                {/if}
              {/each}
            </TableRow>

            {#if expandable}
              <tr
                id="{id}-expandable-row-{row.id}"
                data-child-row
                class:bx--expandable-row={true}
                on:mouseenter={() => {
                  if (nonExpandableRowIdsSet.has(row.id)) return;
                  parentRowId = row.id;
                }}
                on:mouseleave={() => {
                  if (nonExpandableRowIdsSet.has(row.id)) return;
                  parentRowId = null;
                }}
              >
                {#if expandedRowIdsSet.has(row.id) &&
                !nonExpandableRowIdsSet.has(row.id)}
                  <TableCell colspan={totalColumns}>
                    <div class:bx--child-row-inner-container={true}>
                      <slot
                        name="expandedRow"
                        {row}
                        rowSelected={selectedRowIdsSet.has(row.id)}
                      />
                    </div>
                  </TableCell>
                {/if}
              </tr>
            {/if}
          {/each}

          <!-- Spacer row for remaining height -->
          {#if virtualData.endIndex < rowsToVirtualize.length}
            {@const remainingHeight =
              virtualData.totalHeight -
              virtualData.endIndex * virtualConfig.itemHeight}
            <tr style:height="{remainingHeight}px">
              <td colspan={totalColumns}></td>
            </tr>
          {/if}
        {:else}
          <!-- Non-virtualized: render all rows normally -->
          {#each rowsToRender as row, index (row.id)}
            {@const isSelected = selectedRowIdsSet.has(row.id)}
            {@const isExpanded = expandedRowIdsSet.has(row.id)}
            {@const isExpandable = !nonExpandableRowIdsSet.has(row.id)}
            {@const isSelectable = !nonSelectableRowIdsSet.has(row.id)}
            {@const isHighlighted = highlightedRowIdsSet.has(row.id)}
            {@const rowClassValue =
              typeof rowClass === "function"
                ? rowClass({ row, rowIndex: index, selected: isSelected, expanded: isExpanded })
                : rowClass}
            <TableRow
              data-row={row.id}
              data-parent-row={expandable ? true : undefined}
              hidden={hideMode && !matchedRowIdsSet.has(row.id)
                ? true
                : undefined}
              data-zebra-even={zebraVisibleEvenIds?.has(row.id)
                ? ""
                : undefined}
              class="{isSelected
                ? 'bx--data-table--selected'
                : ''} {isExpanded ? 'bx--expandable-row' : ''} {expandable
                ? 'bx--parent-row'
                : ''} {expandable && parentRowId === row.id
                ? 'bx--expandable-row--hover'
                : ''} {isHighlighted ? 'bx--data-table--highlighted-row' : ''} {rowClassValue ?? ''}"
              on:click={(event) => {
                // forgo "click", "click:row" events if target
                // resembles an overflow menu, a checkbox, or radio button
                if (shouldIgnoreRowClick(event.target)) {
                  return;
                }
                dispatch("click", { row });
                dispatch("click:row", {
                  row,
                  target: event.target,
                  currentTarget: event.currentTarget,
                });
              }}
              on:mouseenter={() => {
                dispatch("mouseenter:row", row);
              }}
              on:mouseleave={() => {
                dispatch("mouseleave:row", row);
              }}
            >
              {#if expandable}
                <TableCell
                  class="bx--table-expand"
                  headers="{id}-expand"
                  data-previous-value={isExpandable && isExpanded
                    ? "collapsed"
                    : undefined}
                >
                  {#if isExpandable}
                    <button
                      type="button"
                      class:bx--table-expand__button={true}
                      aria-controls="{id}-expandable-row-{row.id}"
                      aria-label={isExpanded
                        ? "Collapse current row"
                        : "Expand current row"}
                      aria-expanded={isExpanded}
                      on:click|stopPropagation={() => {
                        const next = new Set(expandedRowIds);
                        if (isExpanded) next.delete(row.id);
                        else next.add(row.id);
                        expandedRowIds = [...next];

                        dispatch("click:row--expand", {
                          row,
                          expanded: !isExpanded,
                        });
                      }}
                    >
                      <slot
                        name="expandIcon"
                        expanded={isExpanded}
                        {row}
                        props={expandIconProps}
                      >
                        <ChevronRight {...expandIconProps} />
                      </slot>
                    </button>
                  {/if}
                </TableCell>
              {/if}
              {#if selectable}
                <td
                  class:bx--table-column-checkbox={true}
                  class:bx--table-column-radio={radio}
                >
                  {#if isSelectable}
                    {@const inputId = `${id}-${row.id}`}
                    {#if radio}
                      <RadioButton
                        id={inputId}
                        name={inputName}
                        checked={isSelected}
                        value={row.id}
                        on:change={() => {
                          selectedRowIds = [row.id];
                          dispatch("click:row--select", { row, selected: true });
                        }}
                      />
                    {:else}
                      <InlineCheckbox
                        id={inputId}
                        name={inputName}
                        aria-label="Select row"
                        checked={isSelected}
                        value={row.id}
                        on:click={(event) => {
                          const checked = event.target.checked;
                          const usedRange =
                            event.shiftKey &&
                            lastSelectedRowId !== null &&
                            selectRowRange(index, checked);

                          if (!usedRange) {
                            const next = new Set(selectedRowIds);
                            if (checked) {
                              next.add(row.id);
                            } else {
                              next.delete(row.id);
                            }
                            selectedRowIds = [...next];
                          }

                          lastSelectedRowId = row.id;
                          dispatch("click:row--select", { row, selected: checked });
                        }}
                      />
                    {/if}
                  {/if}
                </td>
              {/if}
              {#each tableCellsByRowId[row.id] as cell, j (cell.key)}
                {#if cell.empty}
                  <td
                    class={formatAlignClass(cell.columnAlign)}
                    class:bx--table-column-menu={cell.columnMenu}
                  >
                    <slot
                      name="cell"
                      {row}
                      {cell}
                      rowIndex={index}
                      cellIndex={j}
                      rowSelected={isSelected}
                      rowExpanded={isExpanded}
                    >
                      {cell.display ? cell.display(cell.value, row) : cell.value}
                    </slot>
                  </td>
                {:else}
                  <TableCell
                    class={formatAlignClass(cell.columnAlign)}
                    headers="{id}-{cell.key}"
                    on:click={(event) => {
                      dispatch("click", { row, cell });
                      dispatch("click:cell", {
                        cell,
                        target: event.target,
                        currentTarget: event.currentTarget,
                      });
                    }}
                  >
                    <slot
                      name="cell"
                      {row}
                      {cell}
                      rowIndex={index}
                      cellIndex={j}
                      rowSelected={isSelected}
                      rowExpanded={isExpanded}
                    >
                      {cell.display ? cell.display(cell.value, row) : cell.value}
                    </slot>
                  </TableCell>
                {/if}
              {/each}
            </TableRow>

            {#if expandable}
              <tr
                id="{id}-expandable-row-{row.id}"
                data-child-row
                hidden={hideMode && !matchedRowIdsSet.has(row.id)
                  ? true
                  : undefined}
                class:bx--expandable-row={true}
                on:mouseenter={() => {
                  if (!isExpandable) return;
                  parentRowId = row.id;
                }}
                on:mouseleave={() => {
                  if (!isExpandable) return;
                  parentRowId = null;
                }}
              >
                {#if isExpanded && isExpandable}
                  <TableCell colspan={totalColumns}>
                    <div class:bx--child-row-inner-container={true}>
                      <slot name="expandedRow" {row} rowSelected={isSelected} />
                    </div>
                  </TableCell>
                {/if}
              </tr>
            {/if}
          {/each}
        {/if}
      </TableBody>
      {#if $$slots.footerCell}
        <TableFoot>
          <TableRow>
            {#if expandable}
              <td aria-hidden="true" class:bx--table-expand={true}></td>
            {/if}
            {#if selectable}
              <td
                aria-hidden="true"
                class:bx--table-column-checkbox={true}
                class:bx--table-column-radio={radio}
              ></td>
            {/if}
            {#each headers as header, index (header.key)}
              <td>
                <slot name="footerCell" {header} {index} />
              </td>
            {/each}
          </TableRow>
        </TableFoot>
      {/if}
    </Table>
  </div>
</TableContainer>
