<script>
  /**
   * @restProps {div}
   * @template {string | number} [Value=string | number]
   * @event {Value | null} change - Dispatched with the chosen value, or `null` when `allowDeselect` clears it.
   * @slot {{}} legendChildren
   */

  /**
   * @typedef {object} SurveyScalePoint
   * @property {string | number} value - The value bound to `value` and submitted with a form.
   * @property {string} [text] - Text drawn in the option. Defaults to `value`.
   * @property {string} [label] - Names the option for screen readers. Drawn instead of `text` for `display="label"`.
   * @property {any} [icon] - Icon component drawn in the option for `display="icon"`.
   */

  /**
   * Set the chosen value. It is `undefined` until the question is answered,
   * so a `0` on an NPS scale is an answer.
   * @type {Value | undefined}
   * @bindable writable
   */
  export let value = undefined;

  /**
   * Specify the scale: `"nps"` for 0 to 10, `"csat"` for 1 to 5, or
   * `"likert"` for agreement. Ignored when `points` is set.
   * @type {"nps" | "csat" | "likert"}
   */
  export let preset = "likert";

  /**
   * Specify the number of Likert points. Only the `"likert"` preset reads it.
   * @type {5 | 7}
   */
  export let levels = 5;

  /**
   * Replace the preset's labels, lowest first, such as for another language.
   * Only the `"csat"` and `"likert"` presets read it. A missing entry keeps
   * the default.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let labels = undefined;

  /**
   * Specify your own points, lowest first. Overrides `preset`.
   * @type {ReadonlyArray<SurveyScalePoint> | undefined}
   */
  export let points = undefined;

  /**
   * Specify what each option draws: its `"number"`, its `"label"` or an
   * `"icon"`. Defaults to `"number"` for NPS, `"icon"` for CSAT and
   * `"label"` for Likert.
   * @type {"number" | "label" | "icon" | undefined}
   */
  export let display = undefined;

  /**
   * Specify the label for the lowest end, such as "Not at all likely".
   * NPS has a default. `"csat"` and `"likert"` borrow their first label
   * unless every option draws its label. Set `""` to hide it.
   * @type {string | undefined}
   */
  export let minLabel = undefined;

  /**
   * Specify the label for the highest end, such as "Extremely likely".
   * @type {string | undefined}
   */
  export let maxLabel = undefined;

  /**
   * Specify the sentence that tells screen readers what the ends mean. It
   * describes the group, so it is read once on entering it, and the first
   * and last options point at their own end label.
   * @type {(low: { value: string; label: string }, high: { value: string; label: string }) => string}
   */
  export let scaleText = defaultScaleText;

  /**
   * Specify the question, as the legend.
   * Alternatively, use the named slot "legendChildren".
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

  /** Set to `true` to disable the scale */
  export let disabled = false;

  /** Set to `true` to show the answer without letting it change */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /**
   * Set to `true` to require an answer.
   * @type {boolean | undefined}
   */
  export let required = undefined;

  /** Set to `true` so choosing the current answer clears it */
  export let allowDeselect = false;

  /**
   * Specify a name attribute for the radio inputs, for form submission.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate
   * the radio inputs with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /** Set an id for the question's legend and messages */
  export let id = uniqueId();

  /**
   * @param {{ value: string; label: string }} low
   * @param {{ value: string; label: string }} high
   */
  function defaultScaleText(low, high) {
    return `${low.value} is ${low.label}, ${high.value} is ${high.label}`;
  }

  import { createEventDispatcher } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { moveRadioInRtl } from "../utils/rtl-radio-keys.js";
  import {
    defaultDisplay,
    findPoint,
    pointName,
    pointText,
    resolveEnds,
    resolvePoints,
  } from "../utils/survey-scale-points.js";
  import { uniqueId } from "../utils/unique-id.js";
  import SurveyFace from "./SurveyFace.svelte";

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLFieldSetElement} */
  let fieldsetRef = null;

  $: scalePoints = resolvePoints({ preset, levels, labels, points });
  $: shown = display ?? defaultDisplay(preset);
  $: ends = resolveEnds({
    preset,
    display: shown,
    points: scalePoints,
    minLabel,
    maxLabel,
    custom: !!points?.length,
  });
  $: scaleDescription =
    ends.min && ends.max && scalePoints.length > 1
      ? scaleText(
          { value: pointText(scalePoints[0]), label: ends.min },
          {
            value: pointText(scalePoints[scalePoints.length - 1]),
            label: ends.max,
          },
        )
      : "";
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: ({ helperId, errorId, warnId, readonlyId } = buildFieldIds(id));
  $: legendId = `legend-${id}`;
  $: minId = `min-${id}`;
  $: maxId = `max-${id}`;
  $: scaleId = `scale-${id}`;
  $: hasLegend = !!(legendText || $$slots.legendChildren);
  // Naming and description go on the radio group, not the wrapper that
  // takes the rest props.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: describedBy = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    invalidText,
    warnText,
    helperText,
    errorId,
    warnId,
    helperId,
  });
  $: groupName = name ?? `survey-scale-${id}`;
  $: selectedKey = value === undefined ? undefined : String(value);

  /** @param {import("../utils/survey-scale-points.js").ScalePoint} point */
  function select(point) {
    if (readonly) return;
    const next = /** @type {Value} */ (point.value);
    if (next === value) return;
    value = next;
    dispatch("change", value);
  }

  /**
   * A radio fires no change when it is already checked.
   * @param {MouseEvent} event
   * @param {boolean} checked
   */
  function handleClick(event, checked) {
    if (readonly) {
      event.preventDefault();
      return;
    }
    if (allowDeselect && checked) {
      value = undefined;
      dispatch("change", null);
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    // Resolved when the key arrives: nothing reports a `dir` change.
    moveRadioInRtl(
      event,
      resolveLayoutDirection($layoutDirection, fieldsetRef) === "rtl",
    );
  }

  function handleFormReset() {
    if (readonly || !fieldsetRef) return;
    const checked = fieldsetRef.querySelector("input:checked");
    value =
      checked instanceof HTMLInputElement
        ? /** @type {Value | undefined} */ (
            findPoint(scalePoints, checked.value)?.value
          )
        : undefined;
  }

  /**
   * @param {number} index
   * @returns {string | undefined}
   */
  function endId(index) {
    if (index === 0 && ends.min) return minId;
    if (index === scalePoints.length - 1 && ends.max) return maxId;
    return undefined;
  }
</script>

<div
  class:bx--form-item={true}
  class:bx--survey-scale={true}
  class:bx--survey-scale--invalid={showInvalid}
  class:bx--survey-scale--warning={showWarn}
  class:bx--survey-scale--disabled={effectiveDisabled}
  class:bx--survey-scale--readonly={readonly}
  {...rest}
>
  <fieldset
    use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
    bind:this={fieldsetRef}
    use:formReset={handleFormReset}
    {form}
    role="radiogroup"
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={joinDescribedBy(
      describedBy,
      readonly ? readonlyId : null,
      scaleDescription ? scaleId : null,
      ariaDescribedBy,
    )}
    aria-readonly={readonly || undefined}
    aria-invalid={showInvalid || undefined}
    data-invalid={showInvalid || undefined}
    class:bx--survey-scale__fieldset={true}
    disabled={effectiveDisabled}
    on:keydown={handleKeydown}
  >
    {#if hasLegend}
      <legend
        id={legendId}
        class:bx--label={true}
        class:bx--label--disabled={effectiveDisabled}
        class:bx--visually-hidden={hideLegend}
      >
        <slot name="legendChildren">{legendText}</slot>
      </legend>
    {/if}
    <div
      class="bx--survey-scale__body bx--survey-scale__body--{shown} bx--survey-scale__body--points-{scalePoints.length}"
      class:bx--survey-scale__body--ends={!!(ends.min || ends.max)}
    >
      {#if ends.min}
        <span
          id={minId}
          class:bx--survey-scale__end={true}
          class:bx--survey-scale__end--min={true}>{ends.min}</span
        >
      {/if}
      <div class:bx--survey-scale__options={true}>
        {#each scalePoints as point, index (point.value)}
          {@const checked = String(point.value) === selectedKey}
          {@const text = pointName(point, shown)}
          <label class:bx--survey-scale__option={true}>
            <input
              type="radio"
              class:bx--survey-scale__input={true}
              name={groupName}
              value={point.value}
              {checked}
              {required}
              disabled={effectiveDisabled}
              {form}
              aria-describedby={endId(index)}
              on:click={(event) => handleClick(event, checked)}
              on:change={() => select(point)}
            />
            <span class:bx--survey-scale__content={true}>
              {#if shown === "icon"}
                {#if point.icon}
                  <svelte:component
                    this={point.icon}
                    size={24}
                    class="bx--survey-scale__icon"
                  />
                {:else if point.face}
                  <SurveyFace
                    level={point.face}
                    class="bx--survey-scale__face"
                  />
                {/if}
              {/if}
              {#if text.visible}
                <span class:bx--survey-scale__text={true}>{text.visible}</span>
              {/if}
              {#if text.hidden}
                <span class:bx--visually-hidden={true}>{text.hidden}</span>
              {/if}
              {#if checked}
                <Checkmark size={16} class="bx--survey-scale__check" />
              {/if}
            </span>
          </label>
        {/each}
      </div>
      {#if ends.max}
        <span
          id={maxId}
          class:bx--survey-scale__end={true}
          class:bx--survey-scale__end--max={true}>{ends.max}</span
        >
      {/if}
    </div>
    {#if scaleDescription}
      <span id={scaleId} hidden>{scaleDescription}</span>
    {/if}
    {#if readonly}
      <span id={readonlyId} class:bx--visually-hidden={true}
        >{readonlyText}</span
      >
    {/if}
    {#if showInvalid}
      <div class:bx--survey-scale__validation-msg={true}>
        <WarningFilled class="bx--survey-scale__invalid-icon" />
        {#if invalidText}
          <div
            id={errorId}
            role="alert"
            class:bx--form-requirement={true}
            class:bx--form-requirement--invalid={true}
          >
            {invalidText}
          </div>
        {/if}
      </div>
    {:else if showWarn}
      <div class:bx--survey-scale__validation-msg={true}>
        <WarningAltFilled
          class="bx--survey-scale__invalid-icon bx--survey-scale__invalid-icon--warning"
        />
        {#if warnText}
          <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
        {/if}
      </div>
    {/if}
  </fieldset>
  {#if helperText && !showInvalid && !showWarn}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={effectiveDisabled}
    >
      {helperText}
    </div>
  {/if}
</div>
