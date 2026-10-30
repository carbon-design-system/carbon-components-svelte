<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @restProps {div | button | a}
   */

  /**
   * Specify the type of tag.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline" | undefined}
   */
  export let type = undefined;

  /**
   * Specify the size of the tag.
   * Defaults to `"default"`, or to the `size` of a parent `TagSet`.
   * Also accepts Carbon v11's `"md"` (`"default"`).
   * @type {"xs" | "sm" | "default" | "lg" | "md" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to use filterable variant */
  export let filter = false;

  /** Set to `true` to disable a filterable tag */
  export let disabled = false;

  /** Set to `true` to render a `button` element instead of a `div` */
  export let interactive = false;

  /**
   * Specify the `href` attribute to render the tag as an anchor.
   * Mutually exclusive with `filter`; when both are set, `filter` takes precedence.
   * @type {string | undefined}
   */
  export let href = undefined;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /**
   * Set to `true` to omit the default outer margin.
   * @deprecated has no effect -- tags have no outer margin, as in Carbon
   * v11. Space tags with their container, such as `Stack` or `TagSet`.
   */
  export let inline = false;

  /**
   * Set the label of the close button in a filterable tag.
   * Shown in a tooltip on hover and focus, and leads the button's accessible name.
   * The tag element gets no native `title` attribute from this prop.
   */
  export let title = "Clear filter";

  /**
   * Override the tag's 208px width cap.
   * Accepts any CSS length (for example `"8rem"`, `"120px"`, or `"100%"` to fit the container).
   * At any width, a truncated label shows its full text in a tooltip.
   * @type {string | undefined}
   */
  export let maxWidth = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify a value that identifies the tag inside a `TagSet`.
   * Returned as `tag.value` in the set's `close:tag` event.
   * @type {string | number | undefined}
   */
  export let value = undefined;

  /** Set an id for the filterable tag */
  export let id = uniqueId();

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import { joinTagSet } from "../TagSet/join-tag-set.js";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import Close from "../icons/Close.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { noop } from "../utils/noop.js";
  import { normalizeSize, TAG_SIZE_ALIASES } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import TagSkeleton from "./TagSkeleton.svelte";
  import { observeTruncation } from "./tag-truncation.js";

  const dispatch = createEventDispatcher();

  // Inside a `TagSet`, register so the set can measure this tag's natural
  // width, collapse it into "+N" once it no longer fits, and include it in
  // roving focus. Standalone, the stores are inert.
  const group = joinTagSet(() => ({
    node: ref,
    label: labelRef?.textContent?.trim() ?? "",
    value,
    type,
    size: resolvedSize,
    disabled,
    filter,
  }));
  const {
    size: groupSize,
    navigation: groupNavigation,
    overflow: groupOverflow,
    tabindex: rovingTabindex,
  } = group;

  /** @type {null | HTMLSpanElement} */
  let labelRef = null;
  /** @type {null | HTMLButtonElement} */
  let closeRef = null;
  let truncated = false;
  let truncationLabel = "";
  let stopObservingLabel = noop;

  // In a filter tag, the close button is the only focusable element, so
  // naming and description go there instead of onto the wrapper.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: filterProps,
  } = splitAriaNaming($$restProps));

  // Fall back to the group's size, then to "default".
  $: resolvedSize =
    normalizeSize(size, TAG_SIZE_ALIASES) ?? $groupSize ?? "default";

  $: hasIcon = Boolean(icon || $$slots.icon);

  // A truncated label shows its full text in a tooltip. Static tags wrap
  // the label in `TooltipDefinition`. Interactive and link tags are already
  // a button or an anchor, so the tooltip anchors to the tag itself instead
  // of nesting another control. A roving `TagSet` is a single tab stop,
  // which the definition's focusable trigger would break, and a disabled
  // tag gets no hover or focus: both fall back to `title`. A filter tag's
  // close button is its only tab stop, and its name already includes the
  // full label, so the label takes `title`, as in Carbon v11.
  $: showTruncationTooltip =
    truncated &&
    !filter &&
    !interactive &&
    !href &&
    $groupNavigation !== "roving";
  $: showHostTooltip = truncated && (interactive || !!href) && !disabled;
  $: nativeTitle =
    truncated && !showTruncationTooltip && !showHostTooltip
      ? truncationLabel
      : undefined;
  // As in Carbon v11, `tabindex` applies to the tooltip trigger, the element
  // that takes focus, so a composite parent can pass `-1` to keep a
  // truncated tag out of the tab order.
  $: rootProps = showTruncationTooltip
    ? omitTabindex($$restProps)
    : $$restProps;

  /** @param {Record<string, any>} props */
  function omitTabindex({ tabindex, ...props }) {
    return props;
  }

  /** @param {boolean} overflowing */
  function setTruncated(overflowing) {
    truncated = overflowing;
    truncationLabel = overflowing ? (labelRef?.textContent?.trim() ?? "") : "";
  }

  // Measure once the label is laid out, then whenever it resizes: a new
  // `maxWidth`, size or icon, or a container narrower than the cap.
  // Swapping the root element or wrapping the label in the tooltip mounts
  // a new label node, which is observed in turn.
  $: {
    stopObservingLabel();
    stopObservingLabel = labelRef
      ? observeTruncation(labelRef, setTruncated)
      : noop;
  }

  onMount(() => {
    return () => stopObservingLabel();
  });

  // Toggling `filter`, `interactive` or `href` swaps the root element, so the
  // set must be told about the new node too.
  $: group.update({
    node: ref,
    value,
    type,
    size: resolvedSize,
    disabled,
    filter,
  });

  function handleClose() {
    dispatch("close");
    group.notifyClose();
  }

  /** @type {import("svelte/store").Writable<undefined | "active" | "revert">} */
  const aiLabelState = writable(undefined);
