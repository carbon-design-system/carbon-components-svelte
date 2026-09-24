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
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

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
  import {
    TOOLTIP_ENTER_DELAY_MS,
    TOOLTIP_LEAVE_DELAY_MS,
  } from "../constants/timing.js";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { uniqueId } from "../utils/unique-id.js";

  const ctx = getContext("carbon:ContentSwitcher");
  const activeTooltip = ctx.activeTooltip;
  const tabStopId = ctx.tabStopId;
  const pairs = ctx.pairs;

  const hasIcon = icon !== undefined;

  // Last `selected` value seen here, so the block below reacts to caller writes
  // and not to the currentId echo.
  let prevSelected = selected;

  ctx.add({ id, text, selected, icon: hasIcon, disabled });

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

  // Icon-only switches show `text` as a portalled tooltip on hover/focus.
  // The portal keeps the tooltip from being clipped by overflow ancestors.
  let hovered = false;
  let focused = false;
  const scheduleTooltip = createDelayedSetter();

  // Gate on `activeTooltip` so only one switch tooltip shows at a time. When a
  // neighbor claims the active slot, this one closes even while still hovered.
  $: tooltipOpen =
    hasIcon && !disabled && (hovered || focused) && $activeTooltip === id;

  function claim() {
    activeTooltip.set(id);
  }

  function release() {
    if (!hovered && !focused && get(activeTooltip) === id) {
      activeTooltip.set(null);
    }
  }

  function reveal() {
    hovered = true;
    claim();
  }

  function showTooltip() {
    // Skip the enter delay when another tooltip is already open (warm handoff).
    const warmHandoff =
      get(activeTooltip) !== null && get(activeTooltip) !== id;
    scheduleTooltip(warmHandoff ? 0 : TOOLTIP_ENTER_DELAY_MS, reveal);
  }

  function hideTooltip() {
    scheduleTooltip(TOOLTIP_LEAVE_DELAY_MS, () => {
      hovered = false;
      release();
    });
  }

  onMount(() => {
    return () => {
      scheduleTooltip.cancel();
      if (get(activeTooltip) === id) activeTooltip.set(null);
      ctx.remove(id);
      unsubscribe();
    };
  });
</script>

<button
  bind:this={ref}
  type="button"
  role="tab"
  tabindex={$tabStopId === id ? "0" : "-1"}
  aria-selected={selected}
  aria-label={hasIcon ? text : undefined}
  aria-controls={$pairs.panelBySwitch[id]}
  {disabled}
  {id}
  class:bx--content-switcher-btn={true}
  class:bx--content-switcher--selected={selected}
  {...$$restProps}
  on:click
  on:click={() => {
    ctx.update(id);
  }}
  on:mouseover
  on:mouseenter
  on:mouseenter={() => {
    if (hasIcon) showTooltip();
  }}
  on:mouseleave
  on:mouseleave={() => {
    if (hasIcon) hideTooltip();
  }}
  on:focus
  on:focus={() => {
    if (hasIcon) {
      focused = true;
      claim();
    }
  }}
  on:blur
  on:blur={() => {
    if (hasIcon) {
      focused = false;
      release();
    }
  }}
  on:keyup
  on:keydown
>
  {#if hasIcon}
    <slot {selected}><svelte:component this={icon} /></slot>
  {:else}
    <span class:bx--content-switcher__label={true}>
      <slot {selected}>{text}</slot>
    </span>
  {/if}
</button>

{#if hasIcon}
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
