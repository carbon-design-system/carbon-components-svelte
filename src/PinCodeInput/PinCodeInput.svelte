<script>
  /**
   * @event {{ value: string; code: string[] }} change
   * @event {{ value: string; code: string[] }} complete
   * @event {null} clear
   * @event {{ value: string }} paste
   * @slot {{}} labelChildren
   * @restProps {div}
   */

  /** Specify the number of input segments to render */
  export let count = 4;

  /**
   * The concatenated code value.
   *
   * Derived from `code` (i.e. `code.join("")`); bind to read the assembled
   * value. When `complete` is `true`, its length equals `count`. Each
   * character matches `pattern` when set, otherwise the active `type`:
   * `0-9` for `"numeric"`, `a-zA-Z0-9` for `"alphanumeric"`. Original casing
   * is preserved regardless of `uppercase`, which only affects the visual
   * rendering.
   * @bindable readonly
   */
  export let value = "";

  /**
   * The individual segment characters.
   *
   * `code` is the source of truth; its length tracks `count`. Each element is
   * either an empty string (unfilled segment) or a single character matching
   * `pattern` when set, otherwise the active `type`: `0-9` for `"numeric"`,
   * `a-zA-Z0-9` for `"alphanumeric"`.
   * Follows the segments when the owning form resets.
   * @type {string[]}
   * @bindable writable
   */
  export let code = [];

  /**
   * Specify the type of allowed characters.
   *
   * `"numeric"` allows `0-9`; `"alphanumeric"` allows `a-z`, `A-Z`, `0-9`.
   * When `pattern` is set, `pattern` decides which characters are accepted,
   * and `type` still sets each segment's `inputmode` (`"numeric"` shows a
   * numeric keypad on touch devices).
   * @type {"numeric" | "alphanumeric"}
   */
  export let type = "numeric";

  /**
   * Override the per-character validation used for typing and paste.
   *
   * Accepts a `RegExp` or a string compiled with `new RegExp(...)`. The
   * pattern is tested against each individual character, not the full
   * assembled value. When unset, `type` selects the preset (`"numeric"` or
   * `"alphanumeric"`). Set `type` to `"alphanumeric"` when the pattern
   * accepts letters, so touch keyboards offer them.
   * @type {RegExp | string | undefined}
   */
  export let pattern = undefined;

  /**
   * Set to `true` to visually display the characters in uppercase
   * while retaining the original casing of `value` and `code`.
   *
   * Only affects letters, so it is most useful with `type="alphanumeric"`.
   */
  export let uppercase = false;

  /**
   * Set to `true` to mask the segments.
   *
   * Each segment is masked when it is not focused, revealing its character
   * only while focused.
   */
  export let mask = false;

  /**
   * `true` when every segment is filled.
   * @bindable readonly
   */
  export let complete = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /**
   * Set the size of the input.
   * @type {"default" | "xs" | "sm" | "xl"}
   */
  export let size = "default";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Placeholder shown in empty segments.
   *
   * Defaults to a placeholder in the fluid variant; non-fluid segments have no
   * placeholder unless this prop is set.
   * @type {string | undefined}
   */
  export let placeholder = undefined;

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

  /**
   * Specify a name attribute for native form participation.
   *
   * When set, a hidden input mirrors the assembled `value` so the code is
   * included in FormData / form submissions. `required` stays on each
   * segment, since hidden inputs take no part in constraint validation.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Set to `true` to submit the closest form after a user edit (typing,
   * paste, or autofill) leaves every segment filled.
   *
   * Uses `form.requestSubmit()`, so constraint validation and `submit`
   * listeners run as for a submit button. Programmatic `code` changes do
   * not submit.
   */
  export let submitOnComplete = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Set to `true` while the code is being verified.
   *
   * Shows a small spinner after the segments and sets `aria-busy` on the
   * fieldset. Edits are blocked, but the segments stay enabled so focus does
   * not move. Invalid and warning states are hidden while loading.
   */
  export let loading = false;

  /** Specify the accessible description of the loading spinner */
  export let loadingDescription = "Verifying code";

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /**
   * Set to `true` to select a segment's value when it receives focus,
   * including on click. Without this prop, browsers typically select the
   * value only on keyboard focus (for example, via Tab).
   */
  export let selectTextOnFocus = false;

  /**
   * Set to `true` to request the code from an incoming SMS with the WebOTP
   * API (Chrome on Android). The request starts on mount and is aborted on
   * unmount or when this prop turns `false`. Does nothing where the API is
   * unavailable.
   */
  export let webOtp = false;

  /**
   * Override the accessible label of each segment.
   *
   * `position` is 1-based. The default returns, for example,
   * `"Verification code digit 1 of 4"`, using `"Pin code"` when `labelText`
   * is empty and `"character"` instead of `"digit"` when `type` is
   * `"alphanumeric"`.
   * @type {(position: number, count: number, labelText: string, type: "numeric" | "alphanumeric") => string}
   */
  export let segmentLabelText = function segmentLabelText(
    position,
    count,
    labelText,
    type,
  ) {
    return `${labelText || "Pin code"} ${type === "numeric" ? "digit" : "character"} ${position} of ${count}`;
  };

  /** Set an id for the input group */
  export let id = uniqueId();

  /**
   * Obtain a reference to the outer element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import Loading from "../Loading/Loading.svelte";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const formContext = getContext("carbon:Form");

  /** @type {HTMLInputElement[]} */
  let inputs = [];
  let mounted = false;
  let prevComplete = false;
  let hadValue = false;
  let skipSelectOnFocus = false;
  /** @type {number} */
  let focusedIndex = -1;

  // Seed `code` from `value` if a value was provided without an explicit code.
  if (code.length === 0 && value) {
    code = value.split("").slice(0, count);
  }

  // Capture the seeded state so events only fire from user interaction.
  prevComplete = count > 0 && code.length === count && code.every(Boolean);
  hadValue = code.some(Boolean);

  /** @type {RegExp} */
  let charPattern;
  $: charPattern =
    pattern == null
      ? type === "numeric"
        ? /^[0-9]$/
        : /^[a-zA-Z0-9]$/
      : typeof pattern === "string"
        ? new RegExp(pattern)
        : pattern;

  $: if (code.length !== count) {
    code = Array.from({ length: count }, (_, index) => code[index] ?? "");
  }

  $: value = code.join("");
  $: complete = count > 0 && code.length === count && code.every(Boolean);
  // Validation states are suppressed in the read-only and disabled variants,
  // matching the other Carbon inputs.
  $: hasError = invalid && !readonly && !disabled && !loading;
  $: hasWarn = warn && !hasError && !readonly && !disabled && !loading;
  // Edits are blocked while read-only, disabled, or verifying.
  $: locked = readonly || disabled || loading;
  $: isFluid = fluid || !!formContext?.isFluid;
  $: segmentPlaceholder =
    placeholder === undefined ? (isFluid ? "–" : "") : placeholder;

  $: legendId = `legend-${id}`;
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: describedById = hasError
    ? errorId
    : hasWarn
      ? warnId
      : helperText && !isFluid
        ? helperId
        : undefined;

  // Emit "complete" once when all segments fill, "clear" once when emptied.
  $: if (mounted && complete && !prevComplete) {
    prevComplete = true;
    dispatch("complete", { value, code });
  }
  $: if (mounted && !complete) prevComplete = false;
  $: anyValue = code.some(Boolean);
  $: if (mounted && !anyValue && hadValue) {
    hadValue = false;
    dispatch("clear");
  }
  $: if (anyValue) hadValue = true;

  // A form reset restores the segments without an input event, and the
  // hidden input keeps its value, so rebuild `code` from the segments.
  // Like the other form controls, a reset fires no events.
  function handleFormReset() {
    const next = Array.from({ length: count }, (_, index) => {
      const char = inputs[index]?.value ?? "";
      return char.length === 1 && isValidChar(char) ? char : "";
    });
    prevComplete = count > 0 && next.every(Boolean);
    hadValue = next.some(Boolean);
    code = next;
  }

  /** @type {(char: string) => boolean} */
  function isValidChar(char) {
    return charPattern.test(char);
  }

  /** @type {(index: number, char: string) => void} */
  function setChar(index, char) {
    const next = code.slice();
    next[index] = char;
    code = next;
    dispatch("change", { value: code.join(""), code });
    submitIfComplete();
  }

  // Wait for the flush so the hidden `name` input holds the new value and
  // `complete` listeners run before the form submits.
  async function submitIfComplete() {
    if (!submitOnComplete) return;
    if (!(count > 0 && code.length === count && code.every(Boolean))) return;
    await tick();
    const form = inputs[0]?.form;
    if (form && typeof form.requestSubmit === "function") {
      form.requestSubmit();
    }
  }

  /** @type {(index: number, options?: { selectTextOnFocus?: boolean }) => void} */
  function focusInput(index, options = {}) {
    const input = inputs[index];
    if (input) {
      focusedIndex = index;
      const shouldSelect = options.selectTextOnFocus ?? selectTextOnFocus;
      skipSelectOnFocus = true;
      input.focus();
      if (shouldSelect) input.select();
      skipSelectOnFocus = false;
    }
  }

  /**
   * Distribute valid characters across segments, matching paste behavior:
   * a full-length code replaces every segment; otherwise fill from `index`.
   * @type {(index: number, chars: string[]) => void}
   */
  function fillFromChars(index, chars) {
    const next = code.slice();
    if (chars.length === count) {
      for (let i = 0; i < count; i++) next[i] = chars[i];
    } else {
      let cursor = index;
      for (const char of chars) {
        if (cursor >= count) break;
        next[cursor++] = char;
      }
    }
    code = next;
    dispatch("change", { value: code.join(""), code });
    submitIfComplete();

    const firstEmpty = code.findIndex((char) => !char);
    focusInput(firstEmpty === -1 ? count - 1 : firstEmpty);
  }

  /** @type {(index: number, event: Event) => void} */
  function handleInput(index, event) {
    const input = /** @type {HTMLInputElement} */ (event.target);
    if (locked) {
      input.value = code[index] ?? "";
      return;
    }

    const raw = input.value;
    // OS/password-manager autofill may insert the whole code into one field.
    if (raw.length > 1) {
      const chars = raw.split("").filter(isValidChar);
      if (chars.length === 0) {
        input.value = code[index] ?? "";
        return;
      }
      fillFromChars(index, chars);
      return;
    }

    const char = raw;
    if (char && !isValidChar(char)) {
      input.value = code[index] ?? "";
      return;
    }

    setChar(index, char);
    if (char && index < count - 1) focusInput(index + 1);
  }

  /** @type {(index: number, event: KeyboardEvent) => void} */
  function handleKeydown(index, event) {
    switch (event.key) {
      case "Backspace":
        if (locked) break;
        if (!code[index] && index > 0) {
          event.preventDefault();
          setChar(index - 1, "");
          focusInput(index - 1);
        }
        break;
      case "ArrowLeft":
        if (index > 0) {
          event.preventDefault();
          focusInput(index - 1);
        }
        break;
      case "ArrowRight":
        if (index < count - 1) {
          event.preventDefault();
          focusInput(index + 1);
        }
        break;
      case "Delete":
        if (locked || !code[index]) break;
        setChar(index, "");
        break;
      default:
        if (locked) break;
        // maxlength="1" drops keystrokes into a filled segment; select its
        // content so the native insertion replaces the character.
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          !event.isComposing &&
          code[index]
        ) {
          const input = inputs[index];
          if (input && input.selectionStart === input.selectionEnd) {
            input.select();
          }
        }
        break;
    }
  }

  /** @type {(index: number, event: ClipboardEvent) => void} */
  function handlePaste(index, event) {
    event.preventDefault();
    if (locked) return;
    const text = (event.clipboardData?.getData("text") ?? "").replace(
      /\s/g,
      "",
    );
    const chars = text.split("").filter(isValidChar);
    if (chars.length === 0) return;

    dispatch("paste", { value: text });
    fillFromChars(index, chars);
  }

  /** @type {(event: KeyboardEvent) => void} */
  function handleLegendKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      focusNextEmptyInput();
    }
  }

  function handleLegendClick() {
    focusNextEmptyInput();
  }

  /** @type {(event: FocusEvent) => void} */
  function handleFocus(event) {
    const index = inputs.indexOf(
      /** @type {HTMLInputElement} */ (event.target),
    );
    if (index !== -1) focusedIndex = index;

    if (skipSelectOnFocus) return;
    if (selectTextOnFocus) {
      /** @type {HTMLInputElement} */ (event.target).select();
    }
  }

  /**
   * Focus the first input segment.
   * @param {{ selectTextOnFocus?: boolean }} [options]
   */
  export function focusFirstInput(options = {}) {
    focusInput(0, options);
  }

  /**
   * Focus the last input segment.
   * @param {{ selectTextOnFocus?: boolean }} [options]
   */
  export function focusLastInput(options = {}) {
    focusInput(count - 1, options);
  }

  /**
   * Focus the first empty input segment, or the last if all are filled.
   * @param {{ selectTextOnFocus?: boolean }} [options]
   */
  export function focusNextEmptyInput(options = {}) {
    const firstEmpty = code.findIndex((char) => !char);
    focusInput(firstEmpty === -1 ? count - 1 : firstEmpty, options);
  }

  /**
   * Focus the next input segment from the currently focused segment.
   * Does not wrap when the last segment is focused.
   * @param {{ selectTextOnFocus?: boolean }} [options]
   */
  export function focusNext(options = {}) {
    let focusedInputIndex = inputs.indexOf(
      /** @type {HTMLInputElement} */ (document.activeElement),
    );
    if (focusedInputIndex === -1) focusedInputIndex = focusedIndex;
    if (focusedInputIndex === -1) {
      focusInput(0, options);
      return;
    }
    if (focusedInputIndex < count - 1) {
      focusInput(focusedInputIndex + 1, options);
    }
  }

  /**
   * Clear all segments programmatically.
   * By default, focus is not moved. Set `options.focus` to `true` to focus the first segment after clearing.
   * @param {{ focus?: boolean }} [options]
   */
  export function clear(options = {}) {
    code = Array.from({ length: count }, () => "");
    dispatch("change", { value: "", code });
    if (options.focus === true) {
      focusInput(0);
    }
  }

  /** @type {AbortController | null} */
  let webOtpController = null;

  function stopWebOtp() {
    webOtpController?.abort();
    webOtpController = null;
  }

  function startWebOtp() {
    if (webOtpController) return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;
    const controller = new AbortController();
    webOtpController = controller;
    navigator.credentials
      .get(
        /** @type {CredentialRequestOptions} */ ({
          otp: { transport: ["sms"] },
          signal: controller.signal,
        }),
      )
      .then((credential) => {
        if (controller.signal.aborted || locked) return;
        const otp = /** @type {{ code?: string } | null} */ (credential)?.code;
        if (!otp) return;
        const chars = otp.split("").filter(isValidChar).slice(0, count);
        if (chars.length === 0) return;
        // Fill without moving focus; the user may be elsewhere on the page.
        code = Array.from({ length: count }, (_, i) => chars[i] ?? "");
        dispatch("change", { value: code.join(""), code });
        submitIfComplete();
      })
      .catch(() => {})
      .finally(() => {
        if (webOtpController === controller) webOtpController = null;
      });
  }

  $: if (mounted) {
    if (webOtp) startWebOtp();
    else stopWebOtp();
  }

  onMount(() => {
    mounted = true;
    return stopWebOtp;
  });
