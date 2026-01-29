<script>
  /**
   * @generics {Row extends DataTableRow = DataTableRow} Row
   * @template {DataTableRow} Row
   * @typedef {import('./DataTableTypes.d.ts').PropertyPath<Row>} DataTableKey<Row=DataTableRow>
   * @typedef {any} DataTableValue
   * @typedef {object} DataTableEmptyHeader<Row=DataTableRow>
   * @property {DataTableKey<Row> | (string & {})} key
   * @property {boolean} empty - Whether the header is empty
   * @property {(item: DataTableValue, row: Row) => DataTableValue} [display]
   * @property {false | ((a: DataTableValue, b: DataTableValue) => number)} [sort]
   * @property {boolean} [columnMenu] - Whether the column menu is enabled
   * @property {string} [width]
   * @property {string} [minWidth]
   * @typedef {object} DataTableNonEmptyHeader<Row=DataTableRow>
   * @property {DataTableKey<Row>} key
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: Row) => DataTableValue} [display]
   * @property {false | ((a: DataTableValue, b: DataTableValue) => number)} [sort]
   * @property {boolean} [columnMenu] - Whether the column menu is enabled
   * @property {string} [width]
   * @property {string} [minWidth]
   * @typedef {DataTableNonEmptyHeader<Row> | DataTableEmptyHeader<Row>} DataTableHeader<Row=DataTableRow>
   * @typedef {{ id: Id; [key: string]: DataTableValue; }} DataTableRow<Id=any>
   * @typedef {object} DataTableCell<Row=DataTableRow>
   * @property {DataTableKey<Row> | (string & {})} key
   * @property {DataTableValue} value
   * @property {(item: DataTableValue, row: DataTableRow) => DataTableValue} [display]
   * @slot {{ row: Row; rowSelected: boolean; }} expanded-row
   * @slot {{ header: DataTableNonEmptyHeader; }} cellHeader
   * @slot {{ row: Row; cell: DataTableCell<Row>; rowIndex: number; cellIndex: number; rowSelected: boolean; rowExpanded: boolean; }} cell
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
   * @property {"ascending" | "descending" | "none"} [sortDirection]
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
   * @event click:cell
   * @type {object}
   * @property {DataTableCell<Row>} cell
   * @property {EventTarget} target
   * @property {EventTarget} currentTarget
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
   */
  export let sortKey = null;

  /**
   * Specify the sort direction.
   * @type {"none" | "ascending" | "descending"}
   */
  export let sortDirection = "none";

  /**
   * Set to `true` for the expandable variant.
   * Automatically set to `true` if `batchExpansion` is `true`.
   */
  export let expandable = false;

  /**
   * Set to `true` to enable batch expansion.
   */
  export let batchExpansion = false;

  /**
   * Specify the row ids to be expanded.
   * @type {ReadonlyArray<Row["id"]>}
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
   */
  export let selectable = false;

  /** Set to `true` to enable batch selection */
  export let batchSelection = false;

  /**
   * Specify the row ids to be selected.
   * @type {ReadonlyArray<Row["id"]>}
   */
  export let selectedRowIds = [];

  /**
   * Specify the ids of rows that should not be selectable.
   * @type {ReadonlyArray<Row["id"]>}
   */
  export let nonSelectableRowIds = [];

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  /** Specify the number of items to display in a page */
  export let pageSize = 0;

  /** Set to `number` to set current page */
  export let page = 0;

  /**
   * Override the default table header translation ids.
   * @type {(id: import("./TableHeader.svelte").TableHeaderTranslationId) => string}
   */
  export let tableHeaderTranslateWithId = undefined;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";
  import InlineCheckbox from "../Checkbox/InlineCheckbox.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import RadioButton from "../RadioButton/RadioButton.svelte";
  import {
    compareValues,
    formatHeaderWidth,
    getDisplayedRows,
    resolvePath,
  } from "./data-table-utils.js";
  import Table from "./Table.svelte";
  import TableBody from "./TableBody.svelte";
  import TableCell from "./TableCell.svelte";
  import TableContainer from "./TableContainer.svelte";
  import TableHead from "./TableHead.svelte";
  import TableHeader from "./TableHeader.svelte";
  import TableRow from "./TableRow.svelte";

  const sortDirectionMap = {
    none: "ascending",
    ascending: "descending",
    descending: "none",
  };
  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<Row["id"]>>}
   */
  const batchSelectedIds = writable([]);
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<Row>>}
   */
  const tableRows = writable(rows);

  // Internal ID prefix for radio buttons, checkboxes, etc.
  // since there may be multiple `DataTable` instances that have overlapping row ids.
  const id = `ccs-${Math.random().toString(36)}`;

  // Store a copy of the original rows for filter restoration.
  $: originalRows = [...rows];

  $: thKeys = headers.reduce((a, c) => {
    a[c.key] = c.key;
    return a;
  }, {});

  /**
   * @type {() => void}
   */
  const resetSelectedRowIds = () => {
    selectAll = false;
    selectedRowIds = [];
    if (refSelectAll) refSelectAll.checked = false;
  };

  /**
   * @type {(searchValue: string, customFilter?: (row: Row, value: string) => boolean) => ReadonlyArray<Row["id"]>}
   */
  const filterRows = (searchValue, customFilter) => {
    const value = searchValue.trim().toLowerCase();

    if (value.length === 0) {
      // Reset to original rows.
      tableRows.set(originalRows);
      return originalRows.map((row) => row.id);
    }

    let filteredRows = [];

    if (typeof customFilter === "function") {
      // Apply custom filter if provided.
      filteredRows = originalRows.filter((row) => customFilter(row, value));
    } else {
      // Get searchable keys from headers (non-empty headers with keys).
      const searchableKeys = headers
        .filter((header) => !header.empty && header.key)
        .map((header) => header.key);

      // Default filter checks fields defined in headers
      // for a basic, case-insensitive match (non-fuzzy).
      // This supports nested keys like "contact.company".
      filteredRows = originalRows.filter((row) => {
        return searchableKeys.some((key) => {
          const _value = resolvePath(row, key);
          if (typeof _value === "string" || typeof _value === "number") {
            return `${_value}`?.toLowerCase().includes(value);
          }
          return false;
        });
      });
    }

    tableRows.set(filteredRows);
    return filteredRows.map((row) => row.id);
  };

  setContext("DataTable", {
    batchSelectedIds,
    tableRows,
    resetSelectedRowIds,
    filterRows,
  });

  let expanded = false;
  let parentRowId = null;

  $: expandedRows = expandedRowIds.reduce((a, id) => {
    a[id] = true;
    return a;
  }, {});

  let refSelectAll = null;

  let prevBatchSelected = [];
  $: if (
    prevBatchSelected.length !== selectedRowIds.length ||
    selectedRowIds.some((id, i) => id !== prevBatchSelected[i])
  ) {
    prevBatchSelected = selectedRowIds;
    batchSelectedIds.set(selectedRowIds);
  }
  $: rowIds = $tableRows.map((row) => row.id);

  // Use Sets for faster row lookups.
  $: selectedRowIdsSet = new Set(selectedRowIds);
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
  let prevHeaders;
  $: if (rows !== prevRows || headers !== prevHeaders) {
    tableCellsByRowId = rows.reduce((rowsAcc, row) => {
      rowsAcc[row.id] = headers.map((header, index) => ({
        key: header.key || `key-${index}`,
        value: header.key ? resolvePath(row, header.key) : undefined,
        display: header.display,
        empty: header.empty,
        columnMenu: header.columnMenu,
      }));
      return rowsAcc;
    }, {});
    prevRows = rows;
    prevHeaders = headers;
  }

  $: $tableRows = rows;
  $: ascending = sortDirection === "ascending";
  $: sorting = sortable && sortKey != null;
  $: sortingHeader = headers.find((header) => header.key === sortKey);
  $: sortedRows =
    sorting && sortDirection !== "none"
      ? [...$tableRows].sort((a, b) => {
          const itemA = resolvePath(a, sortKey);
          const itemB = resolvePath(b, sortKey);
          return compareValues(itemA, itemB, ascending, sortingHeader?.sort);
        })
      : $tableRows;
  $: displayedRows = getDisplayedRows($tableRows, page, pageSize);
  $: displayedSortedRows = getDisplayedRows(sortedRows, page, pageSize);

  $: hasCustomHeaderWidth = headers.some(
    (header) => header.width || header.minWidth,
  );
