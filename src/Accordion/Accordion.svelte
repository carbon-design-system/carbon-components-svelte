<script>
  /**
   * Specify alignment of accordion item chevron icon
   * @type {"start" | "end"} [align="end"]
   */
  export let align = "end";

  /**
   * Specify the size of the accordion
   * @type {"sm" | "lg"} [size]
   */
  export let size = undefined;

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
    align="{align}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <ul
    class:bx--accordion="{true}"
    {...$$restProps}
    class="bx--accordion--{align}
      {size && `bx--accordion--${size}`}
      {$$restProps.class}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </ul>
{/if}
