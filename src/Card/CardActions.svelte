<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  /** @type {import("svelte/store").Readable<boolean>} */
  const clickable = getContext("carbon:Card")?.clickable ?? readable(false);

  // A clickable card is one link or button, so it can't hold buttons.
</script>

{#if !$clickable}
  <div class:bx--card__actions={true} {...$$restProps}>
    <slot />
  </div>
{/if}
