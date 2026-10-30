<script>
  /**
   * @slot {{ row: DataGridRow; rowIndex: number; column: DataGridColumn; columnIndex: number; value: any; }} cell
   * @slot {{ column: DataGridColumn; columnIndex: number; }} columnHeader
   * @restProps {div}
   */

  /**
   * @typedef {Record<string, any>} DataGridRow
   */

  /**
   * @typedef {object} DataGridColumn
   * @property {string} key - The row property the column shows.
   * @property {string} [title] - The column header text. Defaults to `key`.
   * @property {number} [width] - Width in px. Defaults to `defaultColumnWidth`.
   * @property {"start" | "end" | "center"} [align] - Alignment of the cells. Logical, so `end` is the right edge in LTR and the left edge in RTL.
   * @property {(value: any, row: DataGridRow) => string} [format] - Text for a cell, shown and copied. Defaults to `String(value ?? "")`.
   */

  /**
   * @typedef {object} DataGridCell
   * @property {number} row - Zero-based index into `rows`.
   * @property {number} column - Zero-based index into `columns`.
   */

  /**
   * @typedef {object} DataGridRange
   * @property {number} startRow
   * @property {number} startColumn
   * @property {number} endRow - Inclusive.
   * @property {number} endColumn - Inclusive.
   */

  /**
   * The columns, in order. A column's `width` is a px number: the grid only
   * paints the columns in view, so it needs every width up front.
   * @type {ReadonlyArray<DataGridColumn>}
   */
  export let columns = [];

  /**
   * The rows. A cell shows `row[column.key]`. The grid never edits a row.
   * @type {ReadonlyArray<DataGridRow>}
   */
  export let rows = [];

  /**
   * The cell that takes keyboard focus, and the one a paste starts from.
   * Moving it with the keyboard or pointer updates the binding. To move it
   * from code and scroll it into view, call `focusCell`.
   * @type {DataGridCell | null}
   * @bindable writable
   */
  export let activeCell = { row: 0, column: 0 };

  /**
   * The selected rectangle of cells, or `null` while only the active cell is
   * selected.
   * @type {DataGridRange | null}
   * @bindable writable
   */
  export let selection = null;

  /**
   * Set the number of rows that stay under the column headers while the body scrolls.
   */
  export let frozenRows = 0;

  /**
   * Set the number of leading columns that stay in view while the body scrolls sideways.
   * They sit after the row headers.
   */
  export let frozenColumns = 0;

  /**
   * Set to `false` to hide the row header column.
   * Each row header names its row and selects it when clicked.
   */
  export let rowHeaders = true;

  /**
   * Specify the row height. `compact` is 24px, `short` 32px, `medium` 40px,
   * `default` 48px and `tall` 64px. Rows have one fixed height so the grid
   * can paint only the rows in view.
   * @type {"compact" | "short" | "medium" | "default" | "tall"}
   */
  export let size = "short";

  /**
   * Set the tallest the grid grows before it scrolls. A number is px, a
   * string is any CSS length.
   * @type {number | string}
   */
  export let height = 400;

  /**
   * Set the width in px of a column that sets none.
   */
  export let defaultColumnWidth = 120;

  /**
   * Set the width in px of the row header column. By default it fits the
   * largest row number.
   * @type {number | undefined}
   */
  export let rowHeaderWidth = undefined;

  /** Specify the accessible name of the grid. */
  export let labelText = "";

  /**
   * Override the row header text.
   * @type {(rowIndex: number) => string}
   */
  export let rowHeaderText = (rowIndex) => String(rowIndex + 1);

  /** Specify the accessible name of the corner cell, which selects every cell. */
  export let selectAllText = "Select all";

  /**
   * Override the text announced when the selection changes.
   * @type {(rows: number, columns: number) => string}
   */
  export let selectionText = (rows, columns) =>
    `${rows} ${rows === 1 ? "row" : "rows"} by ${columns} ${columns === 1 ? "column" : "columns"} selected`;

  /**
   * Override the text announced after a copy.
   * @type {(rows: number, columns: number) => string}
   */
  export let copiedText = (rows, columns) =>
    `Copied ${rows} ${rows === 1 ? "row" : "rows"} by ${columns} ${columns === 1 ? "column" : "columns"}`;

  /**
   * Override the text announced after a paste.
   * @type {(rows: number, columns: number) => string}
   */
  export let pastedText = (rows, columns) =>
    `Pasted ${rows} ${rows === 1 ? "row" : "rows"} by ${columns} ${columns === 1 ? "column" : "columns"}`;

  /**
   * Bring a cell into view, out from under the frozen rows and columns,
   * and give it focus.
   * @param {number} row
   * @param {number} column
   * @returns {void}
   */
  export function focusCell(row, column) {
    if (!rowCount || !columnCount) return;
    const cell = clampCell({ row, column });
    selection = null;
    activeCell = cell;
    reveal(cell);
    focusActiveCell();
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { selectorTabbable } from "../utils/trap-focus.js";
  import {
    buildColumnLayout,
    getCellAtPoint,
    getColumnWindow,
    getFarCorner,
    getPasteRange,
    getRevealScroll,
    getRowWindow,
    moveCell,
    normalizeRange,
    parseTsv,
    rangesEqual,
    rowHeightForSize,
    toHtmlTable,
    toTsv,
  } from "./data-grid-utils.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  const ROW_OVERSCAN = 6;
  const COLUMN_OVERSCAN = 2;
  const FALLBACK_VIEWPORT_WIDTH = 1024;
  const FALLBACK_VIEWPORT_HEIGHT = 400;
  // The controls Enter or F2 can move into, including those the grid took
  // out of the tab order.
  const selectorControl =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex], [contenteditable="true"]';

  /** @type {HTMLDivElement | null} */
  let gridRef = null;
  /** @type {(() => void) | undefined} */
  let stopObserving;

  // Until the first measurement the window is sized from `height` and a
  // typical screen, so the server and the first client paint agree.
  let viewportWidth = FALLBACK_VIEWPORT_WIDTH;
  let viewportHeight =
    typeof height === "number" ? height : FALLBACK_VIEWPORT_HEIGHT;
  let scrollTop = 0;
  let scrollStart = 0;
  let lead = 0;
  let announcement = "";

  $: layout = buildColumnLayout(columns, defaultColumnWidth);
  $: rowCount = rows.length;
  $: columnCount = columns.length;
  $: rowHeight = rowHeightForSize(size);
  $: frozenRowCount = Math.min(Math.max(frozenRows, 0), rowCount);
  $: frozenColumnCount = Math.min(Math.max(frozenColumns, 0), columnCount);
  $: gutterWidth = rowHeaders
    ? (rowHeaderWidth ?? Math.max(48, 28 + String(rowCount).length * 9))
    : 0;
  $: columnOffset = rowHeaders ? 2 : 1;
  $: totalWidth = gutterWidth + layout.total;
  $: totalHeight = rowHeight * (rowCount + 1);
  $: maxHeight = typeof height === "number" ? `${height}px` : height;

  $: rowWindow = getRowWindow({
    rowCount,
    rowHeight,
    frozenRows: frozenRowCount,
    scrollTop,
    viewportHeight,
    overscan: ROW_OVERSCAN,
    lead,
  });
  $: rowStart = rowWindow.start;
  $: rowEnd = rowWindow.end;
  $: columnWindow = getColumnWindow({
    offsets: layout.offsets,
    frozenColumns: frozenColumnCount,
    gutterWidth,
    scrollStart,
    viewportWidth,
    overscan: COLUMN_OVERSCAN,
  });
  $: columnStart = columnWindow.start;
  $: columnEnd = columnWindow.end;

  // The active cell stays mounted wherever it is. It is the one tab stop and
  // holds DOM focus, and a cell scrolled out of the window would otherwise be
  // removed and take both with it.
  $: activeRow = activeCell ? activeCell.row : -1;
  $: activeColumn = activeCell ? activeCell.column : -1;

  $: if (activeCell && rowCount > 0 && columnCount > 0) {
    if (activeCell.row >= rowCount || activeCell.column >= columnCount) {
      activeCell = clampCell(activeCell);
    }
  } else if (activeCell && (rowCount === 0 || columnCount === 0)) {
    activeCell = null;
  } else if (!activeCell && rowCount > 0 && columnCount > 0) {
    activeCell = { row: 0, column: 0 };
  }

  $: rowIndices = paintedIndices(
    frozenRowCount,
    rowStart,
    rowEnd,
    activeRow,
    rowCount,
    [-1],
  );
  $: columnIndices = paintedIndices(
    frozenColumnCount,
    columnStart,
    columnEnd,
    activeColumn,
    columnCount,
    [],
  );

  // A selection that is out of range after `rows` or `columns` shrinks.
  $: if (
    selection &&
    (selection.endRow >= rowCount || selection.endColumn >= columnCount)
  ) {
    selection = null;
  }

  // `-1` bounds select nothing, which spares each cell a null check.
  $: selectionStartRow = selection ? selection.startRow : 1;
  $: selectionEndRow = selection ? selection.endRow : 0;
  $: selectionStartColumn = selection ? selection.startColumn : 1;
  $: selectionEndColumn = selection ? selection.endColumn : 0;

  /**
   * Indexes to paint, in order: the frozen ones, the window, and the active
   * index when it is in neither.
   * @param {number} frozen
   * @param {number} start
   * @param {number} end
   * @param {number} active
   * @param {number} count
   * @param {number[]} lead
   * @returns {number[]}
   */
  function paintedIndices(frozen, start, end, active, count, lead) {
    const indices = [...lead];
    for (let i = 0; i < frozen; i++) indices.push(i);
    const retained =
      active >= frozen && active < count && (active < start || active >= end);
    if (retained && active < start) indices.push(active);
    for (let i = start; i < end; i++) indices.push(i);
    if (retained && active >= end) indices.push(active);
    return indices;
  }

  /**
   * @param {DataGridCell} cell
   * @returns {DataGridCell}
   */
  function clampCell(cell) {
    return {
      row: Math.min(Math.max(cell.row, 0), Math.max(rowCount - 1, 0)),
      column: Math.min(Math.max(cell.column, 0), Math.max(columnCount - 1, 0)),
    };
  }

  /**
   * @param {DataGridRow} row
   * @param {DataGridColumn} column
   * @returns {string}
   */
  function cellText(row, column) {
    const value = row?.[column.key];
    return column.format ? column.format(value, row) : String(value ?? "");
  }

  /** @param {DataGridRange} range */
  function matrixOf(range) {
    /** @type {string[][]} */
    const matrix = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
      /** @type {string[]} */
      const line = [];
      for (let c = range.startColumn; c <= range.endColumn; c++) {
        line.push(cellText(rows[r], columns[c]));
      }
      matrix.push(line);
    }
    return matrix;
  }

  /** @param {DataGridRange} range */
  function announceSelection(range) {
    announcement = selectionText(
      range.endRow - range.startRow + 1,
      range.endColumn - range.startColumn + 1,
    );
  }

  /**
   * Select a rectangle. One cell is not a selection: it is the active cell.
   * @param {DataGridRange | null} range
   */
  function select(range) {
    const single =
      range &&
      range.startRow === range.endRow &&
      range.startColumn === range.endColumn;
    const next = !range || single ? null : range;
    if (rangesEqual(next, selection)) return;
    selection = next;
    if (next) announceSelection(next);
  }

  /**
   * Whether the grid is laid out right to left, read when a key or pointer
   * arrives because nothing reports a `dir` change.
   */
  function rtl() {
    return resolveLayoutDirection($layoutDirection, gridRef) === "rtl";
  }

  /** @param {{ scrollStart: number; scrollTop: number }} next */
  function scrollTo(next) {
    if (!gridRef) return;
    gridRef.scrollTop = next.scrollTop;
    gridRef.scrollLeft = rtl() ? -next.scrollStart : next.scrollStart;
    // Window now, not when the scroll event arrives, so the target is painted.
    scrollTop = next.scrollTop;
    scrollStart = next.scrollStart;
  }

  /**
   * @param {DataGridCell} cell
   * @param {DataGridCell} [from] - Where a move started. A frozen cell it moved to along an axis brings that axis back to the start.
   */
  function reveal(cell, from) {
    if (!gridRef) return;
    scrollTo(
      getRevealScroll({
        cell,
        offsets: layout.offsets,
        rowCount,
        rowHeight,
        frozenRows: frozenRowCount,
        frozenColumns: frozenColumnCount,
        gutterWidth,
        scrollStart: Math.abs(gridRef.scrollLeft),
        scrollTop: gridRef.scrollTop,
        viewportWidth,
        viewportHeight,
        resetRow: !!from && from.row !== cell.row,
        resetColumn: !!from && from.column !== cell.column,
      }),
    );
  }

  async function focusActiveCell() {
    await tick();
    if (!gridRef || !activeCell) return;
    const cell = gridRef.querySelector(
      `[role="gridcell"][data-row="${activeCell.row}"][data-column="${activeCell.column}"]`,
    );
    if (cell instanceof HTMLElement && cell !== document.activeElement) {
      // The browser would scroll to a cell hidden under a frozen area, so
      // `reveal` has already placed it.
      cell.focus({ preventScroll: true });
    }
  }

  function pageSize() {
    const body = viewportHeight - rowHeight * (frozenRowCount + 1);
    const average = columnCount
      ? layout.total / columnCount
      : defaultColumnWidth;
    const across =
      viewportWidth - gutterWidth - layout.offsets[frozenColumnCount];
    return {
      rows: Math.max(1, Math.floor(body / rowHeight)),
      columns: Math.max(1, Math.floor(across / average)),
    };
  }

  /**
   * Take the controls in painted cells out of the tab order, so the grid
   * stays one tab stop. Enter or F2 moves into a cell's control.
   */
  function removeCellTabStops() {
    if (!gridRef) return;
    for (const node of gridRef.querySelectorAll(selectorTabbable)) {
      if (
        node instanceof HTMLElement &&
        node.getAttribute("role") !== "gridcell" &&
        node.closest('[role="gridcell"]')
      ) {
        node.tabIndex = -1;
      }
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const target = event.target;
    const key = event.key;
    if (!(target instanceof HTMLElement) || !activeCell) return;
    const cell = target.closest('[role="gridcell"]');

    // A control inside a cell keeps its own keys. Escape hands focus back
    // to the cell, as in the APG grid pattern.
    if (target !== cell) {
      if (
        key === "Escape" &&
        !event.defaultPrevented &&
        cell instanceof HTMLElement
      ) {
        event.preventDefault();
        cell.focus({ preventScroll: true });
      }
      return;
    }

    if (key === "Enter" || key === "F2") {
      const control = target.querySelector(selectorControl);
      if (control instanceof HTMLElement) {
        event.preventDefault();
        control.focus();
      }
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey;

    if (ctrl && key.toLowerCase() === "a") {
      event.preventDefault();
      select({
        startRow: 0,
        startColumn: 0,
        endRow: rowCount - 1,
        endColumn: columnCount - 1,
      });
      return;
    }
    if (ctrl && key === " ") {
      event.preventDefault();
      select({
        startRow: 0,
        startColumn: activeCell.column,
        endRow: rowCount - 1,
        endColumn: activeCell.column,
      });
      return;
    }
    if (event.shiftKey && !ctrl && key === " ") {
      event.preventDefault();
      select({
        startRow: activeCell.row,
        startColumn: 0,
        endRow: activeCell.row,
        endColumn: columnCount - 1,
      });
      return;
    }
    if (key === "Escape") {
      if (selection) {
        event.preventDefault();
        select(null);
      }
      return;
    }

    // Alt+Arrow is the browser's and a screen reader's.
    if (event.altKey && key.startsWith("Arrow")) return;

    const page = pageSize();
    const options = {
      rowCount,
      columnCount,
      pageRows: page.rows,
      pageColumns: page.columns,
      ctrl,
      alt: event.altKey,
    };
    const movement = inlineKey(key, $layoutDirection, gridRef);

    if (event.shiftKey) {
      const from = getFarCorner(selection, activeCell);
      const far = moveCell(movement, from, options);
      if (!far) return;
      event.preventDefault();
      select(normalizeRange(activeCell, far));
      reveal(far, from);
      return;
    }

    const next = moveCell(movement, activeCell, options);
    if (!next) return;
    event.preventDefault();
    select(null);
    reveal(next, activeCell);
    activeCell = next;
    focusActiveCell();
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const cell =
      event.target instanceof Element
        ? event.target.closest('[role="gridcell"]')
        : null;
    if (!(cell instanceof HTMLElement) || cell.dataset.row === undefined)
      return;
    const row = Number(cell.dataset.row);
    const column = Number(cell.dataset.column);
    if (activeCell?.row !== row || activeCell?.column !== column) {
      activeCell = { row, column };
    }
  }

  /** @param {EventTarget | null} target */
  function isEditable(target) {
    return (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]') !==
        null
    );
  }

  /** @param {ClipboardEvent} event */
  function handleCopy(event) {
    if (isEditable(event.target) || !event.clipboardData || !activeCell) return;
    const range = selection ?? {
      startRow: activeCell.row,
      startColumn: activeCell.column,
      endRow: activeCell.row,
      endColumn: activeCell.column,
    };
    const matrix = matrixOf(range);
    event.preventDefault();
    if (!dispatch("copy", { range, matrix }, { cancelable: true })) return;
    event.clipboardData.setData("text/plain", toTsv(matrix));
    event.clipboardData.setData("text/html", toHtmlTable(matrix));
    announcement = copiedText(matrix.length, matrix[0]?.length ?? 0);
  }

  /** @param {ClipboardEvent} event */
  function handlePaste(event) {
    if (isEditable(event.target) || !event.clipboardData || !activeCell) return;
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    const matrix = parseTsv(text);
    const target = getPasteRange({
      matrix,
      selection,
      active: activeCell,
      rowCount,
      columnCount,
    });
    if (!target) return;
    const accepted = dispatch(
      "paste",
      { matrix, text, range: target.range, truncated: target.truncated },
      { cancelable: true },
    );
    if (!accepted) return;
    // As in a spreadsheet, the pasted cells end up selected.
    activeCell = {
      row: target.range.startRow,
      column: target.range.startColumn,
    };
    select(target.range);
    announcement = pastedText(
      target.range.endRow - target.range.startRow + 1,
      target.range.endColumn - target.range.startColumn + 1,
    );
  }

  /** @type {DOMRect | null} */
  let dragBounds = null;
  /** @type {DataGridCell | null} */
  let dragCell = null;
  let dragX = 0;
  let dragY = 0;
  let dragFrame = 0;
  let dragRtl = false;

  /**
   * The cell under a pointer. `row` or `column` is `-1` over a header.
   * @param {number} clientX
   * @param {number} clientY
   */
  function cellAtPointer(clientX, clientY) {
    if (!gridRef || !dragBounds) return { row: -1, column: -1 };
    return getCellAtPoint({
      x: dragRtl ? dragBounds.right - clientX : clientX - dragBounds.left,
      y: clientY - dragBounds.top,
      offsets: layout.offsets,
      rowCount,
      rowHeight,
      frozenRows: frozenRowCount,
      frozenColumns: frozenColumnCount,
      gutterWidth,
      scrollStart: Math.abs(gridRef.scrollLeft),
      scrollTop: gridRef.scrollTop,
    });
  }

  /** @param {PointerEvent} event */
  function handlePointerStart(event) {
    const target = event.target;
    // A link or button in a cell takes its own press.
    if (
      !gridRef ||
      !(target instanceof Element) ||
      isEditable(target) ||
      target.closest("a, button") !== null ||
      !rowCount ||
      !columnCount
    ) {
      return false;
    }
    const bounds = gridRef.getBoundingClientRect();
    const rightToLeft = rtl();
    // The scrollbars belong to the grid's own box but are not cells. The
    // vertical one sits at the inline end in both directions.
    const fromStart = rightToLeft
      ? bounds.right - event.clientX
      : event.clientX - bounds.left;
    if (
      fromStart >= gridRef.clientWidth ||
      event.clientY - bounds.top >= gridRef.clientHeight
    ) {
      return false;
    }
    dragBounds = bounds;
    dragRtl = rightToLeft;
    dragX = event.clientX;
    dragY = event.clientY;
    const { row, column } = cellAtPointer(event.clientX, event.clientY);
    const last = { row: rowCount - 1, column: columnCount - 1 };

    dragCell = null;
    if (row < 0 && column < 0) {
      select({
        startRow: 0,
        startColumn: 0,
        endRow: last.row,
        endColumn: last.column,
      });
    } else if (row < 0 && column >= 0) {
      activeCell = { row: Math.max(activeRow, 0), column };
      select({
        startRow: 0,
        startColumn: column,
        endRow: last.row,
        endColumn: column,
      });
    } else if (column < 0) {
      activeCell = { row, column: Math.max(activeColumn, 0) };
      select({
        startRow: row,
        startColumn: 0,
        endRow: row,
        endColumn: last.column,
      });
    } else if (event.shiftKey && activeCell) {
      select(normalizeRange(activeCell, { row, column }));
      dragCell = activeCell;
    } else {
      select(null);
      activeCell = { row, column };
      dragCell = activeCell;
    }
    focusActiveCell();
    return dragCell !== null;
  }

  /** Keep the press from focusing the page or starting a text selection. */
  function handleMousedown(/** @type {MouseEvent} */ event) {
    const target = event.target;
    if (
      target instanceof Element &&
      !isEditable(target) &&
      target.closest("a, button") === null
    ) {
      event.preventDefault();
    }
  }

  function extendDrag() {
    if (!dragCell) return;
    const hovered = cellAtPointer(dragX, dragY);
    const row = Math.min(Math.max(hovered.row, 0), rowCount - 1);
    const column = Math.min(Math.max(hovered.column, 0), columnCount - 1);
    select(normalizeRange(dragCell, { row, column }));
  }

  /**
   * @param {number} position
   * @param {number} near
   * @param {number} far
   */
  function edgeSpeed(position, near, far) {
    if (position < near) return Math.max(-32, (position - near) / 2);
    if (position > far) return Math.min(32, (position - far) / 2);
    return 0;
  }

  // Dragging past an edge of the scrolling area keeps scrolling there.
  function autoScroll() {
    dragFrame = 0;
    if (!gridRef || !dragBounds || !dragCell) return;
    const x = dragRtl ? dragBounds.right - dragX : dragX - dragBounds.left;
    const y = dragY - dragBounds.top;
    const dx = edgeSpeed(
      x,
      gutterWidth + layout.offsets[frozenColumnCount],
      gridRef.clientWidth,
    );
    const dy = edgeSpeed(
      y,
      rowHeight * (frozenRowCount + 1),
      gridRef.clientHeight,
    );
    if (!dx && !dy) return;
    gridRef.scrollTop += dy;
    gridRef.scrollLeft += dragRtl ? -dx : dx;
    extendDrag();
    dragFrame = requestAnimationFrame(autoScroll);
  }

  /** @param {PointerEvent} event */
  function handlePointerMove(event) {
    dragX = event.clientX;
    dragY = event.clientY;
    extendDrag();
    if (!dragFrame) dragFrame = requestAnimationFrame(autoScroll);
  }

  function handlePointerEnd() {
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    dragCell = null;
    dragBounds = null;
  }

  /** @param {UIEvent} event */
  function handleScroll(event) {
    const node = /** @type {HTMLElement} */ (event.currentTarget);
    const top = node.scrollTop;
    const delta = top - scrollTop;
    // Stay ahead of the compositor: a fast scroll can move more than the
    // overscan before the next frame paints.
    lead = Math.max(
      -viewportHeight / rowHeight,
      Math.min(viewportHeight / rowHeight, Math.round(delta / rowHeight)),
    );
    scrollTop = top;
    scrollStart = Math.abs(node.scrollLeft);
  }

  onMount(() => {
    if (!gridRef) return;
    stopObserving = observeResize(gridRef, (entry) => {
      // A grid that is not displayed measures zero. Keep the last size.
      if (entry.contentRect.width > 0) viewportWidth = entry.contentRect.width;
      if (entry.contentRect.height > 0)
        viewportHeight = entry.contentRect.height;
    });
    // Only a `cell` slot can put a control in a cell. Rows and columns
    // mount as the grid scrolls, so recheck when cells are added.
    /** @type {MutationObserver | undefined} */
    let cellObserver;
    if ($$slots.cell && typeof MutationObserver !== "undefined") {
      removeCellTabStops();
      cellObserver = new MutationObserver(removeCellTabStops);
      cellObserver.observe(gridRef, { childList: true, subtree: true });
    }
    return () => {
      cellObserver?.disconnect();
      stopObserving?.();
      if (dragFrame) cancelAnimationFrame(dragFrame);
    };
  });
</script>

<div
  bind:this={gridRef}
  {...$$restProps}
  role="grid"
  tabindex="-1"
  class="bx--data-grid {$$restProps.class ?? ''}"
  class:bx--data-grid--compact={size === "compact"}
  aria-label={labelText || $$restProps["aria-label"] || undefined}
  aria-rowcount={rowCount + 1}
  aria-colcount={columnCount + (rowHeaders ? 1 : 0)}
  aria-multiselectable="true"
  aria-readonly="true"
  style:max-height={maxHeight}
  style:--ccs-data-grid-row-height="{rowHeight}px"
  use:pointerDrag={{
    onStart: handlePointerStart,
    onMove: handlePointerMove,
    onEnd: handlePointerEnd,
  }}
  on:scroll={handleScroll}
  on:keydown
  on:keydown={handleKeydown}
  on:focusin={handleFocusin}
  on:mousedown={handleMousedown}
  on:copy={handleCopy}
  on:paste={handlePaste}
>
  <div
    role="rowgroup"
    class="bx--data-grid__pane"
    style:width="{totalWidth}px"
    style:height="{totalHeight}px"
  >
    {#each rowIndices as rowIndex (rowIndex)}
      {@const header = rowIndex < 0}
      {@const row = rows[rowIndex]}
      {@const rowSelected =
        rowIndex >= selectionStartRow && rowIndex <= selectionEndRow}
      <div
        role="row"
        class="bx--data-grid__row"
        class:bx--data-grid__row--header={header}
        class:bx--data-grid__row--frozen={!header && rowIndex < frozenRowCount}
        class:bx--data-grid__row--frozen-edge={rowIndex === frozenRowCount - 1}
        aria-rowindex={rowIndex + 2}
        style:top="{(rowIndex + 1) * rowHeight}px"
      >
        {#if rowHeaders}
          {#if header}
            <div
              role="columnheader"
              class="bx--data-grid__header bx--data-grid__header--corner bx--data-grid__frozen"
              class:bx--data-grid__frozen--edge={frozenColumnCount === 0}
              aria-colindex="1"
              style:width="{gutterWidth}px"
              style:--ccs-data-grid-x="0px"
            >
              <span class="bx--visually-hidden">{selectAllText}</span>
            </div>
          {:else}
            <div
              role="rowheader"
              class="bx--data-grid__header bx--data-grid__header--row bx--data-grid__frozen"
              class:bx--data-grid__frozen--edge={frozenColumnCount === 0}
              class:bx--data-grid__header--selected={rowSelected ||
                rowIndex === activeRow}
              aria-colindex="1"
              style:width="{gutterWidth}px"
              style:--ccs-data-grid-x="0px"
            >
              {rowHeaderText(rowIndex)}
            </div>
          {/if}
        {/if}
        {#each columnIndices as columnIndex (columnIndex)}
          {@const column = columns[columnIndex]}
          {@const frozen = columnIndex < frozenColumnCount}
          {@const columnSelected =
            columnIndex >= selectionStartColumn &&
            columnIndex <= selectionEndColumn}
          {@const x = gutterWidth + layout.offsets[columnIndex]}
          {#if header}
            <div
              role="columnheader"
              class="bx--data-grid__header bx--data-grid__header--column"
              class:bx--data-grid__frozen={frozen}
              class:bx--data-grid__frozen--edge={columnIndex ===
                frozenColumnCount - 1}
              class:bx--data-grid__header--selected={columnSelected ||
                columnIndex === activeColumn}
              class:bx--data-grid__cell--align-end={column.align === "end"}
              class:bx--data-grid__cell--align-center={column.align ===
                "center"}
              aria-colindex={columnIndex + columnOffset}
              style:width="{layout.widths[columnIndex]}px"
              style:--ccs-data-grid-x="{x}px"
            >
              <slot name="columnHeader" {column} {columnIndex}>
                <span class="bx--data-grid__text"
                  >{column.title ?? column.key}</span
                >
              </slot>
            </div>
          {:else}
            {@const selected = rowSelected && columnSelected}
            {@const active =
              rowIndex === activeRow && columnIndex === activeColumn}
            {@const value = row?.[column.key]}
            <div
              role="gridcell"
              class="bx--data-grid__cell"
              class:bx--data-grid__frozen={frozen}
              class:bx--data-grid__frozen--edge={columnIndex ===
                frozenColumnCount - 1}
              class:bx--data-grid__cell--selected={selected}
              class:bx--data-grid__cell--active={active}
              class:bx--data-grid__cell--range-top={selected &&
                rowIndex === selectionStartRow}
              class:bx--data-grid__cell--range-bottom={selected &&
                rowIndex === selectionEndRow}
              class:bx--data-grid__cell--range-start={selected &&
                columnIndex === selectionStartColumn}
              class:bx--data-grid__cell--range-end={selected &&
                columnIndex === selectionEndColumn}
              class:bx--data-grid__cell--align-end={column.align === "end"}
              class:bx--data-grid__cell--align-center={column.align ===
                "center"}
              aria-colindex={columnIndex + columnOffset}
              aria-selected={selected}
              tabindex={active ? 0 : -1}
              data-row={rowIndex}
              data-column={columnIndex}
              style:width="{layout.widths[columnIndex]}px"
              style:--ccs-data-grid-x="{x}px"
            >
              <slot name="cell" {row} {rowIndex} {column} {columnIndex} {value}>
                <span class="bx--data-grid__text"
                  >{column.format
                    ? column.format(value, row)
                    : (value ?? "")}</span
                >
              </slot>
            </div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>
<div class="bx--visually-hidden" role="status" aria-live="polite">
  {announcement}
</div>
