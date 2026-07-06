<script>
  /**
   * @template [Icon=any]
   * @restProps {div | span}
   */

  /**
   * Specify the type of tag.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline"}
   */
  export let type = undefined;

  /**
   * Specify the size of the tag.
   * Defaults to `"default"`, or to the `size` of a parent `TagSet`.
   * @type {"sm" | "default" | "lg"}
   */
  export let size = undefined;

  /** Set to `true` to use filterable variant */
  export let filter = false;

  /** Set to `true` to disable a filterable tag */
  export let disabled = false;

  /** Set to `true` to render a `button` element instead of a `div` */
  export let interactive = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set to `true` to omit the default outer margin */
  export let inline = false;

  /** Set the title for the close button in a filterable tag */
  export let title = "Clear filter";

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Set an id for the filterable tag */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import Close from "../icons/Close.svelte";
  import TagSkeleton from "./TagSkeleton.svelte";

  const dispatch = createEventDispatcher();

  // When rendered inside a `TagSet`, register so the group can measure this
  // tag's natural width and mark it as overflow once it no longer fits. The
  // group context is absent for a standalone tag, in which case none of this
  // applies.
  const tagSet = getContext("carbon:TagSet");
  const groupItemId = tagSet
    ? `ctag-${Math.random().toString(36).slice(2)}`
    : undefined;
  const groupOverflowIds = tagSet?.overflowIds ?? readable(new Set());
  const groupSize = tagSet?.size ?? readable(undefined);

  let labelRef = null;

  // Fall back to the group's size, then to "default".
  $: resolvedSize = size ?? $groupSize ?? "default";

  if (tagSet) {
    onMount(() => {
      tagSet.register({
        id: groupItemId,
        node: ref,
        label: labelRef?.textContent?.trim() ?? "",
        type,
        size: resolvedSize,
        disabled,
        filter,
      });
      return () => tagSet.unregister(groupItemId);
    });
  }

  $: if (tagSet) {
    tagSet.update(groupItemId, {
      type,
      size: resolvedSize,
      disabled,
      filter,
    });
  }
  $: groupOverflow = !!tagSet && $groupOverflowIds.has(groupItemId);

  function handleClose() {
    dispatch("close");
    if (tagSet) tagSet.notifyClose(groupItemId);
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
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
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={ref}
    aria-label={title}
    {id}
    data-overflow={groupOverflow ? "true" : undefined}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--disabled={disabled}
    class:bx--tag--filter={filter}
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
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <span bind:this={labelRef} class:bx--tag__label={true}>
      <slot props={{ class: "bx--tag__label" }}>
        {type}
      </slot>
    </span>
    <button
      type="button"
      aria-labelledby={id}
      class:bx--tag__close-icon={true}
      {disabled}
      {title}
      on:click|stopPropagation={handleClose}
    >
      <Close />
    </button>
  </div>
{:else if interactive}
  <button
    bind:this={ref}
    type="button"
    {id}
    {disabled}
    aria-disabled={disabled}
    tabindex={disabled ? "-1" : undefined}
    data-overflow={groupOverflow ? "true" : undefined}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--interactive={true}
    class:bx--tag--disabled={disabled}
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
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={ref}
    {id}
    data-overflow={groupOverflow ? "true" : undefined}
    class:bx--tag={true}
    class:bx--tag--inline={inline}
    class:bx--tag--disabled={disabled}
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
  </div>
{/if}
