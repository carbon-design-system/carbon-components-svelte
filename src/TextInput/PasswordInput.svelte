<script>
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
   * Follows the field when the owning form resets.
   * @type {number | string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Set to `"text"` to toggle the password visibility.
   * @type {"text" | "password"}
   * @bindable writable
   */
  export let type = "password";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the hide password label text */
  export let hidePasswordLabel = "Hide password";

  /** Specify the show password label text */
  export let showPasswordLabel = "Show password";

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "end";

  /**
   * Set the position of the tooltip relative to the icon.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the text for the invalid state */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set to `true` to use inline version */
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

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /**
   * Set to `true` to always render the tooltip in a portal, or `false` to
   * keep it in place. Left unset, the tooltip opens in a portal inside a
   * `Modal`, or when a box around it (`overflow` other than `visible`, such
   * as a `DataTable`) would cut it off.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { getContext, onMount, tick } from "svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import EditOff from "../icons/EditOff.svelte";
  import View from "../icons/View.svelte";
  import ViewOff from "../icons/ViewOff.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { createAnchoredTooltip } from "../utils/anchored-tooltip.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { clippedBy } from "../utils/fit-align.js";
  import { formReset } from "../utils/form-reset.js";
  import { noop } from "../utils/noop.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { uniqueId } from "../utils/unique-id.js";

  const ctx = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: isFluid = !inline && (fluid || !!ctx?.isFluid);
  // Set for one open when the in-place tooltip turns out to be cut off by
  // a box around it (a scrolling panel, a DataTable): it shows in a portal
  // instead. Only when `portalTooltip` is left unset.
  let portalWhenClipped = false;
  $: effectivePortalTooltip =
    portalTooltip === undefined
      ? !!insideModal || portalWhenClipped
      : portalTooltip;

  // The position classes place the in-place tooltip and its caret. A
  // portalled one has its own, so the toggle drops them, as Button does.
  $: inlinePosition = effectivePortalTooltip
    ? undefined
    : effectiveTooltipPosition;
  $: inlineAlignment = effectivePortalTooltip
    ? undefined
    : effectiveTooltipAlignment;

  /** @type {null | HTMLButtonElement} */
  let toggleButtonRef = null;
  /** @type {null | HTMLSpanElement} */
  let tooltipRef = null;

  // The toggle's tooltip opens without a delay, but still takes the tooltip
  // group's active slot so it never overlaps another tooltip, and skips the
  // fade-in when it takes over from a tooltip in the same group. Escape
  // hides it until the next hover or focus.
  const tooltip = createAnchoredTooltip({
    group: getTooltipGroup(),
    enabled: () => !disabled,
    dismissOnClick: false,
    enterDelayMs: () => 0,
  });
  const {
    open: tooltipOpen,
    hidden: tooltipHidden,
    instant: tooltipInstant,
  } = tooltip;

  let detachTooltip = noop;

  $: {
    detachTooltip();
    detachTooltip = toggleButtonRef ? tooltip.attach(toggleButtonRef) : noop;
  }

  $: if (disabled) tooltip.hide();

  $: if (!$tooltipOpen) portalWhenClipped = false;
  $: inlineOpen = !effectivePortalTooltip && $tooltipOpen;
  // The in-place tooltip is laid out while hidden, so it measures where it
  // shows. Measured after the update, so the swap lands before paint.
  $: if (inlineOpen) tick().then(portalIfClipped);

  function portalIfClipped() {
    if (portalTooltip !== undefined || !inlineOpen || !tooltipRef) return;
    if (clippedBy(tooltipRef)) portalWhenClipped = true;
  }

  onMount(() => {
    return () => {
      detachTooltip();
      tooltip.destroy();
    };
  });

  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: tooltipLabel = type === "text" ? hidePasswordLabel : showPasswordLabel;

  function handleFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => ref?.select());
    }
  }

  // A form reset restores the field without an input event, and this is a
  // one-way value write, not bind:value, so no Svelte version syncs it back
  // on its own (Svelte 5's built-in resync only instruments genuine two-way
  // bindings — see the note in the TextArea prompt, item 23).
  function handleFormReset() {
    if (ref) value = ref.value;
  }

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--text-input-wrapper={true}
  class:bx--password-input-wrapper={true}
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
      class:bx--visually-hidden={hideLabel && !helperText}
    >
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
        class:bx--label--inline={inline}
        class:bx--label--inline--xs={inline && effectiveSize === "xs"}
        class:bx--label--inline--sm={inline && effectiveSize === "sm"}
        class:bx--label--inline--xl={inline && effectiveSize === "xl"}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
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
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}
      class:bx--label--inline={inline}
      class:bx--label--inline--xs={inline && effectiveSize === "xs"}
      class:bx--label--inline--sm={inline && effectiveSize === "sm"}
      class:bx--label--inline--xl={inline && effectiveSize === "xl"}
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
    >
      <slot name="labelChildren">{labelText}</slot>
    </label>
  {/if}
  <div
    class:bx--text-input__field-outer-wrapper={true}
    class:bx--text-input__field-outer-wrapper--inline={inline}
  >
    <div
      class:bx--text-input__field-wrapper={true}
      class:bx--text-input__field-wrapper--warning={showWarn}
      data-invalid={showInvalid || undefined}
      data-warn={showWarn || undefined}
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
        {id}
        {name}
        {placeholder}
        {type}
        value={value ?? ""}
        {disabled}
        {readonly}
        class:bx--text-input={true}
        class:bx--password-input={true}
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
            invalidText,
            warnText,
            helperText,
            isFluid,
            errorId,
            warnId,
            helperId,
            includeErrorId: false,
          }),
          $$restProps["aria-describedby"],
        )}
        on:change
        on:input
        on:input={(event) => {
          value = /** @type {HTMLInputElement} */ (event.target).value;
        }}
        on:keydown
        on:keyup
        on:focus
        on:focus={handleFocus}
        on:blur
        on:paste
      />
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
      <button
        bind:this={toggleButtonRef}
        type="button"
        {disabled}
        class:bx--text-input--password__visibility__toggle={true}
        class:bx--btn={true}
        class:bx--btn--icon-only={true}
        class:bx--btn--disabled={disabled}
        class:bx--tooltip__trigger={true}
        class:bx--tooltip--a11y={true}
        class:bx--tooltip--portal-active={effectivePortalTooltip}
        class:bx--tooltip--top={inlinePosition === "top"}
        class:bx--tooltip--right={inlinePosition === "right"}
        class:bx--tooltip--bottom={inlinePosition === "bottom"}
        class:bx--tooltip--left={inlinePosition === "left"}
        class:bx--tooltip--align-start={inlineAlignment === "start"}
        class:bx--tooltip--align-center={inlineAlignment === "center"}
        class:bx--tooltip--align-end={inlineAlignment === "end"}
        class:bx--tooltip--hidden={!effectivePortalTooltip && $tooltipHidden}
        class:bx--tooltip--visible={inlineOpen}
        class:bx--tooltip--instant={!effectivePortalTooltip && $tooltipInstant}
        aria-label={effectivePortalTooltip || disabled
          ? tooltipLabel
          : undefined}
        on:click={() => {
          type = type === "password" ? "text" : "password";
        }}
      >
        {#if !disabled && !effectivePortalTooltip}
          <span bind:this={tooltipRef} class:bx--assistive-text={true}>
            {tooltipLabel}
          </span>
        {/if}
        {#if type === "text"}
          <ViewOff class="bx--icon-visibility-off" />
        {:else}
          <View class="bx--icon-visibility-on" />
        {/if}
      </button>
    </div>
    {#if !isFluid && showInvalid && invalidText}
      <div class:bx--form-requirement={true} id={errorId} role="alert">
        {invalidText}
      </div>
    {/if}
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
    {#if !isFluid && showWarn && warnText}
      <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
    {/if}
  </div>
</div>

{#if effectivePortalTooltip && !disabled}
  <PortalTooltip
    anchor={toggleButtonRef}
    direction={effectiveTooltipPosition === "top" ? "top" : "bottom"}
    open={$tooltipOpen}
    text={tooltipLabel}
    on:mouseenter={tooltip.handleTooltipMouseenter}
    on:mouseleave={tooltip.handleTooltipMouseleave}
    on:cover={tooltip.handleTooltipCover}
  />
{/if}
