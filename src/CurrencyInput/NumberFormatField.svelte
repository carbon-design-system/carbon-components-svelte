<script>
  /**
   * @restProps {input}
   * The field behind `CurrencyInput` and `UnitInput`: a `TextInput` whose text
   * is formatted for a locale as it is typed. Not exported.
   */

  /**
   * The number: a decimal string (`"1234.5"`, `""` for none), or a number.
   * @type {string | number | null}
   */
  export let value = "";

  /**
   * `"string"` keeps the digits as entered; `"number"` gives a number or
   * `null`.
   * @type {"string" | "number"}
   */
  export let valueType = "string";

  /** @type {import("../utils/number-format.js").NumberFormatOptions} */
  export let formatOptions = {};

  /** @type {string | number | undefined} */
  export let min = undefined;

  /** @type {string | number | undefined} */
  export let max = undefined;

  /** @type {string | number | undefined} */
  export let step = undefined;

  /**
   * Set the size of the input.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` for the input to be read-only */
  export let readonly = false;

  /** @type {string | undefined} */
  export let name = undefined;

  /** @type {string} */
  export let id = uniqueId();

  /**
   * A short description for assistive technology, linked with
   * `aria-describedby`.
   * @type {string}
   */
  export let hint = "";

  /** @type {null | HTMLInputElement} */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { numberFormat } from "../utils/number-field.js";
  import {
    compareDecimal,
    createNumberFormat,
    isMultipleOf,
  } from "../utils/number-format.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  $: spec = createNumberFormat(formatOptions);
  $: hintId = `${id}-hint`;

  let text = "";
  /** @type {unknown} */
  let lastValue;
  /** @type {import("../utils/number-format.js").NumberFormat | undefined} */
  let lastSpec;

  /**
   * The bound value for what the field shows.
   * @param {unknown} t
   * @returns {string | number | null}
   */
  function numberOf(t) {
    const decimal = spec.toValue(spec.scan(String(t ?? "")).raw);
    if (valueType === "number") return decimal === "" ? null : Number(decimal);
    return decimal;
  }

  /**
   * The bound value changed, or the format did: write the text, unless the
   * text already stands for the value (the user is typing `1.`).
   * @param {import("../utils/number-format.js").NumberFormat} s
   * @param {unknown} v
   */
  function fromProps(s, v) {
    const specChanged = s !== lastSpec;
    if (!specChanged && v === lastValue) return;
    lastSpec = s;
    lastValue = v;
    const wanted = s.finalize(s.fromValue(v));
    const shown = s.toValue(s.scan(text).raw);
    if (!specChanged && wanted === shown) return;
    text = s.format(v);
  }

  /**
   * The text changed, by typing or by a form reset: report the number.
   * @param {string} t
   */
  function fromText(t) {
    const next = numberOf(t);
    if (next === value) return;
    lastValue = next;
    value = next;
  }

  $: fromProps(spec, value);
  $: fromText(text);

  /**
   * @param {string | number | undefined} bound
   * @returns {string}
   */
  const decimalOf = (bound) =>
    bound === undefined ? "" : spec.fromValue(bound);

  $: current = spec.fromValue(value);
  $: outOfRange =
    current !== "" &&
    ((min !== undefined && compareDecimal(current, decimalOf(min)) < 0) ||
      (max !== undefined && compareDecimal(current, decimalOf(max)) > 0) ||
      (step !== undefined &&
        Number(step) > 0 &&
        !isMultipleOf(current, decimalOf(step))));

  $: hidden = spec.toValue(spec.scan(text).raw);
</script>

<div use:numberFormat={formatOptions}>
  {#if $$slots.labelChildren}
    <TextInput
      {...$$restProps}
      {id}
      {disabled}
      {readonly}
      {size}
      invalid={invalid || outOfRange}
      inputmode={spec.allowNegative ? "text" : "decimal"}
      autocomplete="off"
      spellcheck="false"
      data-ccs-number-format={spec.direction}
      aria-describedby={joinDescribedBy(
        hint ? hintId : undefined,
        $$restProps["aria-describedby"],
      )}
      bind:value={text}
      bind:ref
      on:input={(e) => dispatch("input", numberOf(e.detail))}
      on:change={(e) => dispatch("change", numberOf(e.detail))}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave
      on:keydown
      on:keyup
      on:focus
      on:blur
      on:paste
    >
      <svelte:fragment slot="labelChildren">
        <slot name="labelChildren" />
      </svelte:fragment>
    </TextInput>
  {:else}
    <TextInput
      {...$$restProps}
      {id}
      {disabled}
      {readonly}
      {size}
      invalid={invalid || outOfRange}
      inputmode={spec.allowNegative ? "text" : "decimal"}
      autocomplete="off"
      spellcheck="false"
      data-ccs-number-format={spec.direction}
      aria-describedby={joinDescribedBy(
        hint ? hintId : undefined,
        $$restProps["aria-describedby"],
      )}
      bind:value={text}
      bind:ref
      on:input={(e) => dispatch("input", numberOf(e.detail))}
      on:change={(e) => dispatch("change", numberOf(e.detail))}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave
      on:keydown
      on:keyup
      on:focus
      on:blur
      on:paste
    />
  {/if}
  {#if name}
    <!-- The visible text is formatted for a locale (`1.234,56 €`); the form
      submits the number, like a native number input. -->
    <input
      type="hidden"
      {name}
      value={hidden}
      {disabled}
      form={$$restProps.form}
    />
  {/if}
  {#if hint}
    <span id={hintId} class:bx--visually-hidden={true}>{hint}</span>
  {/if}
</div>
