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
   * Required. Specify the trigger button text.
   * Alternatively, use the "labelChildren" slot for custom trigger content;
   * `labelText` is still used as the accessible name in that case.
   * @type {string}
   */
  export let labelText;

  /**
   * Specify the kind of button.
   * @type {"primary" | "tertiary" | "ghost"}
   */
  export let kind = "primary";

  /**
   * Specify the size of the trigger button and the menu's row height.
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to disable the trigger button */
  export let disabled = false;

  /**
   * Set the preferred direction the menu opens toward.
   * The menu flips to the opposite direction if there is not enough space.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Align the menu to the trigger button.
   * @type {"start" | "center" | "end"}
   */
  export let intrinsicAlign = "start";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Obtain a reference to the trigger button HTML element.
   * @type {null | HTMLButtonElement | HTMLAnchorElement}
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
   * tier). Remap so MenuButton never touches Button's "lg"/"xl" classes.
   * "xs" has no Button equivalent; menu-button.scss shrinks it further.
   */
  const TRIGGER_BUTTON_SIZES = {
    xs: "small",
    sm: "small",
    md: "field",
    lg: "default",
  };

  $: triggerClass = [
    "bx--menu-button__trigger",
    size === "xs" && "bx--menu-button__trigger--xs",
    open && "bx--menu-button__trigger--open",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * @type {(event: MouseEvent) => void}
   */
  function toggle(event) {
    const wasOpen = open;
    open = !open;
    // A keyboard-activated click (Enter/Space) reports detail 0; a real mouse
    // click reports 1+. Blur only after a mouse-driven close, so the trigger
    // doesn't linger with a visible focus ring - keyboard users still see
    // focus stay put, as they should.
    if (wasOpen && event.detail !== 0) {
      ref?.blur();
    }
  }
</script>

<Button
  bind:ref
  {kind}
  size={TRIGGER_BUTTON_SIZES[size]}
  {disabled}
  icon={ChevronDown}
  {...$$restProps}
  class={triggerClass}
  aria-haspopup="menu"
  aria-expanded={open}
  aria-label={$$restProps["aria-label"] ?? labelText}
  on:mousedown={(event) => event.preventDefault()}
  on:click
  on:click={toggle}
>
  <slot name="labelChildren">{labelText}</slot>
</Button>

<Menu
  anchor={ref}
  {direction}
  {intrinsicAlign}
  {size}
  intrinsicWidth
  bind:open
  {labelText}
  on:close
>
  <slot />
</Menu>
