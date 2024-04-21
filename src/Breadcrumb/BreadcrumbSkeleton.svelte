<script>
  // @ts-check

  /** Set to `true` to hide the breadcrumb trailing slash */
  export let noTrailingSlash = false;

  /** Specify the number of breadcrumb items to render */
  export let count = 3;
</script>

<div
  class:bx--skeleton="{true}"
  class:bx--breadcrumb="{true}"
  class:bx--breadcrumb--no-trailing-slash="{noTrailingSlash}"
  {...$$restProps}
>
  {#each Array.from({ length: count }) as item}
    <div class:bx--breadcrumb-item="{true}">
      <span class:bx--link="{true}">&nbsp;</span>
    </div>
  {/each}
</div>
