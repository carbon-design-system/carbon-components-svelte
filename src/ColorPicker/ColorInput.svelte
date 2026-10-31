<script>
  /**
   * @restProps {input}
   * @event {string} input
   * @event {string} change
   * @event {null} open
   * @event {null} close
   */

  /**
   * Specify the color as a CSS color string, or `""` for none. Typing
   * writes it in `format`, and so does the picker.
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the format the value is written in.
   * @type {import("./ColorPicker.svelte").ColorPickerFormat}
   * @bindable writable
   */
  export let format = "hex";

  /** Set to `true` to add an alpha slider and field to the picker */
  export let alpha = false;

  /**
   * Specify preset colors for the picker.
   * @type {ReadonlyArray<import("./ColorPicker.svelte").ColorPickerSwatch>}
   */
  export let swatches = [];

  /**
   * Specify the recently chosen colors, newest first. The list survives the
   * popover closing; bind it to keep it longer.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let recent = [];

  /**
   * Specify the color the chosen color sits on, to warn about low contrast.
   * @type {string | undefined}
   */
  export let background = undefined;

  /** Specify the lowest contrast ratio against `background` that does not warn */
  export let minContrast = 4.5;

  /** Set to `true` to hide the picker's eyedropper button */
  export let hideEyeDropper = false;

  /**
   * Set to `true` to open the popover.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the size of the field.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Specify the invalid state text for a typed value that is not a color.
   */
  export let invalidColorText = "Enter a valid color";

  /** Specify the accessible name of the swatch button that opens the picker */
  export let iconDescription = "Choose a color";

  /**
   * Specify a name attribute for the input.
   * @type {string | undefined}
   */
  export let name = undefined;

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Name a color for a screen reader, as in "dark teal".
   * @type {(color: import("./ColorPicker.svelte").ColorPickerColor) => string}
   */
  export let formatColorName = describeColor;

  /**
   * Override the picker's default text.
   * @type {((id: import("./ColorPicker.svelte").ColorPickerTranslationId) => string) | undefined}
   */
  export let translateWithId = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Layer from "../Layer/Layer.svelte";
  import Popover from "../Popover/Popover.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    describeColor,
    formatColor,
    parseColor,
    rgbaToHsva,
  } from "../utils/color.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import {
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { focusQuietly } from "../utils/focus.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import ColorPicker from "./ColorPicker.svelte";

  const BARE_HEX = /^[0-9a-f]{3,8}$/i;
  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);

  /** @type {null | HTMLButtonElement} */
  let triggerRef = null;
  /** @type {null | HTMLDivElement} */
  let anchorRef = null;
  /** @type {null | HTMLDivElement} */
  let popoverRef = null;
  /** @type {null | HTMLDivElement} */
  let areaRef = null;
  let typedInvalid = false;

  /** @type {string | undefined} */
  let effectiveSize;
  $: effectiveSize = normalizeSize(size, FIELD_SIZE_ALIASES);
  $: color = parseColor(value);
  $: swatchColor = color
    ? `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`
    : undefined;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || typedInvalid,
    warn,
    disabled,
    readonly,
  }));
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: shownInvalidText = typedInvalid ? invalidColorText : invalidText;
  $: popoverId = `${id}-popover`;
  $: notifyOpenChange(open);

  // A new value from outside clears the complaint about what was typed.
  $: if (value !== undefined) typedInvalid = false;

  /** @param {Event} event */
  function handleChange(event) {
    const text = /** @type {HTMLInputElement} */ (event.target).value.trim();
    if (text === "") {
      typedInvalid = false;
      value = "";
      dispatch("input", value);
      dispatch("change", value);
      return;
    }
    const rgba = parseColor(BARE_HEX.test(text) ? `#${text}` : text);
    if (!rgba) {
      typedInvalid = true;
      return;
    }
    typedInvalid = false;
    const next = formatColor(
      rgbaToHsva({ ...rgba, a: alpha ? rgba.a : 1 }),
      format,
    );
    value = next;
    /** @type {HTMLInputElement} */ (event.target).value = next;
    dispatch("input", next);
    dispatch("change", next);
  }

  function toggle() {
    if (disabled || readonly) return;
    open = !open;
  }

  // Focus goes into the picker on open, as it does into a dialog, and back to
  // the swatch button when Escape closes it. A popover that turns out to be
  // clipped moves to a portal and mounts the picker again, so focus follows
  // each new thumb.
  /** @type {null | HTMLDivElement} */
  let focusedArea = null;
  $: if (!open) focusedArea = null;
  $: if (open && areaRef && areaRef !== focusedArea) focusArea(areaRef);

  /** @param {HTMLDivElement} thumb */
  function focusArea(thumb) {
    focusedArea = thumb;
    thumb.focus({ preventScroll: true });
    // A portalled popover places itself over the next frames.
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => {
        if (
          open &&
          focusedArea === thumb &&
          !thumb.contains(document.activeElement) &&
          document.activeElement !== thumb &&
          !popoverRef?.contains(document.activeElement)
        ) {
          thumb.focus({ preventScroll: true });
        }
      });
    }
  }

  /** @param {CustomEvent<{ trigger: string }>} event */
  function handleClose(event) {
    open = false;
    if (event.detail.trigger === "escape-key" && triggerRef) {
      focusQuietly(triggerRef);
    }
  }

  // Tab out of the field and the popover closes it, so it never stays open
  // behind the next control.
  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = /** @type {Node | null} */ (event.relatedTarget);
    if (!open || next === null) return;
    if (anchorRef?.contains(next) || popoverRef?.contains(next)) return;
    open = false;
  }
