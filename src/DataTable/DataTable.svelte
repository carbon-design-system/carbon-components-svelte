<script module>
  /** @type {Record<string, string>} */
  const alignClasses = {
    start: "bx--table-column--align-start",
    end: "bx--table-column--align-end",
  };

  /**
   * @param {string | undefined} columnAlign
   * @returns {string | undefined}
   */
  function formatAlignClass(columnAlign) {
    return columnAlign === undefined ? undefined : alignClasses[columnAlign];
  }

  /**
   * Join class names, skipping empty values.
   * @param {...(string | undefined)} parts
   * @returns {string | undefined}
   */
  function joinClasses(...parts) {
    return parts.filter(Boolean).join(" ") || undefined;
  }

  /** Row heights per size variant, matching `bx--data-table--<size>` */
  const ROW_HEIGHTS = {
    compact: 24,
    short: 32,
    medium: 40,
    tall: 64,
  };

  /** Row height when `size` is unset */
  const DEFAULT_ROW_HEIGHT = 48;

  /** @type {{ "aria-hidden": "true" | "false"; class: string; }} */
  const expandIconProps = {
    "aria-hidden": "true",
    class: "bx--table-expand__svg",
  };

  /** @type {Record<"none" | "ascending" | "descending", "none" | "ascending" | "descending">} */
  const NEXT_SORT_DIRECTION = {
    none: "ascending",
    ascending: "descending",
    descending: "none",
  };

  /** @type {Record<"none" | "ascending" | "descending", "none" | "ascending" | "descending">} */
  const NEXT_SORT_DIRECTION_ALWAYS = {
    none: "ascending",
    ascending: "descending",
    descending: "ascending",
  };
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
   */

  /**
   * A column under a key that isn't one of `Row`'s. Its cells come from
   * `display`, such as a total, or from the `cell` slot, such as a link.
   * It has no value to sort by.
   * @template [Row=DataTableRow]
   * @typedef {object} DataTableComputedHeader
   * @property {string & {}} key
   * @property {false} [empty]
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: Row) => DataTableValue} [display]
   * @property {false} sort - A computed column has no value to sort by.
   * @property {boolean} [columnMenu] - Whether the column menu is enabled
   * @property {boolean} [columnHidden] - Whether the column is skipped in render while remaining in `headers`
   * @property {string} [width]
   * @property {string} [minWidth]
   * @property {"start" | "end"} [columnAlign] - Horizontal alignment of the column header and cells. Logical, so `end` is the right edge in LTR and the left edge in RTL. Defaults to `"start"`.
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {DataTableNonEmptyHeader<Row> | DataTableComputedHeader<Row> | DataTableEmptyHeader<Row>} DataTableHeader
   */

  /**
   * @template [Row=DataTableRow]
   * @typedef {object} DataTableCell
   * @property {DataTableKey<Row> | (string & {})} key
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: DataTableRow) => DataTableValue} [display]
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

  /**
   * @template [Row=DataTableRow]
   * @typedef {{ key: null; direction: "none"; preventDefault: () => void } | { key: DataTableKey<Row>; direction: "ascending" | "descending"; preventDefault: () => void }} DataTableSortEvent
   */

  /**
   * @snippet {{ props: { class: string } }} titleChildren - Replace the title heading. Spread `props` on your element.
   * @snippet {{ props: { class: string } }} descriptionChildren - Replace the description paragraph. Spread `props` on your element.
   * @snippet {{}} decorator - An `AILabel` for the table title.
   * @snippet {{ expanded: boolean; row: Row | undefined; props: { "aria-hidden": "true" | "false"; class: string; }; }} expandIcon - Replace the expand chevron. Spread `props` on your icon.
   * @snippet {{ row: Row; rowSelected: boolean; }} expandedRow - Content of an expanded row.
   * @snippet {{ header: DataTableNonEmptyHeader<Row> | DataTableComputedHeader<Row>; }} cellHeader - Render a column header label.
   * @snippet {{ row: Row; cell: DataTableCell<Row>; rowIndex: number; cellIndex: number; rowSelected: boolean; rowExpanded: boolean; }} cell - Render a body cell.
   * @snippet {{ header: DataTableHeader<Row>; index: number; }} footerCell - Render a footer cell. The footer renders only with this snippet.
   * @snippet {{ header: DataTableNonEmptyHeader<Row> | DataTableComputedHeader<Row>; }} headerDecorator - An `AILabel` for a column header.
   * @snippet {{ row: Row; }} rowDecorator - An `AILabel` for a row.
   */

  /** @restProps {div} */

  import { setContext, untrack } from "svelte";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import { toStore } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import InlineCheckbox from "../Checkbox/InlineCheckbox.svelte";
  import { createStatusAnnouncer } from "../ListBox/menu-status.js";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { toCssLength } from "../utils/css-length.js";
  import { formReset } from "../utils/form-reset.js";
  import { forwardShiftClick } from "../utils/forward-shift-click.js";
  import { createScrollEndTracker } from "../utils/is-scroll-near-end.js";
  import { rangeSlice } from "../utils/range-slice.js";
  import { normalizeDataTableSize } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    DEFAULT_VIRTUAL_LIST_CONFIG,
    virtualize as virtualizeUtil,
  } from "../utils/virtualize.js";
  import Table from "./Table.svelte";
  import TableContainer from "./TableContainer.svelte";
  import TableFoot from "./TableFoot.svelte";
  import TableHead from "./TableHead.svelte";
  import TableHeader from "./TableHeader.svelte";
  import TableRow from "./TableRow.svelte";
  import {
    compareValues,
    formatHeaderWidth,
    getDisplayedRows,
    resolvePath,
    shouldIgnoreRowClick,
  } from "./data-table-utils.js";
  import { keepRowFocus } from "./row-focus.js";

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

  /**
   * @template {DataTableRow} [Row=DataTableRow]
   * @typedef {object} DataTableOwnProps
   * @property {ReadonlyArray<DataTableHeader<Row>>} [headers=[]] Specify the data table headers.
   * @property {ReadonlyArray<Row>} [rows=[]] Specify the rows the data table should render. A `$state` array (or its rows) can be edited in place; plain objects edited in place need `refreshRow` or `refreshCells`.
   * @property {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined} [size] Set the size of the data table. Also accepts Carbon v11's row heights: `"xs"` (`"compact"`), `"sm"` (`"short"`), `"md"` (`"medium"`), `"lg"` (the 48px default) and `"xl"` (`"tall"`).
   * @property {string} [title=""] Specify the title of the data table
   * @property {string} [description=""] Specify the description of the data table
   * @property {DataTableRowClass<Row> | undefined} [rowClass] Specify a custom class name for each row, or a function that returns one based on the row and its selected/expanded state.
   * @property {string} [id] Set an id for the table container. The title, description, header, cell and selection ids derive from it, for example `{id}-title` and `{id}-{header.key}`.
   * @property {DataTableCellClass<Row> | undefined} [cellClass] Provide a class name for every body cell, or a function that returns one based on the row, cell, and row state.
   * @property {string | undefined} [inputName] Specify a name attribute for the selection inputs. Defaults to `id`.
   * @property {string | undefined} [inputForm] Specify the id of a form element outside the table to associate the selection inputs with.
   * @property {boolean} [zebra=false] Set to `true` to use zebra styles
   * @property {boolean} [sortable=false] Set to `true` for the sortable variant. Individual columns can opt out (or, if this is `false`, opt in) via `header.sort`.
   * @property {DataTableKey<Row> | null} [sortKey=null] Specify the header key to sort by.
   * @property {"none" | "ascending" | "descending"} [sortDirection="none"] Specify the sort direction.
   * @property {boolean} [sortAlways=false] Set to `true` to only toggle between "ascending" and "descending" sort directions, skipping "none".
   * @property {((a: DataTableSortValue<Row>, b: DataTableSortValue<Row>, context: { key: DataTableKey<Row>; ascending: boolean; row_a: Row; row_b: Row }) => number) | undefined} [sort] Specify a default sort comparator for all sortable columns. Per-header `sort` functions take precedence over this prop.
   * @property {(header: DataTableHeader<Row> | undefined, direction: "none" | "ascending" | "descending") => string} [sortStatusText] Override the text announced after `sortKey` or `sortDirection` changes. `header` is the sorted column. For `"none"`, it is the column that was sorted before.
   * @property {boolean} [expandable=false] Set to `true` for the expandable variant. `batchExpansion` implies it.
   * @property {boolean} [batchExpansion=false] Set to `true` to enable batch expansion.
   * @property {ReadonlyArray<Row["id"]>} [expandedRowIds=[]] Specify the row ids to be expanded.
   * @property {ReadonlyArray<Row["id"]>} [nonExpandableRowIds=[]] Specify the ids for rows that should not be expandable.
   * @property {boolean} [radio=false] Set to `true` for the radio selection variant. Row selection is enabled regardless of `selectable`.
   * @property {boolean} [allowDeselect=false] Set to `true` so clicking an already-selected `radio` row clears the selection instead of leaving it selected. Only applies with `radio`.
   * @property {boolean} [selectable=false] Set to `true` for the selectable variant. Shift-clicking a row checkbox extends selection to every row between it and the last row clicked (not supported with `radio`).
   * @property {boolean} [batchSelection=false] Set to `true` to enable batch selection. Row selection is enabled regardless of `selectable`.
   * @property {ReadonlyArray<Row["id"]>} [selectedRowIds=[]] Specify the row ids to be selected.
   * @property {ReadonlyArray<Row["id"]>} [nonSelectableRowIds=[]] Specify the ids of rows that should not be selectable.
   * @property {ReadonlyArray<Row["id"]>} [highlightedRowIds=[]] Specify the row ids to highlight. Adds `bx--data-table--highlighted-row`. The highlighted row class is themed by default.
   * @property {boolean} [stickyHeader=false] Set to `true` to enable a sticky header
   * @property {number | string | undefined} [stickyHeaderMaxHeight] Override the maximum height of the sticky header table, replacing the default `300px`. Only applies when `stickyHeader` is `true`. Pass a number (interpreted as `px`) or a CSS length string (e.g. `"100%"`, `"24rem"`).
   * @property {boolean} [useStaticWidth=false] Set to `true` to use static width
   * @property {boolean} [fixedLayout=false] Set to `true` to use a fixed table layout, where a header's `width`/`minWidth` is the column's exact rendered size instead of a floor that content can grow past.
   * @property {"remove" | "hide"} [filterMode="remove"] Set the filtering strategy used by `ToolbarSearch`: `"remove"` drops non-matching rows, `"hide"` keeps them mounted with `hidden`. `"hide"` falls back to `"remove"` when `pageSize` is set or `virtualize` is enabled.
   * @property {number} [pageSize=0] Specify the number of items to display in a page
   * @property {number} [page=0] Set to `number` to set current page
   * @property {undefined | boolean | { itemHeight?: number, maxVisibleRows?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number }} [virtualize] Enable virtualization for large row lists. Pass `true` for the defaults or an object to customize `itemHeight`, `maxVisibleRows`, `containerHeight`, `overscan`, `threshold` and `maxItems`.
   * @property {null | HTMLDivElement} [scrollContainerRef=null] Obtain a reference to the table wrapper element. When virtualization is enabled and `stickyHeader` is false, this element is the scroll container.
   * @property {((id: import("./TableHeader.svelte").TableHeaderTranslationId) => string) | undefined} [tableHeaderTranslateWithId] Override the default table header translation ids.
   * @property {(id: DataTableTranslationId) => string} [translateWithId] Override the default translation ids for the expand and select controls.
   * @property {((event: DataTableSortEvent<Row>) => void) | undefined} [onsort] Called when a sortable column header would change the active sort. Call `preventDefault()` to skip updating `sortKey` / `sortDirection` and skip client side sorting, for example to sort on the server.
   * @property {((detail: { header: DataTableHeader<Row>; sortDirection?: "ascending" | "descending" | "none"; target: EventTarget | null; currentTarget: EventTarget | null }) => void) | undefined} [onheaderclick] Called when a column header is clicked. `sortDirection` is the next direction for a sortable column, even if `onsort` prevented it.
   * @property {((detail: { row: Row; target: EventTarget | null; currentTarget: EventTarget | null }) => void) | undefined} [onrowclick] Called when a row is clicked, except on its controls.
   * @property {((detail: { row: Row; cell: DataTableCell<Row>; target: EventTarget | null; currentTarget: EventTarget | null }) => void) | undefined} [oncellclick] Called when a body cell is clicked.
   * @property {((row: Row) => void) | undefined} [onrowmouseenter] Called when the pointer enters a row.
   * @property {((row: Row) => void) | undefined} [onrowmouseleave] Called when the pointer leaves a row.
   * @property {((detail: { row: Row; selected: boolean }) => void) | undefined} [onrowselect] Called when a row is selected or deselected.
   * @property {((detail: { indeterminate: boolean; selected: boolean }) => void) | undefined} [onheaderselect] Called when the select-all checkbox changes.
   * @property {((detail: { row: Row; expanded: boolean }) => void) | undefined} [onrowexpand] Called when a row is expanded or collapsed.
   * @property {((detail: { expanded: boolean }) => void) | undefined} [onheaderexpand] Called when the expand-all button is clicked.
   * @property {((detail: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void) | undefined} [onscrollend] Called when a virtualized table body is scrolled near the bottom, as a load-more signal. Not the browser's native `scrollend`.
   * @property {import("svelte").Snippet} [children] Content above the table, such as a `Toolbar`.
   * @property {import("svelte").Snippet<[{ props: { class: string } }]>} [titleChildren] Replace the title heading. Spread `props` on your element.
   * @property {import("svelte").Snippet<[{ props: { class: string } }]>} [descriptionChildren] Replace the description paragraph. Spread `props` on your element.
   * @property {import("svelte").Snippet} [decorator] An `AILabel` for the table title.
   * @property {import("svelte").Snippet<[{ expanded: boolean; row: Row | undefined; props: { "aria-hidden": "true" | "false"; class: string; } }]>} [expandIcon] Replace the expand chevron. Spread `props` on your icon.
   * @property {import("svelte").Snippet<[{ row: Row; rowSelected: boolean }]>} [expandedRow] Content of an expanded row.
   * @property {import("svelte").Snippet<[{ header: DataTableNonEmptyHeader<Row> | DataTableComputedHeader<Row> }]>} [cellHeader] Render a column header label.
   * @property {import("svelte").Snippet<[{ row: Row; cell: DataTableCell<Row>; rowIndex: number; cellIndex: number; rowSelected: boolean; rowExpanded: boolean }]>} [cell] Render a body cell.
   * @property {import("svelte").Snippet<[{ header: DataTableHeader<Row>; index: number }]>} [footerCell] Render a footer cell. The footer renders only with this snippet.
   * @property {import("svelte").Snippet<[{ header: DataTableNonEmptyHeader<Row> | DataTableComputedHeader<Row> }]>} [headerDecorator] An `AILabel` for a column header.
   * @property {import("svelte").Snippet<[{ row: Row }]>} [rowDecorator] An `AILabel` for a row.
   */

  /** @type {DataTableOwnProps<Row>} */
  let {
    /** @type {ReadonlyArray<DataTableHeader<Row>>} */
    headers = [],
    /** @type {ReadonlyArray<Row>} */
    rows = [],
    /** @type {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined} */
    size = undefined,
    title = "",
    description = "",
    /** @type {DataTableRowClass<Row> | undefined} */
    rowClass = undefined,
    id = uniqueId(),
    /** @type {DataTableCellClass<Row> | undefined} */
    cellClass = undefined,
    /** @type {string | undefined} */
    inputName = undefined,
    /** @type {string | undefined} */
    inputForm = undefined,
    zebra = false,
    sortable = false,
    /** @type {DataTableKey<Row> | null} */
    sortKey = $bindable(null),
    /** @type {"none" | "ascending" | "descending"} */
    sortDirection = $bindable("none"),
    sortAlways = false,
    /** @type {((a: DataTableSortValue<Row>, b: DataTableSortValue<Row>, context: { key: DataTableKey<Row>; ascending: boolean; row_a: Row; row_b: Row }) => number) | undefined} */
    sort = undefined,
    /** @type {(header: DataTableHeader<Row> | undefined, direction: "none" | "ascending" | "descending") => string} */
    sortStatusText = defaultSortStatusText,
    expandable = false,
    batchExpansion = false,
    /** @type {ReadonlyArray<Row["id"]>} */
    expandedRowIds = $bindable([]),
    /** @type {ReadonlyArray<Row["id"]>} */
    nonExpandableRowIds = [],
    radio = false,
    allowDeselect = false,
    selectable = false,
    batchSelection = false,
    /** @type {ReadonlyArray<Row["id"]>} */
    selectedRowIds = $bindable([]),
    /** @type {ReadonlyArray<Row["id"]>} */
    nonSelectableRowIds = [],
    /** @type {ReadonlyArray<Row["id"]>} */
    highlightedRowIds = [],
    stickyHeader = false,
    /** @type {number | string | undefined} */
    stickyHeaderMaxHeight = undefined,
    useStaticWidth = false,
    fixedLayout = false,
    /** @type {"remove" | "hide"} */
    filterMode = "remove",
    pageSize = 0,
    page = $bindable(0),
    /** @type {undefined | boolean | { itemHeight?: number, maxVisibleRows?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number }} */
    virtualize = undefined,
    /** @type {null | HTMLDivElement} */
    scrollContainerRef = $bindable(null),
    /** @type {((id: import("./TableHeader.svelte").TableHeaderTranslationId) => string) | undefined} */
    tableHeaderTranslateWithId = undefined,
    /** @type {(id: DataTableTranslationId) => string} */
    translateWithId = (id) => defaultTranslations[id],
    /** @type {((event: DataTableSortEvent<Row>) => void) | undefined} */
    onsort = undefined,
    /** @type {((detail: { header: DataTableHeader<Row>; sortDirection?: "ascending" | "descending" | "none"; target: EventTarget | null; currentTarget: EventTarget | null }) => void) | undefined} */
    onheaderclick = undefined,
    /** @type {((detail: { row: Row; target: EventTarget | null; currentTarget: EventTarget | null }) => void) | undefined} */
    onrowclick = undefined,
    /** @type {((detail: { row: Row; cell: DataTableCell<Row>; target: EventTarget | null; currentTarget: EventTarget | null }) => void) | undefined} */
    oncellclick = undefined,
    /** @type {((row: Row) => void) | undefined} */
    onrowmouseenter = undefined,
    /** @type {((row: Row) => void) | undefined} */
    onrowmouseleave = undefined,
    /** @type {((detail: { row: Row; selected: boolean }) => void) | undefined} */
    onrowselect = undefined,
    /** @type {((detail: { indeterminate: boolean; selected: boolean }) => void) | undefined} */
    onheaderselect = undefined,
    /** @type {((detail: { row: Row; expanded: boolean }) => void) | undefined} */
    onrowexpand = undefined,
    /** @type {((detail: { expanded: boolean }) => void) | undefined} */
    onheaderexpand = undefined,
    /** @type {((detail: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void) | undefined} */
    onscrollend = undefined,
    children = undefined,
    titleChildren = undefined,
    descriptionChildren = undefined,
    decorator = undefined,
    expandIcon = undefined,
    expandedRow = undefined,
    cellHeader = undefined,
    cell = undefined,
    footerCell = undefined,
    headerDecorator = undefined,
    rowDecorator = undefined,
    ...restProps
  } = $props();

  /**
   * @param {DataTableHeader<Row> | undefined} header
   * @param {"none" | "ascending" | "descending"} direction
   */
  function defaultSortStatusText(header, direction) {
    if (direction === "none" || !header) return "Not sorted";
    return `Sorted by ${header.value ?? header.key}, ${direction}`;
  }

  const effectiveSize = $derived(normalizeDataTableSize(size));
  const visibleHeaders = $derived(
    headers.filter((header) => !header.columnHidden),
  );
  const selectionName = $derived(inputName ?? id);
  const titleId = $derived(`${id}-title`);
  const descriptionId = $derived(`${id}-description`);
  const hasTitle = $derived(!!title && !titleChildren);
  const hasDescription = $derived(!!description && !descriptionChildren);
  const isSelectionEnabled = $derived(selectable || radio || batchSelection);
  const isExpandableTable = $derived(expandable || batchExpansion);

  // Rest props go on the container, but naming and description belong on
  // the `table`. `Table` joins them with the title and description ids.
  const aria = $derived(splitAriaNaming(restProps));

  /**
   * Resolve whether a header is sortable. `header.sort` overrides the
   * table-level `sortable` in either direction.
   * @param {DataTableHeader<Row>} header
   */
  function isHeaderSortable(header) {
    if (header.sort === false) return false;
    if (header.sort === true || typeof header.sort === "function") {
      return true;
    }
    return sortable;
  }

  // ---- Filtering (driven by `ToolbarSearch` through context) ----

  let searchValue = $state("");
  /** @type {undefined | ((row: Row, value: string) => boolean)} */
  let customFilter = $state.raw();

  // Hidden columns are excluded: matching on a column the user cannot see
  // produces results they cannot explain.
  const searchableKeys = $derived(
    visibleHeaders
      .filter((header) => !header.empty && header.key)
      .map((header) => String(header.key)),
  );

  /**
   * Rows matching the active filter. Re-filters when `rows` changes. Always
   * a new array: a legacy-mode parent's `rows.splice(...); rows = rows`
   * passes the same array again, which a `$derived` would treat as
   * unchanged.
   */
  const matchedRows = $derived.by(() => {
    const value = searchValue.trim().toLowerCase();
    if (value.length === 0) return [...rows];
    if (customFilter) {
      const filter = customFilter;
      return rows.filter((row) => filter(row, value));
    }
    return rows.filter((row) =>
      searchableKeys.some((key) => {
        const cellValue = resolvePath(row, key);
        return (
          (typeof cellValue === "string" || typeof cellValue === "number") &&
          `${cellValue}`.toLowerCase().includes(value)
        );
      }),
    );
  });
  const matchedRowIdsSet = $derived(new Set(matchedRows.map((row) => row.id)));

  const virtualConfig = $derived.by(() => {
    if (!virtualize) return null;
    return {
      itemHeight:
        (effectiveSize && ROW_HEIGHTS[effectiveSize]) ?? DEFAULT_ROW_HEIGHT,
      maxVisibleRows: 10,
      containerHeight: /** @type {number | undefined} */ (undefined),
      overscan: DEFAULT_VIRTUAL_LIST_CONFIG.overscan,
      threshold: DEFAULT_VIRTUAL_LIST_CONFIG.threshold,
      maxItems: /** @type {number | undefined} */ (undefined),
      ...(typeof virtualize === "object" ? virtualize : {}),
    };
  });

  // "hide" filtering keeps every row mounted; it is incompatible with
  // strategies that already render a bounded subset, so fall back to "remove".
  const hideMode = $derived(
    filterMode === "hide" && !virtualConfig && !(pageSize > 0),
  );
  /** Rows the table holds: every row in "hide" mode, else the matches. */
  const tableRows = $derived(hideMode ? rows : matchedRows);

  /**
   * @type {(searchValue: string, customFilter?: (row: Row, value: string) => boolean) => ReadonlyArray<Row["id"]>}
   */
  function filterRows(value, filter) {
    searchValue = value;
    customFilter = typeof filter === "function" ? filter : undefined;
    return untrack(() => matchedRows.map((row) => row.id));
  }

  // ---- Sorting ----

  const sortingHeader = $derived(
    headers.find((header) => header.key === sortKey),
  );
  const sorting = $derived(
    sortKey != null &&
      (sortingHeader ? isHeaderSortable(sortingHeader) : sortable),
  );
  const sortedRows = $derived.by(() => {
    if (!sorting || sortDirection === "none") return tableRows;
    const path = String(sortKey);
    const ascending = sortDirection === "ascending";
    const headerSort = sortingHeader?.sort;
    const key = /** @type {DataTableKey<Row>} */ (sortKey);
    return [...tableRows].sort((a, b) => {
      const itemA = /** @type {DataTableSortValue<Row>} */ (
        resolvePath(a, path)
      );
      const itemB = /** @type {DataTableSortValue<Row>} */ (
        resolvePath(b, path)
      );
      if (typeof headerSort === "function") {
        return compareValues(itemA, itemB, ascending, headerSort);
      }
      if (sort) {
        const result = sort(itemA, itemB, {
          key,
          ascending,
          row_a: a,
          row_b: b,
        });
        return ascending ? result : -result;
      }
      return compareValues(itemA, itemB, ascending);
    });
  });

  let sortStatus = $state("");
  const announceSortStatus = createStatusAnnouncer(
    (text) => (sortStatus = text),
  );
  let prevSortKey = untrack(() => sortKey);
  let prevSortDirection = untrack(() => sortDirection);

  // Announce each sort once from a status region. The rows are not a live
  // region: a reorder would read every row again.
  $effect(() => {
    if (sortKey === prevSortKey && sortDirection === prevSortDirection) return;
    const statusKey = sortDirection === "none" ? prevSortKey : sortKey;
    prevSortKey = sortKey;
    prevSortDirection = sortDirection;
    const direction = sortDirection;
    untrack(() =>
      announceSortStatus(
        sortStatusText(
          headers.find((header) => header.key === statusKey),
          direction,
        ),
      ),
    );
  });

  /**
   * Sort on a header click and call the header callbacks.
   * @param {MouseEvent} event
   * @param {DataTableNonEmptyHeader<Row> | DataTableComputedHeader<Row>} header
   */
  function handleHeaderClick(event, header) {
    const { target, currentTarget } = event;
    // A computed column never sorts: it has no value to sort by.
    if (header.sort === false || !isHeaderSortable(header)) {
      onheaderclick?.({ header, target, currentTarget });
      return;
    }
    const current = sortKey === header.key ? sortDirection : "none";
    const next = (
      (header.sortAlways ?? sortAlways)
        ? NEXT_SORT_DIRECTION_ALWAYS
        : NEXT_SORT_DIRECTION
    )[current];
    const nextKey = next === "none" ? null : header.key;
    let prevented = false;
    onsort?.(
      /** @type {DataTableSortEvent<Row>} */ ({
        key: nextKey,
        direction: next,
        preventDefault: () => (prevented = true),
      }),
    );
    if (!prevented) {
      sortDirection = next;
      sortKey = nextKey;
    }
    onheaderclick?.({ header, sortDirection: next, target, currentTarget });
  }

  // ---- Paging and virtualization ----

  let tableBodyScrollTop = $state(0);
  /** @type {null | HTMLElement} */
  let tableRef = $state(null);

  const calculatedContainerHeight = $derived(
    virtualConfig
      ? (virtualConfig.containerHeight ??
          (stickyHeader && typeof stickyHeaderMaxHeight === "number"
            ? stickyHeaderMaxHeight
            : virtualConfig.itemHeight * virtualConfig.maxVisibleRows))
      : null,
  );
  const virtualScrollContainer = $derived(!!virtualConfig && !stickyHeader);

  // With `stickyHeader`, the `<table>` itself scrolls. Render its bounds from
  // props so the server output is already height-bounded.
  const tableStyle = $derived(
    [
      fixedLayout ? "table-layout: fixed" : undefined,
      virtualConfig && stickyHeader && calculatedContainerHeight
        ? `max-height: ${calculatedContainerHeight}px; overflow-y: auto`
        : undefined,
    ]
      .filter(Boolean)
      .join("; "),
  );

  // Pagination is ignored when virtualization is enabled.
  const rowsToVirtualize = $derived(
    virtualConfig ? sortedRows : getDisplayedRows(sortedRows, page, pageSize),
  );
  const virtualData = $derived(
    virtualConfig
      ? virtualizeUtil({
          items: rowsToVirtualize,
          scrollTop: tableBodyScrollTop,
          itemHeight: virtualConfig.itemHeight,
          containerHeight: calculatedContainerHeight ?? 0,
          overscan: virtualConfig.overscan,
          threshold: virtualConfig.threshold,
          maxItems: virtualConfig.maxItems,
        })
      : null,
  );
  const isVirtualized = $derived(!!virtualData?.isVirtualized);
  const rowsToRender = $derived(
    virtualData?.isVirtualized ? virtualData.visibleItems : rowsToVirtualize,
  );
  /** Index of `rowsToRender[0]` in `rowsToVirtualize`. */
  const rowOffset = $derived(
    virtualData?.isVirtualized ? virtualData.startIndex : 0,
  );

  const scrollEndTracker = createScrollEndTracker();

  /**
   * Shared by the sticky-header `<table>` listener and the non-sticky
   * container's `onscroll`.
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
    if (detail) onscrollend?.(detail);
  }

  // With `stickyHeader`, `tableRef` is the wrapping `<section>`; the
  // `<table>` inside it is the element that scrolls.
  $effect(() => {
    if (!virtualConfig || !stickyHeader || !tableRef) return;
    if (!calculatedContainerHeight) return;
    const container = tableRef.querySelector("table") ?? tableRef;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  });

  // Expanding a row changes the scroll height: re-read the scroll position
  // once the DOM has updated.
  $effect(() => {
    if (!virtualConfig) return;
    void expandedRowIds.length;
    const container = stickyHeader
      ? (tableRef?.querySelector("table") ?? tableRef)
      : scrollContainerRef;
    if (container) tableBodyScrollTop = container.scrollTop || 0;
  });

  // ---- Selection and expansion ----

  const selectedRowIdsSet = $derived(new Set(selectedRowIds));
  const expandedRowIdsSet = $derived(new Set(expandedRowIds));
  const highlightedRowIdsSet = $derived(new Set(highlightedRowIds));
  const nonSelectableRowIdsSet = $derived(new Set(nonSelectableRowIds));
  const nonExpandableRowIdsSet = $derived(new Set(nonExpandableRowIds));

  // Selection, "select all", and the expand-all state reflect only the rows
  // matching the active filter, in either filter mode.
  const expandableRowIds = $derived(
    matchedRows
      .map((row) => row.id)
      .filter((rowId) => !nonExpandableRowIdsSet.has(rowId)),
  );
  const selectableRowIds = $derived(
    matchedRows
      .map((row) => row.id)
      .filter((rowId) => !nonSelectableRowIdsSet.has(rowId)),
  );
  // `selectedRowIds` may also hold rows the filter hides (or ids no longer in
  // `rows`), which select all neither reflects nor touches.
  const selectedSelectableCount = $derived(
    selectableRowIds.filter((rowId) => selectedRowIdsSet.has(rowId)).length,
  );
  const selectAll = $derived(
    selectableRowIds.length > 0 &&
      selectedSelectableCount === selectableRowIds.length,
  );
  const indeterminate = $derived(
    selectedSelectableCount > 0 &&
      selectedSelectableCount < selectableRowIds.length,
  );
  const allExpanded = $derived(
    batchExpansion &&
      expandableRowIds.length > 0 &&
      expandableRowIds.every((rowId) => expandedRowIdsSet.has(rowId)),
  );

  /** Anchor row id for shift+click range selection. */
  /** @type {null | Row["id"]} */
  let rangeAnchorRowId = null;
  /** @type {null | Row["id"]} */
  let parentRowId = $state(null);

  function resetSelectedRowIds() {
    selectedRowIds = [];
    rangeAnchorRowId = null;
  }

  /**
   * Apply `checked` to every selectable row between the anchor row and
   * `targetIndex`, a position in `rowsToVirtualize`. Returns `false` if the
   * anchor row is gone, so the caller falls back to a single toggle.
   * @type {(targetIndex: number, checked: boolean) => boolean}
   */
  function selectRowRange(targetIndex, checked) {
    const anchorIndex = rowsToVirtualize.findIndex(
      (row) => row.id === rangeAnchorRowId,
    );
    const range = rangeSlice(
      rowsToVirtualize,
      anchorIndex,
      targetIndex,
      (row) =>
        !nonSelectableRowIdsSet.has(row.id) &&
        (!hideMode || matchedRowIdsSet.has(row.id)),
    );
    if (range === null) return false;
    const next = new Set(selectedRowIds);
    for (const row of range) {
      if (checked) next.add(row.id);
      else next.delete(row.id);
    }
    selectedRowIds = [...next];
    return true;
  }

  /**
   * @param {Row} row
   * @param {boolean} checked
   */
  function toggleRowSelected(row, checked) {
    const next = new Set(selectedRowIds);
    if (checked) next.add(row.id);
    else next.delete(row.id);
    selectedRowIds = [...next];
  }

  /** @param {Row} row */
  function toggleRowExpanded(row) {
    const expanded = expandedRowIdsSet.has(row.id);
    const next = new Set(expandedRowIds);
    if (expanded) next.delete(row.id);
    else next.add(row.id);
    expandedRowIds = [...next];
    onrowexpand?.({ row, expanded: !expanded });
  }

  function toggleAllExpanded() {
    const expanded = !allExpanded;
    if (expanded) {
      const next = new Set(expandedRowIds);
      for (const rowId of expandableRowIds) next.add(rowId);
      expandedRowIds = [...next];
    } else {
      const scope = new Set(expandableRowIds);
      expandedRowIds = expandedRowIds.filter((rowId) => !scope.has(rowId));
    }
    onheaderexpand?.({ expanded });
  }

  /** @param {Event} event */
  function handleSelectAllChange(event) {
    const input = /** @type {HTMLInputElement} */ (event.target);
    onheaderselect?.({
      indeterminate,
      selected: !indeterminate && input.checked,
    });
    if (indeterminate) input.checked = false;
    if (input.checked) {
      const next = new Set(selectedRowIds);
      for (const rowId of selectableRowIds) next.add(rowId);
      selectedRowIds = [...next];
    } else {
      const scope = new Set(selectableRowIds);
      selectedRowIds = selectedRowIds.filter((rowId) => !scope.has(rowId));
    }
  }

  /**
   * With `allowDeselect`, clicking an already-selected radio row clears the
   * selection. `preventDefault` stops the native activation (and a label's
   * re-dispatch) that would re-check the input.
   * @type {(row: Row, event: MouseEvent) => void}
   */
  function handleRadioColumnClick(row, event) {
    if (!radio || !allowDeselect || !selectedRowIdsSet.has(row.id)) return;
    event.preventDefault();
    selectedRowIds = [];
    onrowselect?.({ row, selected: false });
  }

  /**
   * A form reset unchecks the row inputs without a change event. Read the
   * rows still checked back into `selectedRowIds`. Fires no callbacks.
   */
  function handleFormReset() {
    if (!isSelectionEnabled || !scrollContainerRef) return;
    const table = scrollContainerRef.querySelector("table");
    const rowIdByValue = new Map(
      tableRows.map((row) => [String(row.id), row.id]),
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

  // ---- Cells ----

  // A row's cells derive from the row and the headers, per row. A sort only
  // moves rows, so no row recomputes them. Plain row objects edited in place
  // aren't seen; these counters let `refreshRow` and `refreshCells` force it.
  let cellsVersion = $state(0);
  /** @type {SvelteMap<Row["id"], number>} */
  const rowCellsVersion = new SvelteMap();

  /**
   * The cells one row renders. Reads `headers`, the refresh counters, and
   * (through a `$state` proxy) the row's fields, so it reruns for exactly
   * those.
   * @param {Row} row
   */
  function cellsFor(row) {
    void cellsVersion;
    void rowCellsVersion.get(row.id);
    /** @type {Array<{ key: string; value: DataTableValue; display?: (item: DataTableValue, row: any) => DataTableValue; empty?: boolean; columnMenu?: boolean; columnAlign?: "start" | "end"; }>} */
    const cells = [];
    // Index into `headers` rather than the visible subset so hiding a
    // preceding column does not renumber the generated keys.
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
   * Rebuild cells for a single row after an in-place edit to a plain (not
   * `$state`) row object.
   * @type {(id: Row["id"]) => void}
   */
  export function refreshRow(id) {
    rowCellsVersion.set(id, (rowCellsVersion.get(id) ?? 0) + 1);
  }

  /**
   * Rebuild cells for every row after batch in-place edits to plain (not
   * `$state`) row objects.
   * @type {() => void}
   */
  export function refreshCells() {
    cellsVersion++;
  }

  /**
   * @param {DataTableCellClass<Row> | undefined} cellClass
   * @param {DataTableCellClassArgs<Row>} args
   * @returns {string | undefined}
   */
  function resolveCellClass(cellClass, args) {
    return typeof cellClass === "function" ? cellClass(args) : cellClass;
  }

  // In "hide" mode hidden rows still occupy `:nth-child` positions, which
  // breaks zebra striping. Recompute parity over the matched rows.
  const zebraVisibleEvenIds = $derived.by(() => {
    if (!hideMode || !zebra) return null;
    const set = new Set();
    let visibleIndex = 0;
    for (const row of rowsToRender) {
      if (!matchedRowIdsSet.has(row.id)) continue;
      visibleIndex += 1;
      if (visibleIndex % 2 === 0) set.add(row.id);
    }
    return set;
  });

  const hasCustomHeaderWidth = $derived(
    visibleHeaders.some((header) => header.width ?? header.minWidth),
  );
  const totalColumns = $derived(
    (rowDecorator ? 1 : 0) +
      (isExpandableTable ? 1 : 0) +
      (isSelectionEnabled ? 1 : 0) +
      visibleHeaders.length,
  );

  // ---- AI labels ----

  // The title decorator has no AI surface, so its state is not read.
  const titleAILabelState = { set() {} };

  /**
   * Header ids whose `headerDecorator` holds an active `AILabel`. The cells
   * in those columns take the AI gradient.
   * @type {SvelteSet<string>}
   */
  const aiLabelColumns = new SvelteSet();

  /**
   * @param {string} headerId
   * @param {boolean} active
   */
  function setColumnAILabel(headerId, active) {
    if (active) aiLabelColumns.add(headerId);
    else aiLabelColumns.delete(headerId);
  }

  /**
   * AI label state per row id, set by an `AILabel` in `rowDecorator`. A
   * `SvelteMap` is tracked per key, so a change re-renders only its row.
   * @type {SvelteMap<Row["id"], "active" | "revert">}
   */
  const rowAILabelStates = new SvelteMap();
  /** @type {Map<Row["id"], { set: (value: undefined | "active" | "revert") => void }>} */
  const rowAILabelSetters = new Map();

  /** @param {Row["id"]} rowId */
  function rowAILabelState(rowId) {
    let setter = rowAILabelSetters.get(rowId);
    if (!setter) {
      setter = {
        set(value) {
          if (value === undefined) rowAILabelStates.delete(rowId);
          else rowAILabelStates.set(rowId, value);
        },
      };
      rowAILabelSetters.set(rowId, setter);
    }
    return setter;
  }

  /** @type {import("svelte/store").Readable<ReadonlyArray<Row["id"]>>} */
  const batchSelectedIds = toStore(() => selectedRowIds);
  /** @type {import("svelte/store").Readable<ReadonlyArray<Row>>} */
  const tableRowsStore = toStore(() => tableRows);
  /** @type {import("svelte/store").Readable<"compact" | "short" | "medium" | "tall" | undefined>} */
  const tableSize = toStore(() => effectiveSize);

  // The toolbar components read these as stores.
  setContext("carbon:DataTable", {
    batchSelectedIds,
    tableRows: tableRowsStore,
    tableSize,
    resetSelectedRowIds,
    filterRows,
    refreshRow,
    refreshCells,
    setColumnAILabel,
  });
</script>

<TableContainer {id} {useStaticWidth} {...aria.rest}>
  {#if title || titleChildren || description || descriptionChildren || decorator}
    <div
      class:bx--data-table-header={true}
      class:bx--data-table-header--decorator={!!decorator}
    >
      {#if titleChildren}
        {@render titleChildren({
          props: { class: "bx--data-table-header__title" },
        })}
      {:else if title}
        <h4 id={titleId} class:bx--data-table-header__title={true}>
          {title}
        </h4>
      {/if}
      {#if descriptionChildren}
        {@render descriptionChildren({
          props: { class: "bx--data-table-header__description" },
        })}
      {:else if description}
        <p id={descriptionId} class:bx--data-table-header__description={true}>
          {description}
        </p>
      {/if}
      {#if decorator}
        <Decorator
          class="bx--data-table-header__decorator"
          state={titleAILabelState}
          labelSize="xs"
        >
          {@render decorator()}
        </Decorator>
      {/if}
    </div>
  {/if}
  {@render children?.()}
  <div
    bind:this={scrollContainerRef}
    use:formReset={handleFormReset}
    class:bx--data-table-virtual={virtualScrollContainer}
    style:max-height={virtualScrollContainer
      ? `${calculatedContainerHeight}px`
      : undefined}
    style:overflow-y={virtualScrollContainer ? "auto" : undefined}
    onscroll={virtualScrollContainer ? handleScroll : undefined}
  >
    <Table
      bind:ref={tableRef}
      zebra={zebra && !hideMode}
      size={effectiveSize}
      {stickyHeader}
      {sortable}
      {useStaticWidth}
      {fixedLayout}
      labelledBy={hasTitle ? titleId : undefined}
      describedBy={hasDescription ? descriptionId : undefined}
      aria-label={aria.ariaLabel}
      aria-labelledby={aria.ariaLabelledBy}
      aria-describedby={aria.ariaDescribedBy}
      tableStyle={tableStyle || undefined}
      containerStyle={stickyHeader && stickyHeaderMaxHeight != null
        ? `max-height: ${toCssLength(stickyHeaderMaxHeight)}`
        : undefined}
    >
      {#if hasCustomHeaderWidth}
        <colgroup>
          {#if rowDecorator}
            <col />
          {/if}
          {#if isExpandableTable}
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
      >
        <TableRow>
          {#if rowDecorator}
            <th scope="col" class:bx--table-column-decorator={true}>
              <span class:bx--visually-hidden={true}>AI label</span>
            </th>
          {/if}
          {#if isExpandableTable}
            <th
              scope="col"
              id="{id}-expand"
              class:bx--table-expand={true}
              data-previous-value={allExpanded ? "collapsed" : undefined}
            >
              {#if batchExpansion}
                <button
                  type="button"
                  class:bx--table-expand__button={true}
                  aria-label={translateWithId(
                    allExpanded ? "collapseAll" : "expandAll",
                  )}
                  aria-expanded={allExpanded}
                  aria-controls={expandableRowIds
                    .map((rowId) => `${id}-expandable-row-${rowId}`)
                    .join(" ")}
                  onclick={toggleAllExpanded}
                >
                  {#if expandIcon}
                    {@render expandIcon({
                      expanded: allExpanded,
                      row: undefined,
                      props: expandIconProps,
                    })}
                  {:else}
                    <ChevronRight {...expandIconProps} />
                  {/if}
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
              class:bx--table-column-checkbox={true}
              class:bx--table-column-radio={radio}
            >
              <span class:bx--visually-hidden={true}
                >{translateWithId("selectRow")}</span
              >
            </th>
          {/if}
          {#if batchSelection && !radio}
            <th scope="col" class:bx--table-column-checkbox={true}>
              <InlineCheckbox
                id="{id}-select-all"
                aria-label={translateWithId("selectAll")}
                name="{id}-select-all"
                value="all"
                checked={selectAll}
                {indeterminate}
                on:change={handleSelectAllChange}
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
                  >{#if header.value}<span class:bx--visually-hidden={true}
                      >{header.value}</span
                    >{/if}</th
                >
              {:else}
                <th scope="col" style={formatHeaderWidth(header)}>
                  <div class:bx--table-header-label={true}>
                    {#if header.value}<span class:bx--visually-hidden={true}
                        >{header.value}</span
                      >{/if}
                  </div>
                </th>
              {/if}
            {:else if headerDecorator}
              <TableHeader
                id="{id}-{header.key}"
                class={formatAlignClass(header.columnAlign)}
                style={formatHeaderWidth(header)}
                sortable={isHeaderSortable(header)}
                sortDirection={sortKey === header.key ? sortDirection : "none"}
                active={sortKey === header.key}
                {...tableHeaderTranslateWithId
                  ? { translateWithId: tableHeaderTranslateWithId }
                  : {}}
                on:click={(event) => handleHeaderClick(event, header)}
              >
                {#if cellHeader}
                  {@render cellHeader({ header })}
                {:else}
                  {header.value}
                {/if}
                <svelte:fragment slot="decorator">
                  {@render headerDecorator({ header })}
                </svelte:fragment>
              </TableHeader>
            {:else}
              <TableHeader
                id="{id}-{header.key}"
                class={formatAlignClass(header.columnAlign)}
                style={formatHeaderWidth(header)}
                sortable={isHeaderSortable(header)}
                sortDirection={sortKey === header.key ? sortDirection : "none"}
                active={sortKey === header.key}
                {...tableHeaderTranslateWithId
                  ? { translateWithId: tableHeaderTranslateWithId }
                  : {}}
                on:click={(event) => handleHeaderClick(event, header)}
              >
                {#if cellHeader}
                  {@render cellHeader({ header })}
                {:else}
                  {header.value}
                {/if}
              </TableHeader>
            {/if}
          {/each}
        </TableRow>
      </TableHead>
      <tbody use:keepRowFocus={{ enabled: !isVirtualized }}>
        {#if isVirtualized && rowOffset > 0}
          <tr style:height="{virtualData?.offsetY}px">
            <td colspan={totalColumns} class:bx--table-cell={true}></td>
          </tr>
        {/if}
        <!-- Keyed by row: a sort or filter only moves or removes rows. -->
        {#each rowsToRender as row, index (row.id)}
          {@const rowIndex = rowOffset + index}
          {@const isSelected = selectedRowIdsSet.has(row.id)}
          {@const isExpanded = expandedRowIdsSet.has(row.id)}
          {@const isExpandable = !nonExpandableRowIdsSet.has(row.id)}
          {@const isSelectable = !nonSelectableRowIdsSet.has(row.id)}
          {@const isHidden = hideMode && !matchedRowIdsSet.has(row.id)}
          {@const rowClassValue =
            typeof rowClass === "function"
              ? rowClass({
                  row,
                  rowIndex,
                  selected: isSelected,
                  expanded: isExpanded,
                })
              : rowClass}
          <tr
            data-row={row.id}
            data-parent-row={isExpandableTable ? true : undefined}
            hidden={isHidden ? true : undefined}
            data-zebra-even={zebraVisibleEvenIds?.has(row.id) ? "" : undefined}
            class={[
              isSelected && "bx--data-table--selected",
              isExpanded && "bx--expandable-row",
              isExpandableTable && "bx--parent-row",
              isExpandableTable &&
                parentRowId === row.id &&
                "bx--expandable-row--hover",
              highlightedRowIdsSet.has(row.id) &&
                "bx--data-table--highlighted-row",
              isExpandableTable &&
                isSelectionEnabled &&
                "bx--expandable-row--with-selection",
              rowAILabelStates.get(row.id) === "active" &&
                "bx--data-table--ai-label-row",
              rowClassValue,
            ]}
            onclick={(event) => {
              // Skip clicks on an overflow menu, a checkbox, or a radio button.
              if (shouldIgnoreRowClick(event.target)) return;
              onrowclick?.({
                row,
                target: event.target,
                currentTarget: event.currentTarget,
              });
            }}
            onmouseenter={() => onrowmouseenter?.(row)}
            onmouseleave={() => onrowmouseleave?.(row)}
          >
            {#if rowDecorator}
              <td
                class="bx--table-column-decorator"
                class:bx--table-cell={true}
              >
                <Decorator
                  class="bx--table-column-decorator__inner"
                  state={rowAILabelState(row.id)}
                  labelAlign="start"
                >
                  {@render rowDecorator({ row })}
                </Decorator>
              </td>
            {/if}
            {#if isExpandableTable}
              <td
                class="bx--table-expand"
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
                    aria-label={translateWithId(
                      isExpanded ? "collapseRow" : "expandRow",
                    )}
                    aria-expanded={isExpanded}
                    onclick={(event) => {
                      event.stopPropagation();
                      toggleRowExpanded(row);
                    }}
                  >
                    {#if expandIcon}
                      {@render expandIcon({
                        expanded: isExpanded,
                        row: row,
                        props: expandIconProps,
                      })}
                    {:else}
                      <ChevronRight {...expandIconProps} />
                    {/if}
                  </button>
                {/if}
              </td>
            {/if}
            {#if isSelectionEnabled}
              <td
                class:bx--table-cell={true}
                class:bx--table-column-checkbox={true}
                class:bx--table-column-radio={radio}
                onclick={(event) => handleRadioColumnClick(row, event)}
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
                        onchange={() => {
                          selectedRowIds = [row.id];
                          onrowselect?.({ row, selected: true });
                        }}
                      />
                      <label class:bx--radio-button__label={true} for={inputId}>
                        <span class:bx--radio-button__appearance={true}></span>
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
                        onclick={(event) => {
                          const checked = event.currentTarget.checked;
                          const usedRange =
                            event.shiftKey &&
                            rangeAnchorRowId !== null &&
                            selectRowRange(rowIndex, checked);
                          if (!usedRange) toggleRowSelected(row, checked);
                          rangeAnchorRowId = row.id;
                          onrowselect?.({ row, selected: checked });
                        }}
                      />
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                      <label
                        for={inputId}
                        class:bx--checkbox-label={true}
                        onclick={(event) =>
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
            {#each cellsFor(row) as rowCell, cellIndex (rowCell.key)}
              <td
                class={joinClasses(
                  formatAlignClass(rowCell.columnAlign),
                  resolveCellClass(cellClass, {
                    row,
                    cell: rowCell,
                    rowIndex,
                    cellIndex,
                    selected: isSelected,
                    expanded: isExpanded,
                  }),
                )}
                class:bx--table-cell={true}
                class:bx--table-column-menu={rowCell.empty &&
                  rowCell.columnMenu}
                class:bx--table-cell--column-ai-label={aiLabelColumns.has(
                  `${id}-${rowCell.key}`,
                )}
                headers={rowCell.empty ? undefined : `${id}-${rowCell.key}`}
                onclick={(event) => {
                  if (rowCell.empty) return;
                  oncellclick?.({
                    row,
                    cell: rowCell,
                    target: event.target,
                    currentTarget: event.currentTarget,
                  });
                }}
              >
                {#if cell}
                  {@render cell({
                    row,
                    cell: rowCell,
                    rowIndex,
                    cellIndex,
                    rowSelected: isSelected,
                    rowExpanded: isExpanded,
                  })}
                {:else}
                  {rowCell.display
                    ? rowCell.display(rowCell.value, row)
                    : rowCell.value}
                {/if}
              </td>
            {/each}
          </tr>

          {#if isExpandableTable}
            <tr
              id="{id}-expandable-row-{row.id}"
              data-child-row
              hidden={isHidden ? true : undefined}
              class:bx--expandable-row={true}
              onmouseenter={() => {
                if (isExpandable) parentRowId = row.id;
              }}
              onmouseleave={() => {
                if (isExpandable) parentRowId = null;
              }}
            >
              {#if isExpanded && isExpandable}
                <td colspan={totalColumns} class:bx--table-cell={true}>
                  <div class:bx--child-row-inner-container={true}>
                    {@render expandedRow?.({ row, rowSelected: isSelected })}
                  </div>
                </td>
              {/if}
            </tr>
          {/if}
        {/each}
        {#if virtualConfig && virtualData && virtualData.endIndex < rowsToVirtualize.length}
          <tr
            style:height="{virtualData.totalHeight -
              virtualData.endIndex * virtualConfig.itemHeight}px"
          >
            <td colspan={totalColumns} class:bx--table-cell={true}></td>
          </tr>
        {/if}
      </tbody>
      {#if footerCell}
        <TableFoot>
          <TableRow>
            {#if rowDecorator}
              <td
                aria-hidden="true"
                class:bx--table-cell={true}
                class:bx--table-column-decorator={true}
              ></td>
            {/if}
            {#if isExpandableTable}
              <td
                aria-hidden="true"
                class:bx--table-cell={true}
                class:bx--table-expand={true}
              ></td>
            {/if}
            {#if isSelectionEnabled}
              <td
                aria-hidden="true"
                class:bx--table-cell={true}
                class:bx--table-column-checkbox={true}
                class:bx--table-column-radio={radio}
              ></td>
            {/if}
            {#each visibleHeaders as header, index (header.key)}
              <td
                class={formatAlignClass(header.columnAlign)}
                class:bx--table-cell={true}
              >
                {@render footerCell({ header, index })}
              </td>
            {/each}
          </TableRow>
        </TableFoot>
      {/if}
    </Table>
  </div>
  <span role="status" aria-live="polite" class:bx--visually-hidden={true}
    >{sortStatus}</span
  >
</TableContainer>
