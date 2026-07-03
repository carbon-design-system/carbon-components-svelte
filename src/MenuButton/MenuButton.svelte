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
   * @type {"sm" | "md" | "lg"}
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

  /** Button has no "xs" size and no "md"/"sm" names; remap to its closest matching row heights. */
  const TRIGGER_BUTTON_SIZES = { sm: "small", md: "default", lg: "lg" };

  $: triggerClass = [
    "bx--menu-button__trigger",
    open && "bx--menu-button__trigger--open",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  function toggle() {
    open = !open;
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
