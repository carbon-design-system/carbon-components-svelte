<script>
  /**
   * @event {{ id: string; label: string; expanded: boolean }} toggle:row - Fires after a row group opens or closes.
   * @event {{ id: string; label: string; expanded: boolean }} toggle:column - Fires after a column group opens or closes.
   * @event {{ row: import("./pivot.js").PivotNode; column: import("./pivot.js").PivotNode; value: number | null; valueIndex: number; rowPath: string[]; columnPath: string[]; records: any[] }} drill - Fires when a value cell is activated. Cancelable: call `preventDefault()` to keep the built-in side panel closed.
   * @event {{ error: Error }} pivot:error - Fires when the data cannot be pivoted, such as when it has more groups than `maxCells` allows.
   * @restProps {div}
   * @slot {{ error: Error }} error - Replaces the message shown when the data cannot be pivoted.
   * @slot {{}} empty - Replaces `emptyText`, shown when no record passes the filters.
   * @slot {{}} toolbar - Buttons after the expand, collapse and export actions.
   */

  /**
   * Specify the flat records to pivot. Assign a new array to re-pivot;
   * editing a record in place is not seen.
   * @type {ReadonlyArray<Record<string, any>>}
   */
  export let records = [];

  /**
   * Specify which fields are the rows, the columns, the values and the filters.
   * A row or column is a field key or an object with `label`, `group`,
   * `formatKey` and `sort`. A value is `{ field, aggregate, label, format }`.
   * @type {import("./pivot.js").PivotConfig}
   * @bindable writable
   */
  export let config = {};

  /**
   * Specify the field names shown in headers.
   * A field without an entry shows its key.
   * @type {ReadonlyArray<{ key: string; label?: string }>}
   */
  export let fields = [];

  /**
   * The ids of the open row groups. A group is closed unless listed.
   * Ids come from the pivot nodes and survive a data change.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let expandedRowIds = [];

  /**
   * The ids of the open column groups.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let expandedColumnIds = [];

  /**
   * Specify the locale for number formats and label order.
   * It defaults to `"en"` so the server and the browser format alike.
   */
  export let locale = "en";

  /**
   * Set the row height, as for `DataTable`.
   * @type {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to use zebra styles */
  export let zebra = false;

  /** Set to `false` to hide the grand total row and column */
  export let grandTotals = true;

  /**
   * Specify the height of the scrolling area. Numbers are pixels.
   * The headers stay in view while the body scrolls. Without a height
   * the table grows with its rows and only scrolls sideways.
   * @type {number | string | undefined}
   */
  export let height = undefined;

  /**
   * Specify the width of the row header column. Numbers are pixels.
   * @type {number | string | undefined}
   */
  export let rowHeaderWidth = undefined;

  /**
   * Specify the name of the table.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /** Set to `true` to hide the label visually. It still names the table. */
  export let hideLabel = false;

  /**
   * Specify the corner cell text. Defaults to the row field names.
   * @type {string | undefined}
   */
  export let rowHeaderText = undefined;

  /** Specify the header of the grand total row and column */
  export let grandTotalText = "Grand total";

  /**
   * Specify the header of an open column group's subtotal.
   * @type {(label: string) => string}
   */
  export let subtotalText = (label) => `${label} total`;

  /** Specify the label of the group for a missing value */
  export let blankLabel = "(blank)";

  /** Specify the accessible name of a cell with no records */
  export let emptyCellText = "No data";

  /** Specify the text shown when no record passes the filters */
  export let emptyText = "No records to pivot.";

  /**
   * Specify the text shown when the data cannot be pivoted.
   * @type {(error: Error) => string}
   */
  export let errorText = (error) => error.message;

  /**
   * Specify the largest pivot, as row groups x column groups x values.
   * A larger one is not computed and fires `pivot:error`.
   */
  export let maxCells = 1000000;

  /** Set to `true` to hide the toolbar */
  export let hideToolbar = false;

  /**
   * Specify the toolbar's accessible name. Defaults to the table's label
   * followed by "actions".
   * @type {string | undefined}
   */
  export let toolbarLabelText = undefined;

  /** Specify the label of the expand all button */
  export let expandAllText = "Expand all";

  /** Specify the label of the collapse all button */
  export let collapseAllText = "Collapse all";

  /** Specify the label of the export button */
  export let exportText = "Export CSV";

  /**
   * Specify the announcement after a group opens or closes.
   * @type {(label: string, expanded: boolean, rows: number) => string}
   */
  export let toggleDescription = (label, expanded, rows) =>
    `${label} ${expanded ? "expanded" : "collapsed"}, ${rows} ${rows === 1 ? "row" : "rows"}`;

  /**
   * Set to `false` to skip the side panel that lists the records behind a cell.
   * The `drill` event still fires.
   */
  export let drillDown = true;

  /**
   * Specify the record fields the drill-down lists.
   * Defaults to the keys of the first record.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let drillFields = undefined;

  /** Specify the most records the drill-down lists */
  export let drillLimit = 200;

  /**
   * Specify the drill-down panel title.
   * @type {(rowPath: string[], columnPath: string[]) => string}
   */
  export let drillTitleText = (rowPath, columnPath) =>
    [...rowPath, ...columnPath].join(" / ");

  /**
   * Specify the drill-down record count.
   * @type {(shown: number, total: number) => string}
   */
  export let drillSummaryText = (shown, total) =>
    shown < total
      ? `Showing ${shown} of ${total} records`
      : `${total} ${total === 1 ? "record" : "records"}`;

  /** Specify the accessible name of the drill-down table */
  export let drillTableLabel = "Records";

  /** Specify the id of the table. Inner ids derive from it. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the scrolling element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Toolbar from "../DataTable/Toolbar.svelte";
  import ToolbarContent from "../DataTable/ToolbarContent.svelte";
  import SidePanel from "../SidePanel/SidePanel.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { toCssLength } from "../utils/css-length.js";
  import { downloadFile } from "../utils/download-file.js";
  import { inlineKey } from "../utils/inline-direction.js";
  import { getLayoutDirection } from "../utils/layout-direction.js";
  import {
    DATA_TABLE_SIZE_ALIASES,
    normalizeSize,
  } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    createPivotFormatter,
    groupIds,
    layoutPivot,
    pivotToCsv,
  } from "./pivot-layout.js";
  import { pivot } from "./pivot.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /**
   * @param {ReadonlyArray<any>} records
   * @param {import("./pivot.js").PivotConfig} config
   * @param {import("./pivot.js").PivotOptions} options
   */
  function compute(records, config, options) {
    try {
      return { result: pivot(records, config, options), error: undefined };
    } catch (error) {
      return {
        result: undefined,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /** @type {import("./pivot.js").PivotResult | undefined} */
  let result;
  /** @type {Error | undefined} */
  let error;

  /** @type {string | undefined} */
  let ariaLabel;
  /** @type {string | undefined} */
  let ariaLabelledBy;
  /** @type {string | undefined} */
  let ariaDescribedBy;
  /** @type {Record<string, any>} */
  let rootProps;

  // The name and description belong on the treegrid, not the wrapper.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: rootProps,
  } = splitAriaNaming($$restProps));

  $: labels = Object.fromEntries(
    fields.map((field) => [field.key, field.label ?? field.key]),
  );
  $: ({ result, error } = compute(records, config, {
    locale,
    blankLabel,
    maxCells,
    labels,
  }));
  // Svelte 3 and 4 attach a parent's listeners after the child initializes,
  // so an event from the first run would be lost. Wait for the mount.
  let mounted = false;
  onMount(() => {
    mounted = true;
  });
  $: if (mounted && error) dispatch("pivot:error", { error });

  $: expandedRowSet = new Set(expandedRowIds);
  $: expandedColumnSet = new Set(expandedColumnIds);

  // Opening or closing a group changes only these three; `pivot` is not run.
  $: layout = result
    ? layoutPivot(result, {
        expandedRowIds: expandedRowSet,
        expandedColumnIds: expandedColumnSet,
        grandTotals,
        grandTotalText,
        subtotalText,
        rowHeaderText,
      })
    : undefined;
  /** @type {(value: number | null, index?: number) => string} */
  let formatter = (value) => (value === null ? "" : String(value));
  $: if (result) formatter = createPivotFormatter(result.values, locale);

  /**
   * @param {import("./pivot.js").PivotResult} result
   * @param {import("./pivot-layout.js").PivotLayoutRow} row
   * @param {import("./pivot-layout.js").PivotLayoutColumn} column
   * @param {(value: number | null, index?: number) => string} format
   */
  function cellText(result, row, column, format) {
    return format(
      result.get(row.node, column.node, column.value),
      column.value,
    );
  }

  $: effectiveSize = normalizeSize(size, DATA_TABLE_SIZE_ALIASES);
  $: labelId = `${id}-label`;
  let liveText = "";

  // ---- Expansion ------------------------------------------------------

  /**
   * @param {"row" | "column"} axis
   * @param {string} nodeId
   * @param {string} label
   * @param {boolean} expanded
   */
  function setExpanded(axis, nodeId, label, expanded) {
    const ids = axis === "row" ? expandedRowIds : expandedColumnIds;
    const has = ids.includes(nodeId);
    if (has === expanded) return;
    const next = expanded ? [...ids, nodeId] : ids.filter((x) => x !== nodeId);
    if (axis === "row") expandedRowIds = next;
    else expandedColumnIds = next;
    dispatch(`toggle:${axis}`, { id: nodeId, label, expanded });
    announce(axis, label, expanded);
  }

  /**
   * @param {"row" | "column"} axis
   * @param {string} label
   * @param {boolean} expanded
   */
  async function announce(axis, label, expanded) {
    await tick();
    if (!layout) return;
    liveText = toggleDescription(
      label,
      expanded,
      axis === "row" ? layout.rows.length : layout.columns.length,
    );
  }

  /** Open every row and column group. */
  export function expandAll() {
    if (!result) return;
    expandedRowIds = groupIds(result.rowRoot);
    expandedColumnIds = groupIds(result.columnRoot);
  }

  /** Close every row and column group. */
  export function collapseAll() {
    expandedRowIds = [];
    expandedColumnIds = [];
  }

  /**
   * Serialize the visible pivot as CSV.
   * @param {import("./pivot-layout.js").PivotCsvOptions} [options]
   * @returns {string}
   */
  export function toCsv(options = {}) {
    if (!result || !layout) return "";
    return pivotToCsv(result, layout, { locale, ...options });
  }

  /**
   * Download the visible pivot as a CSV file.
   * @param {string} [filename]
   * @param {import("./pivot-layout.js").PivotCsvOptions} [options]
   */
  export function downloadCsv(filename = "pivot.csv", options = {}) {
    downloadFile(toCsv(options), filename, "text/csv;charset=utf-8");
  }

  // ---- Drill-down -----------------------------------------------------

  let drillOpen = false;
  /** @type {any[]} */
  let drillRecords = [];
  let drillTitle = "";
  /** @type {string[]} */
  let drillColumns = [];

  /**
   * @param {import("./pivot-layout.js").PivotLayoutRow} row
   * @param {import("./pivot-layout.js").PivotLayoutColumn} column
   */
  function drill(row, column) {
    if (!result) return;
    const records = result.records(row.node, column.node);
    if (records.length === 0) return;
    const rowPath = pathOf(result.rowNodes, row.node, row.label);
    const columnPath = pathOf(result.columnNodes, column.node, grandTotalText);
    if (result.values.length > 1)
      columnPath.push(result.values[column.value].label);
    const proceed = dispatch(
      "drill",
      {
        row: row.node,
        column: column.node,
        value: result.get(row.node, column.node, column.value),
        valueIndex: column.value,
        rowPath,
        columnPath,
        records,
      },
      { cancelable: true },
    );
    if (!proceed || !drillDown) return;
    drillRecords = records;
    drillTitle = drillTitleText(rowPath, columnPath);
    drillColumns = drillFields
      ? [...drillFields]
      : Object.keys(records[0] ?? {});
    drillOpen = true;
  }

  /**
   * The labels from the outermost group down to `node`.
   * @param {import("./pivot.js").PivotNode[]} nodes
   * @param {import("./pivot.js").PivotNode} node
   * @param {string} grand
   * @returns {string[]}
   */
  function pathOf(nodes, node, grand) {
    /** @type {string[]} */
    const path = [];
    for (let n = node; n.level >= 0; n = nodes[n.parent]) path.unshift(n.label);
    if (path.length === 0 && grand) path.push(grand);
    return path;
  }

  // ---- Keyboard -------------------------------------------------------

  // The tab stop, in table coordinates: header rows first, then body rows.
  // It is set by focus and by the arrow keys; it is never read back from a
  // layout, so the table can change under it.
  let focusRow = Number.POSITIVE_INFINITY;
  let focusCol = 0;

  /** @type {null | HTMLTableElement} */
  let tableRef = null;

  $: headerRowCount = layout?.headerRowCount ?? 0;
  $: bodyRowCount = layout?.rows.length ?? 0;
  $: columnCount = layout?.columnCount ?? 1;
  // Start on the first body cell; keep the stop on a cell that still exists.
  $: tabRow = Math.min(
    Math.max(focusRow, 0),
    headerRowCount + bodyRowCount - 1,
  );
  $: tabCol = Math.min(focusCol, columnCount - 1);
  $: tabHeader =
    layout && tabRow < headerRowCount
      ? layout.headerCellAt(tabRow, tabCol)
      : undefined;

  // The tab stop in the body is set on the element, not bound per cell: a
  // bound `tabindex` re-checks every cell on each arrow key (about 0.75 us
  // each, 50 ms at 67,000 cells). Only the first row header is rendered with
  // `tabindex="0"`, so the server HTML has its one stop.
  /** @type {HTMLElement | null} */
  let stopEl = null;

  function syncStop() {
    if (!tableRef || !layout) return;
    const first = tableRef.tBodies[0]?.rows[0]?.cells[0] ?? null;
    const target =
      focusRow === Number.POSITIVE_INFINITY
        ? first
        : tabRow >= headerRowCount
          ? (cellAt(tabRow, tabCol) ?? null)
          : null;
    for (const el of [stopEl, first]) {
      if (el && el !== target && el.getAttribute("tabindex") === "0") {
        el.tabIndex = -1;
      }
    }
    if (target) target.tabIndex = 0;
    stopEl = target;
  }

  // After the DOM catches up with a new layout or focus position.
  $: scheduleStop(layout, tabRow, tabCol, focusRow);

  /**
   * @param {...unknown} _
   */
  function scheduleStop(..._) {
    queueMicrotask(syncStop);
  }

  /**
   * @param {HTMLElement} cell
   * @returns {{ row: number; col: number } | undefined}
   */
  function locate(cell) {
    const header = cell.dataset.pvr;
    if (header !== undefined) {
      return { row: Number(header), col: Number(cell.dataset.pvc) };
    }
    const tr = /** @type {HTMLElement | null} */ (cell.closest("tr"));
    if (!tr || tr.dataset.pvr === undefined) return undefined;
    return {
      row: headerRowCount + Number(tr.dataset.pvr),
      col: /** @type {HTMLTableCellElement} */ (cell).cellIndex,
    };
  }

  /**
   * @param {number} row
   * @param {number} col
   * @returns {HTMLElement | null | undefined}
   */
  function cellAt(row, col) {
    if (!tableRef) return null;
    if (row < headerRowCount) {
      return tableRef.querySelector(`[data-pvr="${row}"][data-pvc="${col}"]`);
    }
    return /** @type {HTMLElement | undefined} */ (
      tableRef.tBodies[0]?.rows[row - headerRowCount]?.cells[col]
    );
  }

  /**
   * Move focus to the cell that covers (row, col).
   * @param {number} row
   * @param {number} col
   */
  async function focusCell(row, col) {
    if (!layout) return;
    let r = Math.max(0, Math.min(row, headerRowCount + bodyRowCount - 1));
    let c = Math.max(0, Math.min(col, columnCount - 1));
    if (r < headerRowCount) {
      const cell = layout.headerCellAt(r, c);
      r = cell.row;
      c = cell.col;
    }
    focusRow = r;
    focusCol = c;
    await tick();
    const cell = cellAt(r, c);
    if (!cell) return;
    cell.focus({ preventScroll: true });
    reveal(cell, r < headerRowCount, c === 0);
  }

  /**
   * Scroll a focused cell clear of the sticky header rows and the sticky
   * first column. The browser scrolls a cell into the scrollport and ignores
   * what is pinned over it, so a cell it considers visible can sit under the
   * header; `scroll-padding` covers some cases and not this one.
   * @param {HTMLElement} cell
   * @param {boolean} inHeader - The cell is pinned vertically.
   * @param {boolean} inFirstColumn - The cell is pinned horizontally.
   */
  function reveal(cell, inHeader, inFirstColumn) {
    if (!ref) return;
    const scroller = ref.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    if (!inHeader) {
      const top = scroller.top + (tableRef?.tHead?.offsetHeight ?? 0);
      const bottom = scroller.top + ref.clientHeight;
      if (box.top < top) ref.scrollTop -= top - box.top;
      else if (box.bottom > bottom) ref.scrollTop += box.bottom - bottom;
    }
    if (!inFirstColumn) {
      const rtl = getComputedStyle(ref).direction === "rtl";
      const pinned =
        tableRef?.tBodies[0]?.rows[0]?.cells[0]?.offsetWidth ??
        tableRef?.tHead?.rows[0]?.cells[0]?.offsetWidth ??
        0;
      const left = scroller.left + ref.clientLeft + (rtl ? 0 : pinned);
      const right =
        scroller.left + ref.clientLeft + ref.clientWidth - (rtl ? pinned : 0);
      // Scrolling right moves the content left, in either direction.
      if (box.left < left) ref.scrollLeft -= left - box.left;
      else if (box.right > right) ref.scrollLeft += box.right - right;
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const cell = /** @type {HTMLElement} */ (event.target).closest("td, th");
    if (!(cell instanceof HTMLElement)) return;
    const at = locate(cell);
    if (at) {
      focusRow = at.row;
      focusCol = at.col;
    }
  }

  /**
   * @param {HTMLElement} cell
   * @param {number} row
   * @param {number} col
   */
  function toggleAt(cell, row, col) {
    if (!layout) return false;
    if (row < headerRowCount) {
      const header = layout.headerCellAt(row, col);
      if (!header.expandable || !header.node) return false;
      setExpanded("column", header.node.id, header.text, !header.expanded);
      return true;
    }
    const bodyRow = layout.rows[row - headerRowCount];
    if (col !== 0 || !bodyRow?.expandable) return false;
    setExpanded("row", bodyRow.id, bodyRow.label, !bodyRow.expanded);
    return true;
  }

  /**
   * @param {number} row
   * @param {number} col
   */
  function activate(row, col) {
    if (!layout) return;
    if (row < headerRowCount || col === 0) return;
    const bodyRow = layout.rows[row - headerRowCount];
    const column = layout.columns[col - 1];
    if (bodyRow && column) drill(bodyRow, column);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const cell = /** @type {HTMLElement} */ (event.target).closest("td, th");
    if (!(cell instanceof HTMLElement) || !layout) return;
    const at = locate(cell);
    if (!at) return;
    const { row, col } = at;
    const key = inlineKey(event.key, $layoutDirection, tableRef);
    const lastRow = headerRowCount + bodyRowCount - 1;
    const lastCol = columnCount - 1;

    // Header cells span; step past the cell under focus.
    const covered =
      row < headerRowCount ? layout.headerCellAt(row, col) : undefined;
    const rowSpan = covered?.rowSpan ?? 1;
    const colSpan = covered?.colSpan ?? 1;

    if (event.shiftKey && (key === "ArrowRight" || key === "ArrowLeft")) {
      event.preventDefault();
      const open = key === "ArrowRight";
      if (row < headerRowCount) {
        const header = layout.headerCellAt(row, col);
        if (header.expandable && header.node) {
          setExpanded("column", header.node.id, header.text, open);
        }
      } else {
        const bodyRow = layout.rows[row - headerRowCount];
        if (col === 0 && bodyRow?.expandable) {
          setExpanded("row", bodyRow.id, bodyRow.label, open);
        }
      }
      return;
    }
    if (event.altKey || event.metaKey) return;

    /** @type {[number, number] | undefined} */
    let target;
    switch (key) {
      case "ArrowRight":
        target = [row, col + colSpan];
        break;
      case "ArrowLeft":
        target = [row, col - 1];
        break;
      case "ArrowDown":
        target = [row + rowSpan, col];
        break;
      case "ArrowUp":
        target = [row - 1, col];
        break;
      case "Home":
        target = event.ctrlKey ? [0, 0] : [row, 0];
        break;
      case "End":
        target = event.ctrlKey ? [lastRow, lastCol] : [row, lastCol];
        break;
      case "PageDown":
      case "PageUp": {
        const rowHeight = cell.offsetHeight || 32;
        const page = Math.max(
          1,
          Math.floor((ref?.clientHeight ?? rowHeight * 10) / rowHeight) -
            headerRowCount,
        );
        // A page up from the body stops at the first body row; the header
        // rows are one arrow key away.
        target = [
          Math.max(
            row + (key === "PageDown" ? page : -page),
            row >= headerRowCount ? headerRowCount : 0,
          ),
          col,
        ];
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        if (!toggleAt(cell, row, col)) activate(row, col);
        return;
      default:
        return;
    }
    event.preventDefault();
    if (target[0] > lastRow || target[1] > lastCol) {
      target = [Math.min(target[0], lastRow), Math.min(target[1], lastCol)];
    }
    focusCell(target[0], target[1]);
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    const cell = /** @type {HTMLElement} */ (event.target).closest("td, th");
    if (!(cell instanceof HTMLElement)) return;
    const at = locate(cell);
    if (!at) return;
    if (!toggleAt(cell, at.row, at.col)) activate(at.row, at.col);
  }
</script>

<div
  {...rootProps}
  class={[
    "bx--pivot-table",
    effectiveSize &&
      `bx--pivot-table--${effectiveSize === "medium" ? "md" : effectiveSize}`,
    rootProps.class,
  ]
    .filter(Boolean)
    .join(" ")}
>
  {#if labelText}
    <div
      id={labelId}
      class:bx--pivot-table__label-text={true}
      class:bx--visually-hidden={hideLabel}
    >
      {labelText}
    </div>
  {/if}
  {#if !hideToolbar && layout}
    <Toolbar
      ariaLabel={toolbarLabelText ??
        (labelText ? `${labelText} actions` : "Pivot table actions")}
      size={effectiveSize === "compact" || effectiveSize === "short"
        ? "sm"
        : "default"}
    >
      <ToolbarContent>
        <Button kind="ghost" size="sm" on:click={expandAll}
          >{expandAllText}</Button
        >
        <Button kind="ghost" size="sm" on:click={collapseAll}
          >{collapseAllText}</Button
        >
        <Button kind="ghost" size="sm" on:click={() => downloadCsv()}
          >{exportText}</Button
        >
        <slot name="toolbar" />
      </ToolbarContent>
    </Toolbar>
  {/if}
  {#if error}
    <div class:bx--pivot-table__message={true} role="alert">
      <slot name="error" {error}>{errorText(error)}</slot>
    </div>
  {:else if result && layout && result.recordCount > 0}
    <div
      bind:this={ref}
      class:bx--pivot-table__scroll={true}
      style:--ccs-pivot-max-height={toCssLength(height)}
      style:--ccs-pivot-header-width={toCssLength(rowHeaderWidth)}
      style:--ccs-pivot-header-rows={layout.headerRowCount}
    >
      <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
      <table
        bind:this={tableRef}
        {id}
        role="treegrid"
        aria-readonly="true"
        aria-labelledby={ariaLabelledBy ??
          (labelText && !ariaLabel ? labelId : undefined)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        class:bx--data-table={true}
        class:bx--pivot-table__table={true}
        class:bx--data-table--compact={effectiveSize === "compact"}
        class:bx--data-table--short={effectiveSize === "short"}
        class:bx--data-table--md={effectiveSize === "medium"}
        class:bx--data-table--tall={effectiveSize === "tall"}
        class:bx--data-table--zebra={zebra}
        on:focusin={handleFocusin}
        on:keydown={handleKeydown}
        on:click={handleClick}
      >
        <thead>
          {#each layout.headerRows as cells, r (r)}
            <tr style:--ccs-pivot-header-row={r}>
              {#each cells as cell (cell.id)}
                <th
                  role="columnheader"
                  scope={cell.colSpan > 1 ? "colgroup" : "col"}
                  colspan={cell.colSpan > 1 ? cell.colSpan : undefined}
                  rowspan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                  aria-expanded={cell.expandable ? cell.expanded : undefined}
                  tabindex={cell === tabHeader ? 0 : -1}
                  data-pvr={cell.row}
                  data-pvc={cell.col}
                  class:bx--pivot-table__header={true}
                  class:bx--pivot-table__header--corner={cell.kind === "corner"}
                  class:bx--pivot-table__header--leaf={cell.kind === "leaf" ||
                    (cell.kind === "group" && !cell.expanded)}
                  class:bx--pivot-table__header--value={cell.kind === "value"}
                  class:bx--pivot-table__header--total={cell.kind ===
                    "subtotal" || cell.kind === "grand"}
                  class:bx--pivot-table__header--toggle={cell.expandable}
                >
                  {#if cell.expandable}
                    <span class="bx--pivot-table__label">
                      <ChevronRight
                        class="bx--pivot-table__chevron {cell.expanded
                          ? 'bx--pivot-table__chevron--expanded'
                          : ''}"
                      />
                      {cell.text}
                    </span>
                  {:else}
                    {cell.text}
                  {/if}
                </th>
              {/each}
            </tr>
          {/each}
        </thead>
        <tbody>
          {#each layout.rows as row, ri (row.id)}
            <tr
              data-pvr={ri}
              aria-level={row.level + 1}
              aria-posinset={row.posInSet}
              aria-setsize={row.setSize}
              aria-expanded={row.expandable ? row.expanded : undefined}
              class:bx--pivot-table__row--group={row.kind === "group"}
              class:bx--pivot-table__row--grand={row.kind === "grand"}
            >
              <td
                role="rowheader"
                class:bx--table-cell={true}
                tabindex={ri === 0 ? 0 : -1}
                class:bx--pivot-table__row-header={true}
                class:bx--pivot-table__row-header--toggle={row.expandable}
              >
                <span
                  class="bx--pivot-table__label"
                  style:--ccs-pivot-level={row.level}
                >
                  {#if row.expandable}
                    <ChevronRight
                      class="bx--pivot-table__chevron {row.expanded
                        ? 'bx--pivot-table__chevron--expanded'
                        : ''}"
                    />
                  {:else}
                    <span class="bx--pivot-table__chevron-space"></span>
                  {/if}
                  {row.label}
                </span>
              </td>
              {#each layout.columns as column, ci (column.id)}
                {@const text = cellText(result, row, column, formatter)}
                <td
                  role="gridcell"
                  class:bx--table-cell={true}
                  tabindex="-1"
                  aria-label={text === "" ? emptyCellText : undefined}
                  class:bx--pivot-table__cell={true}
                  class:bx--pivot-table__cell--subtotal={column.kind ===
                    "subtotal"}
                  class:bx--pivot-table__cell--total={column.kind === "grand"}
                  class:bx--pivot-table__cell--empty={text === ""}
                >
                  {text === "" ? "—" : text}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class:bx--visually-hidden={true} aria-live="polite" role="status">
      {liveText}
    </div>
  {:else}
    <div class:bx--pivot-table__message={true}>
      <slot name="empty">{emptyText}</slot>
    </div>
  {/if}
</div>

{#if drillDown}
  <SidePanel
    bind:open={drillOpen}
    size="lg"
    includeOverlay
    title={drillTitle}
    subtitle={result
      ? drillSummaryText(
          Math.min(drillRecords.length, drillLimit),
          drillRecords.length,
        )
      : ""}
  >
    <!-- Focusable so a keyboard user can scroll the records. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      class="bx--pivot-table__drill"
      role="region"
      tabindex="0"
      aria-label={drillTableLabel}
    >
      <table
        class="bx--data-table bx--data-table--compact bx--data-table--zebra"
        aria-label={drillTableLabel}
      >
        <thead>
          <tr>
            {#each drillColumns as field (field)}
              <th scope="col">{labels[field] ?? field}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each drillRecords.slice(0, drillLimit) as record, i (i)}
            <tr>
              {#each drillColumns as field (field)}
                <td>{record[field] ?? "—"}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SidePanel>
{/if}
