<script>
  /**
   * @typedef {string} DataTableKey
   * @typedef {any} DataTableValue
   * @typedef {{ key: DataTableKey; empty: boolean; display?: (item: Value) => DataTableValue; sort?: false | ((a: DataTableValue, b: DataTableValue) => (0 | -1 | 1)); columnMenu?: boolean; }} DataTableEmptyHeader
   * @typedef {{ key: DataTableKey; value: DataTableValue; display?: (item: Value) => DataTableValue; sort?: false | ((a: DataTableValue, b: DataTableValue) => (0 | -1 | 1)); columnMenu?: boolean; }} DataTableNonEmptyHeader
   * @typedef {DataTableNonEmptyHeader | DataTableEmptyHeader} DataTableHeader
   * @typedef {{ id: any; [key: string]: DataTableValue; }} DataTableRow
   * @typedef {any} DataTableRowId
   * @typedef {{ key: DataTableKey; value: DataTableValue; display?: (item: Value) => DataTableValue; }} DataTableCell
   * @slot {{ row: DataTableRow; }} expanded-row
   * @slot {{ header: DataTableNonEmptyHeader; }} cell-header
   * @slot {{ row: DataTableRow; cell: DataTableCell; }} cell
   * @event {{ header?: DataTableHeader; row?: DataTableRow; cell?: DataTableCell; }} click
   * @event {{ expanded: boolean; }} click:header--expand
   * @event {{ header: DataTableHeader; sortDirection?: "ascending" | "descending" | "none" }} click:header
   * @event {DataTableRow} click:row
   * @event {DataTableRow} mouseenter:row
   * @event {DataTableRow} mouseleave:row
   * @event {{ expanded: boolean; row: DataTableRow; }} click:row--expand
   * @event {DataTableCell} click:cell
   * @restProps {div}
   */

  /**
   * Specify the data table headers
   * @type {DataTableHeader[]}
   */
  export let headers = [];

  /**
   * Specify the rows the data table should render
   * keys defined in `headers` are used for the row ids
   * @type {DataTableRow[]}
   */
  export let rows = [];

  /**
   * Set the size of the data table
   * @type {"compact" | "short" | "medium" | "tall"}
   */
  export let size = undefined;

  /** Specify the title of the data table */
  export let title = "";

  /** Specify the description of the data table */
  export let description = "";

  /** Set to `true` to use zebra styles */
  export let zebra = false;

  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /**
   * Set to `true` for the expandable variant
   * Automatically set to `true` if `batchExpansion` is `true`
   */
  export let expandable = false;

  /**
   * Set to `true` to enable batch expansion
   */
  export let batchExpansion = false;

  /**
   * Specify the row ids to be expanded
   * @type {DataTableRowId[]}
   */
  export let expandedRowIds = [];

  /**
   * Specify the ids for rows that should not be expandable
   * @type {DataTableRowId[]}
   */
  export let nonExpandableRowIds = [];

  /** Set to `true` for the radio selection variant */
  export let radio = false;

  /**
   * Set to `true` for the selectable variant
   * Automatically set to `true` if `radio` or `batchSelection` are `true`
   */
  export let selectable = false;

  /** Set to `true` to enable batch selection */
  export let batchSelection = false;

  /**
   * Specify the row ids to be selected
   * @type {DataTableRowId[]}
   */
  export let selectedRowIds = [];

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  /** Set to `number` to limit the output */
  export let pageSize = 0;

  /** Set to `number` to set current page */
  export let page = 0;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable, derived } from "svelte/store";
  import ChevronRight16 from "carbon-icons-svelte/lib/ChevronRight16/ChevronRight16.svelte";
  import { InlineCheckbox } from "../Checkbox";
  import { RadioButton } from "../RadioButton";
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
  const batchSelectedIds = writable(false);
  const tableSortable = writable(sortable);
  const sortHeader = writable({
    id: null,
    key: null,
    sort: undefined,
    sortDirection: "none",
  });
  const headerItems = writable([]);
  const thKeys = derived(headerItems, () =>
    headers
      .map(({ key }, i) => ({ key, id: $headerItems[i] }))
      .reduce((a, c) => ({ ...a, [c.key]: c.id }), {})
  );
  const resolvePath = (object, path) =>
    path
      .split(/[\.\[\]\'\"]/)
      .filter((p) => p)
      .reduce((o, p) => (o && typeof o === "object" ? o[p] : o), object);

  setContext("DataTable", {
    sortHeader,
    tableSortable,
    batchSelectedIds,
    resetSelectedRowIds: () => {
      selectAll = false;
      selectedRowIds = [];
      if (refSelectAll) refSelectAll.checked = false;
    },
    add: (id) => {
      headerItems.update((_) => [..._, id]);
    },
  });

  let expanded = false;
  let parentRowId = null;

  $: expandedRows = expandedRowIds.reduce(
    (a, id) => ({ ...a, [id]: true }),
    {}
  );

  let selectAll = false;
  let refSelectAll = null;

  $: batchSelectedIds.set(selectedRowIds);
  $: expandableRowIds = rows
    .map((row) => row.id)
    .filter((id) => !nonExpandableRowIds.includes(id));
  $: indeterminate =
    selectedRowIds.length > 0 && selectedRowIds.length < rows.length;
  $: if (batchExpansion) {
    expandable = true;
    expanded = expandedRowIds.length === expandableRowIds.length;
  }
  $: if (radio || batchSelection) selectable = true;
  $: tableSortable.set(sortable);
  $: headerKeys = headers.map(({ key }) => key);
  $: rows = rows.map((row) => ({
    ...row,
    cells: headerKeys.map((key, index) => ({
      key,
      value: resolvePath(row, key),
      display: headers[index].display,
    })),
  }));
  $: sortedRows = rows;
  $: ascending = $sortHeader.sortDirection === "ascending";
  $: sortKey = $sortHeader.key;
  $: sorting = sortable && sortKey != null;
  $: if (sorting) {
    if ($sortHeader.sortDirection === "none") {
      sortedRows = rows;
    } else {
      sortedRows = [...rows].sort((a, b) => {
        const itemA = ascending
          ? resolvePath(a, sortKey, "")
          : resolvePath(b, sortKey, "");
        const itemB = ascending
          ? resolvePath(b, sortKey, "")
          : resolvePath(a, sortKey, "");

        if ($sortHeader.sort) return $sortHeader.sort(itemA, itemB);

        if (typeof itemA === "number" && typeof itemB === "number")
          return itemA - itemB;

        if ([itemA, itemB].every((item) => !item && item !== 0)) return 0;
        if (!itemA && itemA !== 0) return ascending ? 1 : -1;
        if (!itemB && itemB !== 0) return ascending ? -1 : 1;

        return itemA
          .toString()
          .localeCompare(itemB.toString(), "en", { numeric: true });
      });
    }
  }
  const getDisplayedRows = (rows, page, pageSize) =>
    page && pageSize
      ? rows.slice((page - 1) * pageSize, page * pageSize)
      : rows;
  $: displayedRows = getDisplayedRows(rows, page, pageSize);
  $: displayedSortedRows = getDisplayedRows(sortedRows, page, pageSize);
</script>

<TableContainer useStaticWidth="{useStaticWidth}" {...$$restProps}>
  {#if title || $$slots.title || description || $$slots.description}
    <div class:bx--data-table-header="{true}">
      {#if title || $$slots.title}
        <h4 class:bx--data-table-header__title="{true}">
          <slot name="title">{title}</slot>
        </h4>
      {/if}
      {#if description || $$slots.description}
        <p class:bx--data-table-header__description="{true}">
          <slot name="description">{description}</slot>
        </p>
      {/if}
    </div>
  {/if}
  <slot />
  <Table
    zebra="{zebra}"
    size="{size}"
    stickyHeader="{stickyHeader}"
    sortable="{sortable}"
    useStaticWidth="{useStaticWidth}"
  >
    <TableHead>
      <TableRow>
        {#if expandable}
          <th
            scope="col"
            class:bx--table-expand="{true}"
            data-previous-value="{expanded ? 'collapsed' : undefined}"
          >
            {#if batchExpansion}
              <button
                type="button"
                class:bx--table-expand__button="{true}"
                on:click="{() => {
                  expanded = !expanded;
                  expandedRowIds = expanded ? expandableRowIds : [];

                  dispatch('click:header--expand', { expanded });
                }}"
              >
                <ChevronRight16 class="bx--table-expand__svg" />
              </button>
            {/if}
          </th>
        {/if}
        {#if selectable && !batchSelection}
          <th scope="col"></th>
        {/if}
        {#if batchSelection && !radio}
          <th scope="col" class:bx--table-column-checkbox="{true}">
            <InlineCheckbox
              bind:ref="{refSelectAll}"
              aria-label="Select all rows"
              checked="{selectAll}"
              indeterminate="{indeterminate}"
              on:change="{(e) => {
                if (indeterminate) {
                  e.target.checked = false;
                  selectAll = false;
                  selectedRowIds = [];
                  return;
                }

                if (e.target.checked) {
                  selectedRowIds = rows.map((row) => row.id);
                } else {
                  selectedRowIds = [];
                }
              }}"
            />
          </th>
        {/if}
        {#each headers as header, i (header.key)}
          {#if header.empty}
            <th scope="col"></th>
          {:else}
            <TableHeader
              disableSorting="{header.sort === false}"
              on:click="{() => {
                dispatch('click', { header });

                if (header.sort === false) {
                  dispatch('click:header', { header });
                } else {
                  let active = header.key === $sortHeader.key;
                  let currentSortDirection = active
                    ? $sortHeader.sortDirection
                    : 'none';
                  let sortDirection = sortDirectionMap[currentSortDirection];
                  dispatch('click:header', { header, sortDirection });
                  sortHeader.set({
                    id: sortDirection === 'none' ? null : $thKeys[header.key],
                    key: header.key,
                    sort: header.sort,
                    sortDirection,
                  });
                }
              }}"
            >
              <slot name="cell-header" header="{header}">{header.value}</slot>
            </TableHeader>
          {/if}
        {/each}
      </TableRow>
    </TableHead>
    <TableBody>
      {#each sorting ? displayedSortedRows : displayedRows as row, i (row.id)}
        <TableRow
          id="row-{row.id}"
          class="{selectedRowIds.includes(row.id)
            ? 'bx--data-table--selected'
            : ''} {expandedRows[row.id] ? 'bx--expandable-row' : ''} {expandable
            ? 'bx--parent-row'
            : ''} {expandable && parentRowId === row.id
            ? 'bx--expandable-row--hover'
            : ''}"
          on:click="{() => {
            dispatch('click', { row });
            dispatch('click:row', row);
          }}"
          on:mouseenter="{() => {
            dispatch('mouseenter:row', row);
          }}"
          on:mouseleave="{() => {
            dispatch('mouseleave:row', row);
          }}"
        >
          {#if expandable}
            <TableCell
              class="bx--table-expand"
              headers="expand"
              data-previous-value="{!nonExpandableRowIds.includes(row.id) &&
              expandedRows[row.id]
                ? 'collapsed'
                : undefined}"
            >
              {#if !nonExpandableRowIds.includes(row.id)}
                <button
                  type="button"
                  class:bx--table-expand__button="{true}"
                  aria-label="{expandedRows[row.id]
                    ? 'Collapse current row'
                    : 'Expand current row'}"
                  on:click="{() => {
                    const rowExpanded = !!expandedRows[row.id];

                    expandedRowIds = rowExpanded
                      ? expandedRowIds.filter((id) => id !== row.id)
                      : [...expandedRowIds, row.id];

                    dispatch('click:row--expand', {
                      row,
                      expanded: !rowExpanded,
                    });
                  }}"
                >
                  <ChevronRight16 class="bx--table-expand__svg" />
                </button>
              {/if}
            </TableCell>
          {/if}
          {#if selectable}
            <td
              class:bx--table-column-checkbox="{true}"
              class:bx--table-column-radio="{radio}"
            >
              {#if radio}
                <RadioButton
                  name="select-row-{row.id}"
                  checked="{selectedRowIds.includes(row.id)}"
                  on:change="{() => {
                    selectedRowIds = [row.id];
                  }}"
                />
              {:else}
                <InlineCheckbox
                  name="select-row-{row.id}"
                  checked="{selectedRowIds.includes(row.id)}"
                  on:change="{() => {
                    if (selectedRowIds.includes(row.id)) {
                      selectedRowIds = selectedRowIds.filter(
                        (id) => id !== row.id
                      );
                    } else {
                      selectedRowIds = [...selectedRowIds, row.id];
                    }
                  }}"
                />
              {/if}
            </td>
          {/if}
          {#each row.cells as cell, j (cell.key)}
            {#if headers[j].empty}
              <td class:bx--table-column-menu="{headers[j].columnMenu}">
                <slot name="cell" row="{row}" cell="{cell}">
                  {cell.display ? cell.display(cell.value) : cell.value}
                </slot>
              </td>
            {:else}
              <TableCell
                on:click="{() => {
                  dispatch('click', { row, cell });
                  dispatch('click:cell', cell);
                }}"
              >
                <slot name="cell" row="{row}" cell="{cell}">
                  {cell.display ? cell.display(cell.value) : cell.value}
                </slot>
              </TableCell>
            {/if}
          {/each}
        </TableRow>

        {#if expandable && expandedRows[row.id] && !nonExpandableRowIds.includes(row.id)}
          <tr
            data-child-row
            class:bx--expandable-row="{true}"
            on:mouseenter="{() => {
              parentRowId = row.id;
            }}"
            on:mouseleave="{() => {
              parentRowId = null;
            }}"
          >
            <TableCell
              colspan="{selectable ? headers.length + 2 : headers.length + 1}"
            >
              <div class:bx--child-row-inner-container="{true}">
                <slot name="expanded-row" row="{row}" />
              </div>
            </TableCell>
          </tr>
        {/if}
      {/each}
    </TableBody>
  </Table>
</TableContainer>
