<script>
  /** Specify a selector to be focused inside the footer when opening the tooltip */
  export let selectorPrimaryFocus = "a[href], button:not([disabled])";

  import { getContext } from "svelte";

  let ref = null;
  let open = false;

  const { tooltipOpen } = getContext("Tooltip");

  $: if ((open || $tooltipOpen) && ref) {
    const node = ref.querySelector(selectorPrimaryFocus);
    if (node) node.focus();
  }
</script>

<div bind:this="{ref}" class:bx--tooltip__footer="{true}">
  <slot />
</div>
