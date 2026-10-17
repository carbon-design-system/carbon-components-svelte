<script>
  import { forwardShiftClick } from "../utils/forward-shift-click.js";
  import { uniqueId } from "../utils/unique-id.js";

  /** Specify whether the checkbox is checked */
  export let checked = false;

  /** Specify whether the checkbox is indeterminate */
  export let indeterminate = false;

  /**
   * Specify the title attribute for the label element.
   * @type {string}
   */
  export let title = undefined;

  /** Set an id for the input label */
  export let id = uniqueId();

  /** Obtain a reference to the input HTML element */
  export let ref = null;
</script>

<div class:bx--checkbox--inline={true}>
  <input
    bind:this={ref}
    type="checkbox"
    class:bx--checkbox={true}
    checked={indeterminate ? false : checked}
    bind:indeterminate
    {id}
    {...$$restProps}
    aria-checked={indeterminate ? undefined : checked}
    on:click
    on:change
    on:focus
    on:blur
  >
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- Server markup can't set `indeterminate`, so the label carries the
       mixed state until hydration does. -->
  <label
    for={id}
    {title}
    data-contained-checkbox-state={indeterminate ? "mixed" : undefined}
    data-contained-checkbox-disabled={indeterminate && $$restProps.disabled
      ? "true"
      : undefined}
    class:bx--checkbox-label={true}
    on:click={(event) => forwardShiftClick(event, ref)}
  ></label>
</div>
