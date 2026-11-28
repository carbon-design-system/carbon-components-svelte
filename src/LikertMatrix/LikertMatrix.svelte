<script>
  /**
   * @restProps {div}
   * @template {string | number} [Value=string | number]
   * @event {{ id: string; value: Value }} change - Dispatched with the statement and the value chosen for it.
   * @slot {{}} legendChildren
   */

  /**
   * @typedef {object} LikertStatement
   * @property {string} id - Keys `value` and names the statement's radio group.
   * @property {string} text - The statement the scale rates.
   * @property {string} [name] - The name attribute for the statement's radios, for form submission. Defaults to `name` and `id`.
   * @property {boolean} [invalid] - Whether the statement still needs an answer. Marks its group.
   */

  /**
   * @typedef {object} LikertMatrixPoint
   * @property {string | number} value - The value stored for the statement and submitted with a form.
   * @property {string} [text] - Text shown when there is no `label`. Defaults to `value`.
   * @property {string} [label] - The column heading and the name of the option.
   */

  /**
   * Specify the statements to rate, one row each.
   * @type {ReadonlyArray<LikertStatement>}
   */
  export let statements = [];

  /**
   * Set the answers, keyed by statement `id`. A statement with no answer
   * has no key.
   * @type {Record<string, Value>}
   * @bindable writable
   */
  export let value = {};

  /**
   * Specify the scale: `"likert"` for agreement, `"csat"` for satisfaction,
   * or `"nps"` for 0 to 10. Ignored when `points` is set.
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
   * @type {ReadonlyArray<string> | undefined}
   */
  export let labels = undefined;

  /**
   * Specify your own points, lowest first. Overrides `preset`.
   * @type {ReadonlyArray<LikertMatrixPoint> | undefined}
   */
  export let points = undefined;

  /**
   * Specify the question the statements answer, as the legend.
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

  /** Set to `true` to disable the matrix */
  export let disabled = false;

  /** Set to `true` to show the answers without letting them change */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /**
   * Set to `true` to require an answer to every statement.
   * @type {boolean | undefined}
   */
  export let required = undefined;

  /**
   * Specify a prefix for the radio names, joined to each statement `id`
   * with a hyphen. Defaults to the matrix `id`, so two matrices never share
   * a group.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate
   * the radio inputs with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Override the default translation ids of the preset labels. Unset, it
   * uses `setTranslateContext`, then English.
   * @type {(id: import("../utils/survey-scale-points.js").ScaleTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return translate?.(id) ?? defaultTranslations[id];
  };

  /**
   * Default translation ids.
   * @type {{ stronglyDisagree: "stronglyDisagree"; disagree: "disagree"; somewhatDisagree: "somewhatDisagree"; neitherAgreeNorDisagree: "neitherAgreeNorDisagree"; somewhatAgree: "somewhatAgree"; agree: "agree"; stronglyAgree: "stronglyAgree"; veryDissatisfied: "veryDissatisfied"; dissatisfied: "dissatisfied"; neutral: "neutral"; satisfied: "satisfied"; verySatisfied: "verySatisfied"; notAtAllLikely: "notAtAllLikely"; extremelyLikely: "extremelyLikely" }}
   */
  export const translationIds = {
    stronglyDisagree: "stronglyDisagree",
    disagree: "disagree",
    somewhatDisagree: "somewhatDisagree",
    neitherAgreeNorDisagree: "neitherAgreeNorDisagree",
    somewhatAgree: "somewhatAgree",
    agree: "agree",
    stronglyAgree: "stronglyAgree",
    veryDissatisfied: "veryDissatisfied",
    dissatisfied: "dissatisfied",
    neutral: "neutral",
    satisfied: "satisfied",
    verySatisfied: "verySatisfied",
    notAtAllLikely: "notAtAllLikely",
    extremelyLikely: "extremelyLikely",
  };

  /** Set an id for the legend, statements and messages */
  export let id = useId("likert-matrix");

  import { createEventDispatcher } from "svelte";
  import BuiltinWarningAltFilled from "../icons/WarningAltFilled.svelte";
  import BuiltinWarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import { getIconContext } from "../utils/icon-context.js";
  import { useId } from "../utils/id-scope.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { moveRadioInRtl } from "../utils/rtl-radio-keys.js";
  import {
    findPoint,
    pointText,
    resolvePoints,
  } from "../utils/survey-scale-points.js";
  import { getTranslateContext } from "../utils/translate-context.js";

  const {
    WarningAltFilled = BuiltinWarningAltFilled,
    WarningFilled = BuiltinWarningFilled,
  } = getIconContext();

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const translate = getTranslateContext();

  const defaultTranslations = {
    [translationIds.stronglyDisagree]: "Strongly disagree",
    [translationIds.disagree]: "Disagree",
    [translationIds.somewhatDisagree]: "Somewhat disagree",
    [translationIds.neitherAgreeNorDisagree]: "Neither agree nor disagree",
    [translationIds.somewhatAgree]: "Somewhat agree",
    [translationIds.agree]: "Agree",
    [translationIds.stronglyAgree]: "Strongly agree",
    [translationIds.veryDissatisfied]: "Very dissatisfied",
    [translationIds.dissatisfied]: "Dissatisfied",
    [translationIds.neutral]: "Neutral",
    [translationIds.satisfied]: "Satisfied",
    [translationIds.verySatisfied]: "Very satisfied",
    [translationIds.notAtAllLikely]: "Not at all likely",
    [translationIds.extremelyLikely]: "Extremely likely",
  };

  /** @type {null | HTMLFieldSetElement} */
  let fieldsetRef = null;

  $: scalePoints = resolvePoints({
    preset,
    levels,
    labels,
    points,
    translate: translateWithId,
  });
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: ({ helperId, errorId, warnId, readonlyId } = buildFieldIds(id));
  $: legendId = `legend-${id}`;
  $: hasLegend = !!(legendText || $$slots.legendChildren);
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
  $: prefix = name ?? id;

  /**
   * @param {import("../utils/survey-scale-points.js").ScalePoint} point
   * @returns {string}
   */
  function heading(point) {
    return point.label || pointText(point);
  }

  /**
   * @param {LikertStatement} statement
   * @param {string} fallback
   * @returns {string}
   */
  function radioName(statement, fallback) {
    return statement.name ?? `${fallback}-${statement.id}`;
  }

  /**
   * @param {LikertStatement} statement
   * @param {import("../utils/survey-scale-points.js").ScalePoint} point
   */
  function select(statement, point) {
    if (readonly) return;
    const next = /** @type {Value} */ (point.value);
    if (value[statement.id] === next) return;
    value = { ...value, [statement.id]: next };
    dispatch("change", { id: statement.id, value: next });
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (readonly) event.preventDefault();
  }

  /**
   * On a statement's group, which holds that statement's radios.
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const direction = resolveLayoutDirection($layoutDirection, fieldsetRef);
    moveRadioInRtl(event, direction === "rtl");
  }

  function handleFormReset() {
    if (readonly || !fieldsetRef) return;
    /** @type {Record<string, Value>} */
    const next = {};
    for (const statement of statements) {
      const radios = /** @type {NodeListOf<HTMLInputElement>} */ (
        fieldsetRef.querySelectorAll("input:checked")
      );
      for (const radio of radios) {
        if (radio.name !== radioName(statement, prefix)) continue;
        const point = findPoint(scalePoints, radio.value);
        if (point) next[statement.id] = /** @type {Value} */ (point.value);
      }
    }
    value = next;
  }
