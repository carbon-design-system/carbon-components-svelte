<script>
  let className = undefined;
  export { className as class };
  export let zebra = false;
  export let compact = false;
  export let rowCount = 5;
  export let columnCount = 5;
  export let headers = [];
  export let style = undefined;

  import { cx, fillArray } from '../../lib';

  const rows = fillArray(rowCount - 1);
  const columns = fillArray(columnCount);
  const _headers =
    headers[0] === Object(headers[0]) && !Array.isArray(headers[0])
      ? headers.map(({ header }) => header)
      : headers;
  const _class = cx(
    '--skeleton',
    '--data-table',
    zebra && '--data-table--zebra',
    compact && '--data-table--compact',
    className
  );
</script>

<table on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <thead>
    <tr>
      {#each columns as column, i (column)}
        <th>{_headers[column]}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    <tr>
      {#each columns as column, i (column)}
        <td>
          <span />
        </td>
      {/each}
    </tr>
    {#each rows as row, i (row)}
      <tr>
        {#each columns as column, j (column)}
          <td />
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
