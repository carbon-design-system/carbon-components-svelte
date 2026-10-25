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

  import { onMount, tick } from "svelte";
  import { getThemeZoneClass } from "../ThemeZone/theme-zone.js";
  import {
    declaredDirection,
    getLayoutDirection,
  } from "../utils/layout-direction.js";

  // Content portalled out of a ThemeZone keeps the zone's theme. The
  // portal takes the zone's theme class, but not its painted surface.
  const zoneClass = getThemeZoneClass();

  // Portalled content keeps the direction of the place it renders in: the
  // nearest `dir` attribute there, as for the styles, else the
  // LayoutDirection's. A `dir` passed to the portal wins.
  const layoutDirection = getLayoutDirection();

  // The parent the content renders in before it moves to the target.
  /** @type {Element | null} */
  let owner = null;

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

  /** @type {"ltr" | "rtl" | undefined} */
  let dir;

  $: if (ref && !owner) owner = ref.parentElement;

  // Read again when the LayoutDirection changes. Nothing reports a change to
  // a plain `dir` alone.
  $: readDirection($layoutDirection, owner);

  /**
   * @param {"ltr" | "rtl" | undefined} contextDirection
   * @param {Element | null} node
   */
  function readDirection(contextDirection, node) {
    dir = declaredDirection(contextDirection, node);
    if (!node) return;
    // A `dir` around the owner can change in the same update, after this
    // runs, so read again once the update is done.
    tick().then(() => {
      dir = declaredDirection($layoutDirection, owner);
    });
  }

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
  <svelte:element
    this={tag}
    bind:this={ref}
    data-portal
    {dir}
    {...$$restProps}
    class={[$$restProps.class, $zoneClass].filter(Boolean).join(" ") ||
      undefined}
  >
    <slot />
  </svelte:element>
{/if}