</script>

<div
  bind:this={ref}
  class:bx--form-item={true}
  class:bx--pin-code-input={true}
  class:bx--pin-code-input--light={light}
  class:bx--pin-code-input--readonly={readonly}
  class:bx--pin-code-input--fluid={isFluid}
  class:bx--pin-code-input--xs={size === "xs"}
  {...$$restProps}
>
  <fieldset
    use:formReset={handleFormReset}
    class:bx--pin-code-input__fieldset={true}
    {disabled}
    aria-describedby={describedById}
    aria-busy={loading || undefined}
  >
    {#if labelText || $$slots.labelChildren}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
      <legend
        id={legendId}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
        tabindex={hideLabel || disabled ? undefined : "0"}
        on:click={handleLegendClick}
        on:keydown={handleLegendKeydown}
      >
        <slot name="labelChildren">{labelText}</slot>
      </legend>
    {/if}
    {#if name}
      <input type="hidden" {name} {value}>
    {/if}
    <div
      data-invalid={hasError || undefined}
      data-warn={hasWarn || undefined}
      class:bx--pin-code-input__fields={true}
      class:bx--pin-code-input__fields--invalid={hasError}
      class:bx--pin-code-input__fields--warning={hasWarn}
    >
      <div class:bx--pin-code-input__segments={true}>
        {#each code as char, index (index)}
          <input
            bind:this={inputs[index]}
            type="text"
            inputmode={type === "numeric" ? "numeric" : "text"}
            autocomplete={index === 0 ? "one-time-code" : "off"}
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            maxlength="1"
            value={char}
            placeholder={segmentPlaceholder || undefined}
            id={index === 0 ? id : `${id}-${index}`}
            {disabled}
            readonly={readonly || loading}
            {required}
            aria-readonly={readonly || loading || undefined}
            aria-label={segmentLabelText(index + 1, count, labelText, type)}
            aria-invalid={hasError || undefined}
            data-invalid={hasError || undefined}
            data-warn={hasWarn || undefined}
            class:bx--text-input={true}
            class:bx--pin-code-input__field={true}
            class:bx--pin-code-input__field--masked={mask}
            class:bx--pin-code-input__field--uppercase={uppercase}
            class:bx--text-input--light={light}
            class:bx--text-input--invalid={hasError}
            class:bx--text-input--warning={hasWarn}
            class:bx--text-input--xs={size === "xs"}
            class:bx--text-input--sm={size === "sm"}
            class:bx--text-input--xl={size === "xl"}
            on:input={(event) => handleInput(index, event)}
            on:keydown={(event) => handleKeydown(index, event)}
            on:paste={(event) => handlePaste(index, event)}
            on:focus={handleFocus}
          >
        {/each}
        {#if loading}
          <Loading
            small
            withOverlay={false}
            description={loadingDescription}
            class="bx--pin-code-input__loading"
          />
        {/if}
        {#if !isFluid}
          {#if hasError}
            <WarningFilled class="bx--pin-code-input__icon" />
          {:else if hasWarn}
            <WarningAltFilled
              class="bx--pin-code-input__icon bx--pin-code-input__icon--warning"
            />
          {/if}
        {/if}
      </div>
      {#if isFluid}
        <hr class:bx--pin-code-input__divider={true}>
        {#if hasError}
          <div class:bx--pin-code-input__message={true}>
            <WarningFilled class="bx--pin-code-input__icon" />
            <div class:bx--form-requirement={true} id={errorId}>
              {invalidText}
            </div>
          </div>
        {/if}
        {#if hasWarn}
          <div class:bx--pin-code-input__message={true}>
            <WarningAltFilled
              class="bx--pin-code-input__icon bx--pin-code-input__icon--warning"
            />
            <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
          </div>
        {/if}
      {/if}
    </div>
    {#if !isFluid && !hasError && !hasWarn && helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
    {#if !isFluid && hasError}
      <div class:bx--form-requirement={true} id={errorId}>{invalidText}</div>
    {/if}
    {#if !isFluid && hasWarn}
      <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
    {/if}
  </fieldset>
</div>