</script>

<div class:bx--form-item={true} class:bx--text-input-wrapper={true}>
  {#if labelText || $$slots.labelChildren}
    <div class:bx--text-input__label-wrapper={true}>
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    </div>
  {/if}
  <div class:bx--text-input__field-outer-wrapper={true}>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      bind:this={anchorRef}
      class:bx--color-input={true}
      on:focusout={handleFocusout}
    >
      <div
        class:bx--text-input__field-wrapper={true}
        class:bx--text-input__field-wrapper--warning={showWarn}
        data-invalid={showInvalid || undefined}
        data-warn={showWarn || undefined}
      >
        {#if showInvalid}
          <WarningFilled class="bx--text-input__invalid-icon" />
        {/if}
        {#if showWarn}
          <WarningAltFilled
            class="bx--text-input__invalid-icon bx--text-input__invalid-icon--warning"
          />
        {/if}
        <button
          bind:this={triggerRef}
          type="button"
          class:bx--color-input__trigger={true}
          class:bx--color-input__trigger--xs={effectiveSize === "xs"}
          class:bx--color-input__trigger--sm={effectiveSize === "sm"}
          class:bx--color-input__trigger--xl={effectiveSize === "xl"}
          aria-label={iconDescription}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={popoverId}
          {disabled}
          on:click={toggle}
        >
          <span class:bx--color-input__swatch={true} aria-hidden="true">
            <span
              class:bx--color-input__swatch-face={true}
              class:bx--color-input__swatch-face--empty={!swatchColor}
              style:background-color={swatchColor}
            ></span>
          </span>
        </button>
        <input
          bind:this={ref}
          {id}
          {name}
          {placeholder}
          {disabled}
          {readonly}
          {required}
          value={value ?? ""}
          spellcheck="false"
          autocomplete="off"
          data-invalid={showInvalid || undefined}
          aria-invalid={showInvalid ? "true" : undefined}
          aria-errormessage={showInvalid && shownInvalidText
            ? errorId
            : undefined}
          class:bx--text-input={true}
          class:bx--color-input__field={true}
          class:bx--text-input--invalid={showInvalid}
          class:bx--text-input--warning={showWarn}
          class:bx--text-input--xs={effectiveSize === "xs"}
          class:bx--text-input--sm={effectiveSize === "sm"}
          class:bx--text-input--xl={effectiveSize === "xl"}
          {...$$restProps}
          aria-describedby={joinDescribedBy(
            resolveStatusDescribedBy({
              showInvalid,
              showWarn,
              invalidText: shownInvalidText,
              warnText,
              helperText,
              errorId,
              warnId,
              helperId,
              includeErrorId: false,
            }),
            $$restProps["aria-describedby"],
          )}
          on:change={handleChange}
          on:keydown
          on:focus
          on:blur
          on:paste
        />
      </div>
      <Popover
        bind:ref={popoverRef}
        {open}
        id={popoverId}
        role="dialog"
        aria-label={iconDescription}
        align="bottom-start"
        closeOnEscape
        closeOnOutsideClick
        on:close={handleClose}
      >
        {#if open}
          <div class:bx--color-input__popover={true}>
            <Layer>
              <ColorPicker
                id="{id}-picker"
                bind:value
                bind:format
                bind:recent
                bind:areaRef
                {alpha}
                {swatches}
                {background}
                {minContrast}
                {hideEyeDropper}
                {formatColorName}
                {...translateWithId ? { translateWithId } : {}}
                on:input={(event) => dispatch("input", event.detail)}
                on:change={(event) => dispatch("change", event.detail)}
              />
            </Layer>
          </div>
        {/if}
      </Popover>
    </div>
    {#if !showInvalid && !showWarn && helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
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
</div>
