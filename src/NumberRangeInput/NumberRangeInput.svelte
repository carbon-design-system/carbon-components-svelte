<script>
  /**
   * @typedef {"belowMin" | "aboveMax" | "step" | "crossedMin" | "crossedMax" | "requiredMin" | "requiredMax"} NumberRangeInputTranslationId
   * @typedef {number | null} NumberRangeInputEnd
   * @typedef {[NumberRangeInputEnd, NumberRangeInputEnd]} NumberRangeInputValue
   * @event {{ value: NumberRangeInputValue; valid: boolean }} input
   * @event {{ value: NumberRangeInputValue; valid: boolean }} change
   * @slot {{}} labelChildren
   * @restProps {div}
   */

  /**
   * Specify the range as `[minimum, maximum]`.
   * `null` is an open end: no minimum or no maximum.
   * The value follows what is typed, valid or not. Check `valid` before
   * using it.
   * @type {NumberRangeInputValue}
   * @bindable writable
   */
  export let value = [null, null];

  /**
   * Specify the lowest value either end may take.
   * With `slider`, it is also the slider's start.
   * @type {number | undefined}
   */
  export let min = undefined;

  /**
   * Specify the highest value either end may take.
   * With `slider`, it is also the slider's end.
   * @type {number | undefined}
   */
  export let max = undefined;

  /**
   * Specify the step increment.
   * A typed value must sit on a step counted from `min`, or from 0 without one.
   */
  export let step = 1;

  /**
   * Set to `false` to require both ends.
   * An empty end is then an error, shown when the person leaves it.
   */
  export let allowOpen = true;

  /**
   * Whether the range is valid: each end is within `min` and `max`, on a
   * step, and set where `allowOpen` is `false`, and the minimum is not above
   * the maximum. Ignores the `invalid` prop.
   * @bindable readonly
   */
  export let valid = true;

  /**
   * Specify a BCP 47 locale for number formatting and entry, such as
   * `"de-DE"` for `1.234,5`.
   * Pasted ranges and the messages read and write numbers the same way.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify Intl.NumberFormat options when `locale` is set. A currency or
   * unit style adds the symbol to both fields, the slider and the messages.
   * @type {Intl.NumberFormatOptions | undefined}
   * @example
   * ```svelte
   * <NumberRangeInput locale="en-US" formatOptions={{ style: "currency", currency: "USD" }} />
   * <NumberRangeInput locale="en-US" formatOptions={{ style: "unit", unit: "gigabyte" }} />
   * ```
   */
  export let formatOptions = undefined;

  /**
   * Set to `true` to show a dual-handle slider below the fields, kept in
   * sync with them. Needs `min` and `max`. An open end rests at its bound.
   */
  export let slider = false;

  /**
   * Specify the separator between the fields, such as `"to"` or `"—"`.
   * It is decoration and hidden from assistive technology; the fields carry
   * their own labels.
   */
  export let separator = "–";

  /** Specify the accessible and visible label of the minimum field */
  export let minLabelText = "Minimum";

  /** Specify the accessible and visible label of the maximum field */
  export let maxLabelText = "Maximum";

  /**
   * Set to `true` to visually hide the labels of the two fields.
   * They stay available to screen readers.
   */
  export let hideInputLabels = false;

  /**
   * Specify the placeholder of the minimum field.
   * Defaults to `min` when set, so an open end reads as the lowest value.
   * @type {string | undefined}
   */
  export let minPlaceholder = undefined;

  /**
   * Specify the placeholder of the maximum field.
   * Defaults to `max` when set.
   * @type {string | undefined}
   */
  export let maxPlaceholder = undefined;

  /**
   * Set to `true` to show the stepper buttons in both fields.
   * Hidden by default: a range is typed or slid, and the steppers take
   * the room the numbers need.
   */
  export let hideSteppers = true;

  /**
   * Set the size of the fields.
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default, which overrides a
   * `Form` size) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /** Set to `true` to disable the fields and the slider */
  export let disabled = false;

  /** Set to `true` for the fields and the slider to be read-only */
  export let readonly = false;

  /**
   * Set to `true` to indicate an invalid state on the whole range, for a
   * problem the component cannot see, such as no results in this range.
   * Both fields are marked. Problems with one end show on that field.
   */
  export let invalid = false;

  /** Specify the invalid state text, shown below both fields */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state on the whole range */
  export let warn = false;

  /** Specify the warning state text, shown below both fields */
  export let warnText = "";

  /** Specify the helper text, shown below both fields */
  export let helperText = "";

  /** Specify the legend text that names the range, such as "Price" */
  export let labelText = "";

  /**
   * Set to `true` to visually hide the legend.
   * It stays available to screen readers.
   */
  export let hideLabel = false;

  /**
   * Override the messages shown on a field.
   * `values.limit` is the bound, step or other end, formatted for the
   * `locale`.
   * @type {(id: NumberRangeInputTranslationId, values: { limit: string }) => string}
   */
  export let translateWithId = function translateWithId(id, { limit }) {
    return defaultTranslations[id](limit);
  };

  /**
   * Default translation ids.
   * @type {{ belowMin: "belowMin"; aboveMax: "aboveMax"; step: "step"; crossedMin: "crossedMin"; crossedMax: "crossedMax"; requiredMin: "requiredMin"; requiredMax: "requiredMax" }}
   */
  export const translationIds = {
    belowMin: "belowMin",
    aboveMax: "aboveMax",
    step: "step",
    crossedMin: "crossedMin",
    crossedMax: "crossedMax",
    requiredMin: "requiredMin",
    requiredMax: "requiredMax",
  };

  /**
   * Specify a name attribute for the minimum field.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify a name attribute for the maximum field.
   * @type {string | undefined}
   */
  export let nameUpper = undefined;

  /**
   * Specify the id of the form the fields belong to.
   * @type {string | undefined}
   */
  export let form = undefined;

  /** Set an id for the range. The fields and messages derive theirs from it. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the outer element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import NumberInput from "../NumberInput/NumberInput.svelte";
  import RangeSlider from "../Slider/RangeSlider.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { getNumberFormatter } from "../utils/intl-formatter-cache.js";
  import {
    fromSliderValues,
    normalizeRange,
    parseRangeText,
    rangesEqual,
    toSliderValues,
    validateRange,
  } from "../utils/number-range.js";
  import {
    getAffixes,
    parse,
    parseLocaleValue,
  } from "../utils/numeric-format.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";

  const defaultTranslations = {
    belowMin: (/** @type {string} */ limit) => `Enter ${limit} or more.`,
    aboveMax: (/** @type {string} */ limit) => `Enter ${limit} or less.`,
    step: (/** @type {string} */ limit) => `Use whole steps, such as ${limit}.`,
    crossedMin: (/** @type {string} */ limit) =>
      `Must not be above the maximum, ${limit}.`,
    crossedMax: (/** @type {string} */ limit) =>
      `Must not be below the minimum, ${limit}.`,
    requiredMin: () => "Enter a minimum.",
    requiredMax: () => "Enter a maximum.",
  };

  // The group, not the field, decides what is invalid: a field would judge
  // its text against `min` and `max` while it is typed.
  const returnTrue = () => true;

  const dispatch = createEventDispatcher();
  const formContext = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;

  $: [lo, hi] = normalizeRange(value);
  $: isFluid = fluid || !!formContext?.isFluid;
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);

  // The range as last known, to tell a write of ours from the parent's.
  let known = normalizeRange(value);
  let knownRules = "";
  // The end edited last takes a crossed pair's error.
  /** @type {"min" | "max"} */
  let blame = "max";
  // The issues on screen. A field is judged when it is left, not while it is
  // typed in: new issues wait for `change`, fixes clear at once.
  /** @type {{ min: import("../utils/number-range.js").RangeIssue | null; max: import("../utils/number-range.js").RangeIssue | null }} */
  let shown = { min: null, max: null };

  $: rules = { min, max, step, allowOpen };
  $: result = validateRange({ value: [lo, hi], blame, ...rules });
  $: valid = result.valid;
  $: syncExternal([lo, hi], `${min}|${max}|${step}|${allowOpen}`);

  /**
   * A value or rule from outside: show what is wrong with it now, bar an
   * empty end the person has not been to.
   * @param {import("../utils/number-range.js").RangeValue} next
   * @param {string} key
   */
  function syncExternal(next, key) {
    if (rangesEqual(next, known) && key === knownRules) return;
    known = next;
    knownRules = key;
    const fresh = validateRange({
      value: next,
      ...rules,
      blame: "max",
      skipRequired: true,
    });
    shown = { min: fresh.min, max: fresh.max };
  }

  /**
   * @param {"min" | "max"} side
   * @param {number | null} end
   * @param {boolean} committed - The field was left or the value settled.
   */
  function setEnd(side, end, committed) {
    const next = /** @type {import("../utils/number-range.js").RangeValue} */ (
      side === "min" ? [end, known[1]] : [known[0], end]
    );
    blame = side;
    const changed = !rangesEqual(next, known);
    known = next;
    if (changed) value = next;
    const fresh = validateRange({ value: next, ...rules, blame: side });
    const other = side === "min" ? "max" : "min";
    const nextShown = { min: shown.min, max: shown.max };
    // The field itself is judged at once when it was left; while it is typed
    // in, a fix clears its message and a new problem waits.
    nextShown[side] = committed
      ? fresh[side]
      : fresh[side]
        ? shown[side]
        : null;
    // The other end keeps an empty-end error it already shows, and otherwise
    // follows the pair: a crossed pair can clear on it.
    nextShown[other] = committed
      ? fresh[other]?.code === "required"
        ? shown[other]
        : fresh[other]
      : fresh[other]
        ? shown[other]
        : null;
    shown = nextShown;
    announce(committed ? "change" : "input", fresh.valid);
  }

  /**
   * @param {"input" | "change"} type
   * @param {boolean} isValid
   */
  function announce(type, isValid) {
    dispatch(type, { value: known, valid: isValid });
  }

  // Slider handles, and what the slider was last given.
  $: sliderOn =
    slider &&
    min !== undefined &&
    max !== undefined &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    max > min;
  $: handles = sliderOn
    ? toSliderValues(
        [lo, hi],
        /** @type {number} */ (min),
        /** @type {number} */ (max),
      )
    : [0, 0];

  /**
   * @param {"input" | "change"} type
   * @param {CustomEvent<{ value: number; valueUpper: number }>} event
   */
  function handleSlider(type, event) {
    const next = fromSliderValues(
      known,
      /** @type {[number, number]} */ (handles),
      [event.detail.value, event.detail.valueUpper],
    );
    if (rangesEqual(next, known)) return;
    known = next;
    value = next;
    const fresh = validateRange({ value: next, ...rules, blame });
    // The slider cannot cross its handles or leave the bounds, so a move
    // only fixes what was wrong: show the pair as it now stands.
    shown = { min: fresh.min, max: fresh.max };
    announce(type, fresh.valid);
  }

  /**
   * @param {"min" | "max"} side
   * @param {CustomEvent<{ event: FocusEvent; value: number | null }>} event
   */
  function handleBlur(side, event) {
    // A field left empty never fires `change`, so name the empty end here.
    if (!allowOpen && event.detail.value === null) {
      const fresh = validateRange({ value: known, ...rules, blame });
      shown = { ...shown, [side]: fresh[side] };
    }
  }

  // Parse the field's own number format, for pasted ranges.
  $: formatter = locale ? getNumberFormatter(locale, formatOptions) : null;
  $: style = formatOptions?.style;
  $: affixes =
    formatter && style && style !== "decimal" ? getAffixes(formatter) : [];
  $: marks = locale
    ? getNumberFormatter(
        locale,
        style && style !== "decimal"
          ? {
              style,
              currency: formatOptions?.currency,
              unit: formatOptions?.unit,
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }
          : undefined,
      ).formatToParts(12345.6)
    : null;
  $: groupMark = marks?.find((part) => part.type === "group")?.value ?? "";
  $: decimalMark = marks?.find((part) => part.type === "decimal")?.value ?? ".";

  /** @param {string} text */
  function parseNumber(text) {
    return locale
      ? parseLocaleValue(text, groupMark, decimalMark, style, affixes)
      : parse(text, true);
  }

  /** @param {number} n */
  function format(n) {
    return formatter ? formatter.format(n) : String(n);
  }

  /** @param {ClipboardEvent} event */
  function handlePaste(event) {
    if (readonly || effectiveDisabled) return;
    const text = event.clipboardData?.getData("text");
    const pasted = text ? parseRangeText(text, parseNumber) : null;
    if (!pasted) return;
    event.preventDefault();
    const target = event.target instanceof Element ? event.target : null;
    const side = target?.closest("[data-side]")?.getAttribute("data-side");
    blame = side === "min" ? "min" : "max";
    known = pasted;
    value = pasted;
    const fresh = validateRange({ value: pasted, ...rules, blame });
    shown = { min: fresh.min, max: fresh.max };
    announce("input", fresh.valid);
    announce("change", fresh.valid);
  }

  /**
   * @param {"min" | "max"} side
   * @param {import("../utils/number-range.js").RangeIssue | null} issue
   */
  function messageFor(side, issue) {
    if (!issue) return "";
    const code =
      issue.code === "crossed"
        ? side === "min"
          ? "crossedMin"
          : "crossedMax"
        : issue.code === "required"
          ? side === "min"
            ? "requiredMin"
            : "requiredMax"
          : issue.code;
    return translateWithId(code, {
      limit: issue.limit === undefined ? "" : format(issue.limit),
    });
  }

  $: ({ showInvalid: showGroupInvalid, showWarn: showGroupWarn } =
    resolveValidationVisibility({
      invalid,
      warn,
      disabled: effectiveDisabled,
      readonly,
    }));
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: describedBy = resolveStatusDescribedBy({
    showInvalid: showGroupInvalid,
    showWarn: showGroupWarn,
    invalidText,
    warnText,
    helperText,
    isFluid,
    errorId,
    warnId,
    helperId,
  });

  // Naming and description belong on the fieldset, not the wrapper.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  $: legendId = `legend-${id}`;
  $: minId = `${id}-min`;
  $: maxId = `${id}-max`;
  $: minText = messageFor("min", shown.min);
  $: maxText = messageFor("max", shown.max);
  // "Minimum" alone names a field in the group; "Minimum Price" names it
  // wherever the controls are listed apart from the legend.
  $: minName = [minLabelText, labelText].filter(Boolean).join(" ");
  $: maxName = [maxLabelText, labelText].filter(Boolean).join(" ");

  // A field points at its own message, else at the range's. Always passed,
  // never dropped: Svelte 3 and 4 turn a spread key that goes away into
  // `undefined`, which would blank the field's own pointer.
  $: groupErrorId = showGroupInvalid && invalidText ? errorId : undefined;
  $: minErrorId = minText ? buildFieldIds(minId).errorId : groupErrorId;
  $: maxErrorId = maxText ? buildFieldIds(maxId).errorId : groupErrorId;
  $: minInvalid = showGroupInvalid || !!minText;
  $: maxInvalid = showGroupInvalid || !!maxText;
