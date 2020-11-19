<script>
  /** Specify the number of tabs to render */
  export let count = 4;
</script>

<div
  class:bx--tabs="{true}"
  class:bx--skeleton="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--tabs-trigger="{true}">
    <div class:bx--tabs-trigger-text="{true}">&nbsp;</div>
    <svg width="10" height="5" viewBox="0 0 10 5" fill-rule="evenodd">
      <path d="M10 0L5 5 0 0z"></path>
    </svg>
  </div>
  <ul class:bx--tabs__nav="{true}" class:bx--tabs__nav--hidden="{true}">
    {#each Array.from({ length: count }, (_, i) => i) as item, i (item)}
      <li class:bx--tabs__nav-item="{true}">
        <div class:bx--tabs__nav-link="{true}">&nbsp;</div>
      </li>
    {/each}
  </ul>
</div>
