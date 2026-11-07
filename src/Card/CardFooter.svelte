<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Set to `true` when the footer holds `CardAction`s. The footer drops
   * its padding and gains a top border, and the actions fill the row.
   */
  export let actionSet = false;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  /** @type {import("svelte/store").Readable<boolean>} */
  const clickable = getContext("carbon:Card")?.clickable ?? readable(false);

  // A clickable card is one link or button, so a footer of actions can't
  // go in it. The card shows its own `icon` there instead.
</script>

{#if !$clickable}
  <div
    class:bx--card__footer={true}
    class:bx--card__footer--action-set={actionSet}
    {...$$restProps}
  >
    <slot />
  </div>
{/if}
