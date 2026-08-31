<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Set to `true` when composing `CardAction` children: removes footer
   * padding, adds a top border, and stretches/fixes action widths.
   */
  export let actionSet = false;

  import { getContext } from "svelte";

  // Not supported inside a clickable Card — a clickable card renders its own
  // footer affordance automatically.
  const clickable = getContext("carbon:Card")?.clickable;

  $: if ($clickable) {
    console.warn(
      "[CardFooter.svelte] cannot be used inside a clickable Card. A clickable card renders its own footer affordance automatically. Use `renderFooterIcon` on Card to customize the icon.",
    );
  }
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
