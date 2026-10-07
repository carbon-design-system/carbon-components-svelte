<script>
  /**
   * Internal. Wraps an interactive tile when it has a `decorator`, so the
   * decorator sits beside the tile instead of inside its link, button, or
   * label.
   */

  /** Set to `true` to wrap the tile and render the decorator */
  export let decorated = false;

  /**
   * Receives the state of an `AILabel` in the decorator.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  export let state;

  import Decorator from "../AILabel/Decorator.svelte";
</script>

{#if decorated}
  <div class:bx--tile__wrapper--decorator={true} {...$$restProps}>
    <slot />
    <Decorator class="bx--tile--inner-decorator" {state} labelSize="xs">
      <slot name="decorator" />
    </Decorator>
  </div>
{:else}
  <slot />
{/if}
