<script>
  /**
   * @template [T=any]
   * @restProps {div}
   * @event {boolean} check
   */

  /**
   * Specify the value of the checkbox.
   * Submitted as `"on"` when empty, like a native checkbox.
   * @type {T}
   */
  export let value = /** @type {T} */ ("");

  /**
   * Specify whether the checkbox is checked.
   * Follows the box when the owning form resets.
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

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /** Set to `true` to disable the checkbox */
  export let disabled = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Set to `true` to omit the outer margin that spaces a stack of
   * checkboxes, as when the checkbox sits in a table cell or a row
   * that spaces its own content.
   */
  export let noMargin = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set a name for the input element */
  export let name = "";

  /**
   * Specify the id of a form element outside the component to associate
   * the checkbox with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Set the native `title` attribute on the label element. When unset,
   * the label takes its full text as `title` while it is truncated.
   * @type {string | undefined}
   * @bindable readonly
   */
  export let title = undefined;

  /** Set an id for the input label */
  export let id = uniqueId();

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
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { overflowTitle } from "../utils/overflow-title.js";
  import { uniqueId } from "../utils/unique-id.js";
  import CheckboxSkeleton from "./CheckboxSkeleton.svelte";

  const dispatch = createEventDispatcher();

  // Naming and description belong on the input, not the wrapper.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  const ctx = getContext("carbon:CheckboxGroup");

  const {
    selectedValues,
    groupName,
    groupForm,
    groupRequired,
    readonly: groupReadonly,
    disabled: groupDisabled,
    invalid: groupInvalid,
    warn: groupWarn,
    update: ctxUpdate,
  } = ctx ?? {
    selectedValues: readable([]),
    groupName: readable(undefined),
    groupForm: readable(undefined),
    groupRequired: readable(undefined),
    readonly: readable(false),
    disabled: readable(false),
    invalid: readable(false),
    warn: readable(false),
  };

  $: useGroup = !ctx && Array.isArray(group);
  // A native checkbox with no value submits "on"; `""` would post an empty,
  // falsy field for a checked box. Only the DOM attribute is mapped; group
  // membership still compares `value` itself.
  $: nativeValue = value === "" || value == null ? "on" : value;
  $: if (ctx) checked = $selectedValues.includes(value);
  $: if (useGroup) checked = group.includes(value);

  $: effectiveName = ctx ? ($groupName ?? name) : name;
  // Native validation requires every `required` checkbox. A required group
  // needs only one, so require every box until one is checked.
  $: effectiveRequired = ctx
    ? $groupRequired
      ? $selectedValues.length === 0
      : ($groupRequired ?? required)
    : required;
  $: effectiveReadonly = $groupReadonly || readonly;
  $: effectiveInvalid = $groupInvalid || invalid;
  $: effectiveWarn = $groupWarn || warn;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: effectiveInvalid,
    warn: effectiveWarn,
    // A disabled group disables its boxes natively, through `<fieldset
    // disabled>`, so its state is read here only to hide the invalid state.
    disabled: disabled || $groupDisabled,
    readonly: effectiveReadonly,
  }));

  // Track previous checked value to avoid duplicate dispatches in Svelte 5
  // The reactive statement will only dispatch when checked changes externally (e.g., via bind:checked)
  let prevChecked = checked;
  $: {
    const hasChanged = prevChecked !== checked;
    if (hasChanged) {
      prevChecked = checked;
      dispatch("check", checked);
    }
  }

  /** @type {null | HTMLSpanElement} */
  let labelRef = null;

  /** @type {(nextChecked: boolean) => void} */
  function setGroupMembership(nextChecked) {
    const hasValue = group.includes(value);
    if (nextChecked && !hasValue) {
      group = [...group, value];
    } else if (!nextChecked && hasValue) {
      group = group.filter((_value) => _value !== value);
    }
  }

  // A form reset restores the box without a change event. Sync the state to
  // it, like the other form controls, and fire no `check`. A read-only
  // checkbox keeps its state, so put the box back instead. So does a
  // decorative one: its owner (a tree node, a listbox option) holds the
  // state and never learns about the reset.
  function handleFormReset() {
    if (!ref) return;
    if (effectiveReadonly || decorative) {
      ref.checked = checked;
      return;
    }
    const nextChecked = ref.checked;
    prevChecked = nextChecked;
    if (ctxUpdate) {
      ctxUpdate(value, nextChecked, true);
    } else if (useGroup) {
      setGroupMembership(nextChecked);
    } else {
      checked = nextChecked;
    }
  }

  $: ({ helperId, errorId, warnId, readonlyId } = buildFieldIds(id));
  // A decorative checkbox's owner (e.g. a MultiSelect option) already
  // announces read-only, so skip the per-checkbox description.
  $: describeReadonly = effectiveReadonly && !decorative;

  /** @type {import("svelte/store").Writable<undefined | "active" | "revert">} */
  const aiLabelState = writable(undefined);

  /** @param {"default" | "inline"} kind */
  function labelSizeForKind(kind) {
    return kind === "inline" ? "md" : "mini";
  }
