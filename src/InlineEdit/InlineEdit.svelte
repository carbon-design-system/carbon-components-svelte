<script>
  /**
   * @restProps {div}
   * @event {null} save - Fires on the save button, or on blur/Enter with a changed value.
   * @event {null} cancel - Fires on the cancel button, or on blur/Escape with no real change.
   * @event {FocusEvent} blur - Forwarded after the auto-save/auto-cancel decision runs.
   */

  /**
   * Current value of the input.
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify a custom id for the input.
   * @type {string}
   */
  export let id = uniqueId();

  /**
   * Screen-reader label for the input.
   * @type {string}
   */
  export let labelText;

  /**
   * Label for the edit button.
   * @type {string}
   */
  export let editLabel;

  /**
   * Label for the save button.
   * @type {string}
   */
  export let saveLabel;

  /**
   * Label for the cancel button.
   * @type {string}
   */
  export let cancelLabel;

  /** By default the edit button is shown on hover only. */
  export let editAlwaysVisible = false;

  /**
   * Set to `true` to have the input inherit the container's font settings.
   * `size` still clamps the input's vertical size.
   */
  export let inheritTypography = false;

  /** Set to `true` to indicate an invalid state. */
  export let invalid = false;

  /** Specify the invalid state text. */
  export let invalidText = "";

  /**
   * Specify the input placeholder text.
   * @type {string}
   */
  export let placeholder = undefined;

  /** Set to `true` to select the input's text when entering edit mode. */
  export let selectTextOnFocus = false;

  /**
   * Set to `true` to disable the field entirely: no edit affordance, not
   * focusable. Use `readonly` instead to keep the field visible and
   * focusable while explaining why it can't be edited.
   */
  export let disabled = false;

  /** Set to `true` to disable editing. */
  export let readonly = false;

  /**
   * Label for the "edit off" icon shown in readonly mode. Defaults to
   * `"Edit off"`.
   * @type {string}
   */
  export let readonlyLabel = undefined;

  /**
   * Toggletip text shown in readonly mode, explaining why the field can't
   * be edited. Defaults to `"This field is read-only and cannot be edited"`.
   * @type {string}
   */
  export let readonlyToggletipText = undefined;

  /**
   * Vertical size of the control. `"xs"` matches DataTable's `compact` row
   * size.
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "sm";

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import Close from "../icons/Close.svelte";
  import Edit from "../icons/Edit.svelte";
  import EditOff from "../icons/EditOff.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import Toggletip from "../Toggletip/Toggletip.svelte";
  import { uniqueId } from "../utils/uniqueId.js";

  const dispatch = createEventDispatcher();
  const errorId = `error-${id}`;

  let initialValue = value;
  let focused = false;
  let containerRef = null;
  let inputRef = null;

  // Guards ported from Carbon React's EditInPlace: `escaping` suppresses the
  // blur handler's own auto-save/cancel when Escape/Enter already triggered
  // it explicitly (calling `.blur()` fires a synchronous, bubbling
  // `focusout`); `clickingWithin` tells the blur handler a toolbar button
  // was pressed, so it can tell "moved to an enabled button" (stay in edit
  // mode, let the button's own click handler act) apart from "moved to a
  // disabled button, then away" (exit edit mode).
  let escaping = false;
  let clickingWithin = false;

  // Matches TextInput's own showInvalid convention: disabled/readonly take
  // precedence over validation styling.
  $: showInvalid = invalid && !disabled && !readonly;
  $: hasValueChanged = value.trim() !== initialValue.trim();
  $: canSave = hasValueChanged && !showInvalid;
  $: canCancel = hasValueChanged;

  $: containerClass = [
    "bx--edit-in-place",
    `bx--edit-in-place--${size}`,
    focused && "bx--edit-in-place--focused",
    showInvalid && "bx--edit-in-place--invalid",
    inheritTypography && "bx--edit-in-place--inherit-type",
    readonly && "bx--edit-in-place--readonly",
    disabled && "bx--edit-in-place--disabled",
  ]
    .filter(Boolean)
    .join(" ");

  function isTargetingChild(relatedTarget) {
    return (
      relatedTarget instanceof Node && containerRef?.contains(relatedTarget)
    );
  }

  function handleFocus(event) {
    if (!isTargetingChild(event?.relatedTarget)) {
      inputRef?.focus();
      if (selectTextOnFocus) inputRef?.select();
    }
    focused = true;
  }

  function handleSave(exitEditMode) {
    initialValue = value;
    dispatch("save");
    if (exitEditMode) {
      focused = false;
    } else {
      requestAnimationFrame(() => {
        inputRef?.focus();
      });
    }
  }

  function handleCancel(exitEditMode) {
    value = initialValue;
    dispatch("cancel");
    if (exitEditMode) {
      focused = false;
    } else {
      requestAnimationFrame(() => {
        inputRef?.focus();
        const length = inputRef?.value.length ?? 0;
        inputRef?.setSelectionRange(length, length);
      });
    }
  }

  function handleBlur(event) {
    const clickedWithin = clickingWithin;
    const targetingChild = isTargetingChild(event.relatedTarget);

    // Clicked an enabled toolbar button: let its own click handler act.
    if (clickedWithin && targetingChild) {
      clickingWithin = false;
      return;
    }
    // Clicked a disabled toolbar button, then focus left: fall through and exit.
    if (clickedWithin && !targetingChild) {
      clickingWithin = false;
    }
    // Tabbing to a toolbar button: allow it, don't exit edit mode.
    if (!clickedWithin && targetingChild) {
      return;
    }
    if (escaping) return;

    dispatch("blur", event);
    if (canSave) {
      handleSave(true);
    } else {
      handleCancel(true);
    }
  }

  function removeFocus() {
    inputRef?.blur();
    focused = false;
  }

  function handleKeyDown(event) {
    escaping = true;
    if (event.key === "Escape") {
      removeFocus();
      handleCancel(true);
    } else if (event.key === "Enter") {
      removeFocus();
      if (canSave) handleSave(false);
    }
    escaping = false;
  }

  function handleToolbarMouseDown(event) {
    const button = /** @type {HTMLElement} */ (event.target).closest("button");
    if (!button) return;

    clickingWithin = true;
    const isDisabled =
      button.hasAttribute("disabled") ||
      button.getAttribute("aria-disabled") === "true";
    if (isDisabled) {
      event.preventDefault();
    }
  }
