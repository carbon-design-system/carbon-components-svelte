<script>
  let className = undefined;
  export { className as class };
  export let title = '';
  export let description = '';
  export let zebra = false;
  export let rows = [];
  export let headers = [];
  export let stickyHeader = false;
  export let size = undefined;
  export let sortable = false;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import Table from './Table.svelte';
  import TableBody from './TableBody.svelte';
  import TableCell from './TableCell.svelte';
  import TableContainer from './TableContainer.svelte';
  import TableHead from './TableHead.svelte';
  import TableHeader from './TableHeader.svelte';
  import TableRow from './TableRow.svelte';

  const dispatch = createEventDispatcher();
  const sortDirectionMap = { none: 'ascending', ascending: 'descending', descending: 'none' };

  let tableSortable = writable(sortable);
  let sortHeader = writable({ id: null, key: null, sortDirection: 'none' });
  let headerItems = writable([]);
  let thKeys = derived(headerItems, () =>
    headers
      .map(({ key }, i) => ({ key, id: $headerItems[i] }))
      .reduce((a, c) => ({ ...a, [c.key]: c.id }), {})
  );

  setContext('DataTable', {
    sortHeader,
    tableSortable,
    add: id => {
      headerItems.update(_ => [..._, id]);
    }
  });

  $: tableSortable.set(sortable);
  $: headerKeys = headers.map(({ key }) => key);
  $: rows = rows.map(row => ({ ...row, cells: headerKeys.map(key => ({ key, value: row[key] })) }));
  $: sortedRows = rows;
  $: ascending = $sortHeader.sortDirection === 'ascending';
  $: sortKey = $sortHeader.key;
  $: sorting = sortable && sortKey != null;
  $: if (sorting) {
    if ($sortHeader.sortDirection === 'none') {
      sortedRows = rows;
    } else {
      sortedRows = [...rows].sort((a, b) => {
        const itemA = ascending ? a[sortKey] : b[sortKey];
        const itemB = ascending ? b[sortKey] : a[sortKey];

        if (typeof itemA === 'number' && typeof itemB === 'number') {
          return itemA - itemB;
        }

        return itemA.toString().localeCompare(itemB.toString(), 'en', { numeric: true });
      });
    }
  }
  $: props = {
    headers,
    rows
  };
</script>

<slot {props}>
  <TableContainer class={className} {title} {description} {style}>
    <Table {zebra} {size} {stickyHeader} {sortable}>
      <TableHead>
        <TableRow>
          {#each headers as header, i (header.key)}
            <TableHeader
              on:click={() => {
                dispatch('click', { header });
                dispatch('click:header', header);
                let active = header.key === $sortHeader.key;
                let currentSortDirection = active ? $sortHeader.sortDirection : 'none';
                let sortDirection = sortDirectionMap[currentSortDirection];
                sortHeader.set({
                  id: sortDirection === 'none' ? null : $thKeys[header.key],
                  key: header.key,
                  sortDirection
                });
              }}>
              {header.value}
            </TableHeader>
          {/each}
        </TableRow>
      </TableHead>
      <TableBody>
        {#each sorting ? sortedRows : rows as row, i (row.id)}
          <TableRow
            on:click={() => {
              dispatch('click', { row });
              dispatch('click:row', row);
            }}>
            {#each row.cells as cell, j (cell.key)}
              <TableCell
                on:click={() => {
                  dispatch('click', { row, cell });
                  dispatch('click:cell', cell);
                }}>
                {cell.value}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </TableContainer>
</slot>
