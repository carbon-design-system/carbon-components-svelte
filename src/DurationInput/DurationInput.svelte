<script>
  /**
   * @event {{ value: number | null }} change
   * @slot {{}} labelChildren
   * @restProps {div}
   */

  /**
   * Specify the duration in milliseconds. `null` when the field is empty.
   * Follows the field when the owning form resets.
   * @type {number | null}
   * @bindable writable
   */
  export let value = null;

  /**
   * Specify how the duration is entered: `"segmented"` is a spinbutton for
   * each unit (`1 h 30 m 00 s`), and `"text"` is one field that reads
   * `1h 30m`, `90m`, `1.5h`, `1:30` and ISO 8601 `PT1H30M`.
   * @type {"segmented" | "text"}
   */
  export let variant = "segmented";

  /**
   * Specify the largest unit. It has no upper limit of its own, so `"hour"`
   * takes `100` hours; use `"day"` for longer spans.
   * @type {"day" | "hour" | "minute"}
   */
  export let largestUnit = "hour";

  /**
   * Specify the smallest unit. The segmented variant shows every unit from
   * `largestUnit` down to it, and the text variant counts a bare number in it.
   * @type {"hour" | "minute" | "second" | "millisecond"}
   */
  export let smallestUnit = "second";

  /**
   * Specify how many `smallestUnit`s the smallest segment moves by with
   * the arrow keys, and what typed values round to, such as `15` minutes.
   */
  export let step = 1;

  /** Specify the shortest duration, in milliseconds */
  export let min = 0;

  /**
   * Specify the longest duration, in milliseconds.
   * @type {number | undefined}
   */
  export let max = undefined;

  /**
   * Specify the BCP 47 locale of the unit labels and the spoken duration.
   * Defaults to `"en"` so a server and a browser render the same text.
   */
  export let locale = "en";

  /**
   * Specify how the visible unit labels are written: `h`, `hr`, or `hours`.
   * @type {"narrow" | "short" | "long"}
   */
  export let unitDisplay = "narrow";

  /**
   * Specify the size of the field.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

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

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Set to `true` to mark the field as read-only */
  export let readonly = false;

  /**
   * Specify a name attribute for native form participation.
   * A hidden input submits the duration in milliseconds, or an empty string.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate the
   * field and the hidden `name` input with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Specify the placeholder of the `"text"` variant.
   * @type {string | undefined}
   */
  export let placeholder = undefined;

  /**
   * Specify the message of the `"text"` variant for text that is not a
   * duration. It shows as an invalid state until the text changes.
   */
  export let parseErrorText = "Enter a duration, such as 1h 30m";

  /**
   * Override the duration in words that screen readers hear, such as
   * `"1 hour, 30 minutes"`. Defaults to `Intl.DurationFormat`.
   * @type {(total: number, units: ReadonlyArray<"day" | "hour" | "minute" | "second" | "millisecond">, locale: string) => string}
   */
  export let durationText = function durationText(total, units, locale) {
    return formatDuration(total, units, { locale });
  };

  /**
   * Override the accessible label of each segment. `label` is the unit in
   * the locale, such as `"hours"`.
   * @type {(unit: "day" | "hour" | "minute" | "second" | "millisecond", label: string) => string}
   */
  export let segmentLabelText = function segmentLabelText(unit, label) {
    return label;
  };

  /** Set an id for the field */
  export let id = uniqueId();

  /**
   * Obtain a reference to the outer element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    asciiDigits,
    clampDuration,
    formatCompactDuration,
    formatDuration,
    joinDuration,
    parseDuration,
    segmentDigits,
    segmentMax,
    snapDuration,
    splitDuration,
    stepDuration,
    typeDigit,
    unitLabel,
    unitRange,
  } from "../utils/duration.js";
  import {
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";

  /**
   * @typedef {import("../utils/duration.js").DurationUnit} DurationUnit
   * @typedef {Partial<Record<DurationUnit, number | null>>} Counts
   */

  const DIGIT = /^\d$/;
  const DIGITS_ONLY = /^\d+$/;
  /** Typed between segments, as in `1:30` or `1.30`. */
  const SEPARATOR = /^[:.,\s]$/;

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;

  const dispatch = createEventDispatcher();
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);

  /** @type {HTMLInputElement[]} */
  let inputs = [];
  /** @type {HTMLInputElement | null} */
  let textRef = null;
  /** What each segment holds; `null` is a segment the user cleared. */
  let counts = /** @type {Counts} */ ({});
  /** The digits typed into the focused segment that more digits could extend. */
  let typing = /** @type {{ unit: DurationUnit; buffer: string } | null} */ (
    null
  );
  let text = "";
  let parseFailed = false;
  let announcement = "";

  $: units = unitRange(largestUnit, smallestUnit);
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || parseFailed,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: shownInvalidText = invalid ? invalidText : parseErrorText;
  $: dir = localeDirection(locale);
  $: stepCount = Math.max(1, Math.floor(step) || 1);

  /** @type {Array<{ unit: DurationUnit; limit: number; digits: number; pad: number; label: string; name: string }>} */
  $: segments = units.map((unit) => {
    const limit = segmentMax(unit, units, max);
    const pad = unit === "millisecond" ? 3 : 2;
    return {
      unit,
      limit,
      digits: Math.max(pad, segmentDigits(limit)),
      pad,
      label: unitLabel(unit, locale, unitDisplay),
      name: segmentLabelText(unit, unitLabel(unit, locale, "long")),
    };
  });

  /**
   * @param {Counts} current
   * @param {readonly DurationUnit[]} list
   * @returns {number | null} `null` when every segment is empty
   */
  function totalOf(current, list) {
    if (list.every((unit) => current[unit] == null)) return null;
    return joinDuration(current);
  }

  /**
   * @param {number | null} total
   * @param {readonly DurationUnit[]} list
   * @returns {Counts}
   */
  function countsOf(total, list) {
    if (total == null) {
      return Object.fromEntries(list.map((unit) => [unit, null]));
    }
    return splitDuration(total, list);
  }

  // The two syncs write `counts` and `text` from inside a function, so
  // neither is an input of its own statement: typing into the field must not
  // re-run them, only a new `value` or unit range.

  /**
   * Segments follow `value` when it changes from outside, and keep their
   * own blanks and typing when it only echoes them back.
   * @param {number | null} next
   * @param {readonly DurationUnit[]} list
   */
  function syncCounts(next, list) {
    const own = list.every((unit) => unit in counts);
    if (own && totalOf(counts, list) === next) return;
    typing = null;
    counts = countsOf(next, list);
  }

  /**
   * @param {number | null} current
   * @param {readonly DurationUnit[]} list
   * @param {DurationUnit} bareUnit
   */
  function syncText(current, list, bareUnit) {
    if (parseDuration(text, bareUnit) === current) return;
    text = current == null ? "" : formatCompactDuration(current, list);
  }

  $: syncCounts(value, units);
  $: total = totalOf(counts, units);
  $: spoken = total == null ? undefined : durationText(total, units, locale);
  $: syncText(value, units, smallestUnit);

  /** @param {number | null} next */
  function setValue(next) {
    if (next === value) return;
    value = next;
    dispatch("change", { value });
  }

  /** @param {number | null} next the total the segments should show */
  function apply(next) {
    typing = null;
    counts = countsOf(next, units);
    setValue(next);
  }

  /**
   * Reads the segments into `value`. Typing stays under `max` but not over
   * `min`, since the first segment filled is far below it; `settle` holds
   * the minimum.
   * @param {number} [lower]
   */
  function commit(lower = 0) {
    const next = totalOf(counts, units);
    const clamped = next == null ? null : clampDuration(next, lower, max);
    if (clamped !== next) {
      apply(clamped);
      return;
    }
    setValue(next);
  }

  /** @param {number} index */
  function focusSegment(index) {
    inputs[index]?.focus();
  }

  /**
   * @param {DurationUnit} unit
   * @param {number | null} count
   */
  function setCount(unit, count) {
    counts = { ...counts, [unit]: count };
  }

  /**
   * @param {number} index
   * @param {string} digit
   */
  function typeInto(index, digit) {
    const { unit, limit, digits } = segments[index];
    const before = typing?.unit === unit ? typing.buffer : "";
    const result = typeDigit(before, digit, limit, digits);
    setCount(unit, result.count);
    typing = result.done ? null : { unit, buffer: result.buffer };
    commit();
    if (result.done) focusSegment(index + 1);
  }

  /** @param {number} index */
  function clearSegment(index) {
    const { unit } = segments[index];
    const buffer = typing?.unit === unit ? typing.buffer.slice(0, -1) : "";
    if (buffer) {
      typing = { unit, buffer };
      setCount(unit, Number(buffer));
    } else {
      typing = null;
      setCount(unit, null);
    }
    commit();
  }

  /**
   * @param {number} index
   * @param {1 | -1} direction
   * @param {number} [count]
   */
  function stepSegment(index, direction, count = 1) {
    apply(
      stepDuration(total, segments[index].unit, direction, {
        smallest: smallestUnit,
        step: stepCount,
        min,
        max,
        count,
      }),
    );
  }

  /**
   * @param {number} index
   * @param {"start" | "end"} edge
   */
  function jumpSegment(index, edge) {
    const { unit, limit } = segments[index];
    if (edge === "end" && !Number.isFinite(limit)) return;
    typing = null;
    setCount(unit, edge === "start" ? 0 : limit);
    commit();
  }

  /** Fills the cleared segments with zeros once focus leaves the field. */
  function settle() {
    typing = null;
    if (total == null) return;
    const settled = clampDuration(total, min, max);
    if (settled !== total) apply(settled);
    else if (units.some((unit) => counts[unit] == null)) {
      counts = countsOf(total, units);
    }
  }

  /**
   * @param {number} index
   * @param {FocusEvent & { currentTarget: HTMLInputElement }} event
   */
  function handleFocus(index, event) {
    if (typing && typing.unit !== segments[index].unit) typing = null;
    event.currentTarget.select();
  }

  /**
   * @param {number} index
   * @param {KeyboardEvent} event
   */
  function handleKeydown(index, event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const editable = !readonly && !effectiveDisabled;
    const digit = asciiDigits(event.key);
    /** @type {(() => void) | undefined} */
    let action;
    switch (event.key) {
      case "ArrowUp":
        if (editable) action = () => stepSegment(index, 1);
        break;
      case "ArrowDown":
        if (editable) action = () => stepSegment(index, -1);
        break;
      case "PageUp":
        if (editable) action = () => stepSegment(index, 1, 10);
        break;
      case "PageDown":
        if (editable) action = () => stepSegment(index, -1, 10);
        break;
      case "Home":
        if (editable) action = () => jumpSegment(index, "start");
        break;
      case "End":
        if (editable) action = () => jumpSegment(index, "end");
        break;
      case "ArrowLeft":
        action = () => focusSegment(index - 1);
        break;
      case "ArrowRight":
        action = () => focusSegment(index + 1);
        break;
      case "Backspace":
      case "Delete":
        if (editable) action = () => clearSegment(index);
        break;
      default:
        if (DIGIT.test(digit)) {
          if (editable) action = () => typeInto(index, digit);
        } else if (SEPARATOR.test(event.key)) {
          action = () => {
            typing = null;
            focusSegment(index + 1);
          };
        }
    }
    if (!action) {
      // Anything else a segment could take is printable text it must not show.
      if (event.key.length === 1) event.preventDefault();
      return;
    }
    event.preventDefault();
    action();
  }

  /**
   * Text that arrives with no key event, from a soft keyboard or an IME,
   * goes through the same digit handling.
   * @param {number} index
   * @param {InputEvent} event
   */
  function handleBeforeinput(index, event) {
    if (event.inputType === "insertCompositionText") return;
    event.preventDefault();
    if (readonly || effectiveDisabled) return;
    if (event.inputType.startsWith("delete")) {
      clearSegment(index);
      return;
    }
    let at = index;
    for (const char of asciiDigits(event.data ?? "")) {
      if (DIGIT.test(char)) {
        typeInto(at, char);
        if (typing === null) at = Math.min(at + 1, segments.length - 1);
      }
    }
  }

  /**
   * A pasted duration fills every segment: `1:30:00`, `90m` or `PT1H30M`.
   * @param {ClipboardEvent} event
   */
  function handlePaste(event) {
    event.preventDefault();
    if (readonly || effectiveDisabled) return;
    const parsed = parseDuration(
      event.clipboardData?.getData("text") ?? "",
      smallestUnit,
    );
    if (parsed == null) return;
    apply(
      clampDuration(snapDuration(parsed, smallestUnit, stepCount), min, max),
    );
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    if (ref?.contains(/** @type {Node | null} */ (event.relatedTarget))) return;
    settle();
  }

  function handleFormReset() {
    if (variant === "text") {
      const parsed = parseDuration(textRef?.value ?? "", smallestUnit);
      text = textRef?.value ?? "";
      parseFailed = parsed === undefined;
      value = parsed === undefined ? null : parsed;
      return;
    }
    // The segments hold their form defaults again; read them back.
    const next = /** @type {Counts} */ ({});
    units.forEach((unit, index) => {
      const raw = inputs[index]?.value ?? "";
      next[unit] = DIGITS_ONLY.test(raw) ? Number(raw) : null;
    });
    typing = null;
    counts = next;
    value = totalOf(next, units);
  }

  function handleTextChange() {
    const parsed = parseDuration(text, smallestUnit);
    if (parsed === undefined) {
      parseFailed = true;
      return;
    }
    parseFailed = false;
    const next =
      parsed == null
        ? null
        : clampDuration(
            snapDuration(parsed, smallestUnit, stepCount),
            min,
            max,
          );
    text = next == null ? "" : formatCompactDuration(next, units);
    announcement = next == null ? "" : durationText(next, units, locale);
    setValue(next);
  }

  /** @param {KeyboardEvent} event */
  function handleTextKeydown(event) {
    if (event.key === "Enter" && !readonly) handleTextChange();
  }

  function handleTextInput() {
    parseFailed = false;
  }

  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: describedById = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    invalidText: shownInvalidText,
    warnText,
    helperText,
    errorId,
    warnId,
    helperId,
    includeErrorId: false,
  });
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: submitted = value == null ? "" : String(Math.round(value));
</script>

