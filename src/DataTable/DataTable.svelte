<script context="module">
  import { deepEqual } from "../utils/deep-equal.js";
  import { formatPinnedClass } from "./data-table-utils.js";

  const alignClasses = {
    start: "bx--table-column--align-start",
    end: "bx--table-column--align-end",
  };

  /**
   * @param {string | undefined} columnAlign
   * @param {import("./data-table-utils.js").PinnedColumnLayout | undefined} pin
   */
  function formatColumnClass(columnAlign, pin) {
    return formatPinnedClass(pin, alignClasses[columnAlign]);
  }

  /**
   * Join class names, skipping empty values.
   * @param {...(string | undefined)} parts
   * @returns {string | undefined}
   */
  function joinClasses(...parts) {
    return parts.filter(Boolean).join(" ") || undefined;
  }

  /**
   * The layouts of the leading columns, in render order.
   * @param {null | Array<import("./data-table-utils.js").PinnedColumnLayout | undefined>} layouts
   * @param {boolean} decorator
   * @param {boolean} expand
   * @param {boolean} selection
   */
  function splitLeadingPins(layouts, decorator, expand, selection) {
    let index = 0;
    return {
      decorator: decorator ? layouts?.[index++] : undefined,
      expand: expand ? layouts?.[index++] : undefined,
      selection: selection ? layouts?.[index++] : undefined,
    };
  }

  // Declared widths for the first paint. The expand and selection columns
  // are 2.5rem in Carbon's CSS and the decorator column 1rem.
  const LEADING_COLUMN_WIDTHS = {
    decorator: "1rem",
    expand: "2.5rem",
    selection: "2.5rem",
  };

  /**
   * Whether `next` describes the same row values as `prev`. Unlike
   * `rowsEqual` (used by `ToolbarSearch`), a same-reference element does NOT
   * count as equal: `rowsEqual` short-circuits per element on `rowA ===
   * rowB`, so `rows[0].name = "x"; rows = [...rows]` (a legitimate in-place
   * edit copied into a new array) would read as unchanged even though row 0
   * moved. Here, only an array of entirely DIFFERENT objects that are each
   * value-equal to their predecessor counts as unchanged; any same-reference
   * element means it could have been mutated in place, so fall through and
   * redo the work, matching today's behavior.
   * @param {ReadonlyArray<{ id: any }>} prev
   * @param {ReadonlyArray<{ id: any }>} next
   * @returns {boolean}
   */
  function rowsUnchanged(prev, next) {
    if (prev === next) return true;
    if (prev.length !== next.length) return false;

    // Fast path: bail on the first id mismatch before paying for deep compares.
    for (let i = 0; i < prev.length; i++) {
      if (prev[i]?.id !== next[i]?.id) return false;
    }

    for (let i = 0; i < prev.length; i++) {
      if (prev[i] === next[i]) return false;
      if (!deepEqual(prev[i], next[i])) return false;
    }

    return true;
  }

  /**
   * Whether two cell records map the same row ids to the same cell arrays.
   * @param {Record<string, unknown>} a
   * @param {Record<string, unknown>} b
   */
  function sameCellRecords(a, b) {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    for (const key of keys) {
      if (a[key] !== b[key]) return false;
    }
    return true;
  }

  /**
   * @param {ReadonlyArray<{ id: any }> | undefined} a
   * @param {ReadonlyArray<{ id: any }> | undefined} b
   */
  function paintedRowListChanged(a, b) {
    if (a === b) return false;
    if (!a || !b || a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].id !== b[i].id) return true;
    }
    return false;
  }
</script>

