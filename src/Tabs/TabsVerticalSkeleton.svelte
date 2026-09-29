<script>
  /** Specify the number of tabs to render */
  export let count = 4;

  /**
   * Specify the orientation of the tab list.
   * By default, the tabs are a vertical column at the `md` breakpoint and up,
   * and collapse into a horizontal row below it.
   * Set to `"vertical"` to always render the column, or `"horizontal"` to
   * always render the row.
   * @type {"horizontal" | "vertical" | undefined}
   */
  export let orientation = undefined;
</script>

<div
  class:bx--tabs--vertical-container={true}
  class:bx--tabs--vertical-container--responsive={orientation === undefined}
  class:bx--tabs--vertical-container--column={orientation === "vertical"}
>
  <div
    class:bx--tabs={true}
    class:bx--tabs--vertical={true}
    class:bx--tabs--vertical--responsive={orientation === undefined}
    class:bx--tabs--vertical--row={orientation === "horizontal"}
    class:bx--tabs--vertical--column={orientation === "vertical"}
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
