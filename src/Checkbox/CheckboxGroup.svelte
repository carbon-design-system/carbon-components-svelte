<script>
  /**
   * @event {ReadonlyArray<string | number>} change
   */

  /**
   * Set the selected checkbox values.
   * @type {ReadonlyArray<string | number>}
   * @bindable writable
   */
  export let selected = [];

  /** Set to `true` to disable all checkboxes */
  export let disabled = false;

  /**
   * Set to `true` to require at least one selection.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify a name attribute for the checkbox inputs.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <CheckboxGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   *   <Checkbox value="a" labelText="Option A" />
   *   <Checkbox value="b" labelText="Option B" />
   * </CheckboxGroup>
   * ```
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

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

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Set an id for the container div element.
   * @type {string}
   */
  export let id = undefined;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { readonly as readOnly, writable } from "svelte/store";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { uniqueId } from "../utils/uniqueId.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<string | number>>}
   */
  const selectedValues = writable(selected);
  const groupName = writable(name);
  const groupRequired = writable(required);
  const groupReadonly = writable(readonly);
  const groupInvalid = writable(invalid);
  const groupWarn = writable(warn);
  let isInitialRender = true;

  /**
   * @type {(value: string | number, checked: boolean) => void}
   */
  function update(value, checked) {
    if (readonly) return;
    selectedValues.update((prev) => {
      if (checked) {
        return prev.includes(value) ? prev : [...prev, value];
      }
      return prev.filter((v) => v !== value);
    });
  }

  setContext("carbon:CheckboxGroup", {
    selectedValues,
    groupName: readOnly(groupName),
    groupRequired: readOnly(groupRequired),
    readonly: readOnly(groupReadonly),
    invalid: readOnly(groupInvalid),
    warn: readOnly(groupWarn),
    update,
  });

  $: if (!readonly && selected !== $selectedValues) $selectedValues = selected;

  const unsubscribe = selectedValues.subscribe((value) => {
    if (readonly) return;
    selected = value;
    if (!isInitialRender) {
      dispatch("change", value);
    }
  });

  onMount(() => {
    tick().then(() => {
      isInitialRender = false;
    });
    return unsubscribe;
  });

  $: $groupName = name;
  $: $groupRequired = required;
  $: $groupReadonly = readonly;
  $: $groupInvalid = invalid;
  $: $groupWarn = warn;
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;

  const fallbackHelperId = uniqueId();
  const fallbackErrorId = uniqueId();
  const fallbackWarnId = uniqueId();
  $: helperId = id ? `helper-${id}` : fallbackHelperId;
  $: errorId = id ? `error-${id}` : fallbackErrorId;
  $: warnId = id ? `warn-${id}` : fallbackWarnId;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  {id}
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <fieldset
    class:bx--checkbox-group={true}
    class:bx--checkbox-group--readonly={readonly}
    class:bx--checkbox-group--invalid={showInvalid}
    class:bx--checkbox-group--warning={showWarn}
    {disabled}
    data-invalid={showInvalid || undefined}
    aria-describedby={showInvalid
      ? errorId
      : showWarn
        ? warnId
        : helperText
          ? helperId
          : undefined}
  >
    {#if legendText || $$slots.legendChildren}
      <legend class:bx--label={true} class:bx--visually-hidden={hideLegend}>
        <slot name="legendChildren">{legendText}</slot>
      </legend>
    {/if}
    <slot />
    <div class:bx--checkbox-group__validation-msg={true}>
      {#if showInvalid}
        <WarningFilled class="bx--checkbox__invalid-icon" />
        <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
      {:else if showWarn}
        <WarningAltFilled
          class="bx--checkbox__invalid-icon bx--checkbox__invalid-icon--warning"
        />
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
    </div>
  </fieldset>
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
