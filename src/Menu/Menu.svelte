<script>
  /**
   * @event {HTMLElement} open
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * Required. Specify the anchor element to position the menu relative to.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Set the preferred direction of the menu.
   * The menu flips to the opposite direction if there is not enough space.
   * @type {"bottom" | "top" | "left" | "right"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Obtain a reference to the unordered list HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Accessible name for the menu.
   * Prefer setting this (or `aria-label`) when there is no visible trigger
   * text for `aria-labelledby`.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /** Vertical gap in pixels when direction is top. */
  export let gapTop = 0;

  /** Vertical gap in pixels when direction is bottom. */
  export let gapBottom = 0;

  /** Horizontal gap in pixels when direction is left. */
  export let horizontalGapLeft = 0;

  /** Horizontal gap in pixels when direction is right. */
  export let horizontalGapRight = 0;

  /** Vertical offset in pixels when direction is left. */
  export let verticalAlignOffsetLeft = 0;

  /** Vertical offset in pixels when direction is right. */
  export let verticalAlignOffsetRight = 0;

  /** Specify the z-index of the menu. */
  export let zIndex = 9200;

  /**
   * Set to `true` to use the menu's intrinsic width instead of matching the anchor width.
   * @type {boolean}
   */
  export let intrinsicWidth = false;

  /**
   * When `intrinsicWidth` is true, align the menu to the anchor.
   * @type {"start" | "center" | "end"}
   */
  export let intrinsicAlign = "center";

  /**
   * DOM node to mount the menu into.
   * When unset, uses the anchor's nearest `<dialog>` or `[popover]`, else `document.body`.
   * @type {HTMLElement | null}
   */
  export let target = null;

  import { createEventDispatcher, setContext, tick } from "svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";
  import { rovingFocus } from "../utils/rovingFocus.js";

  const dispatch = createEventDispatcher();

  let focusIndex = -1;
  let prevOpen = false;

  /**
   * @type {(trigger: "escape-key" | "outside-click" | "select") => void}
   */
  function close(trigger) {
    if (!open) return;
    open = false;
    if (trigger === "escape-key") anchor?.focus({ preventScroll: true });
    dispatch("close", { trigger });
  }

  setContext("carbon:Menu", { close });

  $: {
    if (open && !prevOpen) {
      focusIndex = -1;
      tick().then(() => {
        if (!open) return;
        ref?.focus();
        dispatch("open", anchor);
      });
    }
    prevOpen = open;
  }

  $: menuAriaLabel = ($$props["aria-label"] ?? labelText) || undefined;

  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, [anchor, ref])) close("outside-click");
  }
  function handleEscape(event) {
    if (open && event.key === "Escape") close("escape-key");
  }
</script>

<FloatingPortal
  {anchor}
  {direction}
  {open}
  {gapTop}
  {gapBottom}
  {horizontalGapLeft}
  {horizontalGapRight}
  {verticalAlignOffsetLeft}
  {verticalAlignOffsetRight}
  {zIndex}
  {intrinsicWidth}
  {intrinsicAlign}
  {target}
  let:direction={portalDirection}
>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul
    bind:this={ref}
    use:rovingFocus={{
      selector: "[role='menuitem']:not([aria-disabled='true'])",
      orientation: "vertical",
      wrap: false,
      focusOnMove: true,
      getActiveIndex: () => focusIndex,
      onMove: (index) => {
        focusIndex = index;
      },
    }}
    use:dismiss={{
      enabled: open,
      listeners: [
        { type: "click", handler: handleOutsideClick },
        { type: "keydown", handler: handleEscape },
      ],
    }}
    role="menu"
    tabindex="-1"
    data-floating-menu-direction={portalDirection}
    style:position="relative"
    style:top="auto"
    style:left="auto"
    class:bx--menu={true}
    class:bx--menu--open={open}
    {...$$restProps}
    aria-label={menuAriaLabel}
    on:keydown
    on:keydown={(event) => {
      if (
        ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
      ) {
        event.preventDefault();
      }
    }}
  >
    <slot />
  </ul>
</FloatingPortal>
