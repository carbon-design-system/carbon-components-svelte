<script>
  /**
   * @typedef {"increment" | "decrement"} NumberInputTranslationId
   * @event {null | number} change
   * @event {null | number} input
   */

  /**
   * Set the size of the input
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   * Use `null` to denote "no value"
   * @type {null | number}
   */
  export let value = null;

  let previousValue = null;

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

  import { createEventDispatcher, tick } from "svelte";
  import Add from "carbon-components-svelte/src/icons/Add.svelte";
  import Subtract from "carbon-components-svelte/src/icons/Subtract.svelte";
  import WarningFilled from "carbon-components-svelte/src/icons/WarningFilled.svelte";
  import WarningAltFilled from "carbon-components-svelte/src/icons/WarningAltFilled.svelte";
  import EditOff from "carbon-components-svelte/src/icons/EditOff.svelte";

  const defaultTranslations = {
    [translationIds.increment]: "Increment number",
    [translationIds.decrement]: "Decrement number",
  };

  const dispatch = createEventDispatcher();

  function updateValue(isIncrementing) {
    if (isIncrementing) {
      ref.stepUp();
    } else {
      ref.stepDown();
    }

    previousValue = ref.value;
    value = +ref.value;

    dispatch("input", value);
    dispatch("change", value);
  }

  $: incrementLabel = translateWithId("increment");
  $: decrementLabel = translateWithId("decrement");
  $: error =
    (invalid && !readonly) ||
    (!allowEmpty && value == null) ||
    value > max ||
    (typeof value === "number" && value < min);
  $: errorId = `error-${id}`;
  $: ariaLabel =
    $$props["aria-label"] ||
    "Numeric input field with increment and decrement buttons";

  //$: value && !!changeCaretPosition;

  function parse(raw) {
    return raw != "" ? Number(raw) : null;
  }

  function updatePreviousValue() {
    previousValue = parse(value);
  }

  async function onInput({ target, inputType, data }) {
    const possibleNewValue = parse(target.value);
    value = parse(target.value);

    const isIntegerTransition =
      !data &&
      !Number.isInteger(previousValue) &&
      Number.isInteger(possibleNewValue);

    if (isIntegerTransition && value < previousValue) {
      await setSelectionAfterTick(target.value.length);
    } else if (isIntegerTransition && previousValue && value > previousValue) {
      let parts = previousValue.toString().split(".");

      if (inputType === "deleteContentForward" && parts[1]) {
        parts[1] = parts[1].substring(1);
      } else if (inputType === "deleteContentBackward") {
        parts[0] = parts[0].slice(0, -1);
      }

      const chars =
        parts[0].length + (inputType === "deleteContentBackward" ? 1 : 0);
      value = parse(parts.join("."));
      await setSelectionAfterTick(chars);
    } else if (
      !isIntegerTransition &&
      previousValue &&
      value === previousValue &&
      inputType === "deleteContentForward"
    ) {
      value = parse(0);
      await setSelectionAfterTick(0);
    } else {
      value = possibleNewValue;
    }

    dispatch("input", value);
  }

  function setSelection(position) {
    ref.focus();
    ref.type = "text";
    ref.setSelectionRange(position, position);
    ref.type = "number";
  }

  async function setSelectionAfterTick(position) {
    await tick();
    setSelection(position);
  }

  function onChange({ target }) {
    dispatch("change", parse(target.value));
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
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
    class:bx--number--sm="{size === 'sm'}"
    class:bx--number--xl="{size === 'xl'}"
  >
    {#if $$slots.label || label}
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
        data-invalid="{error || undefined}"
        aria-invalid="{error || undefined}"
        aria-label="{label ? undefined : ariaLabel}"
        disabled="{disabled}"
        id="{id}"
        name="{name}"
        max="{max}"
        min="{min}"
        step="{step}"
        on:input="{updatePreviousValue}"
        value="{value ?? ''}"
        readonly="{readonly}"
        {...$$restProps}
        on:change="{onChange}"
        on:input="{onInput}"
        on:keydown
        on:keyup
        on:focus
        on:blur
        on:paste
      />
      {#if readonly}
        <EditOff class="bx--text-input__readonly-icon" />
      {:else}
        {#if invalid}
          <WarningFilled class="bx--number__invalid" />
        {/if}
        {#if !invalid && warn}
          <WarningAltFilled
            class="bx--number__invalid bx--number__invalid--warning"
          />
        {/if}
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
              updateValue(false);
            }}"
            disabled="{disabled}"
          >
            <Subtract class="down-icon" />
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
              updateValue(true);
            }}"
            disabled="{disabled}"
          >
            <Add class="up-icon" />
          </button>
          <div class:bx--number__rule-divider="{true}"></div>
        </div>
      {/if}
    </div>
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
