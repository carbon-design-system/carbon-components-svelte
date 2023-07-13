<script>
  /** @extends {"./AccordionSkeleton.svelte"} AccordionSkeletonProps */

  /**
   * Specify alignment of accordion item chevron icon
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Specify the size of the accordion
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to disable the accordion */
  export let disabled = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import AccordionSkeleton from "./AccordionSkeleton.svelte";

  const disableItems = writable(disabled);

  $: disableItems.set(disabled);

  setContext("Accordion", { disableItems });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <AccordionSkeleton
    {...$$restProps}
    align="{align}"
    size="{size}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <ul
    class:bx--accordion="{true}"
    class:bx--accordion--start="{align === 'start'}"
    class:bx--accordion--end="{align === 'end'}"
    class:bx--accordion--sm="{size === 'sm'}"
    class:bx--accordion--xl="{size === 'xl'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </ul>
{/if}
