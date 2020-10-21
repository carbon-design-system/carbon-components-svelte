<script>
  /**
   * Specify the data table headers
   * @type {{key: string; value: string; display?: (item) => string; sort?: (a, b) => number}[]} [headers=[]]
   */
  export let headers = [];

  /**
   * Specify the rows the data table should render
   * keys defined in `headers` are used for the row ids
   * @type {Object[]} [rows=[]]
   */
  export let rows = [];

  /**
   * Set the size of the data table
   * @type {"compact" | "short" | "tall"} [size]
   */
  export let size = undefined;

  /**
   * Specify the title of the data table
   * @type {string} [title=""]
   */
  export let title = "";

  /**
   * Specify the description of the data table
   * @type {string} [description=""]
   */
  export let description = "";

  /**
   * Set to `true` to use zebra styles
   * @type {boolean} [zebra=false]
   */
  export let zebra = false;

  /**
   * Set to `true` for the sortable variant
   * @type {boolean} [sortable=false]
   */
  export let sortable = false;

  /**
   * Set to `true` for the expandable variant
   * Automatically set to `true` if `batchExpansion` is `true`
   * @type {boolean} [expandable=false]
   */
  export let expandable = false;

  /**
   * Set to `true` to enable batch expansion
   * @type {boolean} [batchExpansion=false]
   */
  export let batchExpansion = false;

  /**
   * Specify the row ids to be expanded
   * @type {string[]} [expandedRowIds=[]]
   */
  export let expandedRowIds = [];

  /**
   * Set to `true` to enable a sticky header
   * @type {boolean} [stickyHeader=false]
   */
  export let stickyHeader = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable, derived } from "svelte/store";
  import ChevronRight16 from "carbon-icons-svelte/lib/ChevronRight16";
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

  setContext("DataTable", {
    sortHeader,
    tableSortable,
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
  $: if (batchExpansion) expandable = true;
  $: tableSortable.set(sortable);
  $: headerKeys = headers.map(({ key }) => key);
  $: rows = rows.map((row) => ({
    ...row,
    cells: headerKeys.map((key) => ({ key, value: row[key] })),
  }));
  $: sortedRows = rows;
  $: ascending = $sortHeader.sortDirection === "ascending";
  $: sortKey = $sortHeader.key;
  $: sorting = sortable && sortKey != null;
  $: if (sorting) {
    if ($sortHeader.sortDirection === "none") {
      sortedRows = rows;
    } else {
      sortedRows = [...rows].sort(
        $sortHeader.sort
          ? $sortHeader.sort
          : (a, b) => {
              const itemA = ascending ? a[sortKey] : b[sortKey];
              const itemB = ascending ? b[sortKey] : a[sortKey];

              if (typeof itemA === "number" && typeof itemB === "number") {
                return itemA - itemB;
              }

              return itemA
                .toString()
                .localeCompare(itemB.toString(), "en", { numeric: true });
            }
      );
    }
  }
</script>

<TableContainer title="{title}" description="{description}" {...$$restProps}>
  <Table
    zebra="{zebra}"
    size="{size}"
    stickyHeader="{stickyHeader}"
    sortable="{sortable}"
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
                  expandedRowIds = expanded ? rows.map((row) => row.id) : [];

                  dispatch('click:header--expand', { expanded });
                }}"
              >
                <ChevronRight16 class="bx--table-expand__svg" />
              </button>
            {/if}
          </th>
        {/if}
        {#each headers as header, i (header.key)}
          <TableHeader
            on:click="{() => {
              dispatch('click', { header });
              let active = header.key === $sortHeader.key;
              let currentSortDirection = active ? $sortHeader.sortDirection : 'none';
              let sortDirection = sortDirectionMap[currentSortDirection];
              dispatch('click:header', { header, sortDirection });
              sortHeader.set({
                id: sortDirection === 'none' ? null : $thKeys[header.key],
                key: header.key,
                sort: header.sort,
                sortDirection,
              });
            }}"
          >
            <slot name="cell-header" header="{header}">{header.value}</slot>
          </TableHeader>
        {/each}
      </TableRow>
    </TableHead>
    <TableBody>
      {#each sorting ? sortedRows : rows as row, i (row.id)}
        <TableRow
          class="{expandedRows[row.id] ? 'bx--expandable-row' : ''} {expandable ? 'bx--parent-row' : ''} {expandable && parentRowId === row.id ? 'bx--expandable-row--hover' : ''}"
          on:click="{() => {
            dispatch('click', { row });
            dispatch('click:row', row);
          }}"
        >
          {#if expandable}
            <TableCell
              class="bx--table-expand"
              headers="expand"
              data-previous-value="{expandedRows[row.id] ? 'collapsed' : undefined}"
            >
              <button
                type="button"
                class:bx--table-expand__button="{true}"
                aria-label="{expandedRows[row.id] ? 'Collapse current row' : 'Expand current row'}"
                on:click="{() => {
                  const rowExpanded = !!expandedRows[row.id];

                  expandedRowIds = rowExpanded ? expandedRowIds.filter((id) => id !== row.id) : [...expandedRowIds, row.id];

                  dispatch('click:row--expand', {
                    row,
                    expanded: !rowExpanded,
                  });
                }}"
              >
                <ChevronRight16 class="bx--table-expand__svg" />
              </button>
            </TableCell>
          {/if}
          {#each row.cells as cell, j (cell.key)}
            <TableCell
              on:click="{() => {
                dispatch('click', { row, cell });
                dispatch('click:cell', cell);
              }}"
            >
              <slot name="cell" row="{row}" cell="{cell}">
                {headers[j].display ? headers[j].display(cell.value) : cell.value}
              </slot>
            </TableCell>
          {/each}
        </TableRow>

        {#if expandable && expandedRows[row.id]}
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
            <TableCell colspan="{headers.length + 1}">
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
