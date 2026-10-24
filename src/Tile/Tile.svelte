<script>
  /**
   * Set the size: `"sm"` for a compact tile, such as a row in a list of
   * choices, with less padding and no minimum height.
   * @type {"sm" | "md"}
   */
  export let size = undefined;

  /** Set to `true` to stretch the tile to fill the height of its container */
  export let fullHeight = false;

  /**
   * Set to `true` to round the tile's corners when it has a `decorator`,
   * such as an `AILabel`. Carbon reserves rounded tiles for AI content.
   */
  export let rounded = false;

  /** Set to `true` to remove the tile's padding */
  export let noPadding = false;

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);
</script>

<div
  bind:this={ref}
  class:bx--tile={true}
  class:bx--tile--sm={size === "sm"}
  class:bx--tile--full-height={fullHeight}
  class:bx--tile--no-padding={noPadding}
  class:bx--tile--decorator={$$slots.decorator}
  class:bx--tile--decorator-rounded={rounded && $$slots.decorator}
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
