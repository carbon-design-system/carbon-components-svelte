<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @restProps {button}
   * @event {{ selected: boolean }} "change"
   */

  /**
   * Set to `true` to select the tag.
   * Ignored inside a `SelectableTagGroup`, which owns the selection.
   * @bindable writable
   */
  export let selected = false;

  /**
   * Specify the type of tag.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline" | undefined}
   */
  export let type = undefined;

  /**
   * Specify the size of the tag.
   * Defaults to `"default"`, or to the `size` of a parent
   * `SelectableTagGroup` or `TagSet`.
   * Also accepts Carbon v11's `"md"` (`"default"`).
   * @type {"xs" | "sm" | "default" | "lg" | "md" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to disable the tag. Also disabled by a disabled `SelectableTagGroup`. */
  export let disabled = false;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify a value that identifies the tag inside a `TagSet`, or in the
   * `selected` array of a `SelectableTagGroup` (falls back to `id`).
   * Returned as `tag.value` in the set's `close:tag` event.
   * @type {string | number | undefined}
   */
  export let value = undefined;

  /** Set an id for the tag */
  export let id = uniqueId();

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLButtonElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import { joinTagSet } from "../TagSet/join-tag-set.js";
  import { noop } from "../utils/noop.js";
  import { normalizeSize, TAG_SIZE_ALIASES } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { observeTruncation } from "./tag-truncation.js";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLSpanElement} */
  let labelRef = null;
  let truncated = false;
  let stopObservingLabel = noop;

  // Inside a `SelectableTagGroup`, the group owns the selection. Outside
  // one, `selectedValues` is `null` and the tag keeps its own `selected`.
  const selectionGroup = getContext("carbon:SelectableTagGroup") ?? {
    selectedValues: readable(/** @type {Set<string | number> | null} */ (null)),
    disabled: readable(false),
    size: readable(
      /** @type {"sm" | "default" | "lg" | undefined} */ (undefined),
    ),
    toggle: () => /** @type {boolean | null} */ (null),
  };
  const {
    selectedValues: groupSelectedValues,
    disabled: groupDisabled,
    size: selectionGroupSize,
  } = selectionGroup;

  // Inside a `TagSet`, register like `Tag` does.
  const group = joinTagSet(() => ({
    node: ref,
    label: ref?.textContent?.trim() ?? "",
    value,
    type,
    size: resolvedSize,
    disabled: isDisabled,
    filter: false,
  }));
  const {
    size: groupSize,
    overflow: groupOverflow,
    tabindex: rovingTabindex,
  } = group;

  $: identity = value ?? id;
  $: inSelectionGroup = $groupSelectedValues !== null;
  $: isSelected = $groupSelectedValues
    ? $groupSelectedValues.has(identity)
    : selected;
  $: isDisabled = disabled || $groupDisabled;
  $: resolvedSize =
    normalizeSize(size, TAG_SIZE_ALIASES) ??
    $selectionGroupSize ??
    $groupSize ??
    "default";
  $: group.update({
    value,
    type,
    size: resolvedSize,
    disabled: isDisabled,
  });
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
    if (isDisabled) return;
    if (inSelectionGroup) {
      // The group may decline, e.g. to keep the last selected tag (`required`).
      const next = selectionGroup.toggle(identity);
      if (next !== null) dispatch("change", { selected: next });
      return;
    }
    selected = !selected;
    dispatch("change", { selected });
  }
</script>

<button
  bind:this={ref}
  type="button"
  aria-pressed={isSelected ? "true" : "false"}
  data-overflow={$groupOverflow ? "true" : undefined}
  {id}
  disabled={isDisabled}
  aria-disabled={isDisabled ? "true" : "false"}
  tabindex={isDisabled ? -1 : $rovingTabindex}
  title={isDisabled && truncated ? truncationLabel : undefined}
  class:bx--tag={true}
  class:bx--tag--selectable={true}
  class:bx--tag--selectable-selected={isSelected}
  class:bx--tag--disabled={isDisabled}
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
  on:click
  on:click={toggle}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
>
  {#if $$slots.icon || icon}
    <div class:bx--tag__custom-icon={true}>
      <slot name="icon"><svelte:component this={icon} /></slot>
    </div>
  {/if}
  <span bind:this={labelRef} class:bx--tag__label={true}> <slot /> </span>
</button>
<AnchoredTooltip
  passEscapeWhenFocused
  anchor={ref}
  text={truncationLabel}
  enabled={truncated && !isDisabled}
/>
