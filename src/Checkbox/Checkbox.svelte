<script>
  /**
   * @restProps {div}
   * @event {boolean} check
   */

  /**
   * Specify the value of the checkbox.
   * @type {any}
   */
  export let value = "";

  /** Specify whether the checkbox is checked */
  export let checked = false;

  /**
   * Specify the bound group.
   * @type {ReadonlyArray<any>}
   */
  export let group = undefined;

  /** Specify whether the checkbox is indeterminate */
  export let indeterminate = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` for the checkbox to be read-only */
  export let readonly = false;

  /** Set to `true` to disable the checkbox */
  export let disabled = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set a name for the input element */
  export let name = "";

  /**
   * Specify the title attribute for the label element.
   * @type {string}
   */
  export let title = undefined;

  /** Set an id for the input label */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import CheckboxSkeleton from "./CheckboxSkeleton.svelte";

  const dispatch = createEventDispatcher();

  $: useGroup = Array.isArray(group);
  $: if (useGroup) checked = group.includes(value);

  // Track previous checked value to avoid duplicate dispatches in Svelte 5
  // The reactive statement will only dispatch when checked changes externally (e.g., via bind:checked)
  let previousChecked = checked;
  $: {
    const hasChanged = previousChecked !== checked;
    if (hasChanged) {
      previousChecked = checked;
      dispatch("check", checked);
    }
  }

  let refLabel = null;

  $: isTruncated = refLabel?.offsetWidth < refLabel?.scrollWidth;
  $: title = !title && isTruncated ? refLabel?.innerText : title;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <CheckboxSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--form-item={true}
    class:bx--checkbox-wrapper={true}
    class:bx--checkbox-wrapper--readonly={readonly}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <input
      bind:this={ref}
      type="checkbox"
      {value}
      {checked}
      {disabled}
      {id}
      bind:indeterminate
      {name}
      {required}
      aria-readonly={readonly || undefined}
      class:bx--checkbox={true}
      on:click={(e) => {
        if (readonly) {
          e.preventDefault();
        }
      }}
      on:change={(e) => {
        if (readonly) {
          e.preventDefault();
          return;
        }
        if (useGroup) {
          group = group.includes(value)
            ? group.filter((_value) => _value !== value)
            : [...group, value];
        } else {
          const newChecked = !checked;
          previousChecked = newChecked;
          checked = newChecked;
          // Dispatch directly for user-initiated changes to avoid duplicate events in Svelte 5
          dispatch("check", newChecked);
        }
      }}
      on:change
      on:focus
      on:blur
    />
    <label for={id} {title} class:bx--checkbox-label={true}>
      <span
        bind:this={refLabel}
        class:bx--checkbox-label-text={true}
        class:bx--visually-hidden={hideLabel}
      >
        <slot name="labelChildren">
          {labelText}
        </slot>
      </span>
    </label>
    {#if helperText}
      <div
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
  </div>
{/if}