</script>

<TableContainer {useStaticWidth} {...$$restProps}>
  {#if title || $$slots.titleChildren || description || $$slots.descriptionChildren}
    <div class:bx--data-table-header={true}>
      {#if title || $$slots.titleChildren}
        <slot name="titleChildren" props={{ class: "bx--data-table-header__title" }}>
          <h4 class:bx--data-table-header__title={true}>{title}</h4>
        </slot>
      {/if}
      {#if description || $$slots.descriptionChildren}
        <slot
          name="descriptionChildren"
          props={{ class: "bx--data-table-header__description" }}
        >
          <p class:bx--data-table-header__description={true}>{description}</p>
        </slot>
      {/if}
    </div>
  {/if}
  <slot />
  <Table
    {zebra}
    {size}
    {stickyHeader}
    {sortable}
    {useStaticWidth}
    tableStyle={hasCustomHeaderWidth && "table-layout: fixed"}
  >
    <TableHead>
      <TableRow>
        {#if expandable}
          <th
            scope="col"
            class:bx--table-expand={true}
            data-previous-value={expanded ? "collapsed" : undefined}
          >
            {#if batchExpansion}
              <button
                type="button"
                class:bx--table-expand__button={true}
                aria-label={expanded ? "Collapse all rows" : "Expand all rows"}
                aria-controls={expandableRowIds
                  .map((id) => `expandable-row-${id}`)
                  .join(" ")}
                on:click={() => {
                  expanded = !expanded;
                  expandedRowIds = expanded ? expandableRowIds : [];

                  dispatch("click:header--expand", { expanded });
                }}
              >
                <ChevronRight
                  aria-hidden="true"
                  class="bx--table-expand__svg"
                />
              </button>
            {/if}
          </th>
        {/if}
        {#if selectable && !batchSelection}
          <th scope="col"></th>
        {/if}
        {#if batchSelection && !radio}
          <th scope="col" class:bx--table-column-checkbox={true}>
            <InlineCheckbox
              bind:ref={refSelectAll}
              aria-label="Select all rows"
              name="{id}-select-all"
              value="all"
              checked={selectAll}
              {indeterminate}
              on:change={(e) => {
                dispatch("click:header--select", {
                  indeterminate,
                  selected: !indeterminate && e.target.checked,
                });

                if (indeterminate) {
                  e.target.checked = false;
                  selectAll = false;
                  selectedRowIds = [];
                  return;
                }

                if (e.target.checked) {
                  selectedRowIds = selectableRowIds;
                } else {
                  selectedRowIds = [];
                }
              }}
            />
          </th>
        {/if}
        {#each headers as header (header.key)}
          {#if header.empty}
            <th scope="col" style={formatHeaderWidth(header)}></th>
          {:else}
            <TableHeader
              id={header.key}
              style={formatHeaderWidth(header)}
              sortable={sortable && header.sort !== false}
              sortDirection={sortKey === header.key ? sortDirection : "none"}
              active={sortKey === header.key}
              {...(tableHeaderTranslateWithId
                ? { translateWithId: tableHeaderTranslateWithId }
                : {})}
              on:click={(e) => {
                dispatch("click", { header });

                if (header.sort === false) {
                  dispatch("click:header", {
                    header,
                    target: e.target,
                    currentTarget: e.currentTarget,
                  });
                } else {
                  let currentSortDirection =
                    sortKey === header.key ? sortDirection : "none";
                  sortDirection = sortDirectionMap[currentSortDirection];
                  sortKey =
                    sortDirection === "none" ? null : thKeys[header.key];
                  dispatch("click:header", {
                    header,
                    sortDirection,
                    target: e.target,
                    currentTarget: e.currentTarget,
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
      {#each sorting ? displayedSortedRows : displayedRows as row, i (row.id)}
        {@const isSelected = selectedRowIdsSet.has(row.id)}
        {@const isExpanded = !!expandedRows[row.id]}
        {@const isExpandable = !nonExpandableRowIdsSet.has(row.id)}
        {@const isSelectable = !nonSelectableRowIdsSet.has(row.id)}
        <TableRow
          data-row={row.id}
          data-parent-row={expandable ? true : undefined}
          class="{isSelected
            ? 'bx--data-table--selected'
            : ''} {isExpanded ? 'bx--expandable-row' : ''} {expandable
            ? 'bx--parent-row'
            : ''} {expandable && parentRowId === row.id
            ? 'bx--expandable-row--hover'
            : ''}"
          on:click={(e) => {
            // forgo "click", "click:row" events if target
            // resembles an overflow menu, a checkbox, or radio button
            if (
              [...e.target.classList].some((name) =>
                /^bx--(overflow-menu|checkbox|radio-button)/.test(name),
              )
            ) {
              return;
            }
            dispatch("click", { row });
            dispatch("click:row", {
              row,
              target: e.target,
              currentTarget: e.currentTarget,
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
              headers="expand"
              data-previous-value={isExpandable && isExpanded
                ? "collapsed"
                : undefined}
            >
              {#if isExpandable}
                <button
                  type="button"
                  class:bx--table-expand__button={true}
                  aria-controls={`expandable-row-${row.id}`}
                  aria-label={isExpanded
                    ? "Collapse current row"
                    : "Expand current row"}
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
                  <ChevronRight
                    aria-hidden="true"
                    class="bx--table-expand__svg"
                  />
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
                    checked={isSelected}
                    value={row.id}
                    on:change={() => {
                      const next = new Set(selectedRowIds);
                      if (isSelected) {
                        next.delete(row.id);
                        selectedRowIds = [...next];
                        dispatch("click:row--select", { row, selected: false });
                      } else {
                        next.add(row.id);
                        selectedRowIds = [...next];
                        dispatch("click:row--select", { row, selected: true });
                      }
                    }}
                  />
                {/if}
              {/if}
            </td>
          {/if}
          {#each tableCellsByRowId[row.id] as cell, j (cell.key)}
            {#if cell.empty}
              <td class:bx--table-column-menu={cell.columnMenu}>
                <slot
                  name="cell"
                  {row}
                  {cell}
                  rowIndex={i}
                  cellIndex={j}
                  rowSelected={isSelected}
                  rowExpanded={isExpanded}
                >
                  {cell.display ? cell.display(cell.value, row) : cell.value}
                </slot>
              </td>
            {:else}
              <TableCell
                on:click={(e) => {
                  dispatch("click", { row, cell });
                  dispatch("click:cell", {
                    cell,
                    target: e.target,
                    currentTarget: e.currentTarget,
                  });
                }}
              >
                <slot
                  name="cell"
                  {row}
                  {cell}
                  rowIndex={i}
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
            id={`expandable-row-${row.id}`}
            data-child-row
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
              <TableCell
                colspan={selectable ? headers.length + 2 : headers.length + 1}
              >
                <div class:bx--child-row-inner-container={true}>
                  <slot
                    name="expanded-row"
                    {row}
                    rowSelected={isSelected}
                  />
                </div>
              </TableCell>
            {/if}
          </tr>
        {/if}
      {/each}
    </TableBody>
  </Table>
</TableContainer>
