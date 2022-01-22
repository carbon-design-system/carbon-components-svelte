<script>
  /**
   * @typedef {"increment" | "decrement"} NumberInputTranslationId
   * @event {number} change
   */

  /**
   * Set the size of the input
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value
   * @type {number | string}
   */
  export let value = "";

  /** Specify the step increment */
  export let step = 1;

  /**
   * Specify the maximum value
   * @type {number}
   */
  export let max = undefined;

  /**
   * Specify the minimum value
   * @type {number}
   */
  export let min = undefined;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` for the input to be read-only */
  export let readonly = false;

  /**
   * Set to `true` to enable the mobile variant
   * @deprecated
   */
  export let mobile = false;

  /** Set to `true` to allow for an empty value */
  export let allowEmpty = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to hide the input stepper buttons */
  export let hideSteppers = false;

  /** Specify the ARIA label for the increment icons */
  export let iconDescription = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let label = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Override the default translation ids
   * @type {(id: NumberInputTranslationId) => string}
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /**
   * Default translation ids
   * @type {{ increment: "increment"; decrement: "decrement" }}
   */
  export const translationIds = {
    increment: "increment",
    decrement: "decrement",
  };

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Add16 from "../icons/Add16.svelte";
  import Subtract16 from "../icons/Subtract16.svelte";
  import WarningFilled16 from "../icons/WarningFilled16.svelte";
  import WarningAltFilled16 from "../icons/WarningAltFilled16.svelte";
  import EditOff16 from "../icons/EditOff16.svelte";

  const defaultTranslations = {
    [translationIds.increment]: "Increment number",
    [translationIds.decrement]: "Decrement number",
  };

  const dispatch = createEventDispatcher();

  function updateValue(direction) {
    const nextValue = (value += direction * step);

    if (nextValue < min) {
      value = min;
    } else if (nextValue > max) {
      value = max;
    } else {
      value = nextValue;
    }
  }

  let inputValue = value;

  const normalizeValue = (_value) => {
    if (_value === undefined || _value === "") return _value;
    return Number(_value);
  };

  $: dispatch("change", value);
  $: incrementLabel = translateWithId("increment");
  $: decrementLabel = translateWithId("decrement");
  $: value = normalizeValue(inputValue);
  $: error =
    invalid || (!allowEmpty && value === "") || value > max || value < min;
  $: errorId = `error-${id}`;
  $: ariaLabel =
    $$props["aria-label"] ||
    "Numeric input field with increment and decrement buttons";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    data-invalid="{error || undefined}"
    class:bx--number="{true}"
    class:bx--number--helpertext="{true}"
    class:bx--number--readonly="{readonly}"
    class:bx--number--light="{light}"
    class:bx--number--nolabel="{hideLabel}"
    class:bx--number--nosteppers="{hideSteppers}"
    class:bx--number--mobile="{mobile}"
    class="{size && `bx--number--${size}`}"
  >
    {#if mobile}
      {#if label}
        <label
          for="{id}"
          class:bx--label="{true}"
          class:bx--label--disabled="{disabled}"
          class:bx--visually-hidden="{hideLabel}"
        >
          <slot name="label">{label}</slot>
        </label>
      {/if}
      <div
        class:bx--number__input-wrapper="{true}"
        class:bx--number__input-wrapper--warning="{!invalid && warn}"
      >
        <button
          type="button"
          aria-live="polite"
          aria-atomic="true"
          title="{decrementLabel}"
          aria-label="{decrementLabel || iconDescription}"
          class:bx--number__control-btn="{true}"
          class:down-icon="{true}"
          on:click="{() => {
            updateValue(-1);
          }}"
          disabled="{disabled}"
        >
          <Subtract16 class="down-icon" />
        </button>
        <input
          bind:this="{ref}"
          type="number"
          pattern="[0-9]*"
          aria-label="{label ? undefined : ariaLabel}"
          disabled="{disabled}"
          id="{id}"
          name="{name}"
          max="{max}"
          min="{min}"
          step="{step}"
          value="{value}"
          readonly="{readonly}"
          {...$$restProps}
          on:input
          on:input="{({ target }) => {
            inputValue = target.value;
          }}"
          on:focus
          on:blur
        />
        <button
          type="button"
          aria-live="polite"
          aria-atomic="true"
          title="{incrementLabel}"
          aria-label="{incrementLabel || iconDescription}"
          class:bx--number__control-btn="{true}"
          class:up-icon="{true}"
          on:click="{() => {
            updateValue(1);
          }}"
          disabled="{disabled}"
        >
          <Add16 class="up-icon" />
        </button>
      </div>
    {:else}
      {#if label}
        <label
          for="{id}"
          class:bx--label="{true}"
          class:bx--label--disabled="{disabled}"
          class:bx--visually-hidden="{hideLabel}"
        >
          <slot name="label">{label}</slot>
        </label>
      {/if}
      <div
        class:bx--number__input-wrapper="{true}"
        class:bx--number__input-wrapper--warning="{!invalid && warn}"
      >
        <input
          bind:this="{ref}"
          type="number"
          pattern="[0-9]*"
          aria-describedby="{errorId}"
          data-invalid="{invalid || undefined}"
          aria-invalid="{invalid || undefined}"
          aria-label="{label ? undefined : ariaLabel}"
          disabled="{disabled}"
          id="{id}"
          name="{name}"
          max="{max}"
          min="{min}"
          step="{step}"
          value="{value}"
          readonly="{readonly}"
          {...$$restProps}
          on:input
          on:input="{({ target }) => {
            inputValue = target.value;
          }}"
          on:focus
          on:blur
        />
        {#if invalid}
          <WarningFilled16 class="bx--number__invalid" />
        {/if}
        {#if !invalid && warn}
          <WarningAltFilled16
            class="bx--number__invalid bx--number__invalid--warning"
          />
        {/if}
        {#if readonly}
          <EditOff16 class="bx--text-input__readonly-icon" />
        {/if}
        {#if !hideSteppers}
          <div class:bx--number__controls="{true}">
            <button
              type="button"
              tabindex="-1"
              title="{decrementLabel || iconDescription}"
              aria-label="{decrementLabel || iconDescription}"
              class:bx--number__control-btn="{true}"
              class:down-icon="{true}"
              on:click="{() => {
                updateValue(-1);
              }}"
              disabled="{disabled}"
            >
              <Subtract16 class="down-icon" />
            </button>
            <div class:bx--number__rule-divider="{true}"></div>
            <button
              type="button"
              tabindex="-1"
              title="{incrementLabel || iconDescription}"
              aria-label="{incrementLabel || iconDescription}"
              class:bx--number__control-btn="{true}"
              class:up-icon="{true}"
              on:click="{() => {
                updateValue(1);
              }}"
              disabled="{disabled}"
            >
              <Add16 class="up-icon" />
            </button>
            <div class:bx--number__rule-divider="{true}"></div>
          </div>
        {/if}
      </div>
    {/if}
    {#if !error && !warn && helperText}
      <div
        class:bx--form__helper-text="{true}"
        class:bx--form__helper-text--disabled="{disabled}"
      >
        {helperText}
      </div>
    {/if}
    {#if error}
      <div id="{errorId}" class:bx--form-requirement="{true}">
        {invalidText}
      </div>
    {/if}
    {#if !error && warn}
      <div id="{errorId}" class:bx--form-requirement="{true}">{warnText}</div>
    {/if}
  </div>
</div>
