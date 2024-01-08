<script>
  /** Specify the number of rows */
  export let rows = 5;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--skeleton="{true}"
  class:cds--structured-list="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:cds--structured-list-thead="{true}">
    <div
      class:cds--structured-list-row="{true}"
      class:cds--structured-list-row--header-row="{true}"
    >
      <div class:cds--structured-list-th="{true}"><span></span></div>
      <div class:cds--structured-list-th="{true}"><span></span></div>
      <div class:cds--structured-list-th="{true}"><span></span></div>
    </div>
  </div>
  <div class:cds--structured-list-tbody="{true}">
    {#each Array.from({ length: rows }, (_, i) => i) as row, i (row)}
      <div class:cds--structured-list-row="{true}">
        <div class:cds--structured-list-td="{true}"></div>
        <div class:cds--structured-list-td="{true}"></div>
        <div class:cds--structured-list-td="{true}"></div>
      </div>
    {/each}
  </div>
</div>
