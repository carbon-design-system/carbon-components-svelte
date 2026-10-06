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
   * @bindable readonly
   */
  export let ref = null;

  import { onMount } from "svelte";

  // Render nothing on the server and on the first client render, so the
  // hydrated markup matches the server's. The content mounts after that,
  // and the block below moves it into the target.
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

  $: if (
    mounted &&
    ref &&
    effectiveTarget &&
    ref.parentNode !== effectiveTarget
  ) {
    const previouslyFocused = document.activeElement;
    const hadFocus = ref.contains(previouslyFocused);
    effectiveTarget.appendChild(ref);
    if (hadFocus && previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
  }
</script>

{#if mounted}
  <svelte:element this={tag} bind:this={ref} data-portal {...$$restProps}>
    <slot />
  </svelte:element>
{/if}
