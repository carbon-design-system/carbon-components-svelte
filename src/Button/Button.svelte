<script>
  /**
   * @extends {"./ButtonSkeleton.svelte"} ButtonSkeletonProps
   * @restProps {button | a | div}
   * @slot {{ props: { role: "button"; type?: string; tabindex: any; disabled: boolean; href?: string; class: string; [key: string]: any; } }}
   * @slot {{ style: undefined | string; }} icon
   */

  /**
   * Specify the kind of button.
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger-tertiary" | "danger-ghost"}
   */
  export let kind = "primary";

  /**
   * Specify the size of button.
   * @type {"default" | "field" | "small" | "lg" | "xl"}
   */
  export let size = "default";

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;

  /**
   * Set to `true` to enable the selected state for an icon-only, ghost button.
   */
  export let isSelected = false;

  /**
   * Specify the icon to render.
   * Alternatively, use the named slot "icon".
   *
   * @type {any}
   * @example
   * ```svelte
   * <Button>
   *   <Icon slot="icon" size={20} />
   * </Button>
   * ```
   */
  export let icon = undefined;

  /**
   * Specify the ARIA label for the button icon.
   * @type {string}
   */
  export let iconDescription = undefined;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Only applies to icon-only buttons.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Set the position of the tooltip relative to the icon.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set to `true` to hide the tooltip while maintaining accessibility.
   * Only applies to icon-only buttons.
   * When `true`, the tooltip is visually hidden but the `iconDescription` remains accessible to screen readers.
   */
  export let hideTooltip = false;

  /**
   * Set to `true` to render a custom HTML element.
   * Props are destructured as `props` in the default slot.
   * @example
   * ```svelte
   * <Button let:props>
   *   <div {...props}>Custom Element</div>
   * </Button>
   * ```
   */
  export let as = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set to `true` to disable the button */
  export let disabled = false;

  /**
   * Set the `href` to use an anchor link.
   * @type {string}
   */
  export let href = undefined;

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Specify the `type` attribute for the button element */
  export let type = "button";

  /** Obtain a reference to the HTML element */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import ButtonSkeleton from "./ButtonSkeleton.svelte";
  import { activeButtonTooltip } from "./button-tooltip-store.js";

  const ctx = getContext("ComposedModal");

  $: if (ctx && ref) {
    ctx.declareRef(ref);
  }
  $: hasIconOnly = (icon || $$slots.icon) && !$$slots.default;

  const tooltipId = {};

  $: tooltipHidden =
    hasIconOnly &&
    !hideTooltip &&
    $activeButtonTooltip !== null &&
    $activeButtonTooltip !== tooltipId;

  function handleMouseEnter() {
    if (hasIconOnly && !hideTooltip) {
      activeButtonTooltip.set(tooltipId);
    }
  }

  function handleMouseLeave() {
    if ($activeButtonTooltip === tooltipId) {
      activeButtonTooltip.set(null);
    }
  }

  onMount(() => {
    return () => {
      if (get(activeButtonTooltip) === tooltipId) {
        activeButtonTooltip.set(null);
      }
    };
  });

  $: iconProps = {
    "aria-hidden": "true",
    class: "bx--btn__icon",
    "aria-label": iconDescription,
  };
  $: buttonProps = {
    type: href && !disabled ? undefined : type,
    tabindex,
    disabled: disabled === true ? true : undefined,
    href,
    "aria-pressed":
      hasIconOnly && kind === "ghost" && !href ? isSelected : undefined,
    ...$$restProps,
    class: [
      "bx--btn",
      expressive && "bx--btn--expressive",
      ((size === "small" && !expressive) ||
        (size === "sm" && !expressive) ||
        (size === "small" && !expressive)) &&
        "bx--btn--sm",
      (size === "field" && !expressive) ||
        (size === "md" && !expressive && "bx--btn--md"),
      size === "field" && "bx--btn--field",
      size === "small" && "bx--btn--sm",
      size === "lg" && "bx--btn--lg",
      size === "xl" && "bx--btn--xl",
      kind && `bx--btn--${kind}`,
      disabled && "bx--btn--disabled",
      hasIconOnly && "bx--btn--icon-only",
      hasIconOnly && !hideTooltip && "bx--tooltip__trigger",
      hasIconOnly && !hideTooltip && "bx--tooltip--a11y",
      hasIconOnly &&
        !hideTooltip &&
        tooltipPosition &&
        `bx--btn--icon-only--${tooltipPosition}`,
      hasIconOnly &&
        !hideTooltip &&
        tooltipAlignment &&
        `bx--tooltip--align-${tooltipAlignment}`,
      hasIconOnly && !hideTooltip && tooltipHidden && "bx--tooltip--hidden",
      hasIconOnly && isSelected && kind === "ghost" && "bx--btn--selected",
      $$restProps.class,
    ]
      .filter(Boolean)
      .join(" "),
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <ButtonSkeleton
    {href}
    {size}
    {...$$restProps}
    style={hasIconOnly && "width: 3rem;"}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else if as}
  <slot props={buttonProps} />
{:else if href && !disabled}
  <!-- svelte-ignore a11y-missing-attribute -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <a
    bind:this={ref}
    {...buttonProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseenter={handleMouseEnter}
    on:mouseleave
    on:mouseleave={handleMouseLeave}
  >
    {#if hasIconOnly}
      <span class:bx--assistive-text={true} style:pointer-events="none">
        {iconDescription}
      </span>
    {/if}
    <slot />
    {#if $$slots.icon}
      <slot
        name="icon"
        style={hasIconOnly ? "margin-left: 0" : undefined}
        {...iconProps}
      />
    {:else if icon}
      <svelte:component
        this={icon}
        style={hasIconOnly ? "margin-left: 0" : undefined}
        {...iconProps}
      />
    {/if}
  </a>
{:else}
  <button
    type="button"
    bind:this={ref}
    {...buttonProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseenter={handleMouseEnter}
    on:mouseleave
    on:mouseleave={handleMouseLeave}
  >
    {#if hasIconOnly}
      <span class:bx--assistive-text={true} style:pointer-events="none">
        {iconDescription}
      </span>
    {/if}
    <slot />
    {#if $$slots.icon}
      <slot
        name="icon"
        style={hasIconOnly ? "margin-left: 0" : undefined}
        {...iconProps}
      />
    {:else if icon}
      <svelte:component
        this={icon}
        style={hasIconOnly ? "margin-left: 0" : undefined}
        {...iconProps}
      />
    {/if}
  </button>
{/if}
