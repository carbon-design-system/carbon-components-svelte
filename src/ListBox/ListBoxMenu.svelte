<script>
  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set to `true` to render the menu in a portal,
   * allowing it to escape containers with `overflow: hidden`.
   * @type {boolean}
   */
  export let portal = false;

  /**
   * Set to `true` to open the floating portal.
   * Only used when `portal` is `true`.
   * @type {boolean}
   */
  export let open = false;

  /**
   * Specify the anchor element to position the portal relative to.
   * Only used when `portal` is `true`.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Specify the direction of the menu.
   * Only used when `portal` is `true`.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Class applied to a wrapper element inside the portal.
   * Only used when `portal` is `true`.
   * @type {string}
   */
  export let portalHostClass = undefined;

  /**
   * Set to `true` to let an option's label wrap onto as many lines as it
   * needs instead of being truncated with an ellipsis.
   * @type {boolean}
   */
  export let wrapOptions = false;

  /**
   * DOM id of the highlighted option (`{instanceId}-{item.id}`).
   * Applied as a two-node class change so `{#each}` does not re-run
   * every `ListBoxMenuItem` on ArrowDown.
   * @type {undefined | null | string}
   */
  export let highlightedId = undefined;

  /**
   * When `false`, skip scrolling the highlighted option into view
   * (pointer hover already has the item on screen).
   * @type {boolean}
   */
  export let highlightScroll = true;

  import { setContext } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { uniqueId } from "../utils/uniqueId.js";
  import {
    createHighlightCursor,
    HIGHLIGHT_CURSOR_KEY,
  } from "./highlightCursor.js";

  const highlightCursor = createHighlightCursor();
  setContext(HIGHLIGHT_CURSOR_KEY, highlightCursor);

  $: highlightCursor.set(highlightedId, { scroll: highlightScroll });
</script>

{#if portal}
  <FloatingPortal {anchor} {direction} {open}>
    <div class={portalHostClass}>
      <div
        bind:this={ref}
        role="listbox"
        id="menu-{id}"
        class:bx--list-box__menu={true}
        class:bx--list-box__menu--wrap-options={wrapOptions}
        style="position: static; {$$restProps.style || ''}"
        {...$$restProps}
        on:scroll
        on:mouseleave
      >
        <slot />
      </div>
    </div>
  </FloatingPortal>
{:else}
  <div
    bind:this={ref}
    role="listbox"
    id="menu-{id}"
    class:bx--list-box__menu={true}
    class:bx--list-box__menu--wrap-options={wrapOptions}
    {...$$restProps}
    on:scroll
    on:mouseleave
  >
    <slot />
  </div>
{/if}
