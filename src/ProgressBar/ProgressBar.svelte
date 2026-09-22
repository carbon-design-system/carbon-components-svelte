<script>
  /**
   * Specify the current value.
   * @type {number}
   */
  export let value = undefined;

  /** Specify the maximum value */
  export let max = 100;

  /**
   * Specify the kind of progress bar.
   * @type {"default" | "inline" | "indented"}
   */
  export let kind = "default";

  /**
   * Specify the status.
   * @type {"active" | "finished" | "error"}
   */
  export let status = "active";

  /**
   * Specify the size.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Specify the value text, at the end of the label row and used for `aria-valuetext`.
   * Format it yourself, e.g. "40 MB of 100 MB".
   */
  export let valueText = "";

  /** Set an id for the progress bar element */
  export let id = uniqueId();

  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const statusIcons = {
    error: ErrorFilled,
    finished: CheckmarkFilled,
  };

  let helperId = uniqueId();

  $: indeterminate = value === undefined && status === "active";
  let capped;
  $: {
    if (status === "error" || value < 0) {
      capped = 0;
    } else if (value > max) {
      capped = max;
    } else {
      capped = value;
    }
  }
  $: ratio =
    max > 0 && Number.isFinite(capped)
      ? Math.min(Math.max(capped / max, 0), 1)
      : 0;
</script>

<div
  class:bx--progress-bar={true}
  class:bx--progress-bar--indeterminate={indeterminate}
  class:bx--progress-bar--big={size === "md"}
  class:bx--progress-bar--small={size === "sm"}
  class:bx--progress-bar--inline={kind === "inline"}
  class:bx--progress-bar--indented={kind === "indented"}
  class:bx--progress-bar--error={status === "error"}
  class:bx--progress-bar--finished={status === "finished"}
  {...$$restProps}
>
  <div class:bx--progress-bar__label={true}>
    <span
      id="{id}-label"
      class:bx--progress-bar__label-text={true}
      class:bx--visually-hidden={hideLabel}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </span>
    {#if status === "error" || status === "finished"}
      <svelte:component
        this={statusIcons[status]}
        class="bx--progress-bar__status-icon"
      />
    {/if}
    {#if valueText.trim() || $$slots.valueChildren}
      <span class:bx--progress-bar__value-text={true}>
        <slot name="valueChildren">{valueText}</slot>
      </span>
    {/if}
  </div>
  <div
    role="progressbar"
    {id}
    class:bx--progress-bar__track={true}
    aria-busy={status === "active"}
    aria-labelledby="{id}-label"
    aria-valuemin={indeterminate ? undefined : 0}
    aria-valuemax={indeterminate ? undefined : max}
    aria-valuenow={indeterminate ? undefined : capped}
    aria-valuetext={valueText.trim() ? valueText : undefined}
    aria-describedby={helperText ? helperId : null}
  >
    <div
      class:bx--progress-bar__bar={true}
      style:transform={status === "active" && `scaleX(${ratio})`}
    ></div>
  </div>
  {#if helperText}
    <div id={helperId} class:bx--progress-bar__helper-text={true}>
      {helperText}
    </div>
  {/if}
</div>