</script>

{#if skeleton}
  <CheckboxSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <div
    class:bx--form-item={true}
    class:bx--form-item--fit={true}
    class:bx--checkbox-wrapper={true}
    class:bx--checkbox-wrapper--no-margin={noMargin}
    class:bx--checkbox-wrapper--readonly={effectiveReadonly}
    class:bx--checkbox-wrapper--invalid={showInvalid}
    class:bx--checkbox-wrapper--warning={showWarn}
    class:bx--checkbox-wrapper--decorator={$$slots.decorator}
    {...wrapperProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <input
      bind:this={ref}
      use:formReset={handleFormReset}
      type="checkbox"
      value={nativeValue}
      {checked}
      {disabled}
      {id}
      {tabindex}
      style:display={decorative ? "none" : undefined}
      bind:indeterminate
      name={effectiveName}
      form={$groupForm ?? form}
      required={effectiveRequired}
      aria-readonly={effectiveReadonly || undefined}
      aria-invalid={showInvalid || undefined}
      data-invalid={showInvalid || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={joinDescribedBy(
        describeReadonly ? readonlyId : null,
        resolveStatusDescribedBy({
          showInvalid,
          showWarn,
          invalidText,
          warnText,
          helperText,
          errorId,
          warnId,
          helperId,
        }),
        ariaDescribedBy,
      )}
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
        // Read the input, not the Svelte state: the two disagree after a
        // form reset, and inverting stale state would undo the click.
        const nextChecked = event.currentTarget.checked;
        if (ctxUpdate) {
          ctxUpdate(value, nextChecked);
        } else if (useGroup) {
          setGroupMembership(nextChecked);
        } else {
          prevChecked = nextChecked;
          checked = nextChecked;
          // Dispatch directly for user-initiated changes to avoid duplicate events in Svelte 5
          dispatch("check", nextChecked);
        }
      }}
      on:change
      on:focus
      on:blur
    />
    <label
      for={id}
      use:overflowTitle={{ title, measure: labelRef }}
      data-contained-checkbox-state={indeterminate ? "mixed" : undefined}
      data-contained-checkbox-disabled={indeterminate && disabled
        ? "true"
        : undefined}
      class:bx--checkbox-label={true}
    >
      <span
        bind:this={labelRef}
        class:bx--checkbox-label-text={true}
        class:bx--visually-hidden={hideLabel}
      >
        <slot name="labelChildren">{labelText}</slot>
      </span>
    </label>
    {#if $$slots.decorator}
      <Decorator
        class="bx--checkbox-wrapper-inner--decorator"
        state={aiLabelState}
        labelSize={labelSizeForKind}
        labelAlign="start"
      >
        <slot name="decorator" />
      </Decorator>
    {/if}
    {#if describeReadonly}
      <span id={readonlyId} class:bx--visually-hidden={true}
        >{readonlyText}</span
      >
    {/if}
    <!-- Hidden by CSS unless invalid or warning, so only built then. -->
    {#if showInvalid || showWarn}
      <div class:bx--checkbox__validation-msg={true}>
        {#if showInvalid}
          <WarningFilled class="bx--checkbox__invalid-icon" />
          {#if invalidText}
            <div id={errorId} class:bx--form-requirement={true} role="alert">
              {invalidText}
            </div>
          {/if}
        {:else}
          <WarningAltFilled
            class="bx--checkbox__invalid-icon bx--checkbox__invalid-icon--warning"
          />
          {#if warnText}
            <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
          {/if}
        {/if}
      </div>
    {/if}
    {#if helperText && !showInvalid && !showWarn}
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
