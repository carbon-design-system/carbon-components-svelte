<script>
  import { getContext, onMount } from "svelte";
  import { overflowTitle } from "../utils/overflowTitle.js";
  import { scrollIntoViewWithinMenu } from "../utils/scrollIntoViewWithinMenu.js";
  import { HIGHLIGHT_CURSOR_KEY } from "./highlightCursor.js";

  /** Set to `true` to enable the active state */
  export let active = false;

  /** Set to `true` to enable the highlighted state */
  export let highlighted = false;

  /** Set to `true` to disable the menu item */
  export let disabled = false;

  /** Set to `true` to add inline padding for a left-aligned icon */
  export let hasLeftIcon = false;

  /**
   * Option element id. Used by the listbox highlight cursor.
   * @type {string}
   */
  export let id = undefined;

  /**
   * Hide the option without unmounting it (`filterMode="hide"`).
   * Omit or pass `true`; a boolean `false` must not reach the DOM.
   * @type {boolean}
   */
  export let hidden = false;

  const HIGHLIGHT_CLASS = "bx--list-box__menu-item--highlighted";
  const highlightCursor = getContext(HIGHLIGHT_CURSOR_KEY);

  let optionEl = null;
  let ref = null;
  let unregisterHighlight = () => {};

  $: if (!highlightCursor && highlighted && ref && !ref.matches(":hover")) {
    // Scroll highlighted item into view if using keyboard navigation.
    // Scoped to the menu's own scroll container so a portaled menu (whose
    // nearest scrollable ancestor is the document) does not scroll the page.
    scrollIntoViewWithinMenu(ref);
  }

  // Do not put `--highlighted` on a `class:` directive when the listbox owns
  // a cursor. Svelte 3 removes that class on every update if the expression
  // is false, which undoes the cursor's classList write.
  $: bindCursor(optionEl, id, active, highlighted);

  /**
   * @param {HTMLElement | null} node
   * @param {string | undefined} optionId
   * @param {boolean} isActive
   * @param {boolean} isHighlighted
   */
  function bindCursor(node, optionId, isActive, isHighlighted) {
    unregisterHighlight();
    unregisterHighlight = () => {};
    if (!node) return;
    if (highlightCursor) {
      if (optionId) {
        unregisterHighlight = highlightCursor.register(optionId, node);
      }
      return;
    }
    node.classList.toggle(HIGHLIGHT_CLASS, Boolean(isActive || isHighlighted));
  }

  onMount(() => () => unregisterHighlight());
</script>

<div
  bind:this={optionEl}
  {id}
  hidden={hidden ? true : undefined}
  role="option"
  tabindex="-1"
  class:bx--list-box__menu-item={true}
  class:bx--list-box__menu-item--active={active}
  aria-selected={active}
  aria-disabled={disabled ? true : undefined}
  disabled={disabled ? true : undefined}
  {...$$restProps}
  on:click
  on:mousedown
  on:mouseenter
  on:mouseleave
>
  <div
    bind:this={ref}
    use:overflowTitle
    class:bx--list-box__menu-item__option={true}
    class:bx--list-box__menu-item__option--icon-left={hasLeftIcon}
  >
    <slot />
  </div>
</div>
