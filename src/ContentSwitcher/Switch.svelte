<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @slot {{ selected: boolean; }}
   */

  /**
   * Specify the switch text.
   * Alternatively, use the default slot.
   * @example
   * ```svelte
   * <Switch>
   *   <span>Custom Text</span>
   * </Switch>
   * ```
   */
  export let text = "Provide text";

  /**
   * Render an icon-only switch.
   * The parent `ContentSwitcher` becomes icon-only when every `Switch` sets `icon`.
   * `text` is used as the accessible label and the tooltip shown on hover and focus.
   * Set `iconOnly` to `false` to show the icon beside the text instead.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Set to `false` to show `icon` before the visible `text`, with no tooltip.
   * Only read when `icon` is set. The default slot then replaces the text,
   * not the icon.
   */
  export let iconOnly = true;

  /**
   * Set to `true` for the switch to be selected.
   * @bindable writable
   */
  export let selected = false;

  /** Set to `true` to disable the switch */
  export let disabled = false;

  /**
   * Align the portalled tooltip to the switch.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /** Set an id for the button element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import { uniqueId } from "../utils/unique-id.js";

  const ctx = getContext("carbon:ContentSwitcher");
  const tabStopId = ctx.tabStopId;
  const pairs = ctx.pairs;

  const hasIcon = icon !== undefined;

  $: showIconOnly = hasIcon && iconOnly;

  // Last `selected` value seen here, so the block below reacts to caller writes
  // and not to the currentId echo.
  let prevSelected = selected;

  ctx.add({ id, text, selected, icon: hasIcon && iconOnly, disabled });

  const unsubscribe = ctx.currentId.subscribe((currentId) => {
    selected = prevSelected = currentId === id;
  });

  $: if (selected !== prevSelected) {
    prevSelected = selected;
    if (selected) {
      ctx.update(id);
    } else if (get(ctx.currentId) === id) {
      // A content switcher always has one selected switch.
      selected = prevSelected = true;
    }
  }

  // Report later `disabled` changes; the initial value goes through `add()`.
  let prevDisabled = disabled;
  $: if (disabled !== prevDisabled) {
    prevDisabled = disabled;
    ctx.setDisabled(id, disabled);
  }

  // Same for `iconOnly`, which decides whether the switcher is icon-only.
  let prevIconOnly = hasIcon && iconOnly;
  $: if (showIconOnly !== prevIconOnly) {
    prevIconOnly = showIconOnly;
    ctx.setIconOnly(id, showIconOnly);
  }

  // Icon-only switches show `text` as a portalled tooltip on hover/focus.
  // The portal keeps the tooltip from being clipped by overflow ancestors.

  let hovered = false;
  let focused = false;
  const tooltipHandoff = createTooltipHandoff({ group: getTooltipGroup() });
  const tooltipActive = tooltipHandoff.active;

  // Gate on the active slot so only one tooltip shows at a time. When a
  // neighbor claims it, this one closes even while still hovered.
  $: tooltipOpen =
    showIconOnly && !disabled && (hovered || focused) && $tooltipActive;

  function showTooltip() {
    tooltipHandoff.scheduleEnter(() => {
      hovered = true;
    });
  }

  function hideTooltip() {
    tooltipHandoff.scheduleLeave(() => {
      hovered = false;
      if (!focused) tooltipHandoff.release();
    });
  }

  onMount(() => {
    return () => {
      tooltipHandoff.cancel();
      tooltipHandoff.release();
      ctx.remove(id);
      unsubscribe();
    };
  });
</script>

<button
  bind:this={ref}
  type="button"
  role="tab"
  tabindex={$tabStopId === id || ($tabStopId === null && selected && !disabled)
    ? "0"
    : "-1"}
  aria-selected={selected}
  aria-label={showIconOnly ? text : undefined}
  aria-controls={$pairs.panelBySwitch[id]}
  {disabled}
  {id}
  class:bx--content-switcher-btn={true}
  class:bx--content-switcher-btn--icon={hasIcon}
  class:bx--content-switcher--selected={selected}
  {...$$restProps}
  on:click
  on:click={() => {
    ctx.update(id);
  }}
  on:mouseover
  on:mouseenter
  on:mouseenter={() => {
    if (showIconOnly) showTooltip();
  }}
  on:mouseleave
  on:mouseleave={() => {
    if (showIconOnly) hideTooltip();
  }}
  on:focus
  on:focus={() => {
    if (showIconOnly) {
      focused = true;
      tooltipHandoff.claim();
    }
  }}
  on:blur
  on:blur={() => {
    if (showIconOnly) {
      focused = false;
      if (!hovered) tooltipHandoff.release();
    }
  }}
  on:keyup
  on:keydown
>
  {#if showIconOnly}
    <slot {selected}><svelte:component this={icon} /></slot>
  {:else if hasIcon}
    <span
      class:bx--content-switcher__label={true}
      class:bx--content-switcher__label--with-icon={true}
    >
      <svelte:component this={icon} />
      <span class:bx--content-switcher__label-text={true}>
        <slot {selected}>{text}</slot>
      </span>
    </span>
  {:else}
    <span class:bx--content-switcher__label={true}>
      <slot {selected}>{text}</slot>
    </span>
  {/if}
</button>

{#if showIconOnly}
  <PortalTooltip
    anchor={ref}
    direction="top"
    open={tooltipOpen}
    {text}
    tooltipType="icon"
    gapTop={1}
    intrinsicAlign={tooltipAlignment}
  />
{/if}
