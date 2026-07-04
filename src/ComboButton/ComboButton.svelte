<script>
  /**
   * @event {MouseEvent} click
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} labelChildren - Custom content for the primary action button. `labelText` remains the accessible name.
   */

  /**
   * Required. Specify the primary action button text.
   * Alternatively, use the "labelChildren" slot for custom button content;
   * `labelText` is still used as the accessible name in that case.
   * @type {string}
   */
  export let labelText;

  /** Set to `true` to disable both the primary action and trigger buttons. */
  export let disabled = false;

  /**
   * Specify the size of both buttons and the menu row height.
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Set the preferred direction the menu opens toward.
   * The menu flips to the opposite direction if there is not enough space.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Align the menu to the trigger button's intrinsic width.
   * @type {"start" | "center" | "end"}
   */
  export let intrinsicAlign = "end";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the accessible label for the icon-only trigger button.
   * Set to an empty string to render the trigger without a tooltip, the
   * same way `Button` handles an empty `iconDescription` - the trigger then
   * has no accessible name of its own, so only do this when something else
   * in the surrounding context labels it.
   */
  export let iconDescription = "Additional actions";

  /**
   * Set the position of the icon-only trigger's tooltip.
   * Independent of `direction`, which controls where the menu opens.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import Button from "../Button/Button.svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import Menu from "../Menu/Menu.svelte";

  /**
   * Button's own "default"/"lg" naming is offset from the v11 size scale:
   * unclassed "default" renders at 48px (v11 "lg"), while Button's "lg"
   * class renders at 64px with baseline-aligned text (v11's "xl"/"2xl"
   * tier). Remap so ComboButton never touches Button's "lg"/"xl" classes.
   * "xs" has no Button equivalent; combo-button.scss shrinks it further.
   */
  const TRIGGER_BUTTON_SIZES = {
    xs: "small",
    sm: "small",
    md: "field",
    lg: "default",
  };

  let triggerRef = null;

  /**
   * @type {(event: MouseEvent) => void}
   */
  function toggleOpen(event) {
    const wasOpen = open;
    open = !open;
    // A keyboard-activated click (Enter/Space) reports detail 0; a real mouse
    // click reports 1+. Blur only after a mouse-driven close, so the trigger
    // doesn't linger with a visible focus ring and pop its own tooltip -
    // keyboard users still see focus stay put, as they should.
    if (wasOpen && event.detail !== 0) {
      triggerRef?.blur();
    }
  }
</script>

<div
  bind:this={ref}
  class:bx--combo-button={true}
  class:bx--combo-button--xs={size === "xs"}
  {...$$restProps}
>
  <Button
    kind="primary"
    size={TRIGGER_BUTTON_SIZES[size]}
    {disabled}
    class="bx--combo-button__primary-action"
    aria-label={$$restProps["aria-label"] ?? labelText}
    on:click
  >
    <slot name="labelChildren">{labelText}</slot>
  </Button>
  <Button
    bind:ref={triggerRef}
    icon={ChevronDown}
    {iconDescription}
    kind="primary"
    size={TRIGGER_BUTTON_SIZES[size]}
    {disabled}
    hideTooltip={open}
    {tooltipPosition}
    class="bx--combo-button__trigger {open
      ? 'bx--combo-button__trigger--open'
      : ''}"
    aria-haspopup="menu"
    aria-expanded={open}
    on:mousedown={(event) => event.preventDefault()}
    on:click={toggleOpen}
  />
  <Menu
    anchor={triggerRef}
    bind:open
    {direction}
    {intrinsicAlign}
    intrinsicWidth={true}
    {size}
    {labelText}
    on:close
  >
    <slot />
  </Menu>
</div>
