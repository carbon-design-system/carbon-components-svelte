<script>
  export let columns = 5;
  export let rows = 5;
  export let compact = false;
  export let zebra = false;
  export let headers = [];

  $: cols = Array.from(
    { length: headers.length > 0 ? headers.length : columns },
    (_, i) => i
  );
</script>

<table
  class:bx--skeleton={true}
  class:bx--data-table={true}
  class:bx--data-table--zebra={zebra}
  class:bx--data-table--compact={compact}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <thead>
    <tr>
      {#each cols as col, i (col)}
        <th>{headers[col] || ''}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    <tr>
      {#each cols as col, i (col)}
        <td>
          <span />
        </td>
      {/each}
    </tr>
    {#each Array.from({ length: rows - 1 }, (_, i) => i) as row, i (row)}
      <tr>
        {#each cols as col, j (col)}
          <td />
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
