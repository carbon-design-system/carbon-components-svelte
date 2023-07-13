<script>
  /** Specify the number of rows */
  export let rows = 5;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--skeleton="{true}"
  class:bx--structured-list="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--structured-list-thead="{true}">
    <div
      class:bx--structured-list-row="{true}"
      class:bx--structured-list-row--header-row="{true}"
    >
      <div class:bx--structured-list-th="{true}"><span></span></div>
      <div class:bx--structured-list-th="{true}"><span></span></div>
      <div class:bx--structured-list-th="{true}"><span></span></div>
    </div>
  </div>
  <div class:bx--structured-list-tbody="{true}">
    {#each Array.from({ length: rows }, (_, i) => i) as row, i (row)}
      <div class:bx--structured-list-row="{true}">
        <div class:bx--structured-list-td="{true}"></div>
        <div class:bx--structured-list-td="{true}"></div>
        <div class:bx--structured-list-td="{true}"></div>
      </div>
    {/each}
  </div>
</div>