<div
  use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
  bind:this={ref}
  class:bx--form-item={true}
  class:bx--duration-input={true}
  class:bx--duration-input--text={variant === "text"}
  class:bx--duration-input--readonly={readonly}
  {...wrapperProps}
>
  {#if name}
    <input type="hidden" {name} {form} value={submitted} />
  {/if}
  {#if variant === "text"}
    {#if labelText || $$slots.labelChildren}
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={effectiveDisabled}
        class:bx--label--readonly={readonly}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    {/if}
    <div
      data-invalid={showInvalid || undefined}
      data-warn={showWarn || undefined}
      class:bx--text-input__field-wrapper={true}
      class:bx--text-input__field-wrapper--warning={showWarn}
    >
      {#if showInvalid}
        <WarningFilled class="bx--text-input__invalid-icon" />
      {:else if showWarn}
        <WarningAltFilled
          class="bx--text-input__invalid-icon bx--text-input__invalid-icon--warning"
        />
      {/if}
      <input
        bind:this={textRef}
        use:formReset={handleFormReset}
        bind:value={text}
        type="text"
        autocomplete="off"
        spellcheck="false"
        {id}
        {form}
        {required}
        placeholder={placeholder ?? "1h 30m"}
        disabled={effectiveDisabled}
        readonly={readonly || undefined}
        data-invalid={showInvalid || undefined}
        aria-invalid={showInvalid ? "true" : undefined}
        aria-errormessage={showInvalid && shownInvalidText
          ? errorId
          : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={joinDescribedBy(describedById, ariaDescribedBy)}
        class:bx--text-input={true}
        class:bx--text-input--invalid={showInvalid}
        class:bx--text-input--warning={showWarn}
        class:bx--text-input--xs={effectiveSize === "xs"}
        class:bx--text-input--sm={effectiveSize === "sm"}
        class:bx--text-input--xl={effectiveSize === "xl"}
        on:input={handleTextInput}
        on:change={handleTextChange}
        on:keydown={handleTextKeydown}
      />
    </div>
    <span class:bx--visually-hidden={true} role="status">{announcement}</span>
  {:else}
    <fieldset
      use:formReset={handleFormReset}
      {form}
      class:bx--duration-input__fieldset={true}
      disabled={effectiveDisabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={joinDescribedBy(describedById, ariaDescribedBy)}
    >
      {#if labelText || $$slots.labelChildren}
        <legend
          id="legend-{id}"
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={effectiveDisabled}
        >
          <slot name="labelChildren">{labelText}</slot>
        </legend>
      {/if}
      <div
        data-invalid={showInvalid || undefined}
        data-warn={showWarn || undefined}
        class:bx--duration-input__fields={true}
        class:bx--duration-input__fields--invalid={showInvalid}
        class:bx--duration-input__fields--warning={showWarn}
      >
        <!-- Digits read from the largest unit down in every language. -->
        <div class:bx--duration-input__segments={true} dir="ltr">
          {#each segments as segment, index (segment.unit)}
            {@const shown =
              typing?.unit === segment.unit
                ? typing.buffer
                : counts[segment.unit] == null
                  ? ""
                  : String(counts[segment.unit]).padStart(segment.pad, "0")}
            <div class:bx--duration-input__segment-group={true}>
              <input
                bind:this={inputs[index]}
                use:preserveFocusSelection={true}
                type="text"
                role="spinbutton"
                inputmode="numeric"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                value={shown}
                placeholder="––"
                id={index === 0 ? id : `${id}-${segment.unit}`}
                disabled={effectiveDisabled}
                {readonly}
                {required}
                {form}
                style:--ccs-duration-digits={Math.max(
                  segment.digits,
                  shown.length,
                )}
                aria-label={segment.name}
                aria-valuemin={0}
                aria-valuemax={Number.isFinite(segment.limit)
                  ? segment.limit
                  : undefined}
                aria-valuenow={counts[segment.unit] ?? undefined}
                aria-valuetext={spoken}
                aria-readonly={readonly || undefined}
                aria-invalid={showInvalid ? "true" : undefined}
                aria-errormessage={showInvalid && shownInvalidText
                  ? errorId
                  : undefined}
                data-invalid={showInvalid || undefined}
                data-warn={showWarn || undefined}
                class:bx--text-input={true}
                class:bx--duration-input__segment={true}
                class:bx--text-input--invalid={showInvalid}
                class:bx--text-input--warning={showWarn}
                class:bx--text-input--xs={effectiveSize === "xs"}
                class:bx--text-input--sm={effectiveSize === "sm"}
                class:bx--text-input--xl={effectiveSize === "xl"}
                on:keydown={(event) => handleKeydown(index, event)}
                on:beforeinput={(event) => handleBeforeinput(index, event)}
                on:paste={handlePaste}
                on:focus={(event) => handleFocus(index, event)}
                on:focusout={handleFocusout}
              />
              <span
                class:bx--duration-input__unit={true}
                class:bx--duration-input__unit--disabled={effectiveDisabled}
                aria-hidden="true"
                {dir}>{segment.label}</span
              >
            </div>
          {/each}
        </div>
        {#if showInvalid}
          <WarningFilled class="bx--duration-input__icon" />
        {:else if showWarn}
          <WarningAltFilled
            class="bx--duration-input__icon bx--duration-input__icon--warning"
          />
        {/if}
      </div>
    </fieldset>
  {/if}
  {#if !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={effectiveDisabled}
    >
      {helperText}
    </div>
  {/if}
  {#if showInvalid && shownInvalidText}
    <div class:bx--form-requirement={true} id={errorId} role="alert">
      {shownInvalidText}
    </div>
  {/if}
  {#if showWarn && warnText}
    <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
  {/if}
</div>
