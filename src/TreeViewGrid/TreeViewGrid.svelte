<script context="module">
  import {
    TREE_ROW_ID_ATTR as ROW_ATTR,
    treeRowIdSelector,
  } from "../TreeView/tree-row-id.js";

  /** How many rows PageUp and PageDown move focus. */
  const PAGE_ROWS = 10;

  /**
   * The narrowest a column with no `width` or `minWidth` gets. Columns take
   * their widths from the header alone, so the table needs a floor to scroll
   * in a narrow container instead of squeezing those columns.
   */
  const MIN_COLUMN_WIDTH = "12rem";

  /**
   * The table's minimum width. Columns with a `width` take it. The others
   * share the rest evenly, and a fixed layout ignores `min-width` on a cell,
   * so each of them is given the largest of their `minWidth` floors.
   * @param {ReadonlyArray<{ width?: string; minWidth?: string }>} headers
   */
  function minTableWidth(headers) {
    const sized = [];
    const floors = [];
    for (const header of headers) {
      if (header.width) sized.push(header.width);
      else floors.push(header.minWidth ?? MIN_COLUMN_WIDTH);
    }
    if (floors.length > 0) {
      const unique = [...new Set(floors)];
      const floor = unique.length > 1 ? `max(${unique.join(", ")})` : unique[0];
      sized.push(`${floors.length} * ${floor}`);
    }
    return `calc(${sized.join(" + ")})`;
  }

  /**
   * Controls inside a cell that Tab must not reach while the grid has a
   * single tab stop. `tabindex="0"` covers custom widgets; the grid's own
   * rows and cells are excluded.
   */
  const WIDGET_SELECTOR =
    'a[href], button, input, select, textarea, [contenteditable=""], [contenteditable="true"], [tabindex="0"]:not(tr):not(td):not(th)';

  /** Elements `Enter` or `F2` on a cell may hand focus to. */
  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [contenteditable=""], [contenteditable="true"], [tabindex]:not(tr):not(td):not(th)';

  /** A pointer press on these inside a cell is the widget's, not the row's. */
  const INTERACTIVE_SELECTOR =
    'a, button, input, select, textarea, label, [contenteditable=""], [contenteditable="true"]';

  /** Marks a control whose tab stop the grid removed, so it can restore it. */
  const REMOVED_ATTR = "data-tree-grid-tab-removed";

  /**
   * Take the controls under `root` out of the tab order. Only `root`'s
   * descendants change; the rows and cells keep their own `tabindex`.
   * @param {Element} root
   */
  function removeWidgetTabStops(root) {
    for (const widget of root.querySelectorAll(WIDGET_SELECTOR)) {
      if (widget.getAttribute("tabindex") !== "-1") {
        widget.setAttribute("tabindex", "-1");
        widget.setAttribute(REMOVED_ATTR, "");
      }
    }
  }

  /**
   * Put the controls in a cell back in the tab order, so Tab walks them
   * while one of them has focus.
   * @param {Element} cell
   */
  function restoreWidgetTabStops(cell) {
    for (const widget of cell.querySelectorAll(`[${REMOVED_ATTR}]`)) {
      widget.setAttribute("tabindex", "0");
    }
  }

  /**
   * @param {ReadonlyArray<string | number>} a
   * @param {ReadonlyArray<string | number>} b
   */
  function arrayIdsEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /** @param {string} query */
  function collapseRepeatedChar(query) {
    return query.length > 1 && [...query].every((c) => c === query[0])
      ? query[0]
      : query;
  }
</script>

