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
   * Specify the size of the menu, which controls each item's row height.
   * `"xs"` has no Carbon v10 equivalent and is hand-authored (see `css/_menu-xs.scss`).
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "sm";

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
   * Specify the maximum height of the menu.
   * A number is treated as pixels; a string is used as a CSS length.
   * The menu scrolls once its items exceed the height.
   * @type {number | string}
   */
  export let maxHeight = undefined;

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
  import { scrollIntoViewWithinMenu } from "../utils/scrollIntoViewWithinMenu.js";

  // Selectable and radio items carry their own roles, so navigation and
  // initial focus must match all three.
  const NON_DISABLED_MENUITEM_SELECTOR = [
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
  ]
    .map((role) => `[role='${role}']:not([aria-disabled='true'])`)
    .join(",");

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
        const firstItem = ref?.querySelector(NON_DISABLED_MENUITEM_SELECTOR);
        if (firstItem instanceof HTMLElement) {
          focusIndex = 0;
          focusMenuItem(firstItem);
        } else {
          ref?.focus({ preventScroll: true });
        }
        dispatch("open", anchor);
      });
    }
    prevOpen = open;
  }

  $: menuAriaLabel = ($$props["aria-label"] ?? labelText) || undefined;
  $: maxHeightStyle =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

  /**
   * @param {HTMLElement} item
   */
  function focusMenuItem(item) {
    // `preventScroll` keeps a portaled menu from scrolling the document;
    // scroll the item into view within the menu's own scroll container.
    item.focus({ preventScroll: true });
    scrollIntoViewWithinMenu(item, '[role="menu"]');
  }

  function handleOutsideClick(event) {
    if (!open) return;
    // Clicks inside any menu (this one or a portalled submenu) are not outside
    // clicks. A submenu's <ul> isn't a DOM descendant of this menu even though
    // it's logically nested, so isOutsideClick alone misses it.
    const target = event.target;
    if (target instanceof Element && target.closest("[role='menu']")) return;
    if (isOutsideClick(event, [anchor, ref])) close("outside-click");
  }
  
  function handleEscape(event) {
    if (!open) return;
    // Tab is treated like Escape: without this, focus would leave the
    // (possibly portaled) menu for whatever happens to be next in the DOM.
    if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close("escape-key");
    }
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
  lockDirection="always"
  let:direction={portalDirection}
>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul
    bind:this={ref}
    use:rovingFocus={{
      selector: NON_DISABLED_MENUITEM_SELECTOR,
      orientation: "vertical",
      wrap: false,
      focusOnMove: false,
      getActiveIndex: () => focusIndex,
      onMove: (index) => {
        focusIndex = index;
        const items = /** @type {HTMLElement[]} */ (
          Array.from(ref?.querySelectorAll(NON_DISABLED_MENUITEM_SELECTOR) ?? [])
        );
        const item = items[index];
        if (item) focusMenuItem(item);
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
    style:max-height={maxHeightStyle}
    class:bx--menu={true}
    class:bx--menu--open={open}
    class:bx--menu--xs={size === "xs"}
    class:bx--menu--md={size === "md"}
    class:bx--menu--lg={size === "lg"}
    class:bx--menu--scrollable={!!maxHeight}
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
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </ul>
</FloatingPortal>
