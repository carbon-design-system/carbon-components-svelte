<script>
  /**
   * Specify the number of columns.
   * Superseded by `headers` if `headers` is a non-empty array.
   */
  export let columns = 5;

  /** Specify the number of rows */
  export let rows = 5;

  /**
   * Set the size of the table.
   * @type {"compact" | "short" | "tall"}
   */
  export let size = undefined;

  /**
   * Set the column headers.
   * Supersedes `columns` if value is a non-empty array.
   * @type {ReadonlyArray<string | Partial<import('./Table.svelte').TableHeader>>}
   */
  export let headers = [];

  $: values = headers.map((header) =>
    typeof header === "string" || header.value === undefined
      ? header
      : header.value,
  );
  $: cols = Array.from(
    { length: headers.length > 0 ? headers.length : columns },
    (_, i) => i,
  );
</script>

<div class:bx--simple-table-container={true} {...$$restProps}>
  <table
    class:bx--skeleton={true}
    class:bx--simple-table={true}
    class:bx--simple-table--compact={size === "compact"}
    class:bx--simple-table--short={size === "short"}
    class:bx--simple-table--tall={size === "tall"}
  >
    <thead>
      <tr>
        {#each cols as col (col)}
          <th class:bx--type-label-01={true}>{values[col] || ""}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each Array.from({ length: rows }, (_, i) => i) as row (row)}
        <tr>
          {#each cols as col (col)}
            <td class:bx--type-caption-01={true}><span></span></td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
