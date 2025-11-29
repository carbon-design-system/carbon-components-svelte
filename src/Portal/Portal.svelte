<script>
  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  import { onMount } from "svelte";

  /** @type {null | HTMLElement} */
  let portal = null;
  let mounted = false;

  onMount(() => {
    mounted = true;

    return () => {
      mounted = false;

      if (portal?.parentNode) {
        portal.parentNode.removeChild(portal);
      }
    };
  });

  $: if (mounted && portal) {
    if (
      typeof document !== "undefined" &&
      portal.parentNode !== document.body
    ) {
      document.body.appendChild(portal);
    }
  }
</script>

<svelte:element this={tag} bind:this={portal} data-portal {...$$restProps}>
  <slot />
</svelte:element>
