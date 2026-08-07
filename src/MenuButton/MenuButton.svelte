<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @event {MouseEvent} click
   * @event {MouseEvent} mousedown
   * @event {FocusEvent} focus
   * @event {FocusEvent} blur
   * @event {MouseEvent} mouseover
   * @event {MouseEvent} mouseenter
   * @event {MouseEvent} mouseleave
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * Required. Specify the trigger button text.
   * Alternatively, use the "labelChildren" slot for custom trigger content;
   * `labelText` is still used as the accessible name in that case.
   * When `iconOnly` is `true`, the text is not rendered but remains the
   * trigger's accessible name.
   * @type {string}
   */
  export let labelText;

  /** Set to `true` to render an icon-only trigger */
  export let iconOnly = false;

  /**
   * Specify the icon to render in the icon-only trigger.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (OverflowMenuVertical);

  /**
   * Specify the ARIA label and title for the icon-only trigger's icon.
   * Defaults to `labelText`.
   * @type {string}
   */
  export let iconDescription = undefined;

  /**
   * Specify the kind of button.
   * Does not apply when `iconOnly` is `true`; the icon-only trigger is
   * always ghost.
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
   * Specify the maximum height of the menu.
   * A number is treated as pixels; a string is used as a CSS length.
   * The menu scrolls once its items exceed the height.
   * @type {number | string}
   */
  export let maxHeight = undefined;

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
  import OverflowMenuVertical from "../icons/OverflowMenuVertical.svelte";
  import Menu from "../Menu/Menu.svelte";

  /**
   * The overflow menu scale is offset from MenuButton's: its unclassed
   * default is 40px ("md" here) and its largest, "xl", is 48px ("lg" here).
   */
  const ICON_TRIGGER_SIZE_CLASSES = {
    xs: "bx--overflow-menu--xs",
    sm: "bx--overflow-menu--sm",
    md: "",
    lg: "bx--overflow-menu--xl",
  };

  $: triggerClass = [
    "bx--menu-button__trigger",
    open && "bx--menu-button__trigger--open",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  $: iconTriggerClass = [ICON_TRIGGER_SIZE_CLASSES[size], $$restProps.class]
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

{#if iconOnly}
  <button
    bind:this={ref}
    type="button"
    {disabled}
    class:bx--overflow-menu={true}
    class:bx--overflow-menu--open={open}
    class:bx--menu-button__trigger={true}
    {...$$restProps}
    class={iconTriggerClass}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label={$$restProps["aria-label"] ?? labelText}
    on:mousedown|preventDefault
    on:mousedown
    on:click
    on:click={toggle}
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <svelte:component
      this={icon}
      aria-label={iconDescription ?? labelText}
      title={iconDescription ?? labelText}
      class="bx--overflow-menu__icon"
    />
  </button>
{:else}
  <Button
    bind:ref
    {kind}
    {size}
    {disabled}
    icon={ChevronDown}
    {...$$restProps}
    class={triggerClass}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label={$$restProps["aria-label"] ?? labelText}
    on:mousedown={(event) => event.preventDefault()}
    on:mousedown
    on:click
    on:click={toggle}
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot name="labelChildren">{labelText}</slot>
  </Button>
{/if}

<Menu
  anchor={ref}
  {direction}
  {intrinsicAlign}
  {size}
  {maxHeight}
  intrinsicWidth
  bind:open
  {labelText}
  data-carbon-menu-button-icon-only={iconOnly ? true : undefined}
  data-carbon-align={iconOnly ? intrinsicAlign : undefined}
  on:close
>
  <slot />
</Menu>
