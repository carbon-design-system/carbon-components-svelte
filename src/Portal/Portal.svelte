<script>
  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  /**
   * Obtain a reference to the portal element.
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { onMount } from "svelte";

  let mounted = false;

  onMount(() => {
    mounted = true;

    return () => {
      mounted = false;

      if (ref?.parentNode) {
        ref.parentNode.removeChild(ref);
      }
    };
  });

  $: if (mounted && ref) {
    if (typeof document !== "undefined" && ref.parentNode !== document.body) {
      document.body.appendChild(ref);
    }
  }
</script>

<svelte:element this={tag} bind:this={ref} data-portal {...$$restProps}>
  <slot />
</svelte:element>