<script>
  /**
   * @template {TreeNode<any>} [Node=TreeNode<any>]
   */

  /**
   * @template [Id=(string|number)]
   * @typedef {import("../TreeView/TreeView.svelte").TreeNode<Id>} TreeNode
   */

  /**
   * @template [Node=any]
   * @typedef {object} TreeViewGridHeader
   * @property {string} key - The node field this column reads. The first column is the tree column and falls back to `node.text`.
   * @property {any} value - The column header content
   * @property {(item: any, node: Node) => any} [display] - Format the cell value
   * @property {string} [width] - The exact width of the column. Columns keep their widths as rows expand and collapse.
   * @property {string} [minWidth] - The narrowest a column with no `width` gets. Defaults to `12rem`.
   * @property {"start" | "end"} [columnAlign] - Horizontal alignment of the column header and cells. Logical, so `end` is the right edge in LTR and the left edge in RTL. Defaults to `"start"`.
   */

  /**
   * @slot {{ node: Node & { expanded: boolean; leaf: boolean; selected: boolean; }; cell: { key: string; value: any; display?: (item: any, node: Node) => any; header: TreeViewGridHeader<Node> }; cellIndex: number; expanded: boolean; selected: boolean; level: number }} cell
   * @slot {{ header: TreeViewGridHeader<Node> }} cellHeader
   */

  /**
   * @event select
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
   */

  /**
   * @event toggle
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
   */

  /**
   * @event toggle:change
   * @type {import("../TreeView/TreeView.svelte").TreeViewExpandedChange<Node["id"]>}
   */

  /**
   * @event focus
   * @type {Node & { expanded: boolean; leaf: boolean; selected: boolean }}
   */

  /**
   * @event select:change
   * @type {import("../TreeView/TreeView.svelte").TreeViewSelectionChange<Node["id"]>}
   */

  /**
   * Provide the hierarchical rows to render.
   * A node's fields other than `nodes` are its column values.
   * @type {ReadonlyArray<Node>}
   */
  export let nodes = [];

  /**
   * Specify the columns. The first is the tree column: it holds the
   * expand toggle, the node `icon` and the node text.
   * @type {ReadonlyArray<TreeViewGridHeader<Node>>}
   */
  export let headers = [];

  /**
   * Set the current active node id.
   * Only one node can be active.
   * @type {Node["id"]}
   * @bindable writable
   */
  export let activeId = "";

  /**
   * Set the node ids to be selected.
   * @type {ReadonlyArray<Node["id"]>}
   * @bindable writable
   */
  export let selectedIds = [];

  /**
   * Set the node ids to be expanded.
   * @type {ReadonlyArray<Node["id"]>}
   * @bindable writable
   */
  export let expandedIds = [];

  /**
   * Set to `true` to enable multi-select mode.
   * Supports Ctrl/Cmd+Click (toggle), Shift+Click (range select),
   * Shift+Up/Down and Ctrl/Cmd+A.
   */
  export let multiselect = false;

  /**
   * Specify the row height.
   * Accepts the same Carbon v11 aliases as `DataTable`.
   * @type {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to use zebra styles */
  export let zebra = false;

  /** Set to `true` to keep the header in view while the rows scroll */
  export let stickyHeader = false;

  /**
   * Cap the height of the scroll area when `stickyHeader` is `true`.
   * A number is in px; a string is any CSS length.
   * @type {number | string | undefined}
   */
  export let stickyHeaderMaxHeight = undefined;

  /**
   * Specify how Tab reaches controls (links, buttons, inputs) in cells.
   * - `"arrow"`: the grid is one tab stop. Arrow keys move between rows and
   *   cells, and `Enter` or `F2` on a cell moves focus into its controls.
   *   `Escape` returns to the cell.
   * - `"tab"`: controls keep their own tab stops.
   * @type {"arrow" | "tab"}
   */
  export let widgetNavigation = "arrow";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Set an id for the grid element.
   * The label id derives from it, for example `{id}-label`.
   */
  export let id = uniqueId();

  /**
   * Programmatically expand all expandable nodes (those with loaded children
   * or `hasChildren: true`).
   * @type {() => void}
   * @example
   * ```svelte
   * <TreeViewGrid bind:this={grid} {nodes} {headers} />
   * <button on:click={() => grid.expandAll()}>Expand All</button>
   * ```
   */
  export function expandAll() {
    writeExpanded(
      traverse(nodes)
        .filter((node) => isExpandableNode(node))
        .map((node) => node.id),
    );
  }

  /**
   * Programmatically collapse all nodes
   * @type {() => void}
   * @example
   * ```svelte
   * <TreeViewGrid bind:this={grid} {nodes} {headers} />
   * <button on:click={() => grid.collapseAll()}>Collapse All</button>
   * ```
   */
  export function collapseAll() {
    writeExpanded([]);
  }

  /**
   * Programmatically expand the expandable nodes `filterNode` returns `true`
   * for. Expands all of them if no argument is provided.
   * @type {(filterNode?: (node: Node) => boolean) => void}
   * @example
   * ```svelte
   * <TreeViewGrid bind:this={grid} {nodes} {headers} />
   * <button on:click={() => grid.expandNodes((node) => node.kind === "folder")}>
   *   Expand Folders
   * </button>
   * ```
   */
  export function expandNodes(filterNode = () => true) {
    const next = new Set(expandedIds);
    for (const node of traverse(nodes)) {
      if (isExpandableNode(node) && filterNode(node)) next.add(node.id);
    }
    writeExpanded([...next]);
  }

  /**
   * Programmatically collapse the nodes `filterNode` returns `true` for.
   * Collapses all nodes if no argument is provided.
   * @type {(filterNode?: (node: Node) => boolean) => void}
   * @example
   * ```svelte
   * <TreeViewGrid bind:this={grid} {nodes} {headers} />
   * <button on:click={() => grid.collapseNodes((node) => node.kind === "folder")}>
   *   Collapse Folders
   * </button>
   * ```
   */
  export function collapseNodes(filterNode = () => true) {
    const collapsed = new Set(
      traverse(nodes)
        .filter((node) => filterNode(node))
        .map((node) => node.id),
    );
    writeExpanded(
      expandedIds.filter((expandedId) => !collapsed.has(expandedId)),
    );
  }

  /**
   * Programmatically show a node by `id`.
   * By default, the matching node will be expanded, selected, and focused.
   * Use the options parameter to customize this behavior.
   * @type {(id: Node["id"], options?: import("../TreeView/TreeView.svelte").ShowNodeOptions) => void}
   * @example
   * ```svelte
   * <TreeViewGrid bind:this={grid} {nodes} {headers} />
   * <button on:click={() => grid.showNode("node-123")}>Show Node</button>
   * ```
   */
  export function showNode(id, options = {}) {
    const { expand = true, select = true, focus = true } = options;
    const target = nodeMap.get(id);
    if (!target) return;

    const ancestorIds = expand ? getAncestorIds(id, parentIdById) : [];
    if (ancestorIds.some((ancestorId) => !expandedSet.has(ancestorId))) {
      writeExpanded([...new Set([...expandedIds, ...ancestorIds])]);
    }

    if (select) {
      activeId = id;
      prevActiveId = id;
      writeSelected([id]);
    }

    if (focus && !target.disabled) {
      tick().then(async () => {
        let rowElement = findRowElement(id);
        for (let i = 0; !rowElement && i < ancestorIds.length * 2 + 2; i++) {
          // biome-ignore lint/performance/noAwaitInLoops: each tick waits for the next reveal flush
          await tick();
          rowElement = findRowElement(id);
        }
        if (rowElement) {
          focusRowId = id;
          tabCol = -1;
          rowElement.focus();
        }
      });
    }
  }

  /**
   * Look up a node by `id`. Returns `null` if no node has the given `id`.
   * @type {(id: Node["id"]) => Node | null}
   * @example
   * ```svelte
   * <TreeViewGrid bind:this={grid} {nodes} {headers} />
   * <button on:click={() => console.log(grid.getNode("node-123"))}>
   *   Log Node
   * </button>
   * ```
   */
  export function getNode(id) {
    return nodeMap.get(id) ?? null;
  }

  /**
   * Look up multiple nodes by `id`. Ids without a matching node are omitted.
   * @type {(ids: ReadonlyArray<Node["id"]>) => Array<Node>}
   * @example
   * ```svelte
   * <TreeViewGrid bind:this={grid} {nodes} {headers} />
   * <button on:click={() => console.log(grid.getNodes(selectedIds))}>
   *   Log Selected Nodes
   * </button>
   * ```
   */
  export function getNodes(ids) {
    /** @type {Array<Node>} */
    const found = [];
    for (const nodeId of ids) {
      const node = nodeMap.get(nodeId);
      if (node) found.push(node);
    }
    return found;
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import {
    formatHeaderWidth,
    resolvePath,
  } from "../DataTable/data-table-utils.js";
  import CaretDown from "../icons/CaretDown.svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import { noop } from "../utils/noop.js";
  import { rangeSlice } from "../utils/range-slice.js";
  import {
    DATA_TABLE_SIZE_ALIASES,
    normalizeSize,
  } from "../utils/size-aliases.js";
  import {
    fingerprintTree,
    matchesFingerprint,
  } from "../utils/tree-fingerprint.js";
  import {
    buildTreeMaps,
    getAncestorIds,
    traverse,
  } from "../utils/tree-nodes.js";
  import {
    createTreeVirtualIndex,
    isExpandableNode,
  } from "../utils/tree-virtual-index.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  // In RTL, child rows indent toward the left, so Left expands and Right
  // collapses. A LayoutDirection gives the direction. Without one, read the
  // computed direction on each arrow key, since nothing reports a `dir`
  // change on an ancestor.
  const layoutDirection = getLayoutDirection();

  $: effectiveSize = normalizeSize(size, DATA_TABLE_SIZE_ALIASES);
  $: labelId = `${id}-label`;

  /** The tree column alone when the consumer gives no columns. */
  $: columns =
    headers.length > 0 ? headers : [{ key: "text", value: labelText }];

  /** @type {null | HTMLTableElement} */
  let tableRef = null;
  /** @type {null | HTMLTableSectionElement} */
  let tbodyRef = null;

  // The node maps rebuild when `nodes` changes identity. A same-reference
  // reassignment (`nodes = nodes`) rebuilds only if a snapshot says something
  // was mutated in place, the lazy-load idiom `node.nodes = children`.
  /** @type {ReadonlyArray<Node> | null} */
  let cachedNodes = null;
  /** @type {ReturnType<typeof fingerprintTree>} */
  let nodesFingerprint = [];
  /** @type {Map<Node["id"], Node>} */
  let nodeMap = new Map();
  /** @type {Map<Node["id"], Node["id"] | typeof import("../utils/tree-nodes.js").ROOT_PARENT_ID>} */
  let parentIdById = new Map();
  let treeVersion = 0;

  /**
   * @param {ReadonlyArray<Node>} next
   * @returns {number} Bumps whenever the tree the rows derive from changed.
   */
  function syncTree(next) {
    if (next === cachedNodes && matchesFingerprint(nodesFingerprint, next)) {
      return treeVersion;
    }
    cachedNodes = next;
    nodesFingerprint = fingerprintTree(next);
    const maps = buildTreeMaps(next);
    nodeMap = maps.nodeMap;
    parentIdById = maps.parentIdById;
    treeVersion += 1;
    return treeVersion;
  }

  $: version = syncTree(nodes);

  // Sets are reassigned, never mutated, so what reads them re-runs.
  $: expandedSet = new Set(expandedIds);
  $: selectedSet = new Set(selectedIds);

  /**
   * @param {number} _version
   * @param {Set<Node["id"]>} expanded
   */
  function buildView(_version, expanded) {
    const index = createTreeVirtualIndex(cachedNodes ?? [], expanded);
    const visibleRows = index.collectRows(0, index.totalCount);
    /** @type {Map<string, number>} */
    const byKey = new Map();
    const ids = [];
    for (let i = 0; i < visibleRows.length; i++) {
      const rowId = visibleRows[i].node.id;
      byKey.set(String(rowId), i);
      ids.push(rowId);
    }
    return { rows: visibleRows, rowIds: ids, indexByKey: byKey };
  }

  $: ({ rows, rowIds, indexByKey } = buildView(version, expandedSet));

  /**
   * The row that owns the tab stop; `undefined` until a row has focus.
   * @type {Node["id"] | undefined}
   */
  let focusRowId;
  /** The tab stop's cell in that row, or -1 for the row itself. */
  let tabCol = -1;

  /**
   * The row that holds the grid's one tab stop: the last focused row, else
   * the active one, else the first enabled row. Resolved from props so the
   * server renders it.
   */
  $: tabStopId = resolveTabStop(rows, indexByKey, focusRowId, activeId);

  /**
   * @param {typeof rows} visible
   * @param {typeof indexByKey} byKey
   * @param {Node["id"] | undefined} focused
   * @param {Node["id"]} active
   */
  function resolveTabStop(visible, byKey, focused, active) {
    for (const candidate of [focused, active]) {
      if (candidate === undefined || candidate === "") continue;
      const i = byKey.get(String(candidate));
      if (i !== undefined && !visible[i].node.disabled) return candidate;
    }
    return visible.find((row) => !row.node.disabled)?.node.id;
  }

  /**
   * @param {typeof rows} visible
   * @param {typeof indexByKey} byKey
   * @param {Node["id"]} rowId
   */
  function rowAt(visible, byKey, rowId) {
    return visible[/** @type {number} */ (byKey.get(String(rowId)))];
  }

  /**
   * The value a node holds for a column. The tree column reads the node's
   * `text` when the node has no field of that name.
   * @param {Node} node
   * @param {TreeViewGridHeader<Node>} header
   * @param {number} column
   */
  function cellValue(node, header, column) {
    const value = resolvePath(node, header.key);
    return column === 0 && value === undefined ? node.text : value;
  }

  /**
   * @param {Node} node
   * @param {TreeViewGridHeader<Node>} header
   * @param {number} column
   */
  function cellDisplay(node, header, column) {
    const value = cellValue(node, header, column);
    return (header.display ? header.display(value, node) : value) ?? "";
  }

  /**
   * Slot props are built only when the consumer fills `cell`.
   * @param {Node} node
   * @param {TreeViewGridHeader<Node>} header
   * @param {number} column
   */
  function cellSlotProps(node, header, column) {
    return {
      key: header.key,
      value: cellValue(node, header, column),
      display: header.display,
      header,
    };
  }

  /** @param {TreeViewGridHeader<Node>} header */
  function alignClass(header) {
    return header.columnAlign
      ? `bx--table-column--align-${header.columnAlign}`
      : undefined;
  }

  /**
   * The node an event carries, with the state the gesture just produced.
   * `expandedSet` and `selectedSet` lag a handler that assigns the id arrays
   * and dispatches in the same call, so the caller passes what it knows.
   * @param {Node} node
   * @param {{ expanded?: boolean; selected?: boolean }} [state]
   */
  function eventNode(node, state = {}) {
    return {
      ...node,
      expanded: state.expanded ?? expandedSet.has(node.id),
      leaf: !isExpandableNode(node),
      selected: state.selected ?? selectedSet.has(node.id),
    };
  }

  /** @param {ReadonlyArray<Node["id"]>} next */
  function writeExpanded(next) {
    expandedIds = next;
    expandedSet = new Set(next);
  }

  /** @param {ReadonlyArray<Node["id"]>} next */
  function writeSelected(next) {
    selectedIds = next;
    selectedSet = new Set(next);
  }

  /**
   * @param {Node} node
   * @param {boolean} expanded
   */
  function setExpanded(node, expanded) {
    if (expandedSet.has(node.id) === expanded) return;
    writeExpanded(
      expanded
        ? [...expandedIds, node.id]
        : expandedIds.filter((expandedId) => expandedId !== node.id),
    );
    dispatch("toggle", eventNode(node, { expanded }));
  }

  /**
   * The `activeId` a gesture last set; a programmatic one selects its row.
   * @type {Node["id"] | undefined}
   */
  let gestureActiveId;
  let prevActiveId = activeId;
  /** @type {Node["id"] | null} */
  let anchorId = null;

  $: if (activeId !== prevActiveId) {
    selectProgrammaticActive(activeId);
  }

  /** @param {Node["id"]} next */
  function selectProgrammaticActive(next) {
    prevActiveId = next;
    if (next === gestureActiveId) return;
    gestureActiveId = undefined;
    const node = nodeMap.get(next);
    if (!node || node.disabled || selectedSet.has(next)) return;
    writeSelected(multiselect ? [...selectedIds, next] : [next]);
  }

  /**
   * Select (or toggle, or extend to) a row from a click, Enter or Space.
   * @param {number} index
   * @param {MouseEvent | KeyboardEvent} event
   */
  function selectRow(index, event) {
    const node = rows[index].node;
    activeId = node.id;
    prevActiveId = node.id;
    gestureActiveId = node.id;

    /** @type {ReadonlyArray<Node["id"]>} */
    let next = [node.id];
    if (multiselect) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && !event.shiftKey) {
        next = selectedSet.has(node.id)
          ? selectedIds.filter((selectedId) => selectedId !== node.id)
          : [...selectedIds, node.id];
        anchorId = node.id;
      } else if (event.shiftKey && anchorId !== null) {
        const anchorIndex = indexByKey.get(String(anchorId)) ?? -1;
        const range = rangeSlice(
          rows,
          anchorIndex,
          index,
          (row) => !row.node.disabled,
        );
        if (range) next = range.map((row) => row.node.id);
        else anchorId = node.id;
      } else {
        anchorId = node.id;
      }
    }
    writeSelected(next);
    dispatch("select", eventNode(node, { selected: next.includes(node.id) }));
  }

  /**
   * Shift+Up/Down in multiselect: toggle the row focus moved to.
   * @param {number} index
   */
  function shiftToggleRow(index) {
    const node = rows[index].node;
    activeId = node.id;
    prevActiveId = node.id;
    gestureActiveId = node.id;
    const selected = !selectedSet.has(node.id);
    writeSelected(
      selected
        ? [...selectedIds, node.id]
        : selectedIds.filter((selectedId) => selectedId !== node.id),
    );
    anchorId = node.id;
    dispatch("select", eventNode(node, { selected }));
  }

  function selectAllRows() {
    const all = rows
      .filter((row) => !row.node.disabled)
      .map((row) => row.node.id);
    writeSelected([...new Set([...selectedIds, ...all])]);
  }

  /**
   * The row element for the visible row at `index`. Rows render in order, so
   * the child at `index` is the row unless the DOM is a flush behind.
   * @param {number} index
   * @returns {HTMLTableRowElement | null}
   */
  function rowElementAt(index) {
    const rowId = rows[index]?.node.id;
    if (rowId === undefined) return null;
    const child = tbodyRef?.children[index];
    if (child?.getAttribute(ROW_ATTR) === String(rowId)) {
      return /** @type {HTMLTableRowElement} */ (child);
    }
    return findRowElement(rowId);
  }

  /**
   * @param {Node["id"]} rowId
   * @returns {HTMLTableRowElement | null}
   */
  function findRowElement(rowId) {
    return tbodyRef?.querySelector(treeRowIdSelector(rowId)) ?? null;
  }

  /**
   * Move focus to a row (`column` -1) or one of its cells.
   * @param {number} index
   * @param {number} column
   */
  function moveFocus(index, column) {
    const rowElement = rowElementAt(index);
    if (!rowElement) return;
    const cell = column >= 0 ? rowElement.cells[column] : undefined;
    focusRowId = rows[index].node.id;
    tabCol = cell ? column : -1;
    (cell ?? rowElement).focus();
  }

  /**
   * The nearest enabled row from `from`, walking by `step`; -1 if none.
   * @param {number} from
   * @param {1 | -1} step
   */
  function enabledFrom(from, step) {
    for (let i = from; i >= 0 && i < rows.length; i += step) {
      if (!rows[i].node.disabled) return i;
    }
    return -1;
  }

  const typeahead = createTypeaheadBuffer();

  /**
   * @param {KeyboardEvent} event
   * @param {number} index
   * @param {number} column
   */
  function handleTypeahead(event, index, column) {
    const query = collapseRepeatedChar(typeahead.push(event.key));
    const match = typeaheadIndex({
      items: rows,
      query,
      index,
      itemToString: (row) => String(cellValue(row.node, columns[0], 0) ?? ""),
      isDisabled: (row) => Boolean(row.node.disabled),
    });
    if (match !== index) moveFocus(match, column);
  }

  /**
   * Hand focus to the first control in a cell.
   * @param {Element} cell
   * @returns {boolean}
   */
  function enterCell(cell) {
    for (const widget of cell.querySelectorAll(FOCUSABLE_SELECTOR)) {
      if (widget instanceof HTMLElement) {
        widget.focus();
        if (document.activeElement === widget) return true;
      }
    }
    return false;
  }

  /**
   * The row and the cell (when there is one) an event came from, or null
   * when it came from the header, another table inside a cell, or outside
   * any row.
   * @param {EventTarget | null} target
   */
  function locate(target) {
    if (!(target instanceof Element) || !tbodyRef) return null;
    const rowElement = target.closest("tr");
    if (!rowElement || rowElement.parentElement !== tbodyRef) return null;
    const index = indexByKey.get(rowElement.getAttribute(ROW_ATTR) ?? "");
    if (index === undefined) return null;
    const cell = target.closest("td");
    return {
      index,
      rowElement,
      cell: cell && cell.parentElement === rowElement ? cell : null,
      onRow: target === rowElement,
      onCell: target === cell,
    };
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    const where = locate(event.target);
    if (!where) return;
    const { index, rowElement, cell, onRow, onCell } = where;

    if (!onRow && !onCell) {
      // A control inside a cell owns every key but Escape.
      if (event.key === "Escape" && cell && !isImeComposition(event)) {
        event.preventDefault();
        event.stopPropagation();
        cell.focus();
      }
      return;
    }

    const row = rows[index];
    const column = onRow ? -1 : (cell?.cellIndex ?? -1);
    const modified = event.ctrlKey || event.metaKey;
    const key = inlineKey(
      event.key,
      $layoutDirection,
      /** @type {Element} */ (event.currentTarget),
    );
    const expanded = row.hasChildren && expandedSet.has(row.node.id);

    switch (key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const step = key === "ArrowDown" ? 1 : -1;
        const next = enabledFrom(index + step, step);
        if (next < 0) break;
        moveFocus(next, column);
        if (multiselect && event.shiftKey && !modified) shiftToggleRow(next);
        break;
      }
      case "PageDown":
      case "PageUp": {
        event.preventDefault();
        const step = key === "PageDown" ? 1 : -1;
        const target = Math.min(
          Math.max(index + step * PAGE_ROWS, 0),
          rows.length - 1,
        );
        let next = enabledFrom(target, step);
        if (next < 0) next = enabledFrom(target, step === 1 ? -1 : 1);
        if (next >= 0 && next !== index) moveFocus(next, column);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        if (onRow) {
          if (row.hasChildren && !expanded) setExpanded(row.node, true);
          else moveFocus(index, 0);
        } else if (column < rowElement.cells.length - 1) {
          moveFocus(index, column + 1);
        }
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        if (onRow) {
          if (expanded) {
            setExpanded(row.node, false);
          } else if (row.parentId !== null) {
            const parentIndex = indexByKey.get(String(row.parentId));
            if (parentIndex !== undefined) moveFocus(parentIndex, -1);
          }
        } else {
          moveFocus(index, column - 1);
        }
        break;
      }
      case "Home":
      case "End": {
        event.preventDefault();
        const last = key === "End";
        if (onCell && !modified) {
          moveFocus(index, last ? rowElement.cells.length - 1 : 0);
          break;
        }
        const next = last
          ? enabledFrom(rows.length - 1, -1)
          : enabledFrom(0, 1);
        if (next >= 0) {
          moveFocus(
            next,
            onCell ? (last ? rowElement.cells.length - 1 : 0) : -1,
          );
        }
        break;
      }
      case "Enter":
      case " ":
      case "F2": {
        if (key === "F2" && !onCell) break;
        event.preventDefault();
        if (onCell && cell && key !== " " && enterCell(cell)) break;
        if (key === "F2") break;
        if (key === "Enter" && row.hasChildren) {
          setExpanded(row.node, !expanded);
        }
        selectRow(index, event);
        break;
      }
      default: {
        if (
          multiselect &&
          modified &&
          (event.key === "a" || event.key === "A")
        ) {
          event.preventDefault();
          selectAllRows();
        } else if (isTypeaheadKey(event)) {
          handleTypeahead(event, index, column);
        }
      }
    }
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    const where = locate(event.target);
    if (!where) return;
    const row = rows[where.index];
    if (row.node.disabled) return;
    const target = /** @type {Element} */ (event.target);

    // A leaf's empty toggle box selects the row like the rest of it.
    if (row.hasChildren && target.closest(".bx--tree-grid__toggle")) {
      setExpanded(row.node, !expandedSet.has(row.node.id));
      return;
    }

    // A control in a cell handles its own click.
    const control = target.closest(INTERACTIVE_SELECTOR);
    if (control && where.rowElement.contains(control)) return;

    selectRow(where.index, event);
  }

  /** @type {Node["id"] | undefined} */
  let lastFocusedRowId;
  /** @type {Element | null} */
  let actionableCell = null;

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const where = locate(event.target);
    if (!where) return;
    const row = rows[where.index];
    if (row.node.disabled) return;

    focusRowId = row.node.id;
    tabCol = where.onRow ? -1 : (where.cell?.cellIndex ?? -1);

    // Tab walks the controls of the cell that holds focus.
    if (widgetNavigation === "arrow" && where.cell && !where.onCell) {
      actionableCell = where.cell;
      restoreWidgetTabStops(where.cell);
    }

    if (lastFocusedRowId !== row.node.id) {
      lastFocusedRowId = row.node.id;
      dispatch("focus", eventNode(row.node));
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = event.relatedTarget;
    if (
      actionableCell &&
      !(
        next instanceof Node &&
        next !== actionableCell &&
        actionableCell.contains(next)
      )
    ) {
      removeWidgetTabStops(actionableCell);
      actionableCell = null;
    }
    if (!(next instanceof Node && tableRef?.contains(next))) {
      lastFocusedRowId = undefined;
    }
  }

  let stopWidgetNavigation = noop;

  $: observeWidgets(tbodyRef, widgetNavigation);

  /**
   * In `"arrow"` mode, controls in cells leave the tab order, also as rows
   * and widgets mount later (an expand, an `{#if}` in a cell).
   * @param {null | HTMLTableSectionElement} body
   * @param {"arrow" | "tab"} mode
   */
  function observeWidgets(body, mode) {
    stopWidgetNavigation();
    stopWidgetNavigation = noop;
    if (!body || mode !== "arrow" || typeof MutationObserver === "undefined") {
      return;
    }
    removeWidgetTabStops(body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const added of record.addedNodes) {
          if (added instanceof Element) removeWidgetTabStops(added);
        }
      }
    });
    observer.observe(body, { childList: true, subtree: true });
    stopWidgetNavigation = () => observer.disconnect();
  }

  onMount(() => () => {
    stopWidgetNavigation();
    typeahead.clear();
  });

  let prevSelectedPushed = selectedIds;
  let prevExpandedPushed = expandedIds;

  $: if (!arrayIdsEqual(selectedIds, prevSelectedPushed)) {
    const was = prevSelectedPushed;
    prevSelectedPushed = selectedIds;
    const next = selectedIds.slice();
    const wasSet = new Set(was);
    const nextSet = new Set(next);
    const added = next.filter((nodeId) => !wasSet.has(nodeId));
    const removed = was.filter((nodeId) => !nextSet.has(nodeId));
    tick().then(() => {
      dispatch("select:change", { selectedIds: next, added, removed });
    });
  }

  $: if (!arrayIdsEqual(expandedIds, prevExpandedPushed)) {
    const was = prevExpandedPushed;
    prevExpandedPushed = expandedIds;
    const next = expandedIds.slice();
    const wasSet = new Set(was);
    const nextSet = new Set(next);
    const added = next.filter((nodeId) => !wasSet.has(nodeId));
    const removed = was.filter((nodeId) => !nextSet.has(nodeId));
    tick().then(() => {
      dispatch("toggle:change", { expandedIds: next, added, removed });
    });
  }
