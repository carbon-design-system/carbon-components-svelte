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
   * Specify which edge of the field the menu lines up with when it is wider
   * than the field, as the inline `Dropdown` menu is. `"end"` opens the menu
   * toward the start side instead of past the field's end.
   * @type {"start" | "end"}
   */
  export let align = "start";

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
   * Specify the maximum height of the menu.
   * A number is treated as pixels; a string is used as a CSS length.
   * The menu scrolls once its items exceed the height.
   * @type {number | string}
   */
  export let maxHeight = undefined;

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
  import { toCssLength } from "../utils/css-length.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    createHighlightCursor,
    HIGHLIGHT_CURSOR_KEY,
  } from "./highlight-cursor.js";

  /** @type {ReturnType<typeof import("./highlight-cursor.js").createHighlightCursor>} */
  const highlightCursor = createHighlightCursor();
  setContext(HIGHLIGHT_CURSOR_KEY, highlightCursor);

  $: highlightCursor.set(highlightedId, { scroll: highlightScroll });

  $: maxHeightStyle = maxHeight ? `max-height: ${toCssLength(maxHeight)};` : "";
  $: menuStyle = [maxHeightStyle, $$restProps.style].filter(Boolean).join(" ");
</script>

{#if portal}
  <FloatingPortal {anchor} {direction} {open}>
    <div
      class={portalHostClass}
      class:bx--list-box__menu-host--align-end={align === "end"}
    >
      <div
        bind:this={ref}
        role="listbox"
        id="menu-{id}"
        class:bx--list-box__menu={true}
        class:bx--list-box__menu--align-end={align === "end"}
        class:bx--list-box__menu--wrap-options={wrapOptions}
        {...$$restProps}
        style="position: static; {menuStyle}"
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
    class:bx--list-box__menu--align-end={align === "end"}
    class:bx--list-box__menu--wrap-options={wrapOptions}
    {...$$restProps}
    style={menuStyle || undefined}
    on:scroll
    on:mouseleave
  >
    <slot />
  </div>
{/if}
