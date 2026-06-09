<script>
  /**
   * Specify the size of the search input.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let size = "xl";

  /** Set to `true` to hide the label text */
  export let hideLabel = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--skeleton={true}
  class:bx--search--xs={size === "xs"}
  class:bx--search--sm={size === "sm"}
  class:bx--search--lg={size === "lg"}
  class:bx--search--xl={size === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabel}
    <span class:bx--label={true}></span>
  {/if}
  <div class:bx--search-input={true}></div>
</div>
