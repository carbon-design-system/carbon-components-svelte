<script>
  /**
   * @event {MouseEvent} click
   * @event {MouseEvent} click:trigger - Fires when the menu trigger button is clicked, separate from the primary action's `click` event.
   * @event {MouseEvent} mousedown
   * @event {MouseEvent} mousedown:trigger
   * @event {FocusEvent} focus
   * @event {FocusEvent} focus:trigger
   * @event {FocusEvent} blur
   * @event {FocusEvent} blur:trigger
   * @event {MouseEvent} mouseover
   * @event {MouseEvent} mouseover:trigger
   * @event {MouseEvent} mouseenter
   * @event {MouseEvent} mouseenter:trigger
   * @event {MouseEvent} mouseleave
   * @event {MouseEvent} mouseleave:trigger
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
   * Set to `true` to show a loading spinner on the primary action button
   * and prevent it from being activated. Unlike `disabled`, the trigger
   * button is unaffected — the menu can still be opened while the primary
   * action is in flight.
   */
  export let loading = false;

  /**
   * Specify the accessible description for the primary action's loading
   * spinner.
   * @type {string | undefined}
   */
  export let loadingDescription = undefined;

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
   * Align the menu to the button group, the primary action and the
   * trigger together. `start` and `end` are the group's inline start and
   * end, which swap under `dir="rtl"`.
   * A menu that would run past a side of the window takes another
   * alignment for that open.
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
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the position of the icon-only trigger's tooltip.
   * Independent of `direction`, which controls where the menu opens.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set the alignment of the icon-only trigger's tooltip relative to the
   * trigger. Use `"end"` when the button sits at the right edge of a page.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import Menu from "../Menu/Menu.svelte";
  import { MENU_PLACEMENT_CONTEXT_KEY } from "../constants/context-keys.js";
  import { BUTTON_SIZE_BY_MENU_SIZE } from "../constants/sizes.js";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { blurOnMouseClose } from "../utils/blur-on-mouse-close.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";

  const dispatch = createEventDispatcher();

  // Naming and description belong on the primary action button, not the
  // wrapper. A consumer `aria-label` wins over `labelText`.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  let triggerRef = null;

  /** @type {import("svelte/store").Writable<null | HTMLDivElement>} */
  const placementGroup = writable(null);
  setContext(MENU_PLACEMENT_CONTEXT_KEY, placementGroup);
  $: placementGroup.set(ref);

  /**
   * @type {(name: string) => (event: Event) => void}
   */
  function dispatchTriggerEvent(name) {
    return (event) => dispatch(`${name}:trigger`, event);
  }

  /**
   * @type {(event: MouseEvent) => void}
   */
  function toggleOpen(event) {
    const wasOpen = open;
    open = !open;
    dispatch("click:trigger", event);
    blurOnMouseClose(wasOpen, event, triggerRef);
  }

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<div
  bind:this={ref}
  class:bx--combo-button={true}
  class:bx--combo-button--xs={size === "xs"}
  {...wrapperProps}
>
  <Button
    kind="primary"
    size={BUTTON_SIZE_BY_MENU_SIZE[size]}
    {disabled}
    {loading}
    {loadingDescription}
    class="bx--combo-button__primary-action"
    aria-label={ariaLabel ?? labelText}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    on:click
    on:mousedown
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot name="labelChildren">{labelText}</slot>
  </Button>
  <Button
    bind:ref={triggerRef}
    icon={ChevronDown}
    {iconDescription}
    kind="primary"
    size={BUTTON_SIZE_BY_MENU_SIZE[size]}
    {disabled}
    hideTooltip={open}
    tooltipPosition={effectiveTooltipPosition}
    tooltipAlignment={effectiveTooltipAlignment}
    class="bx--combo-button__trigger {open
      ? 'bx--combo-button__trigger--open'
      : ''}"
    aria-haspopup="menu"
    aria-expanded={open}
    on:mousedown={(event) => event.preventDefault()}
    on:mousedown
    on:mousedown={dispatchTriggerEvent("mousedown")}
    on:click={toggleOpen}
    on:focus
    on:focus={dispatchTriggerEvent("focus")}
    on:blur
    on:blur={dispatchTriggerEvent("blur")}
    on:mouseover
    on:mouseover={dispatchTriggerEvent("mouseover")}
    on:mouseenter
    on:mouseenter={dispatchTriggerEvent("mouseenter")}
    on:mouseleave
    on:mouseleave={dispatchTriggerEvent("mouseleave")}
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