</script>

<div bind:this={ref} data-component-name="InlineEdit" {...$$restProps}>
  <div
    bind:this={containerRef}
    class={containerClass}
    on:focusin={handleFocus}
    on:focusout={handleBlur}
  >
    <input
      bind:this={inputRef}
      {id}
      type="text"
      class="bx--edit-in-place__text-input bx--text-input"
      {placeholder}
      bind:value
      readonly={readonly || undefined}
      disabled={disabled || undefined}
      on:keydown={handleKeyDown}
      aria-label={labelText}
      aria-invalid={showInvalid || undefined}
      aria-describedby={showInvalid ? errorId : undefined}
    >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="bx--edit-in-place__toolbar"
      on:mousedown={handleToolbarMouseDown}
    >
      {#if showInvalid}
        <WarningFilled size={16} class="bx--edit-in-place__warning-icon" />
      {/if}
      {#if disabled}
      <!-- No edit affordance: the field is fully inert. -->
      {:else if readonly}
        <Toggletip
          icon={EditOff}
          iconDescription={readonlyLabel ?? "Edit off"}
          align="center"
          direction="top"
        >
          <p>
            {readonlyToggletipText ??
              "This field is read-only and cannot be edited"}
          </p>
        </Toggletip>
      {:else if focused}
        <Button
          kind="ghost"
          size="small"
          icon={Close}
          iconDescription={cancelLabel}
          tooltipPosition="top"
          disabled={!canCancel}
          class="bx--edit-in-place__btn bx--edit-in-place__btn-cancel"
          on:click={() => handleCancel(false)}
        />
        <Button
          kind="ghost"
          size="small"
          icon={Checkmark}
          iconDescription={saveLabel}
          tooltipPosition="top"
          disabled={!canSave}
          class="bx--edit-in-place__btn bx--edit-in-place__btn-save"
          on:click={() => handleSave(false)}
        />
      {:else}
        <Button
          kind="ghost"
          size="small"
          icon={Edit}
          iconDescription={editLabel}
          tooltipPosition="top"
          class="bx--edit-in-place__btn bx--edit-in-place__btn-edit {editAlwaysVisible
            ? 'bx--edit-in-place__btn-edit--always-visible'
            : ''}"
          on:click={handleFocus}
        />
      {/if}
    </div>
  </div>
  {#if showInvalid}
    <p class:bx--edit-in-place__warning-text={true} id={errorId}>
      {invalidText}
    </p>
  {/if}
</div>
