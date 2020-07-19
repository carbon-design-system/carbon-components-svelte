<script>
  export let align = "end"; // "start" | "end"
  export let skeleton = false;

  import AccordionSkeleton from "./Accordion.Skeleton.svelte";
</script>

{#if skeleton}
  <AccordionSkeleton {...$$restProps} />
{:else}
  <ul
    class:bx--accordion={true}
    class="bx--accordion--{align}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <slot />
  </ul>
{/if}
