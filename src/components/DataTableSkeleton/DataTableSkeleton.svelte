<script>
  let className = undefined;
  export { className as class };
  export let columns = 5;
  export let compact = false;
  export let headers = [];
  export let rows = 5;
  export let style = undefined;
  export let zebra = false;

  import { cx, fillArray } from '../../lib';

  $: cols = fillArray(headers.length > 0 ? headers.length : columns);
</script>

<table
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--skeleton', '--data-table', zebra && '--data-table--zebra', compact && '--data-table--compact', className)}
  {style}>
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
    {#each fillArray(rows - 1) as row, i (row)}
      <tr>
        {#each cols as col, j (col)}
          <td />
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
