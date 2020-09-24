<script>
  /**
   * Specify the data table headers
   * @type {{key: string; value: string;}[]} [headers=[]]
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
   * Set to `true` to enable a sticky header
   * @type {boolean} [stickyHeader=false]
   */
  export let stickyHeader = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable, derived } from "svelte/store";
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
  const sortHeader = writable({ id: null, key: null, sortDirection: "none" });
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
      sortedRows = [...rows].sort((a, b) => {
        const itemA = ascending ? a[sortKey] : b[sortKey];
        const itemB = ascending ? b[sortKey] : a[sortKey];

        if (typeof itemA === "number" && typeof itemB === "number") {
          return itemA - itemB;
        }

        return itemA
          .toString()
          .localeCompare(itemB.toString(), "en", { numeric: true });
      });
    }
  }
  $: props = {
    headers,
    rows,
  };
</script>

<slot props="{props}">
  <TableContainer title="{title}" description="{description}" {...$$restProps}>
    <Table
      zebra="{zebra}"
      size="{size}"
      stickyHeader="{stickyHeader}"
      sortable="{sortable}"
    >
      <TableHead>
        <TableRow>
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
                  sortDirection,
                });
              }}"
            >
              {header.value}
            </TableHeader>
          {/each}
        </TableRow>
      </TableHead>
      <TableBody>
        {#each sorting ? sortedRows : rows as row, i (row.id)}
          <TableRow
            on:click="{() => {
              dispatch('click', { row });
              dispatch('click:row', row);
            }}"
          >
            {#each row.cells as cell, j (cell.key)}
              <TableCell
                on:click="{() => {
                  dispatch('click', { row, cell });
                  dispatch('click:cell', cell);
                }}"
              >
                {cell.value}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </TableContainer>
</slot>
