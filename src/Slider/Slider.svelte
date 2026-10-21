<script>
  /**
   * @restProps {div}
   * @event {number} change
   * @event {number} input
   */

  /**
   * Specify the value of the slider.
   * Kept when the owning form resets.
   * @bindable writable
   */
  export let value = 0;

  /**
   * Set the size of the number input.
   * Inherits `"xs"` from a parent `Form`.
   * @type {"xs"}
   */
  export let size = undefined;

  /** Set the maximum slider value */
  export let max = 100;

  /** Specify the label for the max value */
  export let maxLabel = "";

  /** Set the minimum slider value */
  export let min = 0;

  /** Specify the label for the min value */
  export let minLabel = "";

  /**
   * Format displayed values for range labels and `aria-valuetext`.
   * Does not change the numeric model; the text input stays numeric.
   * @type {undefined | ((value: number) => string)}
   */
  export let formatValue = undefined;

  /** Set the step value */
  export let step = 1;

  /**
   * Show tick marks along the track.
   * Set to `true` to place a tick at every `step`, or pass an array of
   * `{ value, label? }` for specific stops with optional labels below the track.
   * Marks are visual only unless `snapToMarks` is set; snapping otherwise follows `step`.
   * @type {boolean | ReadonlyArray<{ value: number; label?: string }>}
   */
  export let marks = false;

  /**
   * Set to `true` to snap drag, click, and arrow key navigation to the configured `marks`
   * instead of `step`. Has no effect when `marks` is not set.
   */
  export let snapToMarks = false;

  /** Set the step multiplier value */
  export let stepMultiplier = 4;

  /** Set to `true` to require a value */
  export let required = false;

  /** Specify the input type */
  export let inputType = "number";

  /** Set to `true` to disable the slider */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /** Set to `true` to hide the text input */
  export let hideTextInput = false;

  /**
   * Set to `true` to hide the min and max labels beside the track,
   * as when a readout elsewhere already shows the range.
   */
  export let hideRangeLabels = false;

  /**
   * Set to `true` for the slider to span
   * the full width of its containing element.
   */
  export let fullWidth = false;

  /**
   * Set to "vertical" to lay out the slider along the vertical axis
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /** Set an id for the slider div element */
  export let id = uniqueId();

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Specify the label text.
   * Alternatively, use the "labelChildren" slot.
   * @example
   * ```svelte
   * <Slider>
   *   <span slot="labelChildren">Custom Label</span>
   * </Slider>
   * ```
   */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set a name for the slider element */
  export let name = "";

  /**
   * Specify the id of a form element outside the component to associate
   * the value input with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to select the number input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { createEventDispatcher, getContext, tick } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { clamp, parse } from "../utils/numeric-format.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { reflectDefaultValue } from "../utils/reflect-default-value.js";
  import {
    nearestMark,
    resolveSliderMarks,
  } from "../utils/resolve-slider-marks.js";
  import {
    formatRangeLabel as formatSliderRangeLabel,
    getValueText as getSliderValueText,
    getTextInputWidth,
    snapToStep,
    valueFromPointer,
  } from "../utils/slider-value.js";
  import { uniqueId } from "../utils/unique-id.js";

  $: textInputWidth = getTextInputWidth(min, max, step);

  const dispatch = createEventDispatcher();

  // Naming and description belong on the slider thumb and its text input,
  // not the wrapper. A consumer `aria-label` replaces the visible label.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: controlLabelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : labelId);

  let trackRef = null;
  let textInputRef = null;

  /** @type {(label: string, numericValue: number) => string | number} */
  function formatRangeLabel(label, numericValue) {
    return formatSliderRangeLabel(label, numericValue, formatValue);
  }

  /** @type {(numericValue: number) => string | undefined} */
  function getValueText(numericValue) {
    return getSliderValueText(numericValue, formatValue);
  }

  function handleDragStart(event) {
    if (disabled || readonly) return false;
    calcValue(event);
  }

  function handleDragEnd() {
    if (!disabled && !readonly) dispatch("change", value);
  }

  function handleTextInputFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => textInputRef?.select());
    }
  }

  function calcValue(event) {
    if (disabled || readonly || !event) return;

    let nextValue = valueFromPointer(event, trackRef.getBoundingClientRect(), {
      orientation,
      min,
      max,
      step,
      rtl: horizontalRtl,
    });
    if (nextValue == null) return;
    if (snapToMarks && resolvedMarks.length) {
      nextValue = nearestMark(nextValue, resolvedMarks).value;
    }
    value = nextValue;
    dispatch("input", value);
  }

  $: labelId = `label-${id}`;
  $: ({ errorId, warnId, readonlyId, helperId } = buildFieldIds(id));
  $: inputId = `input-${id}`;
  // Invalid/warn states are suppressed when the slider is disabled or read-only.
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: range = max - min;
  $: left = range === 0 ? 0 : ((value - min) / range) * 100;

  // In RTL, `min` sits at the right end of a horizontal track. A
  // LayoutDirection gives the direction on the server. Without one, read
  // the track's computed direction once it mounts.
  const layoutDirection = getLayoutDirection();
  $: horizontalRtl =
    orientation !== "vertical" &&
    !!($layoutDirection || trackRef) &&
    resolveLayoutDirection($layoutDirection, trackRef) === "rtl";

  /**
   * @param {number} percent
   * @param {boolean} rtl
   * @returns {string}
   */
  function toLeft(percent, rtl) {
    return `${rtl ? 100 - percent : percent}%`;
  }
  $: resolvedMarks = resolveSliderMarks(marks, min, max, step);
  $: hasMarkLabels = resolvedMarks.some(
    (mark) => mark.label != null && mark.label !== "",
  );
  $: value = clamp(value, min, max);

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? ($formSize === "xs" ? "xs" : undefined);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--form-item--fit={!fullWidth}
  class:bx--slider-form-item--vertical={orientation === "vertical"}
  {...wrapperProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <!-- A hidden input cannot be labelled; the thumb is named through aria-labelledby. -->
  <label
    for={hideTextInput || readonly ? undefined : inputId}
    id={labelId}
    class:bx--label={true}
    class:bx--label--disabled={disabled}
    class:bx--visually-hidden={hideLabel}
  >
    <slot name="labelChildren"> {labelText} </slot>
  </label>
  <div
    class:bx--slider-container={true}
    class:bx--slider-container--full-width={fullWidth}
    class:bx--slider-container--no-range-labels={hideRangeLabels}
    class:bx--slider-container--no-text-input={hideTextInput}
    class:bx--slider-container--readonly={readonly}
    class:bx--slider-container--vertical={orientation === "vertical"}
    style:width={fullWidth ? "100%" : undefined}
  >
    {#if !hideRangeLabels}
      <span class:bx--slider__range-label={true}
        >{formatRangeLabel(minLabel, min)}</span
      >
    {/if}
    <div
      bind:this={ref}
      class:bx--slider={true}
      class:bx--slider--disabled={disabled}
      class:bx--slider--readonly={readonly}
      class:bx--slider--with-marks={resolvedMarks.length > 0}
      class:bx--slider--with-mark-labels={hasMarkLabels}
      class:bx--slider--vertical={orientation === "vertical"}
      style:max-width={fullWidth ? "none" : undefined}
      use:pointerDrag={{
        onStart: handleDragStart,
        onMove: calcValue,
        onEnd: handleDragEnd,
      }}
    >
      <div
        role="slider"
        aria-disabled={disabled || undefined}
        tabindex={disabled ? undefined : 0}
        class:bx--slider__thumb={true}
        style:left={orientation === "vertical"
          ? undefined
          : toLeft(left, horizontalRtl)}
        style:top={orientation === "vertical" ? `${100 - left}%` : undefined}
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={value}
        aria-valuetext={getValueText(value)}
        aria-label={ariaLabel}
        aria-labelledby={controlLabelledBy}
        aria-orientation={orientation}
        aria-describedby={joinDescribedBy(
          readonly ? readonlyId : null,
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
        aria-invalid={showInvalid || undefined}
        aria-readonly={readonly || undefined}
        {id}
        on:keydown={(event) => {
          // Alt/Ctrl/Meta+Arrow belong to the browser (Alt/Cmd+Left is Back).
          if (disabled || readonly || hasModifierKey(event)) return;

          if (event.key === "Home" || event.key === "End") {
            // Prevent the browser from also scrolling to the top/bottom of the page.
            event.preventDefault();
            value = event.key === "Home" ? min : max;
            dispatch("input", value);
            dispatch("change", value);
            return;
          }

          // Left and right move the thumb the way they point, as they do
          // on a native range input in RTL.
          const keys = {
            ArrowDown: -1,
            ArrowLeft: horizontalRtl ? 1 : -1,
            ArrowRight: horizontalRtl ? -1 : 1,
            ArrowUp: 1,
            PageDown: -1,
            PageUp: 1,
          };
          if (keys[event.key]) {
            // Prevent the arrow/page keys from also scrolling the page.
            event.preventDefault();
            const isLargeStep =
              event.shiftKey ||
              event.key === "PageUp" ||
              event.key === "PageDown";

            if (snapToMarks && resolvedMarks.length) {
              // Marks may be passed in any order; walk them from lowest to highest.
              const stops = [...resolvedMarks].sort(
                (a, b) => a.value - b.value,
              );
              const currentIndex = stops.findIndex(
                (mark) => mark.value === value,
              );
              const fromIndex =
                currentIndex === -1
                  ? stops.indexOf(nearestMark(value, stops))
                  : currentIndex;
              const jump = isLargeStep ? stepMultiplier : 1;
              let nextIndex = fromIndex + keys[event.key] * jump;
              if (nextIndex < 0) nextIndex = 0;
              else if (nextIndex > stops.length - 1)
                nextIndex = stops.length - 1;
              value = stops[nextIndex].value;
            } else {
              const delta =
                step *
                (isLargeStep ? range / step / stepMultiplier : 1) *
                keys[event.key];
              value = snapToStep(value + delta, { min, max, step });
            }
            dispatch("input", value);
            dispatch("change", value);
          }
        }}
      ></div>
      <div bind:this={trackRef} class:bx--slider__track={true}></div>
      <div
        class:bx--slider__filled-track={true}
        style:transform={orientation === "vertical"
          ? `translate(-50%, 0) scaleY(${left / 100})`
          : horizontalRtl
            ? `translate(100%, -50%) scaleX(${-left / 100})`
            : `translate(0, -50%) scaleX(${left / 100})`}
      ></div>
      {#if resolvedMarks.length > 0}
        <div class:bx--slider__marks={true} aria-hidden="true">
          {#each resolvedMarks as mark (mark.value)}
            {@const percent =
              range === 0 ? 0 : ((mark.value - min) / range) * 100}
            <span
              class:bx--slider__mark={true}
              style:left={orientation === "vertical"
                ? undefined
                : toLeft(percent, horizontalRtl)}
              style:top={orientation === "vertical"
                ? `${100 - percent}%`
                : undefined}
            >
              {#if mark.label != null && mark.label !== ""}
                <span class:bx--slider__mark-label={true}>{mark.label}</span>
              {/if}
            </span>
          {/each}
        </div>
      {/if}
    </div>
    {#if !hideRangeLabels}
      <span class:bx--slider__range-label={true}
        >{formatRangeLabel(maxLabel, max)}</span
      >
    {/if}
    <div class:bx--slider-text-input-wrapper={true}>
      {#if showInvalid}
        <WarningFilled class="bx--slider__invalid-icon" />
      {:else if showWarn}
        <WarningAltFilled
          class="bx--slider__invalid-icon bx--slider__invalid-icon--warning"
        />
      {/if}
      <input
        bind:this={textInputRef}
        use:preserveFocusSelection={selectTextOnFocus && !disabled}
        use:reflectDefaultValue={value}
        type={hideTextInput || readonly ? "hidden" : inputType}
        id={inputId}
        {name}
        {form}
        class:bx--text-input={true}
        class:bx--slider-text-input={true}
        style:width={textInputWidth}
        class:bx--slider-text-input--xs={effectiveSize === "xs"}
        class:bx--text-input--invalid={showInvalid}
        class:bx--slider-text-input--warn={showWarn}
        {value}
        aria-labelledby={controlLabelledBy}
        aria-label={ariaLabel ?? "Slider number input"}
        {disabled}
        {readonly}
        {required}
        {min}
        {max}
        {step}
        on:change={(event) => {
          if (readonly) return;
          // An empty or unparsable entry keeps the current value.
          const next = parse(event.target.value.trim(), true);
          if (next !== null) {
            value = clamp(next, min, max);
            dispatch("change", value);
          }
          // Show the value the slider holds. Svelte skips the update when a
          // clamped or rejected entry leaves `value` unchanged.
          event.target.value = String(value);
        }}
        data-invalid={showInvalid || null}
        data-warn={showWarn || null}
        aria-invalid={showInvalid || null}
        aria-describedby={joinDescribedBy(
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
        on:focus
        on:focus={handleTextInputFocus}
        on:blur
      >
      <!-- NVDA announces a read-only number input as editable, so a read-only
        slider shows its value as text. The thumb already exposes the value. -->
      {#if readonly && !hideTextInput}
        <div
          aria-hidden="true"
          class:bx--text-input={true}
          class:bx--slider-text-input={true}
          class:bx--slider-text-input--readonly={true}
          class:bx--slider-text-input--xs={effectiveSize === "xs"}
        >
          {value}
        </div>
      {/if}
    </div>
  </div>
  {#if showInvalid && invalidText}
    <div
      id={errorId}
      role="alert"
      class:bx--slider__validation-msg={true}
      class:bx--slider__validation-msg--invalid={true}
      class:bx--form-requirement={true}
    >
      {invalidText}
    </div>
  {/if}
  {#if showWarn && warnText}
    <div
      id={warnId}
      class:bx--slider__validation-msg={true}
      class:bx--form-requirement={true}
    >
      {warnText}
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
  {#if readonly}
    <span id={readonlyId} class:bx--visually-hidden={true}>{readonlyText}</span>
  {/if}
</div>
