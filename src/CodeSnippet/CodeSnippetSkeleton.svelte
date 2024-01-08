<script>
  /**
   * Set the type of code snippet
   * @type {"single" | "multi"}
   */
  export let type = "single";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--skeleton="{true}"
  class:cds--snippet="{true}"
  class:cds--snippet--single="{type === 'single'}"
  class:cds--snippet--multi="{type === 'multi'}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:cds--snippet-container="{true}">
    {#if type === "single"}
      <span></span>
    {:else if type === "multi"}<span></span> <span></span> <span></span>{/if}
  </div>
</div>
