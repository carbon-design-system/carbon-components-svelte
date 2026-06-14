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
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Obtain a reference to the anchor HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import Close from "../icons/Close.svelte";

  const {
    selectedTab,
    useAutoWidth,
    useFullWidth,
    useDismissible,
    hasSecondaryLabel,
    add,
    remove,
    update,
    dismiss,
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
    {id}
    {href}
    class:bx--tabs__nav-link={true}
    class:bx--tabs__nav-link--icon={Boolean(icon)}
    style:width={$useFullWidth ? "100%" : $useAutoWidth ? "auto" : undefined}
  >
    {#if $hasSecondaryLabel}
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
</li>
