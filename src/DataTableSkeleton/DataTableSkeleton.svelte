<script>
  /**
   * Specify the number of columns
   * @type {number} [columns=5]
   */
  export let columns = 5;

  /**
   * Specify the number of rows
   * @type {number} [rows=5]
   */
  export let rows = 5;

  /**
   * Set to `true` to use the compact variant
   * @type {boolean} [compact=false]
   */
  export let compact = false;

  /**
   * Set to `true` to apply zebra styles to the datatable rows
   * @type {boolean} [zebra=false]
   */
  export let zebra = false;

  /**
   * Set the column headers
   * If `headers` has one more items, `count` is ignored
   * @type {string[]} [headers=[]]
   */
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
