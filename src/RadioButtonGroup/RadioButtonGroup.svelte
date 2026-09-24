<script>
  /**
   * @template {string | number} [Value=string | number]
   * @event {Value} change
   */

  /**
   * Set the selected radio button value.
   * Follows the field after a reset — becomes the value of whichever radio
   * is checked in the DOM, or `undefined`.
   * @type {Value | undefined}
   * @bindable writable
   */
  export let selected = undefined;

  /** Set to `true` to disable the radio buttons */
  export let disabled = false;

  /**
   * Set to `true` to require the selection of a radio button.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify a name attribute for the radio button inputs.
   * Overrides each button's own `name`. When neither is set, the buttons
   * share a generated id so they form one radio group; set a name
   * explicitly when form submission matters.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <RadioButtonGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   *   <RadioButton labelText="Option 1" value="1" />
   *   <RadioButton labelText="Option 2" value="2" />
   *   <RadioButton labelText="Option 3" value="3" />
   * </RadioButtonGroup>
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
   * Set to `true` so clicking an already-selected radio clears the
   * selection instead of leaving it selected.
   */
  export let allowDeselect = false;

  /**
   * Specify the label position.
   * @type {"right" | "left"}
   */
  export let labelPosition = "right";

  /**
   * Specify the orientation of the radio buttons.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /**
   * Set an id for the container div element.
   * @type {string}
   */
  export let id = undefined;

  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { readonly as readOnly, writable } from "svelte/store";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    buildFieldIds,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<Value | undefined>}
   */
  const selectedValue = writable(selected);
  const groupName = writable(name || undefined);
  // Unnamed radios are separate controls, so arrow keys would not move the
  // selection. Buttons with no name of their own share this one when the
  // group has no `name` either.
  const fallbackName = uniqueId();
  const groupRequired = writable(required);
  const groupReadonly = writable(readonly);
  const groupAllowDeselect = writable(allowDeselect);
  const fallbackHelperId = uniqueId();
  const fallbackErrorId = uniqueId();
  const fallbackWarnId = uniqueId();
  /** @type {import("svelte/store").Writable<string | undefined>} */
  const helperId = writable(undefined);
  let initialRender = true;
  /** @type {HTMLFieldSetElement | undefined} */
  let fieldsetRef;
  // Suppresses the store's own "change" dispatch (below) while a reset is
  // rewriting `selectedValue` — a reset fires no events, like the other
  // form controls.
  let resettingFromForm = false;

  /**
   * @type {(data: { checked: boolean; value: Value }) => void}
   */
  function add({ checked, value }) {
    if (checked) {
      selectedValue.set(value);
    }
  }

  /**
   * @type {(value: Value) => void}
   */
  function update(value) {
    if (readonly) return;
    selected = value;
  }

  function deselect() {
    if (readonly) return;
    selected = undefined;
  }

  function handleFormReset() {
    if (!fieldsetRef) return;
    if (readonly) {
      // Read-only keeps its state; put the DOM back to match it instead of
      // leaving the browser's native-reset default (every radio unchecked).
      for (const input of fieldsetRef.querySelectorAll('input[type="radio"]')) {
        input.checked =
          selected !== undefined && String(selected) === input.value;
      }
      return;
    }
    // formReset is task-deferred, so the browser has already restored every
    // radio to its own default: checked when the markup carried a `checked`
    // attribute (server-rendered), unchecked otherwise. Read the winner back,
    // or none.
    const checkedInput = /** @type {HTMLInputElement | null} */ (
      fieldsetRef.querySelector('input[type="radio"]:checked')
    );
    // The DOM only ever carries strings. `Value` is uniform across one
    // group's RadioButtons, so coerce back to a number when the group was
    // already using numeric values; otherwise (including "nothing was
    // selected before this reset", where the type can't be known) keep the
    // native string.
    const nextSelected = checkedInput
      ? typeof selected === "number"
        ? Number(checkedInput.value)
        : checkedInput.value
      : undefined;
    resettingFromForm = true;
    selectedValue.set(nextSelected);
    resettingFromForm = false;
  }

  setContext("carbon:RadioButtonGroup", {
    selectedValue,
    groupName: readOnly(groupName),
    fallbackName,
    groupRequired: readOnly(groupRequired),
    readonly: readOnly(groupReadonly),
    allowDeselect: readOnly(groupAllowDeselect),
    helperId: readOnly(helperId),
    add,
    update,
    deselect,
  });

  $: if (!readonly) $selectedValue = selected;

  const unsubscribe = selectedValue.subscribe((value) => {
    if (readonly) return;
    selected = value;
    if (!initialRender && !resettingFromForm) {
      dispatch("change", value);
    }
  });

  onMount(() => {
    $selectedValue = selected;
    initialRender = false;
    return unsubscribe;
  });

  $: $groupName = name || undefined;
  $: $groupRequired = required;
  $: $groupReadonly = readonly;
  $: $groupAllowDeselect = allowDeselect;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: ({
    errorId,
    warnId,
    helperId: rawHelperId,
  } = buildFieldIds(id, {
    helperId: fallbackHelperId,
    errorId: fallbackErrorId,
    warnId: fallbackWarnId,
  }));
  // The `helperId` store holds the *resolved* description id (not the
  // raw helper id) — child RadioButtons point their own
  // aria-describedby at whichever tier is currently showing.
  $: $helperId = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    helperText,
    errorId,
    warnId,
    helperId: rawHelperId,
  });
</script>

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
    bind:this={fieldsetRef}
    use:formReset={handleFormReset}
    role="radiogroup"
    aria-orientation={orientation}
    aria-readonly={readonly || undefined}
    class:bx--radio-button-group={true}
    class:bx--radio-button-group--vertical={orientation === "vertical"}
    class:bx--radio-button-group--label-left={labelPosition === "left"}
    class:bx--radio-button-group--label-right={labelPosition === "right"}
    class:bx--radio-button-group--readonly={readonly}
    class:bx--radio-button-group--invalid={showInvalid}
    class:bx--radio-button-group--warning={showWarn}
    {disabled}
    data-invalid={showInvalid || undefined}
    aria-invalid={showInvalid || undefined}
  >
    {#if legendText || $$slots.legendChildren}
      <legend class:bx--label={true} class:bx--visually-hidden={hideLegend}>
        <slot name="legendChildren">{legendText}</slot>
      </legend>
    {/if}
    <slot />
    <div class:bx--radio-button-group__validation-msg={true}>
      {#if showInvalid}
        <WarningFilled class="bx--radio-button-group__invalid-icon" />
        <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
      {:else if showWarn}
        <WarningAltFilled
          class="bx--radio-button-group__invalid-icon bx--radio-button-group__invalid-icon--warning"
        />
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
    </div>
  </fieldset>
  {#if helperText && !showInvalid && !showWarn}
    <div
      id={$helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
