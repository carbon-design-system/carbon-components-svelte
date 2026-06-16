<script>
  /** Specify the number of tabs to render */
  export let count = 4;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class:bx--tabs--vertical-container={true}>
  <div
    class:bx--tabs={true}
    class:bx--tabs--vertical={true}
    class:bx--skeleton={true}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <ul class:bx--tabs__nav={true}>
      {#each Array.from({ length: count }, (_, i) => i) as item (item)}
        <li class:bx--tabs__nav-item={true}>
          <div class:bx--tabs__nav-link={true}><span></span></div>
        </li>
      {/each}
    </ul>
  </div>
</div>
