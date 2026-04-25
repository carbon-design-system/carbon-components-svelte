<script>
  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  /**
   * Specify the DOM element to mount the portal into.
   * Defaults to `document.body`.
   * @type {HTMLElement | null}
   */
  export let target = null;

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

  $: effectiveTarget =
    target ?? (typeof document === "undefined" ? null : document.body);

  $: if (mounted && ref && effectiveTarget) {
    if (ref.parentNode !== effectiveTarget) {
      const activeEl = document.activeElement;
      const hadFocus = ref.contains(activeEl);
      effectiveTarget.appendChild(ref);
      if (hadFocus && activeEl instanceof HTMLElement) {
        activeEl.focus();
      }
    }
  }
</script>

<svelte:element this={tag} bind:this={ref} data-portal {...$$restProps}>
  <slot />
</svelte:element>