</script>

<div
  class:bx--form-item={true}
  class:bx--likert-matrix={true}
  class:bx--likert-matrix--invalid={showInvalid}
  class:bx--likert-matrix--warning={showWarn}
  class:bx--likert-matrix--disabled={effectiveDisabled}
  class:bx--likert-matrix--readonly={readonly}
  {...rest}
>
  <!-- An unnamed matrix is a plain group, and ARIA 1.2 supports neither
       `aria-invalid` nor `aria-readonly` on it. Browsers still expose both,
       and the form field contract reads them there. -->
  <!-- svelte-ignore a11y-role-supports-aria-props-implicit -->
  <fieldset
    use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
    bind:this={fieldsetRef}
    use:formReset={handleFormReset}
    {form}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={joinDescribedBy(
      describedBy,
      readonly ? readonlyId : null,
      ariaDescribedBy,
    )}
    aria-readonly={readonly || undefined}
    aria-invalid={showInvalid || undefined}
    data-invalid={showInvalid || undefined}
    class:bx--likert-matrix__fieldset={true}
    disabled={effectiveDisabled}
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
    <!-- Each statement is a radio group named by its legend, in every
         layout. The headings only draw the columns: each radio carries its
         point's name, shown under each option in a narrow container. -->
    <div
      class="bx--likert-matrix__body bx--likert-matrix--points-{scalePoints.length}"
      style:--ccs-likert-matrix-points={scalePoints.length}
    >
      <div class:bx--likert-matrix__headings={true} aria-hidden="true">
        <span class:bx--likert-matrix__corner={true}></span>
        {#each scalePoints as point (point.value)}
          <span class:bx--likert-matrix__heading={true}>{heading(point)}</span>
        {/each}
      </div>
      {#each statements as statement (statement.id)}
        {@const selectedKey =
          value[statement.id] === undefined
            ? undefined
            : String(value[statement.id])}
        {@const groupName = radioName(statement, prefix)}
        {@const rowInvalid =
          !!statement.invalid && !effectiveDisabled && !readonly}
        <fieldset
          role="radiogroup"
          aria-invalid={rowInvalid || undefined}
          class:bx--likert-matrix__row={true}
          class:bx--likert-matrix__row--invalid={rowInvalid}
          on:keydown={handleKeydown}
        >
          <!-- A legend can't be a grid item in WebKit, so the group takes
               its name from a hidden one and the column shows a copy. -->
          <legend class:bx--visually-hidden={true}>{statement.text}</legend>
          <span aria-hidden="true" class:bx--likert-matrix__statement={true}
            >{statement.text}</span
          >
          {#each scalePoints as point (point.value)}
            <label class:bx--likert-matrix__option={true}>
              <input
                type="radio"
                class:bx--likert-matrix__input={true}
                name={groupName}
                value={point.value}
                checked={String(point.value) === selectedKey}
                {required}
                disabled={effectiveDisabled}
                {form}
                on:click={handleClick}
                on:change={() => select(statement, point)}
              />
              <span class:bx--likert-matrix__mark={true}></span>
              <span class:bx--likert-matrix__point={true}>{heading(point)}</span
              >
            </label>
          {/each}
        </fieldset>
      {/each}
    </div>
    {#if readonly}
      <span id={readonlyId} class:bx--visually-hidden={true}
        >{readonlyText}</span
      >
    {/if}
    {#if showInvalid}
      <div class:bx--likert-matrix__validation-msg={true}>
        <WarningFilled class="bx--likert-matrix__invalid-icon" />
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
      <div class:bx--likert-matrix__validation-msg={true}>
        <WarningAltFilled
          class="bx--likert-matrix__invalid-icon bx--likert-matrix__invalid-icon--warning"
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
