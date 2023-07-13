<script>
  /** Specify the number of tabs to render */
  export let count = 4;

  /**
   * Specify the type of tabs
   * @type {"default" | "container"}
   */
  export let type = "default";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--tabs="{true}"
  class:bx--skeleton="{true}"
  class:bx--tabs--scrollable="{true}"
  class:bx--tabs--scrollable--container="{type === 'container'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <ul class:bx--tabs--scrollable__nav="{true}">
    {#each Array.from({ length: count }, (_, i) => i) as item}
      <li class:bx--tabs--scrollable__nav-item="{true}">
        <div class:bx--tabs__nav-link="{true}">
          <span></span>
        </div>
      </li>
    {/each}
  </ul>
</div>
