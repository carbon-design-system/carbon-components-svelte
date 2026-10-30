<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @restProps {li}
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
   * Specify the tabindex of the selected tab.
   * Unselected tabs use `-1`, so the tab list is a single Tab-key stop
   * and arrow keys move between tabs.
   * Ignored when `Tabs` sets `navigation`.
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /**
   * Set an id for the top-level element.
   * Use a stable value with `Tabs` `selectedId` when tabs are added or removed dynamically.
   */
  export let id = uniqueId();

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
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Obtain a reference to the anchor HTML element.
   * @bindable readonly
   * @type {null | HTMLAnchorElement}
   */
  export let ref = null;

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipDirection` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the direction of the tooltip relative to the tab.
   * Only used when the tab is rendered icon-only.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "bottom"}
   */
  export let tooltipDirection = "bottom";

  /**
   * Set the alignment of the tooltip relative to the tab.
   * Only used when the tab is rendered icon-only.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  import { getContext, onMount } from "svelte";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import Close from "../icons/Close.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { uniqueId } from "../utils/unique-id.js";

  const {
    selectedTab,
    iconOnly,
    useAutoWidth,
    useFullWidth,
    useDismissible,
    useDismissText,
    hasSecondaryLabel,
    secondaryLabelSupported,
    useContainer,
    navigation,
    add,
    remove,
    claimTab,
    update,
    dismiss,
    tabsById,
    contentByIndex,
  } = getContext("carbon:Tabs");

  // Claim this tab's position before it renders; see `claimTab` in `Tabs`.
  // `undefined` for a tab added after mount.
  const initialTab = claimTab?.(id);

  // Re-register when these change so `bx--tabs--tall` and the `dismiss`
  // detail follow the current props.
  $: hasOwnSecondaryLabel = Boolean(
    secondaryLabel || $$slots.secondaryChildren,
  );
  // A tab draws its own secondary label from the first render; its
  // siblings learn of it, and make room, only once it registers. Until
  // then (server markup), CSS sizes the row from this tab's own class.
  $: ownSecondaryLabel = $secondaryLabelSupported && hasOwnSecondaryLabel;
  // A container tab that draws its label alone, with no secondary label
  // or placeholder under it. Before the tabs register, a sized set with a
  // secondary label gives these links the placeholder's empty line in CSS.
  $: singleLine =
    $useContainer && !$iconOnly && !($hasSecondaryLabel || ownSecondaryLabel);

  $: add({
    id,
    label,
    disabled,
    hasSecondaryLabel: hasOwnSecondaryLabel,
  });

  onMount(() => {
    return () => {
      remove(id);
    };
  });

  // Naming, description, and `aria-controls` belong on the `role="tab"`
  // anchor, not the presentational `li`. A consumer `aria-label` wins over
  // the icon-only label, and a consumer `aria-controls` over the panel id.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: { "aria-controls": ariaControls, ...wrapperProps },
  } = splitAriaNaming($$restProps));

  $: selected = $selectedTab === id;
  $: registered = $tabsById[id] !== undefined;
  // Only the selected tab is a Tab-key stop, even when disabled, so the tab
  // list stays reachable (APG allows focusable disabled tabs). A tab that
  // claimed its position expects a selection, so it gives up the stop even
  // when it renders before the selected tab (first render, SSR). Otherwise,
  // until a selection resolves, keep every enabled tab reachable.
  $: hasSelection =
    $selectedTab !== undefined || (initialTab !== undefined && !registered);
  // Default href is the "#" placeholder, so tabs behave as selection controls.
  // Any other href is user-provided and should navigate like a link.
  $: isLink = !!href && href !== "#";
  // Panels learn their tab's id by index (`TabContent`); mirror that pairing
  // in the other direction so the tab can point `aria-controls` at its panel.
  // `undefined` when no panel is rendered for this tab's position. Before
  // registration flushes, use the panel id reserved when the tab claimed.
  $: panelId = registered
    ? $contentByIndex[$tabsById[id].index]
    : initialTab?.panelId;

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipDirection, tooltipAlignment));
</script>

<li
  role="presentation"
  class:bx--tabs__nav-item={true}
  class:bx--tabs__nav-item--disabled={disabled}
  class:bx--tabs__nav-item--selected={selected}
  class:bx--tabs__nav-item--default={!disabled && !selected}
  class:bx--tabs__nav-item--container={$useContainer}
  class:bx--tabs__nav-item--secondary-label={ownSecondaryLabel}
  class:bx--tabs__nav-item--container-selected={$useContainer &&
    selected &&
    !disabled}
  {...wrapperProps}
  on:click
  on:click={(event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (!isLink && !$navigation) event.preventDefault();
    update(id);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown={(event) => {
    if (disabled) return;

    if ($useDismissible && event.key === "Delete") {
      dismiss(id);
      return;
    }

    // Enter and Space on the dismiss button click it, not the tab.
    if (event.target !== ref) return;

    // Links activate natively on Enter, which fires the click above.
    if ($navigation) return;

    if (event.key === " ") {
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
    role={$navigation ? undefined : "tab"}
    tabindex={$navigation
      ? undefined
      : (hasSelection ? !selected : disabled)
        ? "-1"
        : tabindex}
    aria-selected={$navigation ? undefined : selected}
    aria-current={$navigation && selected ? "page" : undefined}
    aria-disabled={disabled}
    aria-controls={ariaControls ?? ($navigation ? undefined : panelId)}
    aria-label={ariaLabel ?? ($iconOnly ? label : undefined)}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    {id}
    href={$navigation && disabled ? undefined : href}
    class:bx--tabs__nav-link={true}
    class:bx--tabs__nav-link--selected={selected && !disabled}
    class:bx--tabs__nav-link--container-selected={$useContainer &&
      selected &&
      !disabled}
    class:bx--tabs__nav-link--icon={Boolean(icon) && !$iconOnly}
    class:bx--tabs__nav-link--icon-only={$iconOnly}
    class:bx--tabs__nav-link--single-line={singleLine}
    style:width={$iconOnly
      ? undefined
      : $useFullWidth
        ? "100%"
        : $useAutoWidth
          ? "auto"
          : undefined}
  >
    {#if $iconOnly}
      <div class:bx--tabs__nav-item--icon={true}>
        <slot {selected}><svelte:component this={icon} /></slot>
      </div>
      <!-- Visible only in the mobile dropdown; hidden in the desktop icon-only row. -->
      <span class:bx--tabs__nav-item-label={true}>{label}</span>
    {:else if $hasSecondaryLabel || ownSecondaryLabel}
      <div class:bx--tabs__nav-item-label-wrapper={true}>
        <span
          class:bx--tabs__nav-item-label={true}
          data-label={label || undefined}
        >
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
      <span
        class:bx--tabs__nav-item-label={true}
        data-label={label || undefined}
      >
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
        aria-label={$useDismissText(label ?? "")}
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

  <!-- Icon-only tabs show `label` as a portalled tooltip on hover and
       focus, so the tab nav's overflow can't clip it. -->
  {#if $iconOnly}
    <AnchoredTooltip
      anchor={ref}
      text={label}
      enabled={!disabled}
      direction={effectiveTooltipPosition}
      align={effectiveTooltipAlignment}
      dismissOnClick={false}
    />
  {/if}
</li>
