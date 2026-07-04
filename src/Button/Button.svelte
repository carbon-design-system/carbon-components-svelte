<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @extends {"./ButtonSkeleton.svelte"} ButtonSkeletonProps
   * @restProps {button | a | div}
   * @slot {{ props: { role: "button"; type?: string; tabindex: any; disabled: boolean; href?: string; class: string; [key: string]: any; } }}
   * @slot {{ style: undefined | string; }} icon
   * @slot {{}} badge - Compose a `BadgeIndicator` overlaid on an icon-only button. Size is set to `lg` automatically.
   */

  /**
   * Specify the kind of button.
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger-tertiary" | "danger-ghost"}
   */
  export let kind = "primary";

  /**
   * Specify the size of button.
   * When the `badge` slot is used, size is set to `lg` per Carbon design guidelines.
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
   * @type {Icon}
   * @example
   * ```svelte
   * <Button>
   *   <Icon slot="icon" size={20} />
   * </Button>
   * ```
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify the ARIA label for the button icon.
   * On an icon-only button, this also drives Carbon's tooltip. If omitted,
   * the icon-only button renders without a tooltip; supply your own
   * `aria-label` or `aria-labelledby` for accessibility in that case.
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

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Specify the `type` attribute for the button element */
  export let type = "button";

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set to `true` to render the icon-only tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers
   * and enabling auto-flipping when the preferred direction lacks space.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import ButtonSkeleton from "./ButtonSkeleton.svelte";
  import { activeButtonTooltip } from "./button-tooltip-store.js";

  const ctx = getContext("carbon:ComposedModal");
  const insideModal = getContext("carbon:Modal");

  $: if (ctx && ref) {
    ctx.declareRef(ref);
  }
  $: hasIconOnly = (icon || $$slots.icon) && !$$slots.default;
  // Without an iconDescription there is nothing to show in a tooltip or
  // announce as the accessible name via the assistive-text span; skip the
  // whole tooltip apparatus and let the consumer's own aria-label/
  // aria-labelledby (passed through $$restProps) carry accessibility instead.
  $: hasTooltipContent = hasIconOnly && Boolean(iconDescription);
  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;
  $: usePortal = hasTooltipContent && !hideTooltip && effectivePortalTooltip;
  $: hasTooltip = hasTooltipContent && !hideTooltip && !usePortal;

  const tooltipId = {};

  // Hardcoded for parity with TooltipIcon defaults; not exposed as props yet.
  const ENTER_DELAY_MS = 100;
  const LEAVE_DELAY_MS = 300;

  let hovered = false;
  let focused = false;
  let portalTimeout;

  // Gate on the shared store so only one icon-only tooltip can be open at a
  // time. When another button claims the store, this one closes immediately —
  // preventing overlapping tooltips (e.g. Pagination's adjacent buttons).
  $: portalOpen =
    usePortal &&
    !disabled &&
    (hovered || focused) &&
    $activeButtonTooltip === tooltipId;

  function claimActiveTooltip() {
    activeButtonTooltip.set(tooltipId);
  }

  function releaseActiveTooltip() {
    if (get(activeButtonTooltip) === tooltipId) {
      activeButtonTooltip.set(null);
    }
  }

  function dismissPortalTooltip() {
    clearTimeout(portalTimeout);
    hovered = false;
    focused = false;
    releaseActiveTooltip();
  }

  // Re-attach the portal observer so the tooltip dismisses when an
  // ancestor modal closes (mirrors CopyButton).
  let disconnectModalObserver = () => {};

  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      usePortal && ref
        ? observeModalClose(ref, dismissPortalTooltip)
        : () => {};
  }

  $: tooltipHidden =
    hasTooltipContent &&
    !hideTooltip &&
    $activeButtonTooltip !== null &&
    $activeButtonTooltip !== tooltipId;

  function handleMouseEnter() {
    if (hasTooltip) {
      claimActiveTooltip();
    }
  }

  function handleMouseLeave() {
    if (usePortal) return;
    releaseActiveTooltip();
  }

  function handlePortalMouseEnter() {
    if (!usePortal || disabled) return;
    clearTimeout(portalTimeout);
    // Warm handoff: if another icon-only tooltip is already showing, skip the
    // enter delay so moving between adjacent buttons feels instant.
    const warmHandoff =
      get(activeButtonTooltip) !== null &&
      get(activeButtonTooltip) !== tooltipId;
    portalTimeout = setTimeout(
      () => {
        hovered = true;
        claimActiveTooltip();
      },
      warmHandoff ? 0 : ENTER_DELAY_MS,
    );
  }

  function handlePortalMouseLeave() {
    if (!usePortal) return;
    clearTimeout(portalTimeout);
    portalTimeout = setTimeout(() => {
      hovered = false;
      if (!focused) releaseActiveTooltip();
    }, LEAVE_DELAY_MS);
  }

  function handlePortalFocus() {
    if (!usePortal || disabled) return;
    focused = true;
    claimActiveTooltip();
  }

  function handlePortalBlur() {
    if (!usePortal) return;
    focused = false;
    if (!hovered) releaseActiveTooltip();
  }

  const PORTAL_HORIZONTAL_GAP_LEFT_PX = 2;
  const PORTAL_HORIZONTAL_GAP_RIGHT_PX = 2;
  const PORTAL_VERTICAL_GAP_TOP_PX = 1;
  const PORTAL_VERTICAL_GAP_BOTTOM_PX = 1;
  const PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX = -3;
  const PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX = 1;

  $: portalHorizontalGapLeft =
    tooltipPosition === "left" || tooltipPosition === "right"
      ? PORTAL_HORIZONTAL_GAP_LEFT_PX
      : 0;
  $: portalHorizontalGapRight =
    tooltipPosition === "left" || tooltipPosition === "right"
      ? PORTAL_HORIZONTAL_GAP_RIGHT_PX
      : 0;
  $: portalGapTop =
    tooltipPosition === "top" || tooltipPosition === "bottom"
      ? PORTAL_VERTICAL_GAP_TOP_PX
      : 0;
  $: portalGapBottom =
    tooltipPosition === "top" || tooltipPosition === "bottom"
      ? PORTAL_VERTICAL_GAP_BOTTOM_PX
      : 0;
  $: portalVerticalAlignOffsetLeft =
    tooltipPosition === "left" && tooltipAlignment === "start"
      ? PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX
      : 0;
  $: portalVerticalAlignOffsetRight =
    tooltipPosition === "right" && tooltipAlignment === "end"
      ? PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX
      : 0;

  onMount(() => {
    return () => {
      clearTimeout(portalTimeout);
      disconnectModalObserver();
      if (get(activeButtonTooltip) === tooltipId) {
        activeButtonTooltip.set(null);
      }
    };
  });

  $: isDisabled = Boolean(disabled);
  $: effectiveSize = $$slots.badge ? "lg" : size;
  $: iconProps = {
    "aria-hidden": "true",
    class: "bx--btn__icon",
  };
  $: buttonProps = {
    type: href && !isDisabled ? undefined : type,
    tabindex,
    disabled: isDisabled ? true : undefined,
    href: href && !isDisabled ? href : undefined,
    rel:
      href && !isDisabled && $$restProps.target === "_blank"
        ? "noopener noreferrer"
        : undefined,
    "aria-pressed":
      hasIconOnly && kind === "ghost" && !href ? isSelected : undefined,
    ...$$restProps,
    class: [
      "bx--btn",
      expressive && "bx--btn--expressive",
      effectiveSize === "small" && "bx--btn--sm",
      effectiveSize === "field" && "bx--btn--field",
      effectiveSize === "lg" && "bx--btn--lg",
      effectiveSize === "xl" && "bx--btn--xl",
      kind && `bx--btn--${kind}`,
      isDisabled && "bx--btn--disabled",
      hasIconOnly && "bx--btn--icon-only",
      hasTooltip && "bx--tooltip__trigger",
      hasTooltip && "bx--tooltip--a11y",
      hasTooltip && tooltipPosition && `bx--btn--icon-only--${tooltipPosition}`,
      hasTooltip &&
        tooltipAlignment &&
        `bx--tooltip--align-${tooltipAlignment}`,
      hasTooltip && tooltipHidden && "bx--tooltip--hidden",
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
{:else if href && !isDisabled}
  {#if $$slots.badge}
    <div class="bx--btn__badge-wrapper">
      <!-- svelte-ignore a11y-missing-attribute -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <a
        bind:this={ref}
        {...buttonProps}
        on:click
        on:mousedown
        on:focus
        on:focus={handlePortalFocus}
        on:blur
        on:blur={handlePortalBlur}
        on:mouseover
        on:mouseenter
        on:mouseenter={handleMouseEnter}
        on:mouseenter={handlePortalMouseEnter}
        on:mouseleave
        on:mouseleave={handleMouseLeave}
        on:mouseleave={handlePortalMouseLeave}
      >
        {#if hasIconOnly && iconDescription}
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
      <slot name="badge" />
    </div>
  {:else}
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <a
      bind:this={ref}
      {...buttonProps}
      on:click
      on:mousedown
      on:focus
      on:focus={handlePortalFocus}
      on:blur
      on:blur={handlePortalBlur}
      on:mouseover
      on:mouseenter
      on:mouseenter={handleMouseEnter}
      on:mouseenter={handlePortalMouseEnter}
      on:mouseleave
      on:mouseleave={handleMouseLeave}
      on:mouseleave={handlePortalMouseLeave}
    >
      {#if hasIconOnly && iconDescription}
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
  {/if}
{:else if $$slots.badge}
  <div class="bx--btn__badge-wrapper">
    <button
      type="button"
      bind:this={ref}
      {...buttonProps}
      on:click
      on:mousedown
      on:focus
      on:focus={handlePortalFocus}
      on:blur
      on:blur={handlePortalBlur}
      on:mouseover
      on:mouseenter
      on:mouseenter={handleMouseEnter}
      on:mouseenter={handlePortalMouseEnter}
      on:mouseleave
      on:mouseleave={handleMouseLeave}
      on:mouseleave={handlePortalMouseLeave}
    >
      {#if hasIconOnly && iconDescription}
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
    <slot name="badge" />
  </div>
{:else}
  <button
    type="button"
    bind:this={ref}
    {...buttonProps}
    on:click
    on:mousedown
    on:focus
    on:focus={handlePortalFocus}
    on:blur
    on:blur={handlePortalBlur}
    on:mouseover
    on:mouseenter
    on:mouseenter={handleMouseEnter}
    on:mouseenter={handlePortalMouseEnter}
    on:mouseleave
    on:mouseleave={handleMouseLeave}
    on:mouseleave={handlePortalMouseLeave}
  >
    {#if hasIconOnly && iconDescription}
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

{#if usePortal}
  <PortalTooltip
    anchor={ref}
    direction={tooltipPosition}
    open={portalOpen}
    text={iconDescription}
    tooltipType="icon"
    intrinsicAlign={tooltipAlignment}
    horizontalGapLeft={portalHorizontalGapLeft}
    horizontalGapRight={portalHorizontalGapRight}
    gapTop={portalGapTop}
    gapBottom={portalGapBottom}
    verticalAlignOffsetLeft={portalVerticalAlignOffsetLeft}
    verticalAlignOffsetRight={portalVerticalAlignOffsetRight}
  />
{/if}