<script>
  /**
   * @template {DataTableRow} [Row=DataTableRow]
   */

  /** @typedef {any} DataTableValue */

  /** @typedef {"expandAll" | "collapseAll" | "expandRow" | "collapseRow" | "expandColumn" | "selectAll" | "selectRow"} DataTableTranslationId */

  /**
   * @template [Id=any]
   * @typedef {{ id: Id; [key: string]: DataTableValue; }} DataTableRow
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {(
   *   [keyof import('./data-table-utils.d.ts').KeysWithoutIndexSignature<Row>] extends [never]
   *     ? import('./data-table-utils.d.ts').PropertyPath<Row>
   *     : keyof import('./data-table-utils.d.ts').KeysWithoutIndexSignature<Row> extends "id"
   *       ? import('./data-table-utils.d.ts').PropertyPath<Row>
   *       : Row extends DataTableRow
   *         ? import('./data-table-utils.d.ts').PropertyPathIgnoringIndexSignatures<Row>
   *         : import('./data-table-utils.d.ts').PropertyPath<Row>
   * )} DataTableKey Path keys for sort, headers, and cells; mirrors PropertyPath / PropertyPathIgnoringIndexSignatures in ./data-table-utils.d.ts.
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {import('./data-table-utils.d.ts').DataTableSortValue<Row>} DataTableSortValue
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {object} DataTableEmptyHeader
   * @property {DataTableKey<Row> | (string & {})} key
   * @property {true} empty - Whether the header is empty
   * @property {DataTableValue} [value] - Name of the column for screen readers. Visually hidden. Without it, the header has no accessible name.
   * @property {(item: DataTableValue, row: Row) => DataTableValue} [display]
   * @property {boolean | ((a: DataTableSortValue<Row>, b: DataTableSortValue<Row>) => number)} [sort] - `false` disables sorting for this column even when the table is sortable; `true` enables it even when the table is not; a comparator both enables sorting and provides it. Unset inherits the table-level `sortable`.
   * @property {boolean} [sortAlways] - Override table-level sortAlways for this column
   * @property {boolean} [columnMenu] - Whether the column menu is enabled
   * @property {boolean} [columnHidden] - Whether the column is skipped in render while remaining in `headers`
   * @property {string} [width]
   * @property {string} [minWidth]
   * @property {"start" | "end"} [columnAlign] - Horizontal alignment of the column header and cells. Logical, so `end` is the right edge in LTR and the left edge in RTL. Defaults to `"start"`.
   * @property {"start" | "end"} [columnPinned] - Keep the column in view while the table scrolls horizontally. Logical, so `start` is the left edge in LTR and the right edge in RTL. A pinned column renders at its edge wherever it sits in `headers`, in `headers` order within the edge. Give it a `width` so the first paint is right.
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {object} DataTableNonEmptyHeader
   * @property {DataTableKey<Row>} key
   * @property {false} [empty]
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: Row) => DataTableValue} [display]
   * @property {boolean | ((a: DataTableSortValue<Row>, b: DataTableSortValue<Row>) => number)} [sort] - `false` disables sorting for this column even when the table is sortable; `true` enables it even when the table is not; a comparator both enables sorting and provides it. Unset inherits the table-level `sortable`.
   * @property {boolean} [sortAlways] - Override table-level sortAlways for this column
   * @property {boolean} [columnMenu] - Whether the column menu is enabled
   * @property {boolean} [columnHidden] - Whether the column is skipped in render while remaining in `headers`
   * @property {string} [width]
   * @property {string} [minWidth]
   * @property {"start" | "end"} [columnAlign] - Horizontal alignment of the column header and cells. Logical, so `end` is the right edge in LTR and the left edge in RTL. Defaults to `"start"`.
   * @property {"start" | "end"} [columnPinned] - Keep the column in view while the table scrolls horizontally. Logical, so `start` is the left edge in LTR and the right edge in RTL. A pinned column renders at its edge wherever it sits in `headers`, in `headers` order within the edge. Give it a `width` so the first paint is right.
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {DataTableNonEmptyHeader<Row> | DataTableEmptyHeader<Row>} DataTableHeader
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {object} DataTableCell
   * @property {DataTableKey<Row> | (string & {})} key
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: DataTableRow) => DataTableValue} [display]
   */

  /**
   * @slot {{ expanded: boolean; row: Row | undefined; props: { "aria-hidden": "true" | "false"; class: string; }; }} expandIcon
   * @slot {{ row: Row; rowSelected: boolean; }} expandedRow
   * @slot {{ header: DataTableNonEmptyHeader<Row>; }} cellHeader
   * @slot {{ row: Row; cell: DataTableCell<Row>; rowIndex: number; cellIndex: number; rowSelected: boolean; rowExpanded: boolean; }} cell
   * @slot {{ header: DataTableHeader<Row>; index: number; }} footerCell
   * @slot {{ header: DataTableNonEmptyHeader<Row>; }} headerDecorator
   * @slot {{ row: Row; }} rowDecorator
   */

  /**
   * @event click
   * @type {object}
   * @property {DataTableHeader<Row>} [header]
   * @property {Row} [row]
   * @property {DataTableCell<Row>} [cell]
   */

  /**
   * @event click:header--expand
   * @type {object}
   * @property {boolean} expanded
   */

  /**
   * @event click:header
   * @type {object}
   * @property {DataTableHeader<Row>} header
   * @property {"ascending" | "descending" | "none"} [sortDirection] - The intended next sort direction for this click, reported regardless of whether the `sort` event was cancelled.
   * @property {EventTarget} target
   * @property {EventTarget} currentTarget
   */

  /**
   * @event click:header--select
   * @type {object}
   * @property {boolean} indeterminate
   * @property {boolean} selected
   */

  /**
   * @event click:row
   * @type {object}
   * @property {Row} row
   * @property {EventTarget} target
   * @property {EventTarget} currentTarget
   */

  /**
   * @event {Row} mouseenter:row
   * @event {Row} mouseleave:row
   */

  /**
   * @event click:row--expand
   * @type {object}
   * @property {boolean} expanded
   * @property {Row} row
   */

  /**
   * @event click:row--select
   * @type {object}
   * @property {boolean} selected
   * @property {Row} row
   */

  /**
   * @event {{ key: null; direction: "none" } | { key: DataTableKey<Row>; direction: "ascending" | "descending" }} sort - Dispatched when a sortable column header would change the active sort. The event is cancelable: call `preventDefault()` to skip updating `sortKey` / `sortDirection` and skip client side sorting for that click (for example full server side sorting while still reading `detail.key` / `detail.direction` for your API). If not cancelled, the table applies the new sort and sorts the current `rows` client side. Typical uses: server side sorting, URL or query string sync, analytics, and persisting sort preferences.
   * @property {DataTableKey<Row> | null} key - Proposed sort column (`header.key`), or `null` when the proposed `direction` is `none`.
   * @property {"ascending" | "descending" | "none"} direction - Proposed sort direction for this click (applied internally unless the event is cancelled).
   */

  /**
   * @event click:cell
   * @type {object}
   * @property {DataTableCell<Row>} cell
   * @property {EventTarget} target
   * @property {EventTarget} currentTarget
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {{ row: Row, rowIndex: number, selected: boolean, expanded: boolean }} DataTableRowClassArgs
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {string | ((row: DataTableRowClassArgs<Row>) => string | undefined)} DataTableRowClass
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {{ row: Row, cell: DataTableCell<Row>, rowIndex: number, cellIndex: number, selected: boolean, expanded: boolean }} DataTableCellClassArgs
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {string | ((args: DataTableCellClassArgs<Row>) => string | undefined)} DataTableCellClass
   */

  /** @restProps {div} */

  /**
   * Dispatched when the virtualized table body is scrolled near the bottom
   * (load-more signal). Not the browser's native `scrollend` (scroll stopped).
   * Only fires when `virtualize` is enabled.
   * @event {{ scrollTop: number; scrollHeight: number; clientHeight: number }} scrollend
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
   * Also accepts Carbon v11's row heights: `"xs"` (`"compact"`), `"sm"`
   * (`"short"`), `"md"` (`"medium"`), `"lg"` (the 48px default) and `"xl"`
   * (`"tall"`).
   * @type {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined}
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
   * @type {DataTableRowClass<Row> | undefined}
   */
  export let rowClass = undefined;

  /**
   * Set an id for the table container.
   * The title, description, header, cell and selection ids derive from it,
   * for example `{id}-title` and `{id}-{header.key}`.
   */
  export let id = uniqueId();

  /**
   * Provide a class name for every body cell, or a function
   * that returns one based on the row, cell, and row state.
   * @example
   * ```svelte
   * <DataTable cellClass={({ cell }) => cell.key === "status" && cell.value === "Failed" ? "cell-failed" : undefined} />
   * ```
   * @type {DataTableCellClass<Row> | undefined}
   */
  export let cellClass = undefined;

  /**
   * Specify a name attribute for the input elements
   * in a selectable data table (radio or checkbox).
   * When the table is inside a form, this name will
   * be included in the form data on submit.
   * Defaults to the table `id`.
   * @type {string | undefined}
   */
  export let inputName = undefined;

  /**
   * Specify the id of a form element outside the table to associate the
   * selection inputs with.
   * @type {string | undefined}
   */
  export let inputForm = undefined;

  /** Set to `true` to use zebra styles */
  export let zebra = false;

  /** Set to `true` for the sortable variant. Individual columns can opt out (or, if this is `false`, opt in) via `header.sort`. */
  export let sortable = false;

  /**
   * Specify the header key to sort by.
   * @type {DataTableKey<Row> | null}
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
   * @type {((a: DataTableSortValue<Row>, b: DataTableSortValue<Row>, context: { key: DataTableKey<Row>; ascending: boolean; row_a: Row; row_b: Row }) => number) | undefined}
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

  /**
   * Set to `true` for the radio selection variant.
   * Row selection is enabled regardless of `selectable`.
   */
  export let radio = false;

  /**
   * Set to `true` so clicking an already-selected `radio` row clears the
   * selection instead of leaving it selected. Only applies with `radio`.
   */
  export let allowDeselect = false;

  /**
   * Set to `true` for the selectable variant.
   * Shift-clicking a row checkbox extends selection to every row between it and the last row clicked (not supported with `radio`).
   * @bindable writable
   */
  export let selectable = false;

  /**
   * Set to `true` to enable batch selection.
   * Row selection is enabled regardless of `selectable`.
   */
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

  /**
   * Set to `true` to highlight the row and column of the cell under the
   * pointer, including the column's header. Use it on a grid of values read
   * across two axes, such as a timetable. Rows get
   * `bx--data-table--highlighted-row`, and the column's header and cells get
   * `bx--data-table--highlighted-column`.
   */
  export let crosshair = false;

  /**
   * Set to `true` to make the body cells keyboard navigable, as in a grid.
   * One cell is a tab stop; the arrow keys move between cells (`ArrowLeft`
   * and `ArrowRight` follow the text direction), `Home` and `End` go to the
   * ends of the row, and `Ctrl` with them to the ends of the table. The
   * table gets `role="grid"`. With `crosshair`, the focused cell drives the
   * cross. Use it for read-only values: an interactive control inside a
   * cell takes its own keys, so keep those cells out of a navigable table.
   */
  export let cellFocus = false;

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /**
   * Override the maximum height of the sticky header table, replacing the
   * default `300px`. Only applies when `stickyHeader` is `true`. Pass a number
   * (interpreted as `px`) or a CSS length string (e.g. `"100%"`, `"24rem"`).
   * @type {number | string | undefined}
   */
  export let stickyHeaderMaxHeight = undefined;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  /**
   * Set to `true` to use a fixed table layout, where a header's `width`/`minWidth`
   * is the column's exact rendered size instead of a floor that content can grow past.
   * Unset columns share the remaining space equally.
   */
  export let fixedLayout = false;

  /**
   * Set the filtering strategy used by `ToolbarSearch`.
   * - `"remove"`: remove non-matching rows from the DOM and recreate them when the
   *   filter clears.
   * - `"hide"`: keep all rows mounted and hide non-matching rows with the `hidden`
   *   attribute, preserving focus, inputs, and open menus.
   *
   * `"hide"` falls back to `"remove"` when `pageSize` is set or `virtualize` is enabled.
   *
   * Because `"hide"` keeps every row mounted, each keystroke re-renders all
   * rows, not just matching ones. For large row counts (hundreds or more),
   * prefer `"remove"`, pagination, or virtualization.
   * @type {"remove" | "hide"}
   */
  export let filterMode = "remove";

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
   * - `containerHeight` (default: calculated from maxVisibleRows): The maximum height in pixels of the table body container. If not provided and `stickyHeader` is `true` with a numeric `stickyHeaderMaxHeight`, that value is used instead so the virtual window matches the visible scroll area; otherwise calculated from `itemHeight * maxVisibleRows`. A string `stickyHeaderMaxHeight` (e.g. `"50vh"`) does not feed virtualization.
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
   * @type {((id: import("./TableHeader.svelte").TableHeaderTranslationId) => string) | undefined}
   */
  export let tableHeaderTranslateWithId = undefined;

  /**
   * Override the default translation ids for the expand and select controls.
   * @type {(id: DataTableTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  /**
   * Default translation ids.
   * @type {{ expandAll: "expandAll"; collapseAll: "collapseAll"; expandRow: "expandRow"; collapseRow: "collapseRow"; expandColumn: "expandColumn"; selectAll: "selectAll"; selectRow: "selectRow" }}
   */
  export const translationIds = {
    expandAll: "expandAll",
    collapseAll: "collapseAll",
    expandRow: "expandRow",
    collapseRow: "collapseRow",
    expandColumn: "expandColumn",
    selectAll: "selectAll",
    selectRow: "selectRow",
  };

  const defaultTranslations = {
    [translationIds.expandAll]: "Expand all rows",
    [translationIds.collapseAll]: "Collapse all rows",
    [translationIds.expandRow]: "Expand current row",
    [translationIds.collapseRow]: "Collapse current row",
    [translationIds.expandColumn]: "Expand rows",
    [translationIds.selectAll]: "Select all rows",
    [translationIds.selectRow]: "Select row",
  };

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import InlineCheckbox from "../Checkbox/InlineCheckbox.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { toCssLength } from "../utils/css-length.js";
  import { formReset } from "../utils/form-reset.js";
  import { forwardShiftClick } from "../utils/forward-shift-click.js";
  import { inlineKey } from "../utils/inline-direction.js";
  import { createScrollEndTracker } from "../utils/is-scroll-near-end.js";
  import { noop } from "../utils/noop.js";
  import { rangeSlice } from "../utils/range-slice.js";
  import { observeResize } from "../utils/shared-observer.js";
  import {
    DATA_TABLE_SIZE_ALIASES,
    normalizeSize,
  } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    DEFAULT_VIRTUAL_LIST_CONFIG,
    virtualize as virtualizeUtil,
  } from "../utils/virtualize.js";
  import Table from "./Table.svelte";
  import TableBody from "./TableBody.svelte";
  import TableContainer from "./TableContainer.svelte";
  import TableFoot from "./TableFoot.svelte";
  import TableHead from "./TableHead.svelte";
  import TableHeader from "./TableHeader.svelte";
  import TableRow from "./TableRow.svelte";
  import { findCellTarget } from "./cell-navigation.js";
  import {
    compareValues,
    computePinnedOffsets,
    formatColumnStyle,
    formatHeaderWidth,
    formatInsetStyle,
    getDisplayedRows,
    resolveColumnOrder,
    resolvePath,
    shouldIgnoreRowClick,
  } from "./data-table-utils.js";
  import { revealFocus } from "./reveal-focus.js";

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
  const tableSize = writable(normalizeSize(size, DATA_TABLE_SIZE_ALIASES));
  $: effectiveSize = normalizeSize(size, DATA_TABLE_SIZE_ALIASES);
  $: $tableSize = effectiveSize;

  /** Row heights per size variant, matching `bx--data-table--<size>` */
  const ROW_HEIGHTS = {
    compact: 24,
    short: 32,
    medium: 40,
    tall: 64,
  };

  /** Row height when `size` is unset */
  const DEFAULT_ROW_HEIGHT = 48;

  const expandIconProps = {
    "aria-hidden": "true",
    class: "bx--table-expand__svg",
  };

  let tableBodyScrollTop = 0;
  let prevExpandedRowIds = [];
  let tableRef = null;
  let scrollListenerCleanup = null;

  const scrollEndTracker = createScrollEndTracker();

  /**
   * Shared by the sticky-header `<table>` listener and the non-sticky
   * container's `on:scroll`, so `scrollend` rides the existing scroll
   * tracking instead of adding a second listener on the same element.
   * @param {Event} event
   */
  function handleScroll(event) {
    const target = /** @type {HTMLElement} */ (event.currentTarget);
    tableBodyScrollTop = target.scrollTop || 0;
    const detail = scrollEndTracker.observe({
      scrollTop: tableBodyScrollTop,
      scrollHeight: target.scrollHeight,
      clientHeight: target.clientHeight,
      itemCount: rowsToVirtualize.length,
    });
    if (detail) dispatch("scrollend", detail);
  }

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
    // When `stickyHeader` is true, `tableRef` is the wrapping `<section>`
    // (see Table.svelte); the `<table>` inside it is the element that
    // actually scrolls, so the listener must target that, not the section,
    // or it never fires and the virtual window freezes on the initial rows.
    const container = tableRef.querySelector("table") ?? tableRef;
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

  // `id` prefixes the ids of radio buttons, checkboxes, etc.
  // since there may be multiple `DataTable` instances that have overlapping row ids.
  $: selectionName = inputName ?? id;

  // Label the table with its title/description. Only when the default
  // heading markup renders (not overridden via the titleChildren /
  // descriptionChildren slots, whose custom markup we don't control ids for).
  $: titleId = `${id}-title`;
  $: descriptionId = `${id}-description`;
  $: hasTitle = !!title && !$$slots.titleChildren;
  $: hasDescription = !!description && !$$slots.descriptionChildren;

  // `headers` is compared by identity, so a consumer that rebuilds a
  // new-but-equal array (or reassigns from an object reassigned to an equal
  // one) would otherwise re-sort and re-render every cell for an identical
  // result. Alias to a stable reference that only moves when the header set
  // actually differs, and derive every reader below from it. Functions
  // (`sort`, `display`) are compared by identity: a consumer that rebuilds
  // `headers` with inline arrow functions still re-runs, as it must.
  //
  // Compared against shallow copies, not `headers` itself: an in-place edit
  // (`headers[i].columnHidden = true; headers = headers`) keeps the same
  // array reference, so `deepEqual(stableHeaders, headers)` would take the
  // reference fast path and report "unchanged" even though the content
  // moved. A snapshot of independent copies forces the real comparison.
  let stableHeaders = headers;
  let headersSnapshot = headers.map((header) => ({ ...header }));

  function headersUnchanged(nextHeaders) {
    return deepEqual(headersSnapshot, nextHeaders);
  }

  $: if (!headersUnchanged(headers)) {
    stableHeaders = headers;
    headersSnapshot = headers.map((header) => ({ ...header }));
  }

  // A columnHidden header stays in `headers`, the column definition, and is
  // skipped everywhere the rendered column set is meant. Pinned columns move
  // to their edge here, so the head, `colgroup`, cells and footer all follow
  // one order and DOM order stays equal to visual order.
  $: renderOrder = resolveColumnOrder(stableHeaders);
  $: visibleHeaders = renderOrder.map((index) => stableHeaders[index]);

  // A single stable reference that only moves when `rows` genuinely differs
  // by value, shared by the filter-replay block and the cell cache block
  // below. Sharing one signal matters: if each block tracked its own "last
  // seen `rows`" by identity, a new-but-equal array would still look changed
  // to whichever block wasn't updated, defeating the guard.
  let stableRows = rows;
  $: if (!rowsUnchanged(stableRows, rows)) {
    stableRows = rows;
  }

  // Store a copy of the original rows for filter restoration.
  let prevFilterRows = stableRows;
  let originalRows = [...stableRows];
  // Row ids that match the active filter. In "hide" mode this toggles `hidden` on rows
  // instead of shrinking `tableRows`.
  let matchedRowIdsSet = new Set(originalRows.map((row) => row.id));
  // Last filter applied via `filterRows`, replayed when `rows` changes so
  // an active search is not silently dropped on row reassignment.
  let prevSearchValue = "";
  let prevCustomFilter;

  /**
   * @type {(searchValue: string, customFilter?: (row: Row, value: string) => boolean) => ReadonlyArray<Row["id"]>}
   */
  function filterRows(searchValue, customFilter) {
    prevSearchValue = searchValue;
    prevCustomFilter = customFilter;
    const value = searchValue.trim().toLowerCase();

    if (value.length === 0) {
      // Reset to original rows.
      const ids = originalRows.map((row) => row.id);
      matchedRowIdsSet = new Set(ids);
      tableRows.set(originalRows);
      return ids;
    }

    let filteredRows = [];

    if (typeof customFilter === "function") {
      // Apply custom filter if provided.
      filteredRows = originalRows.filter((row) => customFilter(row, value));
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
      filteredRows = originalRows.filter((row) => {
        return searchableKeys.some((searchKey) => {
          const cellValue = resolvePath(row, searchKey);
          if (typeof cellValue === "string" || typeof cellValue === "number") {
            return `${cellValue}`?.toLowerCase().includes(value);
          }
          return false;
        });
      });
    }

    const ids = filteredRows.map((row) => row.id);
    matchedRowIdsSet = new Set(ids);
    // "hide" mode keeps every row mounted and drives visibility via `matchedRowIdsSet`;
    // otherwise shrink the rendered set as before.
    tableRows.set(hideMode ? originalRows : filteredRows);
    return ids;
  }

  $: if (stableRows !== prevFilterRows) {
    originalRows = [...stableRows];
    prevFilterRows = stableRows;
    if (prevSearchValue.trim().length > 0) {
      filterRows(prevSearchValue, prevCustomFilter);
    } else {
      matchedRowIdsSet = new Set(stableRows.map((row) => row.id));
      $tableRows = stableRows;
    }
  }

  // Replay the active filter when the strategy flips so the rendered set and the
  // matched ids stay consistent (for example switching to "remove" must re-shrink
  // `tableRows`, and switching to "hide" must restore the full mounted set).
  let prevHideMode = hideMode;
  $: if (hideMode !== prevHideMode) {
    prevHideMode = hideMode;
    if (prevSearchValue.trim().length > 0) {
      filterRows(prevSearchValue, prevCustomFilter);
    }
  }

  /**
   * @type {() => void}
   */
  function resetSelectedRowIds() {
    selectedRowIds = [];
    rangeAnchorRowId = null;
  }

  /**
   * A form reset unchecks the row inputs without a change event. Read the
   * rows still checked (none, unless the markup was server-rendered with
   * `checked`) back into `selectedRowIds`, mapping each input's string value
   * to its row id. Inputs of a nested data table are skipped. Fires no
   * events.
   * @type {() => void}
   */
  function handleFormReset() {
    if (!isSelectionEnabled || !scrollContainerRef) return;
    const table = scrollContainerRef.querySelector("table");
    const rowIdByValue = new Map(
      $tableRows.map((row) => [String(row.id), row.id]),
    );
    const next = [];
    for (const input of scrollContainerRef.querySelectorAll("input")) {
      if (
        input.name !== selectionName ||
        !input.checked ||
        input.closest("table") !== table ||
        !rowIdByValue.has(input.value)
      ) {
        continue;
      }
      next.push(rowIdByValue.get(input.value));
    }
    selectedRowIds = next;
    rangeAnchorRowId = null;
  }

  /** Anchor row id for shift+click range selection; cleared when the anchor no longer exists in the current row order. */
  let rangeAnchorRowId = null;

  /**
   * Apply `checked` to every selectable row between the anchor row and `targetIndex` (inclusive),
   * where `targetIndex` is a position in `rowsToVirtualize`. Returns `false` if the anchor row
   * is no longer present (for example, filtered out), so the caller can fall back to a single toggle.
   * @type {(targetIndex: number, checked: boolean) => boolean}
   */
  function selectRowRange(targetIndex, checked) {
    const anchorIndex = rowsToVirtualize.findIndex(
      (row) => row.id === rangeAnchorRowId,
    );
    const rows = rangeSlice(
      rowsToVirtualize,
      anchorIndex,
      targetIndex,
      (row) =>
        !nonSelectableRowIdsSet.has(row.id) &&
        // "hide" mode keeps filtered-out rows mounted (and in `rowsToVirtualize`).
        (!hideMode || matchedRowIdsSet.has(row.id)),
    );
    if (rows === null) return false;

    const next = new Set(selectedRowIds);
    for (const row of rows) {
      if (checked) {
        next.add(row.id);
      } else {
        next.delete(row.id);
      }
    }
    selectedRowIds = [...next];
    return true;
  }

  /**
   * With `allowDeselect`, clicking an already-selected radio row clears the
   * selection. This listens for `click` rather than `change`: clicking a
   * radio's associated `<label>` re-dispatches the click onto the hidden
   * input, whose native activation behavior re-checks it and fires `change`
   * right after this handler clears the selection. `preventDefault` stops
   * that native activation (and the label's re-dispatch) so the clear
   * sticks.
   * @type {(row: Row, event: MouseEvent) => void}
   */
  function handleRadioColumnClick(row, event) {
    if (!radio || !allowDeselect || !selectedRowIdsSet.has(row.id)) return;

    event.preventDefault();
    selectedRowIds = [];
    dispatch("click:row--select", { row, selected: false });
  }

  /**
   * Header ids whose `headerDecorator` holds an active `AILabel`. The cells in
   * those columns take the AI gradient, as in Carbon v11.
   * @type {import("svelte/store").Writable<Set<string>>}
   */
  const aiLabelColumns = writable(new Set());

  /**
   * @param {string} headerId
   * @param {boolean} active
   */
  function setColumnAILabel(headerId, active) {
    aiLabelColumns.update((columns) => {
      if (active === columns.has(headerId)) return columns;
      const next = new Set(columns);
      if (active) next.add(headerId);
      else next.delete(headerId);
      return next;
    });
  }

  // With `cellFocus`, header controls leave the tab order and join the
  // grid's arrow keys. `TableHeader` reads it.
  const cellFocusStore = writable(cellFocus);
  $: cellFocusStore.set(cellFocus);

  setContext("carbon:DataTable", {
    batchSelectedIds,
    cellFocus: cellFocusStore,
    tableRows,
    tableSize,
    resetSelectedRowIds,
    filterRows,
    refreshRow,
    refreshCells,
    setColumnAILabel,
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
  // Count only the selectable rows matching the active filter: `selectedRowIds`
  // may also hold rows the filter hides (or ids no longer in `rows`), which
  // select all neither reflects nor touches.
  $: selectedSelectableCount = selectableRowIds.reduce(
    (count, id) => count + (selectedRowIdsSet.has(id) ? 1 : 0),
    0,
  );
  $: selectAll =
    selectableRowIds.length > 0 &&
    selectedSelectableCount === selectableRowIds.length;
  $: indeterminate =
    selectedSelectableCount > 0 &&
    selectedSelectableCount < selectableRowIds.length;
  $: if (batchExpansion) {
    expandable = true;
    expanded =
      expandableRowIds.length > 0 &&
      expandableRowIds.every((id) => expandedRowIdsSet.has(id));
  }
  $: isSelectionEnabled = selectable || radio || batchSelection;

  let tableCellsByRowId = {};
  let prevRows;
  let prevVisibleHeaders;
  let prevRowsToRender;

  /**
   * Resolve whether a header is sortable. `header.sort` overrides the
   * table-level `sortable` in either direction (`false` opts out, `true` or
   * a comparator opts in); unset inherits `sortable`.
   */
  function isHeaderSortable(header) {
    if (header.sort === false) return false;
    if (header.sort === true || typeof header.sort === "function") {
      return true;
    }
    return sortable;
  }

  /** Build cell objects for one row. Always new objects so `display` columns re-run. */
  function computeRowCells(row) {
    const cells = [];

    // Index into `headers` rather than the visible subset so hiding a preceding
    // column does not renumber the generated keys the `{#each}` blocks key on.
    for (const index of renderOrder) {
      const header = headers[index];
      cells.push({
        key: header.key ?? `key-${index}`,
        value: header.key ? resolvePath(row, header.key) : undefined,
        display: header.display,
        empty: header.empty,
        columnMenu: header.columnMenu,
        columnAlign: header.columnAlign,
      });
    }

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
   * Rebuild cells for currently painted rows after batch in-place edits to
   * `rows`. Offscreen rows are computed when they enter the window.
   * @type {() => void}
   * @example
   * ```svelte
   * <DataTable bind:this={dataTable} {headers} {rows} />
   * <button on:click={() => dataTable.refreshCells()}>Refresh table</button>
   * ```
   */
  export function refreshCells() {
    tableCellsByRowId = buildCellsForPaintedRows(rowsToRender ?? [], {});
  }

  /**
   * Build cell records for the painted row list, reusing cached cell objects
   * when the resolved values are unchanged.
   * @param {ReadonlyArray<Row>} paintedRows
   * @param {Record<string, ReturnType<typeof computeRowCells>>} cache
   */
  function buildCellsForPaintedRows(paintedRows, cache) {
    const next = {};
    for (const row of paintedRows) {
      const prevCells = cache[row.id];
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
    return next;
  }

  $: ascending = sortDirection === "ascending";
  $: sortingHeader = stableHeaders.find((header) => header.key === sortKey);
  $: sorting =
    sortKey != null &&
    (sortingHeader ? isHeaderSortable(sortingHeader) : sortable);
  $: sortPath = sortKey == null ? "" : String(sortKey);
  $: sortedRows =
    sorting && sortDirection !== "none"
      ? [...$tableRows].sort((a, b) => {
          const itemA = resolvePath(a, sortPath);
          const itemB = resolvePath(b, sortPath);
          const headerSort = sortingHeader?.sort;

          if (typeof headerSort === "function") {
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
  $: defaultRowHeight = ROW_HEIGHTS[effectiveSize] ?? DEFAULT_ROW_HEIGHT;
  $: virtualConfig = virtualize
    ? {
        itemHeight: defaultRowHeight,
        maxVisibleRows: 10,
        containerHeight: undefined,
        overscan: DEFAULT_VIRTUAL_LIST_CONFIG.overscan,
        threshold: DEFAULT_VIRTUAL_LIST_CONFIG.threshold,
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
      (stickyHeader && typeof stickyHeaderMaxHeight === "number"
        ? stickyHeaderMaxHeight
        : virtualConfig.itemHeight * virtualConfig.maxVisibleRows))
    : null;

  $: virtualScrollContainer = virtualConfig && !stickyHeader;

  // With `stickyHeader`, the `<table>` itself scrolls. Render its bounds from
  // props so the server output is already height-bounded.
  $: tableStyle = [
    fixedLayout ? "table-layout: fixed" : undefined,
    virtualConfig && stickyHeader && calculatedContainerHeight
      ? `max-height: ${calculatedContainerHeight}px; overflow-y: auto`
      : undefined,
  ]
    .filter(Boolean)
    .join("; ");

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
      const scrollContainer = stickyHeader
        ? (tableRef?.querySelector("table") ?? tableRef)
        : scrollContainerRef;
      if (scrollContainer) {
        tableBodyScrollTop = scrollContainer.scrollTop || 0;
      }
    });
  }

  $: rowsToRender = virtualData?.isVirtualized
    ? virtualData.visibleItems
    : rowsToVirtualize;

  // The row `{#each}` blocks iterate ids, not row objects. Svelte 5's legacy
  // mode treats every object item as changed whenever the list is reassigned,
  // so iterating rows re-ran every row's and cell's props on each sort or
  // filter. Ids compare by value: a reorder only moves rows. `rowById`
  // follows `stableRows`, so a new `rows` array still refreshes every row.
  $: rowById = new Map(stableRows.map((row) => [row.id, row]));
  $: rowIdsToRender = rowsToRender.map((row) => row.id);

  // Walk the painted window, not `rows`. Virtualized and paginated tables
  // otherwise allocate cell records for every row on each `rows`/headers
  // invalidation. Compare against `stableRows`/`visibleHeaders`, not the raw
  // props: both are fresh references on every prop invalidation (Svelte
  // treats every object/array prop write as changed), so comparing against
  // the raw prop would defeat the guards above and rebuild every cell for a
  // new-but-equal `rows` or `headers`. `visibleHeaders` still changes
  // reference when `columnHidden` is toggled in place, so that case keeps
  // rebuilding cells.
  $: if (
    stableRows !== prevRows ||
    visibleHeaders !== prevVisibleHeaders ||
    paintedRowListChanged(rowsToRender, prevRowsToRender)
  ) {
    const nextCells = buildCellsForPaintedRows(
      rowsToRender ?? [],
      tableCellsByRowId,
    );
    // A reorder (sort) reuses every row's cell array. Keep the old record
    // then, so the per-row cell `{#each}` blocks don't re-run.
    if (!sameCellRecords(nextCells, tableCellsByRowId)) {
      tableCellsByRowId = nextCells;
    }
    prevRows = stableRows;
    prevVisibleHeaders = visibleHeaders;
    prevRowsToRender = rowsToRender;
  }

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

  // Pinned columns stick at an offset summed from the widths before them.
  // Declared widths give the server output and the first paint; the pinned
  // header cells are then measured, since a table can lay a column out wider
  // or narrower than its `width`. The leading columns (decorator, expand,
  // selection) pin with the start group, so their offsets are measured too.
  $: leadingColumns = [
    hasRowDecorator && { width: LEADING_COLUMN_WIDTHS.decorator },
    expandable && { width: LEADING_COLUMN_WIDTHS.expand },
    isSelectionEnabled && { width: LEADING_COLUMN_WIDTHS.selection },
  ].filter(Boolean);

  /** @type {Array<number | undefined>} */
  let measuredWidths = [];

  $: pinnedLayouts = computePinnedOffsets(
    [
      ...leadingColumns.map((column) => ({ ...column, leading: true })),
      ...visibleHeaders.map((header) => ({
        pin: header.columnPinned,
        width: header.width,
      })),
    ],
    measuredWidths,
  );
  $: leadingPins = splitLeadingPins(
    pinnedLayouts,
    hasRowDecorator,
    expandable,
    isSelectionEnabled,
  );
  $: pinnedByKey = pinnedLayouts
    ? Object.fromEntries(
        visibleHeaders.map((header, index) => [
          header.key,
          pinnedLayouts[leadingColumns.length + index],
        ]),
      )
    : {};

  // Which head cells to measure, and which columns they are. Strings, so an
  // offset update does not re-subscribe the observer, and a swap of two
  // pinned columns does.
  $: pinnedCells = pinnedLayouts
    ? pinnedLayouts.map((layout) => (layout ? "p" : "-")).join("")
    : "";
  $: pinnedKeys = pinnedLayouts
    ? visibleHeaders.map((h) => h.key).join("\0")
    : "";

  let stopMeasuring = noop;
  let measureEpoch = 0;

  /**
   * @param {null | HTMLElement} root
   * @param {string} signature - `"p"` for each head cell to measure.
   * @param {string} _keys - Re-subscribes when the columns change.
   */
  function measurePinnedCells(root, signature, _keys) {
    stopMeasuring();
    stopMeasuring = noop;
    const epoch = ++measureEpoch;
    if (measuredWidths.length > 0) measuredWidths = [];
    if (!root || !signature) return;
    // The signature changes before the head re-renders.
    tick().then(() => {
      if (epoch !== measureEpoch) return;
      const cells = root.querySelector("thead tr")?.children;
      if (!cells) return;
      const stops = [];
      for (let i = 0; i < signature.length; i++) {
        if (signature[i] !== "p" || !cells[i]) continue;
        stops.push(
          observeResize(cells[i], () => {
            const width = cells[i].getBoundingClientRect().width;
            // No width means no layout (a hidden table): keep what we have.
            // Sub-pixel noise would rewrite every offset.
            if (!width || Math.abs(width - (measuredWidths[i] ?? -1)) < 0.5)
              return;
            const next = [...measuredWidths];
            next[i] = Math.round(width * 100) / 100;
            measuredWidths = next;
          }),
        );
      }
      stopMeasuring = () => {
        for (const stop of stops) stop();
      };
    });
  }

  $: measurePinnedCells(scrollContainerRef, pinnedCells, pinnedKeys);

  onMount(() => () => {
    measureEpoch++;
    stopMeasuring();
  });

  // Calculate total columns for spacer rows and expanded row cells
  $: totalColumns =
    (hasRowDecorator ? 1 : 0) +
    (expandable ? 1 : 0) +
    (isSelectionEnabled ? 1 : 0) +
    visibleHeaders.length;

  // Rest props go on the container, but naming and description belong on
  // the `table`. `Table` joins them with the title and description ids.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  /** Sort on a header click and dispatch the header click events. */
  function handleHeaderClick(event, header) {
    dispatch("click", { header });

    if (isHeaderSortable(header)) {
      const currentSortDirection =
        sortKey === header.key ? sortDirection : "none";
      const effectiveSortAlways = header.sortAlways ?? sortAlways;
      /** @type {Record<"none" | "ascending" | "descending", "none" | "ascending" | "descending">} */
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
      const nextSortDirection = sortDirectionMap[currentSortDirection];
      const nextSortKey = nextSortDirection === "none" ? null : header.key;
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
    } else {
      dispatch("click:header", {
        header,
        target: event.target,
        currentTarget: event.currentTarget,
      });
    }
  }

  $: hasRowDecorator = $$slots.rowDecorator;

  /**
   * The cell under the pointer. Only the row id and column key are read, so
   * moving within a row or a column changes at most one of them and a cell
   * that is neither re-renders nothing.
   * @type {null | { rowId: Row["id"]; key: string | undefined }}
   */
  let hoverCell = null;
  /**
   * The cell holding focus, when `cellFocus` is set.
   * @type {null | { rowId: Row["id"]; key: string | undefined }}
   */
  let focusCell = null;
  /**
   * The cell the next Tab lands on: the last one focused, else the first
   * painted. It is dropped when a filter or page change removes its row.
   * @type {null | { rowId: Row["id"]; key: string }}
   */
  let tabCell = null;
  $: crossCell = hoverCell || focusCell;
  $: crossRowId = crosshair && crossCell ? crossCell.rowId : undefined;
  $: crossKey = crosshair && crossCell ? crossCell.key : undefined;

  $: tabRowId = cellFocus
    ? resolveTabRow(tabCell, rowIdsToRender, hideMode, matchedRowIdsSet)
    : undefined;
  $: tabKey = cellFocus ? resolveTabKey(tabCell, visibleHeaders) : undefined;

  /**
   * @param {null | { rowId: Row["id"]; key: string }} cell
   * @param {ReadonlyArray<Row["id"]>} ids
   * @param {boolean} hidden Whether rows outside `matched` are hidden.
   * @param {Set<Row["id"]>} matched
   */
  function resolveTabRow(cell, ids, hidden, matched) {
    if (cell && ids.includes(cell.rowId)) return cell.rowId;
    return ids.find((rowId) => !hidden || matched.has(rowId));
  }

  /**
   * @param {null | { rowId: Row["id"]; key: string }} cell
   * @param {ReadonlyArray<{ key: string; empty?: boolean }>} columns
   */
  function resolveTabKey(cell, columns) {
    const keys = columns.filter((column) => !column.empty);
    if (cell && keys.some((column) => column.key === cell.key)) return cell.key;
    return keys[0]?.key;
  }

  /**
   * The key of the column a body cell belongs to, read from the `headers`
   * attribute that ties it to its header (`{id}-{key}`). The expand and
   * selection cells have none.
   * @param {EventTarget | null} target
   */
  function columnKeyAt(target) {
    const cell = /** @type {Element | null} */ (target)?.closest?.("td");
    const ref = cell?.getAttribute("headers");
    const prefix = `${id}-`;
    return ref?.startsWith(prefix) && ref !== `${id}-expand`
      ? ref.slice(prefix.length)
      : undefined;
  }

  /**
   * @param {MouseEvent} event
   * @param {Row["id"]} rowId
   */
  function handleCellPointer(event, rowId) {
    if (!crosshair) return;
    const key = columnKeyAt(event.target);
    if (hoverCell?.rowId === rowId && hoverCell.key === key) return;
    hoverCell = { rowId, key };
  }

  /**
   * @param {FocusEvent} event
   * @param {Row["id"]} rowId
   */
  function handleCellFocus(event, rowId) {
    if (pinnedLayouts !== null || stickyHeader) revealFocus(event.target);
    if (!cellFocus) return;
    const cell = /** @type {Element} */ (event.target).closest("td[tabindex]");
    const key = columnKeyAt(cell);
    if (key === undefined) return;
    if (tabCell?.rowId !== rowId || tabCell.key !== key) {
      tabCell = { rowId, key };
    }
    if (focusCell?.rowId !== rowId || focusCell.key !== key) {
      focusCell = { rowId, key };
    }
  }

  /** @param {KeyboardEvent} event */
  function handleCellKeydown(event) {
    const target = /** @type {Element} */ (event.target);
    // A navigable body cell, or a header cell or its sort button. Other
    // controls in a cell keep their own keys.
    const cell = /** @type {HTMLTableCellElement | null} */ (
      target.closest?.("td[tabindex], th[data-header]") ?? null
    );
    if (
      !cellFocus ||
      !cell ||
      !(target === cell || target.matches("button.bx--table-sort")) ||
      event.defaultPrevented ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }
    const ctrl = event.ctrlKey || event.metaKey;
    // Only `Home` and `End` take `Ctrl`; the arrows are left to the browser with it.
    if (ctrl && event.key !== "Home" && event.key !== "End") return;
    const next = findCellTarget(
      cell,
      inlineKey(event.key, undefined, cell),
      ctrl,
    );
    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  /**
   * @param {{ key: string; columnAlign?: string }} header
   * @param {import("./data-table-utils.js").PinnedColumnLayout | undefined} pin
   * @param {string | undefined} highlightedKey Passed in, not read from the
   * component, so a template call re-runs when the highlighted column moves.
   */
  function formatHeaderClass(header, pin, highlightedKey) {
    return joinClasses(
      formatColumnClass(header.columnAlign, pin),
      highlightedKey !== undefined && header.key === highlightedKey
        ? "bx--data-table--highlighted-column"
        : undefined,
    );
  }

  // The title decorator has no AI surface, so its state is not read.
  const titleAILabelState = { set() {} };

  /**
   * AI label state per row id, set by an `AILabel` in the `rowDecorator`
   * slot. Mutated in place: a Map is always "changed" to Svelte, so `set`
   * still notifies. `set` skips an unchanged value, since every row reads
   * the store.
   * @type {Map<Row["id"], "active" | "revert">}
   */
  const rowAILabelMap = new Map();
  const rowAILabelStates = writable(rowAILabelMap);
  /** @type {Map<Row["id"], { set: (value: undefined | "active" | "revert") => void }>} */
  const rowAILabelSetters = new Map();

  /**
   * Resolve `cellClass` for one body cell. Rows come from a lookup by id,
   * so `row` is typed as possibly missing.
   * @param {DataTableCellClass<Row> | undefined} cellClass
   * @param {Omit<DataTableCellClassArgs<Row>, "row"> & { row: Row | undefined }} args
   * @returns {string | undefined}
   */
  function resolveCellClass(cellClass, { row, ...args }) {
    if (typeof cellClass !== "function") return cellClass;
    return row ? cellClass({ row, ...args }) : undefined;
  }

  /** @param {Row["id"]} rowId */
  function rowAILabelState(rowId) {
    let setter = rowAILabelSetters.get(rowId);
    if (!setter) {
      setter = {
        set(value) {
          if (rowAILabelMap.get(rowId) === value) return;
          rowAILabelStates.update((states) => {
            if (value === undefined) states.delete(rowId);
            else states.set(rowId, value);
            return states;
          });
        },
      };
      rowAILabelSetters.set(rowId, setter);
    }
    return setter;
  }
</script>

<TableContainer {id} {useStaticWidth} {...wrapperProps}>
  {#if title || $$slots.titleChildren || description || $$slots.descriptionChildren || $$slots.decorator}
    <div
      class:bx--data-table-header={true}
      class:bx--data-table-header--decorator={$$slots.decorator}
    >
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
      {#if $$slots.decorator}
        <Decorator
          class="bx--data-table-header__decorator"
          state={titleAILabelState}
          labelSize="xs"
        >
          <slot name="decorator" />
        </Decorator>
      {/if}
    </div>
  {/if}
  <slot />
  <div
    bind:this={scrollContainerRef}
    use:formReset={handleFormReset}
    class:bx--data-table-virtual={virtualScrollContainer}
    style:max-height={virtualScrollContainer
      ? `${calculatedContainerHeight}px`
      : undefined}
    style:overflow-y={virtualScrollContainer ? "auto" : undefined}
    on:scroll={virtualScrollContainer ? handleScroll : undefined}
  >
    <Table
      bind:ref={tableRef}
      zebra={zebra && !hideMode}
      size={effectiveSize}
      {stickyHeader}
      {sortable}
      {useStaticWidth}
      {fixedLayout}
      pinnedColumns={pinnedLayouts !== null}
      grid={cellFocus}
      labelledBy={hasTitle ? titleId : undefined}
      describedBy={hasDescription ? descriptionId : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      tableStyle={tableStyle || undefined}
      containerStyle={stickyHeader && stickyHeaderMaxHeight != null
        ? `--ccs-sticky-header-max-height: ${toCssLength(stickyHeaderMaxHeight)}`
        : undefined}
    >
      {#if hasCustomHeaderWidth}
        <colgroup>
          {#if hasRowDecorator}
            <col />
          {/if}
          {#if expandable}
            <col />
          {/if}
          {#if isSelectionEnabled}
            <col />
          {/if}
          {#each visibleHeaders as header (header.key)}
            <col style={formatHeaderWidth(header)} />
          {/each}
        </colgroup>
      {/if}
      <TableHead
        style={virtualScrollContainer ? "position: sticky; top: 0;" : undefined}
        on:keydown={handleCellKeydown}
      >
        <TableRow>
          {#if hasRowDecorator}
            <th
              scope="col"
              class={formatPinnedClass(
                leadingPins.decorator,
                "bx--table-column-decorator",
              )}
              style={formatInsetStyle(leadingPins.decorator)}
            >
              <span class:bx--visually-hidden={true}>AI label</span>
            </th>
          {/if}
          {#if expandable}
            <th
              scope="col"
              id="{id}-expand"
              class={formatPinnedClass(leadingPins.expand, "bx--table-expand")}
              style={formatInsetStyle(leadingPins.expand)}
              data-previous-value={expanded ? "collapsed" : undefined}
            >
              {#if batchExpansion}
                <button
                  type="button"
                  class:bx--table-expand__button={true}
                  aria-label={translateWithId(
                    expanded ? "collapseAll" : "expandAll",
                  )}
                  aria-expanded={expanded}
                  aria-controls={expandableRowIds
                    .map((rid) => `${id}-expandable-row-${rid}`)
                    .join(" ")}
                  on:click={() => {
                    expanded = !expanded;
                    if (expanded) {
                      const next = new Set(expandedRowIds);
                      for (const rid of expandableRowIds) next.add(rid);
                      expandedRowIds = [...next];
                    } else {
                      const scope = new Set(expandableRowIds);
                      expandedRowIds = expandedRowIds.filter(
                        (rid) => !scope.has(rid),
                      );
                    }

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
                <span class:bx--visually-hidden={true}
                  >{translateWithId("expandColumn")}</span
                >
              {/if}
            </th>
          {/if}
          {#if isSelectionEnabled && (radio || !batchSelection)}
            <th
              scope="col"
              class={formatPinnedClass(
                leadingPins.selection,
                "bx--table-column-checkbox",
              )}
              class:bx--table-column-radio={radio}
              style={formatInsetStyle(leadingPins.selection)}
            >
              <span class:bx--visually-hidden={true}
                >{translateWithId("selectRow")}</span
              >
            </th>
          {/if}
          {#if batchSelection && !radio}
            <th
              scope="col"
              class={formatPinnedClass(
                leadingPins.selection,
                "bx--table-column-checkbox",
              )}
              style={formatInsetStyle(leadingPins.selection)}
            >
              <InlineCheckbox
                id="{id}-select-all"
                aria-label={translateWithId("selectAll")}
                name="{id}-select-all"
                value="all"
                checked={selectAll}
                {indeterminate}
                on:change={(event) => {
                  dispatch("click:header--select", {
                    indeterminate,
                    selected:
                      !indeterminate &&
                      /** @type {HTMLInputElement} */ (event.target).checked,
                  });

                  if (indeterminate) {
                    /** @type {HTMLInputElement} */ (event.target).checked =
                      false;
                  }

                  if (/** @type {HTMLInputElement} */ (event.target).checked) {
                    const next = new Set(selectedRowIds);
                    for (const id of selectableRowIds) next.add(id);
                    selectedRowIds = [...next];
                  } else {
                    const scope = new Set(selectableRowIds);
                    selectedRowIds = selectedRowIds.filter(
                      (id) => !scope.has(id),
                    );
                  }
                }}
              />
            </th>
          {/if}
          {#each visibleHeaders as header (header.key)}
            {@const pin = pinnedByKey[header.key]}
            {#if header.empty}
              {#if header.columnMenu}
                <th
                  scope="col"
                  class={joinClasses(
                    formatHeaderClass(header, pin, crossKey),
                    "bx--table-column-menu",
                  )}
                  style={formatColumnStyle(header, pin)}
                  >{#if header.value}<span class:bx--visually-hidden={true}
                      >{header.value}</span
                    >{/if}</th
                >
              {:else}
                <th
                  scope="col"
                  class={formatHeaderClass(header, pin, crossKey)}
                  style={formatColumnStyle(header, pin)}
                >
                  <div class:bx--table-header-label={true}>
                    {#if header.value}<span class:bx--visually-hidden={true}
                        >{header.value}</span
                      >{/if}
                  </div>
                </th>
              {/if}
            {:else}
              {#if $$slots.headerDecorator}
                <TableHeader
                  id="{id}-{header.key}"
                  class={formatHeaderClass(header, pin, crossKey)}
                  style={formatColumnStyle(header, pin)}
                  sortable={isHeaderSortable(header)}
                  sortDirection={sortKey === header.key
                    ? sortDirection
                    : "none"}
                  active={sortKey === header.key}
                  {...tableHeaderTranslateWithId
                    ? { translateWithId: tableHeaderTranslateWithId }
                    : {}}
                  on:click={(event) => handleHeaderClick(event, header)}
                >
                  <slot name="cellHeader" {header}>{header.value}</slot>
                  <svelte:fragment slot="decorator">
                    <slot name="headerDecorator" {header} />
                  </svelte:fragment>
                </TableHeader>
              {:else}
                <TableHeader
                  id="{id}-{header.key}"
                  class={formatHeaderClass(header, pin, crossKey)}
                  style={formatColumnStyle(header, pin)}
                  sortable={isHeaderSortable(header)}
                  sortDirection={sortKey === header.key
                    ? sortDirection
                    : "none"}
                  active={sortKey === header.key}
                  {...tableHeaderTranslateWithId
                    ? { translateWithId: tableHeaderTranslateWithId }
                    : {}}
                  on:click={(event) => handleHeaderClick(event, header)}
                >
                  <slot name="cellHeader" {header}>{header.value}</slot>
                </TableHeader>
              {/if}
            {/if}
          {/each}
        </TableRow>
      </TableHead>
      <TableBody>
        {#if virtualData?.isVirtualized}
          <!-- Spacer row for offset -->
          {#if virtualData.startIndex > 0}
            <tr style:height="{virtualData.offsetY}px">
              <td colspan={totalColumns} class:bx--table-cell={true}></td>
            </tr>
          {/if}

          <!-- Visible rows -->
          {#each rowIdsToRender as rowId, index (rowId)}
            {@const row = rowById.get(rowId)}
            {@const actualIndex = virtualData.startIndex + index}
            {@const isSelected = selectedRowIdsSet.has(row.id)}
            {@const isExpanded = expandedRowIdsSet.has(row.id)}
            {@const isHighlighted =
              highlightedRowIdsSet.has(row.id) || rowId === crossRowId}
            {@const rowClassValue =
              typeof rowClass === "function"
                ? rowClass({
                    row,
                    rowIndex: actualIndex,
                    selected: isSelected,
                    expanded: isExpanded,
                  })
                : rowClass}
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <tr
              data-row={row.id}
              data-parent-row={expandable ? true : undefined}
              class="{isSelected ? 'bx--data-table--selected' : ''} {isExpanded
                ? 'bx--expandable-row'
                : ''} {expandable ? 'bx--parent-row' : ''} {expandable &&
              parentRowId === row.id
                ? 'bx--expandable-row--hover'
                : ''} {isHighlighted
                ? 'bx--data-table--highlighted-row'
                : ''} {expandable && isSelectionEnabled
                ? 'bx--expandable-row--with-selection'
                : ''} {$rowAILabelStates.get(row.id) === 'active'
                ? 'bx--data-table--ai-label-row'
                : ''} {rowClassValue ?? ''}"
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
              on:mouseover={(event) => handleCellPointer(event, rowId)}
              on:focusin={(event) => handleCellFocus(event, rowId)}
              on:focusout={() => (focusCell = null)}
              on:keydown={handleCellKeydown}
              on:mouseleave={() => {
                hoverCell = null;
                dispatch("mouseleave:row", row);
              }}
            >
              {#if hasRowDecorator}
                <td
                  class={formatPinnedClass(
                    leadingPins.decorator,
                    "bx--table-column-decorator",
                  )}
                  style={formatInsetStyle(leadingPins.decorator)}
                  class:bx--table-cell={true}
                >
                  <Decorator
                    class="bx--table-column-decorator__inner"
                    state={rowAILabelState(row.id)}
                    labelAlign="start"
                  >
                    <slot name="rowDecorator" {row} />
                  </Decorator>
                </td>
              {/if}
              {#if expandable}
                <td
                  class={formatPinnedClass(
                    leadingPins.expand,
                    "bx--table-expand",
                  )}
                  style={formatInsetStyle(leadingPins.expand)}
                  class:bx--table-cell={true}
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
                        ? translateWithId("collapseRow")
                        : translateWithId("expandRow")}
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
                </td>
              {/if}
              {#if isSelectionEnabled}
                <td
                  class={formatPinnedClass(
                    leadingPins.selection,
                    "bx--table-column-checkbox",
                  )}
                  style={formatInsetStyle(leadingPins.selection)}
                  class:bx--table-cell={true}
                  class:bx--table-column-radio={radio}
                  on:click={(event) => handleRadioColumnClick(row, event)}
                >
                  {#if !nonSelectableRowIdsSet.has(row.id)}
                    {@const inputId = `${id}-${row.id}`}
                    {#if radio}
                      <div class:bx--radio-button-wrapper={true}>
                        <input
                          type="radio"
                          class:bx--radio-button={true}
                          id={inputId}
                          name={selectionName}
                          form={inputForm}
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
                        <label
                          class:bx--radio-button__label={true}
                          for={inputId}
                        >
                          <span class:bx--radio-button__appearance={true}
                          ></span>
                          <span
                            class:bx--radio-button__label-text={true}
                            class:bx--visually-hidden={true}
                            >{translateWithId("selectRow")}</span
                          >
                        </label>
                      </div>
                    {:else}
                      <div class:bx--checkbox--inline={true}>
                        <input
                          type="checkbox"
                          id={inputId}
                          name={selectionName}
                          form={inputForm}
                          aria-label={translateWithId("selectRow")}
                          value={row.id}
                          checked={selectedRowIdsSet.has(row.id)}
                          aria-checked={selectedRowIdsSet.has(row.id)}
                          class:bx--checkbox={true}
                          on:click={(event) => {
                            const checked = /** @type {HTMLInputElement} */ (
                              event.target
                            ).checked;
                            const usedRange =
                              event.shiftKey &&
                              rangeAnchorRowId !== null &&
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

                            rangeAnchorRowId = row.id;
                            dispatch("click:row--select", {
                              row,
                              selected: checked,
                            });
                          }}
                        />
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <label
                          for={inputId}
                          class:bx--checkbox-label={true}
                          on:click={(event) =>
                            forwardShiftClick(
                              event,
                              /** @type {HTMLInputElement} */ (
                                event.currentTarget.previousElementSibling
                              ),
                            )}
                        ></label>
                      </div>
                    {/if}
                  {/if}
                </td>
              {/if}
              {#each tableCellsByRowId[row.id] as cell, j (cell.key)}
                {@const cellClassValue = resolveCellClass(cellClass, {
                  row,
                  cell,
                  rowIndex: actualIndex,
                  cellIndex: j,
                  selected: isSelected,
                  expanded: isExpanded,
                })}
                {@const pin = pinnedByKey[cell.key]}
                <td
                  class={joinClasses(
                    formatColumnClass(cell.columnAlign, pin),
                    cell.key === crossKey
                      ? "bx--data-table--highlighted-column"
                      : undefined,
                    cellClassValue,
                  )}
                  style={formatInsetStyle(pin)}
                  class:bx--table-cell={true}
                  class:bx--table-column-menu={cell.empty && cell.columnMenu}
                  class:bx--table-cell--column-ai-label={$aiLabelColumns.has(
                    `${id}-${cell.key}`,
                  )}
                  headers={cell.empty ? undefined : `${id}-${cell.key}`}
                  tabindex={cellFocus && !cell.empty
                    ? rowId === tabRowId && cell.key === tabKey
                      ? 0
                      : -1
                    : undefined}
                  on:click={(event) => {
                    if (cell.empty) return;
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
                    {cell.display ? cell.display(cell.value, row) : cell.value}
                  </slot>
                </td>
              {/each}
            </tr>

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
                {#if expandedRowIdsSet.has(row.id) && !nonExpandableRowIdsSet.has(row.id)}
                  <td colspan={totalColumns} class:bx--table-cell={true}>
                    <div class:bx--child-row-inner-container={true}>
                      <slot
                        name="expandedRow"
                        {row}
                        rowSelected={selectedRowIdsSet.has(row.id)}
                      />
                    </div>
                  </td>
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
              <td colspan={totalColumns} class:bx--table-cell={true}></td>
            </tr>
          {/if}
        {:else}
          <!-- Non-virtualized: render all rows normally -->
          {#each rowIdsToRender as rowId, index (rowId)}
            {@const row = rowById.get(rowId)}
            {@const isSelected = selectedRowIdsSet.has(row.id)}
            {@const isExpanded = expandedRowIdsSet.has(row.id)}
            {@const isExpandable = !nonExpandableRowIdsSet.has(row.id)}
            {@const isSelectable = !nonSelectableRowIdsSet.has(row.id)}
            {@const isHighlighted =
              highlightedRowIdsSet.has(row.id) || rowId === crossRowId}
            {@const rowClassValue =
              typeof rowClass === "function"
                ? rowClass({
                    row,
                    rowIndex: index,
                    selected: isSelected,
                    expanded: isExpanded,
                  })
                : rowClass}
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <tr
              data-row={row.id}
              data-parent-row={expandable ? true : undefined}
              hidden={hideMode && !matchedRowIdsSet.has(row.id)
                ? true
                : undefined}
              data-zebra-even={zebraVisibleEvenIds?.has(row.id)
                ? ""
                : undefined}
              class="{isSelected ? 'bx--data-table--selected' : ''} {isExpanded
                ? 'bx--expandable-row'
                : ''} {expandable ? 'bx--parent-row' : ''} {expandable &&
              parentRowId === row.id
                ? 'bx--expandable-row--hover'
                : ''} {isHighlighted
                ? 'bx--data-table--highlighted-row'
                : ''} {expandable && isSelectionEnabled
                ? 'bx--expandable-row--with-selection'
                : ''} {$rowAILabelStates.get(row.id) === 'active'
                ? 'bx--data-table--ai-label-row'
                : ''} {rowClassValue ?? ''}"
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
              on:mouseover={(event) => handleCellPointer(event, rowId)}
              on:focusin={(event) => handleCellFocus(event, rowId)}
              on:focusout={() => (focusCell = null)}
              on:keydown={handleCellKeydown}
              on:mouseleave={() => {
                hoverCell = null;
                dispatch("mouseleave:row", row);
              }}
            >
              {#if hasRowDecorator}
                <td
                  class={formatPinnedClass(
                    leadingPins.decorator,
                    "bx--table-column-decorator",
                  )}
                  style={formatInsetStyle(leadingPins.decorator)}
                  class:bx--table-cell={true}
                >
                  <Decorator
                    class="bx--table-column-decorator__inner"
                    state={rowAILabelState(row.id)}
                    labelAlign="start"
                  >
                    <slot name="rowDecorator" {row} />
                  </Decorator>
                </td>
              {/if}
              {#if expandable}
                <td
                  class={formatPinnedClass(
                    leadingPins.expand,
                    "bx--table-expand",
                  )}
                  style={formatInsetStyle(leadingPins.expand)}
                  class:bx--table-cell={true}
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
                        ? translateWithId("collapseRow")
                        : translateWithId("expandRow")}
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
                </td>
              {/if}
              {#if isSelectionEnabled}
                <td
                  class={formatPinnedClass(
                    leadingPins.selection,
                    "bx--table-column-checkbox",
                  )}
                  style={formatInsetStyle(leadingPins.selection)}
                  class:bx--table-cell={true}
                  class:bx--table-column-radio={radio}
                  on:click={(event) => handleRadioColumnClick(row, event)}
                >
                  {#if isSelectable}
                    {@const inputId = `${id}-${row.id}`}
                    {#if radio}
                      <div class:bx--radio-button-wrapper={true}>
                        <input
                          type="radio"
                          class:bx--radio-button={true}
                          id={inputId}
                          name={selectionName}
                          form={inputForm}
                          checked={isSelected}
                          value={row.id}
                          on:change={() => {
                            selectedRowIds = [row.id];
                            dispatch("click:row--select", {
                              row,
                              selected: true,
                            });
                          }}
                        />
                        <label
                          class:bx--radio-button__label={true}
                          for={inputId}
                        >
                          <span class:bx--radio-button__appearance={true}
                          ></span>
                          <span
                            class:bx--radio-button__label-text={true}
                            class:bx--visually-hidden={true}
                            >{translateWithId("selectRow")}</span
                          >
                        </label>
                      </div>
                    {:else}
                      <div class:bx--checkbox--inline={true}>
                        <input
                          type="checkbox"
                          id={inputId}
                          name={selectionName}
                          form={inputForm}
                          aria-label={translateWithId("selectRow")}
                          value={row.id}
                          checked={isSelected}
                          aria-checked={isSelected}
                          class:bx--checkbox={true}
                          on:click={(event) => {
                            const checked = /** @type {HTMLInputElement} */ (
                              event.target
                            ).checked;
                            const usedRange =
                              event.shiftKey &&
                              rangeAnchorRowId !== null &&
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

                            rangeAnchorRowId = row.id;
                            dispatch("click:row--select", {
                              row,
                              selected: checked,
                            });
                          }}
                        />
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <label
                          for={inputId}
                          class:bx--checkbox-label={true}
                          on:click={(event) =>
                            forwardShiftClick(
                              event,
                              /** @type {HTMLInputElement} */ (
                                event.currentTarget.previousElementSibling
                              ),
                            )}
                        ></label>
                      </div>
                    {/if}
                  {/if}
                </td>
              {/if}
              {#each tableCellsByRowId[row.id] as cell, j (cell.key)}
                {@const cellClassValue = resolveCellClass(cellClass, {
                  row,
                  cell,
                  rowIndex: index,
                  cellIndex: j,
                  selected: isSelected,
                  expanded: isExpanded,
                })}
                {@const pin = pinnedByKey[cell.key]}
                <td
                  class={joinClasses(
                    formatColumnClass(cell.columnAlign, pin),
                    cell.key === crossKey
                      ? "bx--data-table--highlighted-column"
                      : undefined,
                    cellClassValue,
                  )}
                  style={formatInsetStyle(pin)}
                  class:bx--table-cell={true}
                  class:bx--table-column-menu={cell.empty && cell.columnMenu}
                  class:bx--table-cell--column-ai-label={$aiLabelColumns.has(
                    `${id}-${cell.key}`,
                  )}
                  headers={cell.empty ? undefined : `${id}-${cell.key}`}
                  tabindex={cellFocus && !cell.empty
                    ? rowId === tabRowId && cell.key === tabKey
                      ? 0
                      : -1
                    : undefined}
                  on:click={(event) => {
                    if (cell.empty) return;
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
                </td>
              {/each}
            </tr>

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
                  <td colspan={totalColumns} class:bx--table-cell={true}>
                    <div class:bx--child-row-inner-container={true}>
                      <slot name="expandedRow" {row} rowSelected={isSelected} />
                    </div>
                  </td>
                {/if}
              </tr>
            {/if}
          {/each}
        {/if}
      </TableBody>
      {#if $$slots.footerCell}
        <TableFoot>
          <TableRow>
            {#if hasRowDecorator}
              <td
                aria-hidden="true"
                class={formatPinnedClass(
                  leadingPins.decorator,
                  "bx--table-column-decorator",
                )}
                style={formatInsetStyle(leadingPins.decorator)}
                class:bx--table-cell={true}
              ></td>
            {/if}
            {#if expandable}
              <td
                aria-hidden="true"
                class={formatPinnedClass(
                  leadingPins.expand,
                  "bx--table-expand",
                )}
                style={formatInsetStyle(leadingPins.expand)}
                class:bx--table-cell={true}
              ></td>
            {/if}
            {#if isSelectionEnabled}
              <td
                aria-hidden="true"
                class={formatPinnedClass(
                  leadingPins.selection,
                  "bx--table-column-checkbox",
                )}
                style={formatInsetStyle(leadingPins.selection)}
                class:bx--table-cell={true}
                class:bx--table-column-radio={radio}
              ></td>
            {/if}
            {#each visibleHeaders as header, index (header.key)}
              {@const pin = pinnedByKey[header.key]}
              <td
                class={formatColumnClass(header.columnAlign, pin)}
                style={formatInsetStyle(pin)}
                class:bx--table-cell={true}
              >
                <slot name="footerCell" {header} {index} />
              </td>
            {/each}
          </TableRow>
        </TableFoot>
      {/if}
    </Table>
  </div>
</TableContainer>