</script>

{#if !hideLabel}
  <label id={labelId} class:bx--label={true}>
    <slot name="labelChildren">{labelText}</slot>
  </label>
{/if}

<div
  class:bx--data-table_inner-container={stickyHeader}
  class:bx--data-table-content={!stickyHeader}
  style={stickyHeader && stickyHeaderMaxHeight != null
    ? `max-height: ${toCssLength(stickyHeaderMaxHeight)}`
    : undefined}
>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <table
    {...$$restProps}
    {id}
    bind:this={tableRef}
    role="treegrid"
    class:bx--data-table={true}
    class:bx--tree-grid={true}
    class:bx--data-table--compact={effectiveSize === "compact"}
    class:bx--data-table--short={effectiveSize === "short"}
    class:bx--data-table--md={effectiveSize === "medium"}
    class:bx--data-table--tall={effectiveSize === "tall"}
    class:bx--data-table--zebra={zebra}
    class:bx--data-table--sticky-header={stickyHeader}
    style:min-inline-size={minTableWidth(columns)}
    aria-label={$$restProps["aria-label"] ??
      (hideLabel ? labelText : undefined)}
    aria-labelledby={$$restProps["aria-labelledby"] ??
      (hideLabel || $$restProps["aria-label"] ? undefined : labelId)}
    aria-multiselectable={multiselect ? "true" : undefined}
    on:keydown
    on:keydown={handleKeydown}
    on:click={handleClick}
    on:focusin={handleFocusin}
    on:focusout={handleFocusout}
  >
    <thead>
      <tr>
        {#each columns as header (header.key)}
          <th
            scope="col"
            class={alignClass(header)}
            style={formatHeaderWidth(header)}
          >
            <div class:bx--table-header-label={true}>
              <slot name="cellHeader" {header}>{header.value}</slot>
            </div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody bind:this={tbodyRef}>
      {#each rowIds as rowId (rowId)}
        {@const row = rowAt(rows, indexByKey, rowId)}
        {@const node = row.node}
        {@const expandable = row.hasChildren}
        {@const expanded = expandable && expandedSet.has(node.id)}
        {@const selected = selectedSet.has(node.id)}
        {@const slotNode = $$slots.cell
          ? eventNode(node, { expanded, selected })
          : null}
        <tr
          data-tree-row-id={node.id}
          tabindex={node.disabled
            ? undefined
            : node.id === tabStopId && tabCol === -1
              ? 0
              : -1}
          aria-level={row.depth + 1}
          aria-posinset={row.posInSet}
          aria-setsize={row.setSize}
          aria-expanded={expandable ? expanded : undefined}
          aria-selected={node.disabled ? undefined : selected}
          aria-disabled={node.disabled || undefined}
          aria-current={node.id === activeId || undefined}
          class:bx--data-table--selected={selected}
          class:bx--tree-grid__row--disabled={node.disabled}
          style:--ccs-tree-grid-level={row.depth + 1}
        >
          {#each columns as header, column (header.key)}
            <td
              role={column === 0 ? "rowheader" : "gridcell"}
              tabindex={node.disabled
                ? undefined
                : node.id === tabStopId && tabCol === column
                  ? 0
                  : -1}
              class={alignClass(header)}
            >
              {#if column === 0}
                <div class:bx--tree-grid__label={true}>
                  <span
                    class:bx--tree-grid__toggle={true}
                    class:bx--tree-grid__toggle--expandable={expandable}
                    class:bx--tree-grid__toggle--expanded={expanded}
                  >
                    {#if expandable}<CaretDown />{/if}
                  </span>
                  {#if node.icon}
                    <svelte:component
                      this={node.icon}
                      class="bx--tree-grid__icon"
                    />
                  {/if}
                  <span>
                    <slot
                      name="cell"
                      node={slotNode}
                      cell={cellSlotProps(node, header, column)}
                      cellIndex={column}
                      {expanded}
                      {selected}
                      level={row.depth + 1}
                    >
                      {cellDisplay(node, header, column)}
                    </slot>
                  </span>
                </div>
              {:else}
                <slot
                  name="cell"
                  node={slotNode}
                  cell={cellSlotProps(node, header, column)}
                  cellIndex={column}
                  {expanded}
                  {selected}
                  level={row.depth + 1}
                >
                  {cellDisplay(node, header, column)}
                </slot>
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
