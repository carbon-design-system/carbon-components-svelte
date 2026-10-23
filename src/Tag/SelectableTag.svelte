<script>
  /**
   * @template [Icon=any]
   * @restProps {button}
   * @event {{ selected: boolean }} "change"
   */

  /**
   * Set to `true` to select the tag.
   * @bindable writable
   */
  export let selected = false;

  /**
   * Specify the type of tag.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline"}
   */
  export let type = undefined;

  /**
   * Specify the size of the tag.
   * Defaults to `"default"`, or to the `size` of a parent `TagSet`.
   * Also accepts Carbon v11's `"md"` (`"default"`).
   * @type {"sm" | "default" | "lg" | "md"}
   */
  export let size = undefined;

  /** Set to `true` to disable the tag */
  export let disabled = false;

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

  /** Set an id for the tag */
  export let id = uniqueId();

  import { createEventDispatcher, onMount } from "svelte";
  import { joinTagSet } from "../TagSet/join-tag-set.js";
  import { noop } from "../utils/noop.js";
  import { normalizeSize, TAG_SIZE_ALIASES } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import TagTooltip from "./TagTooltip.svelte";
  import { observeTruncation } from "./tag-truncation.js";

  const dispatch = createEventDispatcher();

  let buttonRef = null;
  let labelRef = null;
  let truncated = false;
  let stopObservingLabel = noop;

  // Inside a `TagSet`, register like `Tag` does.
  const group = joinTagSet(() => ({
    node: buttonRef,
    label: buttonRef?.textContent?.trim() ?? "",
    value,
    type,
    size: resolvedSize,
    disabled,
    filter: false,
  }));
  const {
    size: groupSize,
    overflow: groupOverflow,
    tabindex: rovingTabindex,
  } = group;

  $: resolvedSize =
    normalizeSize(size, TAG_SIZE_ALIASES) ?? $groupSize ?? "default";
  $: group.update({ value, type, size: resolvedSize, disabled });
  $: hasIcon = Boolean(icon || $$slots.icon);

  // A truncated label shows its full text in a tooltip on the tag. A
  // disabled tag gets no hover or focus, so it falls back to `title`.
  $: {
    stopObservingLabel();
    stopObservingLabel = labelRef
      ? observeTruncation(labelRef, (value) => {
          truncated = value;
        })
      : noop;
  }
  $: truncationLabel = truncated ? (labelRef?.textContent?.trim() ?? "") : "";

  onMount(() => {
    return () => stopObservingLabel();
  });

  function toggle() {
    if (disabled) return;
    selected = !selected;
    dispatch("change", { selected });
  }
</script>

<button
  bind:this={buttonRef}
  type="button"
  aria-pressed={selected}
  data-overflow={$groupOverflow ? "true" : undefined}
  {id}
  {disabled}
  aria-disabled={disabled}
  tabindex={disabled ? "-1" : $rovingTabindex}
  title={disabled && truncated ? truncationLabel : undefined}
  class:bx--tag={true}
  class:bx--tag--selectable={true}
  class:bx--tag--selectable-selected={selected}
  class:bx--tag--disabled={disabled}
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
  {...$$restProps}
  on:click
  on:click={toggle}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
>
  {#if $$slots.icon || icon}
    <div class:bx--tag__custom-icon={true}>
      <slot name="icon"> <svelte:component this={icon} /> </slot>
    </div>
  {/if}
  <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
</button>
<TagTooltip
  anchor={buttonRef}
  text={truncationLabel}
  enabled={truncated && !disabled}
/>
