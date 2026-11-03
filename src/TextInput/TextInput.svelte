<script>
  /**
   * @event {null | number | string} change
   * @event {null | number | string} input
   * @slot {{}} decorator - Render an `AILabel` or another decorator at the end of the field.
   */

  /**
   * Set the size of the input.
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default, which overrides a
   * `Form` size) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   *
   * `value` will be set to `null` if type="number" and the value is empty.
   * Follows the field when the owning form resets.
   * @type {null | number | string}
   * @bindable writable
   */
  export let value = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string | undefined}
   */
  export let name = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Specify the max character count allowed for the input.
   * Displays a character counter to the right of the label.
   * @type {number | undefined}
   */
  export let maxCount = undefined;

  /**
   * Override the counter text read by screen readers.
   * @type {((count: number, max: number) => string) | undefined}
   * @default `${count} of ${max} characters`
   */
  export let counterText = undefined;

  /**
   * Specify the text announced when the limit is reached.
   * @type {string | undefined}
   * @default "Character limit reached"
   */
  export let limitReachedText = undefined;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   * Cannot be combined with the inline variant.
   */
  export let fluid = false;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import EditOff from "../icons/EditOff.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { graphemeCount } from "../utils/grapheme-count.js";
  import { createLimitAnnouncement } from "../utils/limit-announcement.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";

  const ctx = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);
  const dispatch = createEventDispatcher();

  function parse(raw) {
    if ($$restProps.type !== "number") return raw;
    return raw === "" ? null : Number(raw);
  }

  // A form reset restores the field without an input event. Svelte 5 syncs
  // `bind:value` back on its own; Svelte 3 and 4 do not, so read the field.
  function handleFormReset() {
    if (ref) value = parse(ref.value);
  }

  /** @type {(e: Event) => void} */
  function handleInput(event) {
    value = parse(/** @type {HTMLInputElement} */ (event.target).value);
    dispatch("input", value);
  }

  /** @type {(e: Event) => void} */
  function handleChange(event) {
    dispatch(
      "change",
      parse(/** @type {HTMLInputElement} */ (event.target).value),
    );
  }

  function handleFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => ref?.select());
    }
  }

  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: isFluid = !inline && (fluid || !!ctx?.isFluid);
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: counterId = `counter-${id}`;
  $: count = graphemeCount((value ?? "").toString());
  $: resolvedCounterText = counterText ?? ((c, m) => `${c} of ${m} characters`);
  $: resolvedLimitReachedText = limitReachedText ?? "Character limit reached";

  const limitAnnouncement = createLimitAnnouncement(
    graphemeCount((value ?? "").toString()),
  );

  onMount(() => limitAnnouncement.cancel);

  $: limitAnnouncement.track(count, maxCount, resolvedLimitReachedText);

  // NVDA ignores `readonly` on a number input and announces it as editable,
  // so a read-only number field renders as a text input.
  $: typeOverride =
    readonly && $$restProps.type === "number" ? { type: "text" } : {};
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--text-input-wrapper={true}
  class:bx--text-input-wrapper--inline={inline}
  class:bx--text-input-wrapper--readonly={readonly}
  class:bx--text-input--fluid={isFluid}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if inline}
    <div
      class:bx--text-input__label-helper-wrapper={true}
      class:bx--visually-hidden={hideLabel && maxCount == null && !helperText}
    >
      {#if labelText || $$slots.labelChildren}
        <div class:bx--text-input__label-wrapper={true}>
          <label
            for={id}
            class:bx--label={true}
            class:bx--visually-hidden={hideLabel}
            class:bx--label--disabled={disabled}
            class:bx--label--inline={inline}
            class:bx--label--inline--xs={effectiveSize === "xs"}
            class:bx--label--inline--sm={effectiveSize === "sm"}
            class:bx--label--inline--xl={effectiveSize === "xl"}
            class:bx--label--slotted={isFluid && $$slots.labelChildren}
          >
            <slot name="labelChildren">{labelText}</slot>
          </label>
          {#if maxCount != null}
            <div
              class:bx--label={true}
              class:bx--label--disabled={disabled}
              class:bx--text-input__label-counter={true}
              aria-hidden="true"
            >
              {count}/{maxCount}
            </div>
          {/if}
        </div>
      {/if}
      {#if !isFluid && helperText}
        <div
          id={helperId}
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={disabled}
          class:bx--form__helper-text--inline={inline}
        >
          {helperText}
        </div>
      {/if}
    </div>
  {/if}
  {#if !inline && (labelText || $$slots.labelChildren)}
    <div class:bx--text-input__label-wrapper={true}>
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
        class:bx--label--inline={inline}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
        use:titleWhenTruncated={{ enabled: isFluid && !$$slots.labelChildren }}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
      {#if maxCount != null}
        <div
          class:bx--label={true}
          class:bx--label--disabled={disabled}
          class:bx--text-input__label-counter={true}
          aria-hidden="true"
        >
          {count}/{maxCount}
        </div>
      {/if}
    </div>
  {/if}
  {#if maxCount != null}
    <span id={counterId} class:bx--visually-hidden={true}>
      {resolvedCounterText(count, maxCount)}
    </span>
    <!-- Polite, not assertive like Carbon's, so it never cuts off the
      screen reader's echo of what was just typed. -->
    <div class:bx--visually-hidden={true} aria-live="polite" aria-atomic="true">
      {$limitAnnouncement}
    </div>
  {/if}
  <div
    class:bx--text-input__field-outer-wrapper={true}
    class:bx--text-input__field-outer-wrapper--inline={inline}
  >
    <div
      data-invalid={showInvalid || undefined}
      data-warn={showWarn || undefined}
      class:bx--text-input__field-wrapper={true}
      class:bx--text-input__field-wrapper--warning={showWarn}
      class:bx--text-input__field-wrapper--decorator={$$slots.decorator &&
        !isFluid}
      class:bx--text-input__field-wrapper--ai-label={$aiLabelState === "active"}
    >
      {#if readonly}
        <EditOff class="bx--text-input__readonly-icon" />
      {:else}
        {#if showInvalid}
          <WarningFilled class="bx--text-input__invalid-icon" />
        {/if}
        {#if showWarn}
          <WarningAltFilled
            class="bx--text-input__invalid-icon
            bx--text-input__invalid-icon--warning"
          />
        {/if}
      {/if}
      <input
        bind:this={ref}
        use:preserveFocusSelection={selectTextOnFocus && !disabled}
        use:formReset={handleFormReset}
        data-invalid={showInvalid || undefined}
        aria-invalid={showInvalid ? "true" : undefined}
        data-warn={showWarn || undefined}
        aria-errormessage={showInvalid && invalidText ? errorId : undefined}
        {disabled}
        {id}
        {name}
        {placeholder}
        bind:value
        {required}
        {readonly}
        class:bx--text-input={true}
        class:bx--text-input--invalid={showInvalid}
        class:bx--text-input--warning={showWarn}
        class:bx--text-input--xs={effectiveSize === "xs"}
        class:bx--text-input--sm={effectiveSize === "sm"}
        class:bx--text-input--xl={effectiveSize === "xl"}
        maxlength={maxCount ?? undefined}
        {...$$restProps}
        {...typeOverride}
        aria-describedby={joinDescribedBy(
          resolveStatusDescribedBy({
            showInvalid,
            showWarn,
            invalidText,
            warnText,
            helperText,
            isFluid,
            errorId,
            warnId,
            helperId,
            includeErrorId: false,
          }),
          maxCount == null ? null : counterId,
          $$restProps["aria-describedby"],
        )}
        on:change={handleChange}
        on:input={handleInput}
        on:keydown
        on:keyup
        on:focus
        on:focus={handleFocus}
        on:blur
        on:paste
      />
      {#if $$slots.decorator}
        <Decorator
          class="bx--field-decorator bx--text-input__field-inner-wrapper--decorator"
          size={effectiveSize}
          state={aiLabelState}
        >
          <slot name="decorator" />
        </Decorator>
      {/if}
      {#if isFluid}
        <hr class:bx--text-input__divider={true} />
      {/if}
      {#if isFluid && showInvalid && invalidText}
        <div class:bx--form-requirement={true} id={errorId} role="alert">
          {invalidText}
        </div>
      {/if}
      {#if isFluid && showWarn && warnText}
        <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
      {/if}
    </div>
    {#if !showInvalid && !showWarn && !isFluid && !inline && helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
        class:bx--form__helper-text--inline={inline}
      >
        {helperText}
      </div>
    {/if}
    {#if !isFluid && showInvalid && invalidText}
      <div class:bx--form-requirement={true} id={errorId} role="alert">
        {invalidText}
      </div>
    {/if}
    {#if !isFluid && showWarn && warnText}
      <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
    {/if}
  </div>
</div>
