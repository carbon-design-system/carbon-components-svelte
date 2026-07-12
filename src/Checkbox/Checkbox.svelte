<script>
  /**
   * @template [T=any]
   * @restProps {div}
   * @event {boolean} check
   */

  /**
   * Specify the value of the checkbox.
   * @type {T}
   */
  export let value = /** @type {T} */ ("");

  /**
   * Specify whether the checkbox is checked.
   * @bindable writable
   */
  export let checked = false;

  /**
   * Specify the bound group.
   * @type {ReadonlyArray<T> | undefined}
   * @bindable writable
   */
  export let group = undefined;

  /**
   * Specify whether the checkbox is indeterminate.
   * @bindable writable
   */
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
   * @bindable readonly
   */
  export let title = undefined;

  /** Set an id for the input label */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Set the tabindex for the input element.
   * @type {number | string | undefined}
   */
  export let tabindex = undefined;

  /**
   * Set to `true` to hide the input from the accessibility tree via CSS
   * (not just tabindex/aria-hidden, which axe-core's nested-interactive
   * check does not treat as sufficient). Use when this Checkbox is
   * nested inside another interactive/widget-role element that already
   * owns the checked-state semantics (e.g. a listbox option) and the
   * checkbox itself is purely decorative.
   */
  export let decorative = false;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import { readable } from "svelte/store";
  import { overflowTitle } from "../utils/overflowTitle.js";
  import CheckboxSkeleton from "./CheckboxSkeleton.svelte";

  const dispatch = createEventDispatcher();

  const ctx = getContext("carbon:CheckboxGroup");

  const {
    selectedValues,
    groupName,
    groupRequired,
    readonly: groupReadonly,
    update: ctxUpdate,
  } = ctx ?? {
    selectedValues: readable([]),
    groupName: readable(undefined),
    groupRequired: readable(undefined),
    readonly: readable(false),
  };

  $: useGroup = !ctx && Array.isArray(group);
  $: if (ctx) checked = $selectedValues.includes(value);
  $: if (useGroup) checked = group.includes(value);

  $: effectiveName = ctx ? ($groupName ?? name) : name;
  $: effectiveRequired = ctx ? ($groupRequired ?? required) : required;
  $: effectiveReadonly = $groupReadonly || readonly;

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

  $: helperId = `helper-${id}`;
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
    class:bx--checkbox-wrapper--readonly={effectiveReadonly}
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
      {tabindex}
      style:display={decorative ? "none" : undefined}
      bind:indeterminate
      name={effectiveName}
      required={effectiveRequired}
      aria-readonly={effectiveReadonly || undefined}
      aria-describedby={helperText ? helperId : undefined}
      class:bx--checkbox={true}
      on:click={(event) => {
        if (effectiveReadonly) {
          event.preventDefault();
        }
      }}
      on:change={(event) => {
        if (effectiveReadonly) {
          event.stopImmediatePropagation();
          return;
        }
        if (ctxUpdate) {
          ctxUpdate(value, !checked);
        } else if (useGroup) {
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
    >
    <label
      for={id}
      use:overflowTitle={{ title, measure: refLabel }}
      class:bx--checkbox-label={true}
    >
      <span
        bind:this={refLabel}
        class:bx--checkbox-label-text={true}
        class:bx--visually-hidden={hideLabel}
      >
        <slot name="labelChildren"> {labelText} </slot>
      </span>
    </label>
    {#if helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
  </div>
{/if}
