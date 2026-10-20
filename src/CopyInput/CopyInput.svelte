<script>
  import { COPY_FEEDBACK_TIMEOUT_MS } from "../utils/copy-feedback.js";
  import { copyText } from "../utils/copy-text.js";

  /**
   * @template [Icon=any]
   * @event {null} copy
   * @event {{ error: unknown }} copy:error
   * @event {MouseEvent} mouseenter:copy-button
   * @event {MouseEvent} mouseleave:copy-button
   */

  /**
   * Specify the value to display and copy.
   * @type {string}
   */
  export let value = "";

  /**
   * Set to `"password"` to obscure the value.
   * Use `revealMode` to reveal the value on interaction.
   * @type {"text" | "password"}
   */
  export let type = "text";

  /**
   * Specify the text to show in place of `value`, such as an API key
   * masked to `sk_live_••••4f2a`. The copy button still copies `value`,
   * and `revealMode` shows `value` on interaction.
   * Unlike `type="password"`, browsers don't offer to save it.
   * @type {string}
   */
  export let maskedValue = undefined;

  /**
   * Control when a `type="password"` value or a `maskedValue` is revealed.
   * Has no effect unless `type` is `"password"` or `maskedValue` is set.
   * - `"focus"`: reveal while the input is focused.
   * - `"hover-focus"`: reveal while the input is hovered or focused.
   * When unset, the value stays obscured; the copy button still copies the full value.
   * @type {"focus" | "hover-focus"}
   */
  export let revealMode = undefined;

  /**
   * Set to `true` to select the full value when the input receives focus.
   * @type {boolean}
   */
  export let selectTextOnFocus = false;

  /**
   * Set the size of the input.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Set to `true` to disable the input and copy button. The copy button is
   * also disabled while `value` is empty, unless `copy` is overridden.
   */
  export let disabled = false;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   * Cannot be combined with the inline variant.
   */
  export let fluid = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set the feedback text shown after clicking the copy button */
  export let feedback = "Copied!";

  /** Set the feedback text shown when copying fails */
  export let errorFeedback = "Failed to copy";

  /**
   * Specify an icon to render during the feedback window (for example, after copying).
   * When unset, the copy icon is always shown.
   * @type {Icon}
   */
  export let feedbackIcon = /** @type {Icon} */ (undefined);

  /** Set the timeout duration (ms) to display the feedback text */
  export let feedbackTimeout = COPY_FEEDBACK_TIMEOUT_MS;

  /** Set the title and ARIA label for the copy button */
  export let iconDescription = "Copy to clipboard";

  /**
   * Override the default copy behavior (`navigator.clipboard.writeText` with
   * a `document.execCommand("copy")` fallback). Failures reject so the control
   * can show `errorFeedback` and dispatch `copy:error`.
   * @type {(text: string) => void | Promise<void>}
   */
  export let copy = copyText;

  /**
   * Set to `true` to render the feedback tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /**
   * Set the position of the copy button's tooltip.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set the alignment of the copy button's tooltip.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "end";

  import { createEventDispatcher, getContext, tick } from "svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import { buildFieldIds, joinDescribedBy } from "../utils/field-status.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { reflectDefaultValue } from "../utils/reflect-default-value.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const ctx = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;

  let focused = false;
  let hovered = false;

  // Browsers still fire mouseenter on disabled inputs; never reveal those.
  $: revealed =
    !disabled &&
    (revealMode === "hover-focus"
      ? focused || hovered
      : revealMode === "focus"
        ? focused
        : false);
  $: inputType = type === "password" && !revealed ? "password" : "text";
  $: masked = maskedValue != null;
  $: shownValue = masked && !revealed ? maskedValue : value;
  $: isFluid = !inline && (fluid || !!ctx?.isFluid);
  $: ({ helperId } = buildFieldIds(id));
  $: hasLabel = !!(labelText || $$slots.labelChildren);
  $: labelId = id ? `${id}-label` : undefined;

  function handleFocus() {
    focused = true;
    if (selectTextOnFocus && !disabled) {
      ref?.select();
      // Revealing a mask swaps the input's text, which clears that
      // selection, so select again once the value is shown.
      if (masked && revealMode) tick().then(() => ref?.select());
    }
  }

  function handleBlur() {
    focused = false;
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--text-input-wrapper={true}
  class:bx--text-input-wrapper--inline={inline}
  class:bx--text-input--fluid={isFluid}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if inline}
    <div class:bx--text-input__label-helper-wrapper={true}>
      {#if hasLabel}
        <label
          id={labelId}
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
          <slot name="labelChildren"> {labelText} </slot>
        </label>
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
  {#if !inline && hasLabel}
    <label
      id={labelId}
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </label>
  {/if}
  <div
    class:bx--text-input__field-outer-wrapper={true}
    class:bx--text-input__field-outer-wrapper--inline={inline}
  >
    <!-- Hover spans the copy button, which overlaps the input's right edge,
         so reaching for it does not re-obscure the value. -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class:bx--text-input__field-wrapper={true}
      class:bx--copy-input__field-wrapper={true}
      on:mouseenter={() => (hovered = true)}
      on:mouseleave={() => (hovered = false)}
    >
      <input
        bind:this={ref}
        use:preserveFocusSelection={selectTextOnFocus && !disabled}
        use:reflectDefaultValue={shownValue}
        readonly
        type={inputType}
        value={shownValue}
        {disabled}
        {id}
        name={masked ? undefined : name}
        class:bx--text-input={true}
        class:bx--text-input--xs={effectiveSize === "xs"}
        class:bx--text-input--sm={effectiveSize === "sm"}
        class:bx--text-input--xl={effectiveSize === "xl"}
        {...$$restProps}
        aria-describedby={joinDescribedBy(
          helperText && !isFluid ? helperId : undefined,
          $$restProps["aria-describedby"],
        )}
        on:focus
        on:focus={handleFocus}
        on:blur
        on:blur={handleBlur}
      >
      {#if masked && name}
        <!-- The form submits the value, not the mask. -->
        <input type="hidden" {name} {value} {disabled} form={$$restProps.form}>
      {/if}
      {#if isFluid}
        <hr class:bx--text-input__divider={true}>
      {/if}
      <CopyButton
        text={value}
        {feedback}
        {errorFeedback}
        {feedbackIcon}
        {feedbackTimeout}
        {iconDescription}
        {portalTooltip}
        {tooltipPosition}
        {tooltipAlignment}
        disabled={disabled || (!value && copy === copyText)}
        {copy}
        aria-describedby={hasLabel ? labelId : undefined}
        on:copy
        on:copy:error
        on:mouseenter={(event) => dispatch("mouseenter:copy-button", event)}
        on:mouseleave={(event) => dispatch("mouseleave:copy-button", event)}
      />
    </div>
    {#if !inline && !isFluid && helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
  </div>
</div>
