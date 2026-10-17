<script>
  /**
   * @template [Icon=any]
   * @restProps {div | button | a}
   */

  /**
   * Specify the type of tag.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline"}
   */
  export let type = undefined;

  /**
   * Specify the size of the tag.
   * Defaults to `"default"`, or to the `size` of a parent `TagSet`.
   * @type {"xs" | "sm" | "default" | "lg"}
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
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set to `true` to omit the default outer margin */
  export let inline = false;

  /** Set the title for the close button in a filterable tag */
  export let title = "Clear filter";

  /**
   * Cap the tag width. When the label overflows, a tooltip shows the full text.
   * Accepts any CSS length (for example `"8rem"`, `"120px"`).
   * @type {string | undefined}
   */
  export let maxWidth = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

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

  import { createEventDispatcher, tick } from "svelte";
  import Close from "../icons/Close.svelte";
  import { joinTagSet } from "../TagSet/join-tag-set.js";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { uniqueId } from "../utils/unique-id.js";
  import TagSkeleton from "./TagSkeleton.svelte";

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

  let labelRef = null;
  let truncated = false;
  let truncationLabel = "";
  let measureToken = 0;

  // In a filter tag, the close button is the only focusable element, so
  // naming and description go there instead of onto the wrapper.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: filterProps,
  } = splitAriaNaming($$restProps));

  // Fall back to the group's size, then to "default".
  $: resolvedSize = size ?? $groupSize ?? "default";

  // Interactive tags are already buttons, and link tags are already anchors.
  // Wrapping the label in `TooltipDefinition` would nest interactive
  // elements, so use the native `title` instead. A roving `TagSet` is a
  // single tab stop, which the tooltip's focusable trigger would break.
  $: showTruncationTooltip =
    truncated && !interactive && !href && $groupNavigation !== "roving";
  $: nativeTitle =
    truncated && !showTruncationTooltip ? truncationLabel : undefined;

  async function measureTruncation() {
    const token = ++measureToken;
    await tick();
    if (token !== measureToken) return;

    if (!maxWidth || !labelRef) {
      truncated = false;
      truncationLabel = "";
      return;
    }

    const text = labelRef.textContent?.trim() ?? "";
    const overflowing = labelRef.scrollWidth > labelRef.clientWidth;
    truncated = overflowing;
    truncationLabel = overflowing ? text : "";
  }

  $: if (maxWidth != null && !skeleton) {
    void maxWidth;
    void filter;
    void interactive;
    void href;
    void type;
    void resolvedSize;
    measureTruncation();
  } else if (maxWidth == null) {
    truncated = false;
    truncationLabel = "";
  }

  $: group.update({ value, type, size: resolvedSize, disabled, filter });

  function handleClose() {
    dispatch("close");
    group.notifyClose();
  }
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
    title={nativeTitle}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--disabled={disabled}
    class:bx--tag--filter={filter}
    class:bx--tag--truncate={maxWidth != null}
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
    {...filterProps}
    style:max-width={maxWidth}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if showTruncationTooltip}
      <TooltipDefinition
        class="bx--tag__label-tooltip"
        tooltipText={truncationLabel}
        portalTooltip
      >
        <span bind:this={labelRef} id="{id}-label" class:bx--tag__label={true}>
          <slot props={{ class: "bx--tag__label" }}>
            {type}
          </slot>
        </span>
      </TooltipDefinition>
    {:else}
      <span bind:this={labelRef} id="{id}-label" class:bx--tag__label={true}>
        <slot props={{ class: "bx--tag__label" }}>
          {type}
        </slot>
      </span>
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
      {title}
      on:click|stopPropagation={handleClose}
    >
      <Close />
    </button>
  </div>
{:else if href}
  <a
    bind:this={ref}
    href={disabled ? undefined : href}
    role={disabled ? "link" : undefined}
    {id}
    aria-disabled={disabled || undefined}
    tabindex={$rovingTabindex}
    rel={resolveLinkRel($$restProps.target)}
    data-overflow={$groupOverflow ? "true" : undefined}
    title={nativeTitle}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--interactive={true}
    class:bx--tag--disabled={disabled}
    class:bx--tag--truncate={maxWidth != null}
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
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
    <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
  </a>
{:else if interactive}
  <button
    bind:this={ref}
    type="button"
    {id}
    {disabled}
    aria-disabled={disabled}
    tabindex={disabled ? "-1" : $rovingTabindex}
    title={nativeTitle}
    data-overflow={$groupOverflow ? "true" : undefined}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--interactive={true}
    class:bx--tag--disabled={disabled}
    class:bx--tag--truncate={maxWidth != null}
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
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
    <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
  </button>
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
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.icon || icon}
      <div class:bx--tag__custom-icon={true}>
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
    {#if showTruncationTooltip}
      <TooltipDefinition
        class="bx--tag__label-tooltip"
        tooltipText={truncationLabel}
        portalTooltip
      >
        <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
      </TooltipDefinition>
    {:else}
      <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
    {/if}
  </div>
{/if}
