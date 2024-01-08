<script>
  /** @extends {"./DataTable.svelte"} DataTableHeader */

  /**
   * Specify the number of columns
   * Superseded by `headers` if `headers` is a non-empty array
   */
  export let columns = 5;

  /** Specify the number of rows */
  export let rows = 5;

  /**
   * Set the size of the data table
   * @type {"compact" | "short" | "tall"}
   */
  export let size = undefined;

  /** Set to `true` to apply zebra styles to the datatable rows */
  export let zebra = false;

  /** Set to `false` to hide the header */
  export let showHeader = true;

  /**
   * Set the column headers
   * Supersedes `columns` if value is a non-empty array
   * @type {ReadonlyArray<string | Partial<DataTableHeader>>}
   */
  export let headers = [];

  /** Set to `false` to hide the toolbar */
  export let showToolbar = true;

  $: values = headers.map((header) =>
    header.value !== undefined ? header.value : header
  );
  $: cols = Array.from(
    { length: headers.length > 0 ? headers.length : columns },
    (_, i) => i
  );
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:cds--skeleton="{true}"
  class:cds--data-table-container="{true}"
  {...$$restProps}
>
  {#if showHeader}
    <div class:cds--data-table-header="{true}">
      <div class:cds--data-table-header__title="{true}"></div>
      <div class:cds--data-table-header__description="{true}"></div>
    </div>
  {/if}
  {#if showToolbar}
    <section aria-label="data table toolbar" class:cds--table-toolbar="{true}">
      <div class:cds--toolbar-content="{true}">
        <span
          class:cds--skeleton="{true}"
          class:cds--btn="{true}"
          class:cds--btn--sm="{true}"></span>
      </div>
    </section>
  {/if}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <table
    class:cds--skeleton="{true}"
    class:cds--data-table="{true}"
    class:cds--data-table--compact="{size === 'compact'}"
    class:cds--data-table--short="{size === 'short'}"
    class:cds--data-table--tall="{size === 'tall'}"
    class:cds--data-table--zebra="{zebra}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <thead>
      <tr>
        {#each cols as col (col)}
          {#if typeof values[col] === "object" && values[col].empty === true}
            <th></th>
          {:else}
            <th>{values[col] || ""}</th>
          {/if}
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each Array.from({ length: rows }, (_, i) => i) as row (row)}
        <tr>
          {#each cols as col (col)}
            <td><span></span></td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
