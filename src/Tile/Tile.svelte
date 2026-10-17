<script>
  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to stretch the tile to fill the height of its container */
  export let fullHeight = false;

  /** Set to `true` to remove the tile's padding */
  export let noPadding = false;

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";

  /** @type {import("svelte/store").Writable<undefined | "active" | "revert">} */
  const aiLabelState = writable(undefined);
</script>

<div
  bind:this={ref}
  class:bx--tile={true}
  class:bx--tile--light={light}
  class:bx--tile--full-height={fullHeight}
  class:bx--tile--no-padding={noPadding}
  class:bx--tile--decorator={$$slots.decorator}
  class:bx--tile--ai-label={$aiLabelState === "active"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
  {#if $$slots.decorator}
    <Decorator
      class="bx--tile--inner-decorator"
      state={aiLabelState}
      labelSize="xs"
    >
      <slot name="decorator" />
    </Decorator>
  {/if}
</div>
