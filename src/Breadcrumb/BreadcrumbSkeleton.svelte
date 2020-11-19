<script>
  /** Set to `true` to hide the breadcrumb trailing slash */
  export let noTrailingSlash = false;

  /** Specify the number of breadcrumb items to render */
  export let count = 3;
</script>

<div
  class:bx--breadcrumb="{true}"
  class:bx--breadcrumb--no-trailing-slash="{noTrailingSlash}"
  class:bx--skeleton="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#each Array.from({ length: count }, (_, i) => i) as item, i (item)}
    <div class:bx--breadcrumb-item="{true}">
      <span class:bx--link="{true}">&nbsp;</span>
    </div>
  {/each}
</div>