</script>

{#if skeleton}
  <TagSkeleton
    size={resolvedSize}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else if filter}
  <div
    bind:this={ref}
    {id}
    data-overflow={$groupOverflow ? "true" : undefined}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--disabled={disabled}
    class:bx--tag--filter={filter}
    class:bx--tag--truncate={maxWidth != null}
    class:bx--tag--xs={resolvedSize === "xs"}
    class:bx--tag--with-icon={hasIcon}
    class:bx--tag--sm={resolvedSize === "sm"}
    class:bx--tag--lg={resolvedSize === "lg"}
    class:bx--tag--red={type === "red"}
    class:bx--tag--magenta={type === "magenta"}
    class:bx--tag--purple={type === "purple"}
    class:bx--tag--blue={type === "blue"}
    class:bx--tag--cyan={type === "cyan"}
    class:bx--tag--teal={type === "teal"}
    class:bx--tag--green={type === "green"}
    class:bx--tag--gray={type === "gray"}
    class:bx--tag--cool-gray={type === "cool-gray"}
    class:bx--tag--warm-gray={type === "warm-gray"}
    class:bx--tag--high-contrast={type === "high-contrast"}
    class:bx--tag--outline={type === "outline"}
    {...filterProps}
    style:max-width={maxWidth}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon={true}>
        <slot name="icon"><svelte:component this={icon} /></slot>
      </div>
    {/if}
    <span
      bind:this={labelRef}
      id="{id}-label"
      title={nativeTitle}
      class:bx--tag__label={true}
    >
      <slot props={{ class: "bx--tag__label" }}>
        {type}
      </slot>
    </span>
    {#if $$slots.decorator}
      <Decorator
        class="bx--tag__decorator"
        state={aiLabelState}
        labelSize="sm"
        labelKind="inline"
        labelAlign="start"
      >
        <slot name="decorator" />
      </Decorator>
    {/if}
    <button
      type="button"
      id="{id}-close"
      aria-label={ariaLabel ?? title}
      aria-labelledby={ariaLabelledBy ??
        (ariaLabel ? undefined : `${id}-close ${id}-label`)}
      aria-describedby={ariaDescribedBy}
      aria-keyshortcuts={$groupNavigation === "roving"
        ? "Delete Backspace"
        : undefined}
      class:bx--tag__close-icon={true}
      tabindex={$rovingTabindex}
      {disabled}
      bind:this={closeRef}
      on:click|stopPropagation={handleClose}
    >
      <Close />
    </button>
    <AnchoredTooltip
      anchor={closeRef}
      text={title}
      enabled={!disabled}
      passEscapeWhenFocused
    />
  </div>
{:else if href}
  <a
    bind:this={ref}
    href={disabled ? undefined : href}
    role={disabled ? "link" : undefined}
    {id}
    aria-disabled={disabled ? "true" : undefined}
    tabindex={$rovingTabindex}
    rel={resolveLinkRel($$restProps.target)}
    data-overflow={$groupOverflow ? "true" : undefined}
    title={nativeTitle}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--interactive={true}
    class:bx--tag--disabled={disabled}
    class:bx--tag--truncate={maxWidth != null}
    class:bx--tag--with-icon={hasIcon}
    class:bx--tag--xs={resolvedSize === "xs"}
    class:bx--tag--sm={resolvedSize === "sm"}
    class:bx--tag--lg={resolvedSize === "lg"}
    class:bx--tag--red={type === "red"}
    class:bx--tag--magenta={type === "magenta"}
    class:bx--tag--purple={type === "purple"}
    class:bx--tag--blue={type === "blue"}
    class:bx--tag--cyan={type === "cyan"}
    class:bx--tag--teal={type === "teal"}
    class:bx--tag--green={type === "green"}
    class:bx--tag--gray={type === "gray"}
    class:bx--tag--cool-gray={type === "cool-gray"}
    class:bx--tag--warm-gray={type === "warm-gray"}
    class:bx--tag--high-contrast={type === "high-contrast"}
    class:bx--tag--outline={type === "outline"}
    {...$$restProps}
    style:max-width={maxWidth}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon={true}>
        <slot name="icon"><svelte:component this={icon} /></slot>
      </div>
    {/if}
    <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
  </a>
  <AnchoredTooltip
    anchor={ref}
    text={truncationLabel}
    enabled={showHostTooltip}
    passEscapeWhenFocused
  />
{:else if interactive}
  <button
    bind:this={ref}
    type="button"
    {id}
    {disabled}
    aria-disabled={disabled ? "true" : "false"}
    tabindex={disabled ? -1 : $rovingTabindex}
    title={nativeTitle}
    data-overflow={$groupOverflow ? "true" : undefined}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--interactive={true}
    class:bx--tag--disabled={disabled}
    class:bx--tag--truncate={maxWidth != null}
    class:bx--tag--with-icon={hasIcon}
    class:bx--tag--xs={resolvedSize === "xs"}
    class:bx--tag--sm={resolvedSize === "sm"}
    class:bx--tag--lg={resolvedSize === "lg"}
    class:bx--tag--red={type === "red"}
    class:bx--tag--magenta={type === "magenta"}
    class:bx--tag--purple={type === "purple"}
    class:bx--tag--blue={type === "blue"}
    class:bx--tag--cyan={type === "cyan"}
    class:bx--tag--teal={type === "teal"}
    class:bx--tag--green={type === "green"}
    class:bx--tag--gray={type === "gray"}
    class:bx--tag--cool-gray={type === "cool-gray"}
    class:bx--tag--warm-gray={type === "warm-gray"}
    class:bx--tag--high-contrast={type === "high-contrast"}
    class:bx--tag--outline={type === "outline"}
    {...$$restProps}
    style:max-width={maxWidth}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon={true}>
        <slot name="icon"><svelte:component this={icon} /></slot>
      </div>
    {/if}
    <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
  </button>
  <AnchoredTooltip
    anchor={ref}
    text={truncationLabel}
    enabled={showHostTooltip}
    passEscapeWhenFocused
  />
{:else}
  <div
    bind:this={ref}
    {id}
    data-overflow={$groupOverflow ? "true" : undefined}
    title={nativeTitle}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--disabled={disabled}
    class:bx--tag--truncate={maxWidth != null}
    class:bx--tag--with-icon={hasIcon}
    class:bx--tag--xs={resolvedSize === "xs"}
    class:bx--tag--sm={resolvedSize === "sm"}
    class:bx--tag--lg={resolvedSize === "lg"}
    class:bx--tag--red={type === "red"}
    class:bx--tag--magenta={type === "magenta"}
    class:bx--tag--purple={type === "purple"}
    class:bx--tag--blue={type === "blue"}
    class:bx--tag--cyan={type === "cyan"}
    class:bx--tag--teal={type === "teal"}
    class:bx--tag--green={type === "green"}
    class:bx--tag--gray={type === "gray"}
    class:bx--tag--cool-gray={type === "cool-gray"}
    class:bx--tag--warm-gray={type === "warm-gray"}
    class:bx--tag--high-contrast={type === "high-contrast"}
    class:bx--tag--outline={type === "outline"}
    {...rootProps}
    style:max-width={maxWidth}
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon={true}>
        <slot name="icon"><svelte:component this={icon} /></slot>
      </div>
    {/if}
    {#if showTruncationTooltip}
      <TooltipDefinition
        class="bx--tag__label-tooltip"
        tooltipText={truncationLabel}
        tabindex={$$restProps.tabindex}
        portalTooltip
      >
        <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
      </TooltipDefinition>
    {:else}
      <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
    {/if}
    {#if $$slots.decorator}
      <Decorator
        class="bx--tag__decorator"
        state={aiLabelState}
        labelSize="sm"
        labelKind="inline"
        labelAlign="start"
      >
        <slot name="decorator" />
      </Decorator>
    {/if}
  </div>
{/if}
