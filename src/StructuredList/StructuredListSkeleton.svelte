<script>
  // @ts-check
  
  /** Specify the number of rows */
  export let count = 5;
</script>

<div class:bx--skeleton="{true}" class:bx--structured-list="{true}">
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
    {#each Array.from({ length: count }) as row}
      <div class:bx--structured-list-row="{true}">
        <div class:bx--structured-list-td="{true}"></div>
        <div class:bx--structured-list-td="{true}"></div>
        <div class:bx--structured-list-td="{true}"></div>
      </div>
    {/each}
  </div>
</div>
