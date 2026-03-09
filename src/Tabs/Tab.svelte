<script>
  /**
   * @generics {Icon = any} Icon
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

  /** Specify the tabindex */
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
   * Icon is rendered to the right of the label.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Obtain a reference to the anchor HTML element */
  export let ref = null;

  import { getContext, onMount } from "svelte";

  const {
    selectedTab,
    useAutoWidth,
    useFullWidth,
    hasSecondaryLabel,
    add,
    remove,
    update,
    change,
  } = getContext("carbon:Tabs");

  add({
    id,
    label,
    disabled,
    hasSecondaryLabel: Boolean(secondaryLabel || $$slots.secondaryChildren),
  });

  onMount(() => {
    return () => {
      remove(id);
    };
  });

  $: selected = $selectedTab === id;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  tabindex="-1"
  role="presentation"
  class:bx--tabs__nav-item={true}
  class:bx--tabs__nav-item--disabled={disabled}
  class:bx--tabs__nav-item--selected={selected}
  {...$$restProps}
  on:click|preventDefault
  on:click|preventDefault={() => {
    if (!disabled) {
      update(id);
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown={({ key }) => {
    if (!disabled) {
      if (key === "ArrowRight") {
        change(1);
      } else if (key === "ArrowLeft") {
        change(-1);
      } else if (key === " " || key === "Enter") {
        update(id);
      }
    }
  }}
>
  <a
    bind:this={ref}
    role="tab"
    tabindex={disabled ? "-1" : tabindex}
    aria-selected={selected}
    aria-disabled={disabled}
    {id}
    {href}
    class:bx--tabs__nav-link={true}
    style:width={$useFullWidth ? "100%" : $useAutoWidth ? "auto" : undefined}
  >
    {#if $hasSecondaryLabel}
      <div class:bx--tabs__nav-item-label-wrapper={true}>
        <span class:bx--tabs__nav-item-label={true}>
          <slot>{label}</slot>
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
      <span class:bx--tabs__nav-item-label={true}> <slot>{label}</slot> </span>
      {#if icon}
        <div class:bx--tabs__nav-item--icon={true}>
          <svelte:component this={icon} />
        </div>
      {/if}
    {/if}
  </a>
</li>
