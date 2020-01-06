<script>
  let className = undefined;
  export { className as class };

  // refined props
  export let title = '';
  export let description = '';
  export let zebra = false;
  export let rows = [];
  export let headers = [];
  export let stickyHeader = false;
  export let size = undefined;
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import Table from './Table.svelte';
  import TableBody from './TableBody.svelte';
  import TableCell from './TableCell.svelte';
  import TableContainer from './TableContainer.svelte';
  import TableHead from './TableHead.svelte';
  import TableHeader from './TableHeader.svelte';
  import TableRow from './TableRow.svelte';

  const dispatch = createEventDispatcher();

  $: headerKeys = headers.map(({ key }) => key);
  $: rows = rows.map(row => ({
    ...row,
    cells: headerKeys.map(key => ({ key, value: row[key] }))
  }));
  $: props = {};
</script>

<slot {props}>
  <TableContainer class={className} {title} {description} {style}>
    <Table {zebra} {size} {stickyHeader}>
      <TableHead>
        <TableRow>
          {#each headers as header, i (header.key)}
            <TableHeader
              on:click={() => {
                dispatch('click:header', { header });
              }}>
              {header.value}
            </TableHeader>
          {/each}
        </TableRow>
      </TableHead>
      <TableBody>
        {#each rows as row, i (row.id)}
          <TableRow
            on:click={() => {
              dispatch('click:row', { row });
            }}>
            {#each row.cells as cell, j (cell.key)}
              <TableCell
                on:click={() => {
                  dispatch('click:cell', { row, cell });
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
