<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @slot {{ selected: boolean; }}
   */

  /**
   * Specify the tab label.
   * Alternatively, use the default slot.
   * @example
   * ```svelte
   * <Tab>
   *   <span>Label</span>
   * </Tab>
   * ```
   */
  export let label = "";

  /** Specify the href attribute */
  export let href = "#";

  /** Set to `true` to disable the tab */
  export let disabled = false;

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify an optional secondary label.
   * Only rendered for container type tabs.
   * Alternatively, use the "secondaryChildren" slot.
   */
  export let secondaryLabel = "";

  /**
   * Specify the icon to render.
   * Icon is rendered to the right of the label by default.
   * When the parent `Tabs` is `dismissible`, the icon is rendered to the left.
   * When the parent `Tabs` is `iconOnly`, only the icon is rendered and the
   * `label` is used as the accessible name and the tooltip shown on hover/focus.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Obtain a reference to the anchor HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set the direction of the tooltip relative to the tab.
   * Only used when the tab is rendered icon-only.
   * @type {"top" | "bottom"}
   */
  export let tooltipDirection = "bottom";

  /**
   * Set the alignment of the tooltip relative to the tab.
   * Only used when the tab is rendered icon-only.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  import { getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import Close from "../icons/Close.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";

  const {
    selectedTab,
    activeTooltip,
    iconOnly,
    useAutoWidth,
    useFullWidth,
    useDismissible,
    hasSecondaryLabel,
    add,
    remove,
    update,
    dismiss,
  } = getContext("carbon:Tabs");

  // Icon-only tabs show `label` as a portalled tooltip on hover/focus.
  // The portal keeps the tooltip from being clipped by the tab nav's overflow.
  const ENTER_DELAY_MS = 100;
  const LEAVE_DELAY_MS = 300;

  let hovered = false;
  let focused = false;
  let openTimeout;

  // Gate on `activeTooltip` so only one tab tooltip shows at a time. When a
  // neighbor claims the active slot, this one closes even while still hovered.
  $: tooltipOpen =
    $iconOnly && !disabled && (hovered || focused) && $activeTooltip === id;

  function claim() {
    activeTooltip.set(id);
  }

  function release() {
    if (!hovered && !focused && get(activeTooltip) === id) {
      activeTooltip.set(undefined);
    }
  }

  function reveal() {
    hovered = true;
    claim();
  }

  function showTooltip() {
    clearTimeout(openTimeout);
    // Skip the enter delay when another tooltip is already open (warm handoff).
    if (get(activeTooltip) !== undefined && get(activeTooltip) !== id) {
      reveal();
    } else {
      openTimeout = setTimeout(reveal, ENTER_DELAY_MS);
    }
  }

  function hideTooltip() {
    clearTimeout(openTimeout);
    openTimeout = setTimeout(() => {
      hovered = false;
      release();
    }, LEAVE_DELAY_MS);
  }

  add({
    id,
    label,
    disabled,
    hasSecondaryLabel: Boolean(secondaryLabel || $$slots.secondaryChildren),
  });

  onMount(() => {
    return () => {
      clearTimeout(openTimeout);
      if (get(activeTooltip) === id) activeTooltip.set(undefined);
      remove(id);
    };
  });

  $: selected = $selectedTab === id;
  // Default href is the "#" placeholder, so tabs behave as selection controls.
  // Any other href is user-provided and should navigate like a link.
  $: isLink = !!href && href !== "#";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  tabindex="-1"
  role="presentation"
  class:bx--tabs__nav-item={true}
  class:bx--tabs__nav-item--disabled={disabled}
  class:bx--tabs__nav-item--selected={selected}
  {...$$restProps}
  on:click
  on:click={(event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (!isLink) event.preventDefault();
    update(id);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown={(event) => {
    if (disabled) return;

    if ($useDismissible && event.key === "Delete") {
      dismiss(id);
    } else if (event.key === " ") {
      event.preventDefault();
      update(id);
    } else if (event.key === "Enter") {
      if (!isLink) event.preventDefault();
      update(id);
    }
  }}
>
  <a
    bind:this={ref}
    role="tab"
    tabindex={disabled ? "-1" : tabindex}
    aria-selected={selected}
    aria-disabled={disabled}
    aria-label={$iconOnly ? label : undefined}
    {id}
    {href}
    class:bx--tabs__nav-link={true}
    class:bx--tabs__nav-link--icon={Boolean(icon) && !$iconOnly}
    class:bx--tabs__nav-link--icon-only={$iconOnly}
    style:width={$iconOnly
      ? undefined
      : $useFullWidth
        ? "100%"
        : $useAutoWidth
          ? "auto"
          : undefined}
    on:mouseenter={$iconOnly ? showTooltip : undefined}
    on:mouseleave={$iconOnly ? hideTooltip : undefined}
    on:focus={$iconOnly
      ? () => {
          focused = true;
          claim();
        }
      : undefined}
    on:blur={$iconOnly
      ? () => {
          focused = false;
          release();
        }
      : undefined}
  >
    {#if $iconOnly}
      <div class:bx--tabs__nav-item--icon={true}>
        <slot {selected}><svelte:component this={icon} /></slot>
      </div>
      <!-- Visible only in the mobile dropdown; hidden in the desktop icon-only row. -->
      <span class:bx--tabs__nav-item-label={true}>{label}</span>
    {:else if $hasSecondaryLabel}
      <div class:bx--tabs__nav-item-label-wrapper={true}>
        <span class:bx--tabs__nav-item-label={true}>
          <slot {selected}>{label}</slot>
        </span>
        {#if icon}
          <div class:bx--tabs__nav-item--icon={true}>
            <svelte:component this={icon} />
          </div>
        {/if}
      </div>
      {#if secondaryLabel || $$slots.secondaryChildren}
        <div
          class:bx--tabs__nav-item-secondary-label={true}
          title={secondaryLabel || undefined}
        >
          <slot name="secondaryChildren">{secondaryLabel}</slot>
        </div>
      {:else}
        <div
          class:bx--tabs__nav-item-secondary-label={true}
          aria-hidden="true"
        ></div>
      {/if}
    {:else}
      {#if $useDismissible && icon}
        <div class:bx--tabs__nav-item--icon-left={true}>
          <svelte:component this={icon} />
        </div>
      {/if}
      <span class:bx--tabs__nav-item-label={true}>
        <slot {selected}>{label}</slot>
      </span>
      {#if icon && !$useDismissible}
        <div class:bx--tabs__nav-item--icon={true}>
          <svelte:component this={icon} />
        </div>
      {/if}
    {/if}
  </a>
  {#if $useDismissible}
    <div class:bx--tabs__nav-item--close={true}>
      <button
        type="button"
        tabindex="-1"
        aria-label={label ? `Dismiss ${label}` : "Dismiss tab"}
        class:bx--tabs__nav-item--close-icon={true}
        class:bx--tabs__nav-item--close-icon--disabled={disabled}
        {disabled}
        on:click|preventDefault|stopPropagation={() => {
          if (!disabled) {
            dismiss(id);
          }
        }}
      >
        <Close aria-hidden="true" />
      </button>
    </div>
  {/if}

  {#if $iconOnly}
    <PortalTooltip
      anchor={ref}
      direction={tooltipDirection}
      open={tooltipOpen}
      text={label}
      tooltipType="icon"
      intrinsicAlign={tooltipAlignment}
      gapTop={tooltipDirection === "top" ? 1 : 0}
      gapBottom={tooltipDirection === "bottom" ? 1 : 0}
    />
  {/if}
</li>