</script>

<div
  use:fieldsetDisabled={(isDisabled) => (inDisabledFieldset = isDisabled)}
  bind:this={ref}
  class:bx--form-item={true}
  class:bx--number-range-input={true}
  class:bx--number-range-input--fluid={isFluid}
  class:bx--number-range-input--readonly={readonly}
  class:bx--number-range-input--xs={effectiveSize === "xs"}
  class:bx--number-range-input--sm={effectiveSize === "sm"}
  class:bx--number-range-input--xl={effectiveSize === "xl"}
  class:bx--number-range-input--labelled={!hideInputLabels && !isFluid}
  {...wrapperProps}
>
  <fieldset
    class:bx--number-range-input__fieldset={true}
    disabled={effectiveDisabled}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={joinDescribedBy(describedBy, ariaDescribedBy)}
  >
    {#if labelText || $$slots.labelChildren}
      <legend
        id={legendId}
        class:bx--label={true}
        class:bx--number-range-input__legend={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={effectiveDisabled}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
      >
        <slot name="labelChildren">{labelText}</slot>
      </legend>
    {/if}
    <div
      class:bx--number-range-input__fields={true}
      data-invalid={showGroupInvalid || undefined}
      on:paste={handlePaste}
    >
      <div class:bx--number-range-input__row={true}>
        <div class:bx--number-range-input__field={true} data-side="min">
          <NumberInput
            id={minId}
            value={lo}
            {min}
            {max}
            {step}
            {name}
            {form}
            {locale}
            {formatOptions}
            {readonly}
            {size}
            fluid={isFluid}
            allowEmpty
            {hideSteppers}
            labelText={minLabelText}
            hideLabel={hideInputLabels && !isFluid}
            invalid={minInvalid}
            invalidText={minText}
            warn={showGroupWarn}
            validate={returnTrue}
            disabled={effectiveDisabled}
            placeholder={minPlaceholder ??
              (min === undefined ? undefined : format(min))}
            aria-label={minName}
            aria-errormessage={minErrorId}
            on:input={(event) => setEnd("min", event.detail, false)}
            on:change={(event) => setEnd("min", event.detail, true)}
            on:blur={(event) => handleBlur("min", event)}
          />
        </div>
        {#if !isFluid}
          <span
            class:bx--number-range-input__separator={true}
            aria-hidden="true">{separator}</span
          >
        {/if}
        <div class:bx--number-range-input__field={true} data-side="max">
          <NumberInput
            id={maxId}
            value={hi}
            {min}
            {max}
            {step}
            name={nameUpper}
            {form}
            {locale}
            {formatOptions}
            {readonly}
            {size}
            fluid={isFluid}
            allowEmpty
            {hideSteppers}
            labelText={maxLabelText}
            hideLabel={hideInputLabels && !isFluid}
            invalid={maxInvalid}
            invalidText={maxText}
            warn={showGroupWarn}
            validate={returnTrue}
            disabled={effectiveDisabled}
            placeholder={maxPlaceholder ??
              (max === undefined ? undefined : format(max))}
            aria-label={maxName}
            aria-errormessage={maxErrorId}
            on:input={(event) => setEnd("max", event.detail, false)}
            on:change={(event) => setEnd("max", event.detail, true)}
            on:blur={(event) => handleBlur("max", event)}
          />
        </div>
      </div>
      <!-- As on a field, invalid or warn replaces the helper text. -->
      {#if showGroupInvalid}
        {#if invalidText}
          <div
            id={errorId}
            class:bx--form-requirement={true}
            class:bx--form-requirement--invalid={true}
            role="alert"
          >
            {invalidText}
          </div>
        {/if}
      {:else if showGroupWarn}
        {#if warnText}
          <div
            id={warnId}
            class:bx--form-requirement={true}
            class:bx--form-requirement--warn={true}
          >
            {warnText}
          </div>
        {/if}
      {:else if helperText && !isFluid}
        <div
          id={helperId}
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={effectiveDisabled}
        >
          {helperText}
        </div>
      {/if}
    </div>
    {#if sliderOn}
      <div class:bx--number-range-input__slider={true}>
        <RangeSlider
          min={/** @type {number} */ (min)}
          max={/** @type {number} */ (max)}
          {step}
          value={handles[0]}
          valueUpper={handles[1]}
          labelText={labelText || minLabelText}
          hideLabel
          hideTextInput
          fullWidth
          {readonly}
          disabled={effectiveDisabled}
          size={effectiveSize === "xs" ? "xs" : undefined}
          formatValue={formatter ? format : undefined}
          ariaLabelInput={minLabelText}
          ariaLabelInputUpper={maxLabelText}
          on:input={(event) => handleSlider("input", event)}
          on:change={(event) => handleSlider("change", event)}
        />
      </div>
    {/if}
  </fieldset>
</div>
