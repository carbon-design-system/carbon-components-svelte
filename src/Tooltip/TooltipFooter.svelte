<script>
  /** Specify a selector to be focused inside the footer when opening the tooltip */
  export let selectorPrimaryFocus = "a[href], button:not([disabled])";

  import { getContext, onMount } from "svelte";

  let footerRef = null;
  let open = false;
  let openedByHover = false;

  const ctx = getContext("carbon:Tooltip") ?? null;
  const unsubscribeOpen = ctx?.tooltipOpen.subscribe((value) => {
    open = value;
  });
  const unsubscribeOpenedByHover = ctx?.openedByHover?.subscribe((value) => {
    openedByHover = value;
  });

  onMount(() => {
    return () => {
      unsubscribeOpen?.();
      unsubscribeOpenedByHover?.();
    };
  });

  // Move focus into the footer only when the tooltip was opened via keyboard or
  // programmatically. Focusing on mouse hover would yank focus away from a user
  // who is only pointing at the trigger.
  $: if (open && !openedByHover && footerRef) {
    const node = footerRef.querySelector(selectorPrimaryFocus);
    if (node) node.focus();
  }
</script>

<div bind:this={footerRef} class:bx--tooltip__footer={true}><slot /></div>
