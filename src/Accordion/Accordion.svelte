<script>
  /**
   * Specify alignment of accordion item chevron icon
   * @type {"start" | "end"} [align="end"]
   */
  export let align = "end";

  /**
   * Set to `true` to display the skeleton state
   * @type {boolean} [skeleton=false]
   */
  export let skeleton = false;

  import AccordionSkeleton from "./Accordion.Skeleton.svelte";
</script>

{#if skeleton}
  <AccordionSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <ul
    class:bx--accordion="{true}"
    {...$$restProps}
    class="bx--accordion--{align} {$$restProps.class}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </ul>
{/if}
