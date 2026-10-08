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
   * @type {"sm" | "default" | "lg"}
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

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  // Inside a `TagSet`, register like `Tag` does so the group can measure
  // this tag and collapse it into the "+N" indicator once it no longer fits.
  const tagSet = getContext("carbon:TagSet");
  const groupItemId = tagSet ? uniqueId("ctag") : undefined;
  const groupOverflowIds = tagSet?.overflowIds ?? readable(new Set());
  const groupSize = tagSet?.size ?? readable(undefined);
  const groupNavigation = tagSet?.navigation ?? readable("tab");
  const groupTabStopId = tagSet?.tabStopId ?? readable(null);

  let buttonRef = null;

  $: resolvedSize = size ?? $groupSize ?? "default";

  // A roving `TagSet` owns the tab order: only its current tab stop is
  // tabbable. `undefined` leaves the native order (standalone, or before the
  // set has picked a tab stop).
  $: rovingTabindex =
    $groupNavigation === "roving" && $groupTabStopId !== null
      ? $groupTabStopId === groupItemId
        ? "0"
        : "-1"
      : undefined;

  if (tagSet) {
    onMount(() => {
      tagSet.register({
        id: groupItemId,
        node: buttonRef,
        label: buttonRef?.textContent?.trim() ?? "",
        value,
        type,
        size: resolvedSize,
        disabled,
        filter: false,
      });
      return () => tagSet.unregister(groupItemId);
    });
  }

  $: if (tagSet) {
    tagSet.update(groupItemId, {
      value,
      type,
      size: resolvedSize,
      disabled,
    });
  }
  $: groupOverflow = !!tagSet && $groupOverflowIds.has(groupItemId);

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
  data-overflow={groupOverflow ? "true" : undefined}
  {id}
  {disabled}
  aria-disabled={disabled}
  tabindex={disabled ? "-1" : rovingTabindex}
  class:bx--tag={true}
  class:bx--tag--selectable={true}
  class:bx--tag--selectable-selected={selected}
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
  <span> <slot /> </span>
</button>
