<script>
  /** Specify a selector to be focused inside the footer when opening the tooltip */
  export let selectorPrimaryFocus = "a[href], button:not([disabled])";

  import { getContext, onMount } from "svelte";

  let ref = null;
  let open = false;

  const ctx = getContext("Tooltip");
  const unsubscribe = ctx.tooltipOpen.subscribe((tooltipOpen) => {
    open = tooltipOpen;
  });

  onMount(() => {
    return () => {
      unsubscribe();
    };
  });

  $: if (open && ref) {
    const node = ref.querySelector(selectorPrimaryFocus);
    if (node) node.focus();
  }
</script>

<div bind:this="{ref}" class:bx--tooltip__footer="{true}">
  <slot />
</div>
