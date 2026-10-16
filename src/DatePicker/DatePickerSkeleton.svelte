<script>
  /**
   * Set the size of the skeleton to match the field it stands in for.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the type of the date picker it stands in for. `"simple"` is a
   * short text field; `"range"` draws two inputs; the other types draw
   * one full-width input, as on DatePicker.
   * Takes precedence over `range`; unset, it's `"range"` when `range` is
   * set, otherwise `"simple"`.
   * @type {"simple" | "single" | "range" | "month" | "year" | "week" | "multiple"}
   */
  export let datePickerType = undefined;

  /**
   * Set to `true` to use the range variant.
   * @deprecated use `datePickerType="range"`
   */
  export let range = false;

  /** Set to `true` to use the short variant */
  export let short = false;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;
  $: type = datePickerType ?? (range ? "range" : "simple");
  $: isRange = type === "range";
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    class:bx--date-picker={true}
    class:bx--skeleton={true}
    class:bx--date-picker--range={isRange}
    class:bx--date-picker--simple={type === "simple"}
    class:bx--date-picker--single={type !== "simple" && !isRange}
    class:bx--date-picker--short={short}
  >
    {#each Array.from(
      { length: isRange ? 2 : 1 },
      (_, i) => i,
    ) as input (input)}
      <div class:bx--date-picker-container={true}>
        <span class:bx--label={true}></span>
        <div
          class:bx--date-picker__input={true}
          class:bx--skeleton={true}
          class:bx--date-picker__input--xs={effectiveSize === "xs"}
          class:bx--date-picker__input--sm={effectiveSize === "sm"}
          class:bx--date-picker__input--xl={effectiveSize === "xl"}
        ></div>
      </div>
    {/each}
  </div>
</div>
