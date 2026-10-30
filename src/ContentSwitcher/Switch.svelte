<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
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
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

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
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";

  const ctx = getContext("carbon:ContentSwitcher");
  const tabStopId = ctx.tabStopId;
  const pairs = ctx.pairs;

  let hasIcon = icon !== undefined;

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

  // Same for `icon`, so the switcher re-infers its icon-only variant.
  $: if ((icon !== undefined) !== hasIcon) {
    hasIcon = icon !== undefined;
    ctx.setIcon(id, hasIcon);
  }

  onMount(() => {
    return () => {
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
    ? 0
    : -1}
  aria-selected={selected ? "true" : "false"}
  aria-label={hasIcon ? text : undefined}
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
  on:mouseleave
  on:focus
  on:blur
  on:keyup
  on:keydown
>
  {#if hasIcon}
    <slot {selected}><svelte:component this={icon} /></slot>
  {:else}
    <span class:bx--content-switcher__label={true} use:titleWhenTruncated>
      <slot {selected}>{text}</slot>
    </span>
  {/if}
</button>

<!-- Icon-only switches show `text` as a portalled tooltip on hover and
     focus, so an overflow ancestor can't clip it. -->
{#if hasIcon}
  <AnchoredTooltip
    anchor={ref}
    {text}
    enabled={!disabled}
    direction="top"
    align={tooltipAlignment}
    dismissOnClick={false}
  />
{/if}
