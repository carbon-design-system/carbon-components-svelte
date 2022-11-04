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
  class:bx--tabs--contained="{type === 'container'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--tab--list="{true}">
    {#each Array.from({ length: count }, (_, i) => i) as item}
      <span class:bx--tabs__nav-item="{true}" class:bx--tabs__nav-link="{true}">
        <span></span>
      </span>
    {/each}
  </div>
</div>
