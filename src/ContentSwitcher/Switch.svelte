<script>
  /**
   * @template [Icon=any]
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
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";

  const ctx = getContext("carbon:ContentSwitcher");
  const activeTooltip = ctx.activeTooltip;

  const hasIcon = icon !== undefined;

  ctx.add({ id, text, selected, icon: hasIcon });

  const unsubscribe = ctx.currentId.subscribe((currentId) => {
    selected = currentId === id;
  });

  // Icon-only switches show `text` as a portalled tooltip on hover/focus.
  // The portal keeps the tooltip from being clipped by overflow ancestors.
  const ENTER_DELAY_MS = 100;
  const LEAVE_DELAY_MS = 300;

  let hovered = false;
  let focused = false;
  let openTimeout;

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
    clearTimeout(openTimeout);
    // Skip the enter delay when another tooltip is already open (warm handoff).
    if (get(activeTooltip) !== null && get(activeTooltip) !== id) {
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

  onMount(() => {
    return () => {
      clearTimeout(openTimeout);
      if (get(activeTooltip) === id) activeTooltip.set(null);
      ctx.remove(id);
      unsubscribe();
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button
  bind:this={ref}
  type="button"
  role="tab"
  tabindex={selected ? "0" : "-1"}
  aria-selected={selected}
  aria-label={hasIcon ? text : undefined}
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
    <slot><svelte:component this={icon} /></slot>
  {:else}
    <span class:bx--content-switcher__label={true}> <slot>{text}</slot> </span>
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
