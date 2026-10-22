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
   * - `"toggle"`: reveal only while the show/hide button is toggled on.
   * When unset, the value stays obscured; the copy button still copies the full value.
   * @type {"focus" | "hover-focus" | "toggle"}
   */
  export let revealMode = undefined;

  /**
   * Milliseconds a revealed value stays visible before it is obscured again.
   * Only applies when `revealMode` is `"toggle"`.
   * When unset, the value stays revealed until the toggle is clicked again.
   * @type {number}
   */
  export let revealTimeout = undefined;

  /**
   * Whether the value currently renders as text, in any reveal mode.
   * @bindable readonly
   */
  export let revealed = false;

  /** Set the show-value toggle's label and tooltip text while the value is obscured */
  export let showValueLabel = "Show value";

  /** Set the show-value toggle's label and tooltip text while the value is revealed */
  export let hideValueLabel = "Hide value";

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
   * Control when the copy button is visible.
   * Set to `"hover-focus"` to fade it in only while the field is hovered or has focus within.
   * @type {"always" | "hover-focus"}
   */
  export let copyButtonVisibility = "always";

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

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import View from "../icons/View.svelte";
  import ViewOff from "../icons/ViewOff.svelte";
  import { iconTooltipPortalGaps } from "../Portal/icon-tooltip-portal-gaps.js";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { buildFieldIds, joinDescribedBy } from "../utils/field-status.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { reflectDefaultValue } from "../utils/reflect-default-value.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const ctx = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;

  let focused = false;
  let hovered = false;
  let toggled = false;
  let toggleHovered = false;
  let toggleFocused = false;

  /** @type {null | HTMLButtonElement} */
  let toggleRef = null;

  const scheduleObscure = createDelayedSetter();

  // The toggle's tooltip joins the copy button's tooltip group, so moving
  // between the two hands off instantly and the delays are shared.
  const toggleHandoff = createTooltipHandoff({ group: getTooltipGroup() });
  const toggleTooltipActive = toggleHandoff.active;

  // Browsers still fire mouseenter on disabled inputs; never reveal those.
  $: revealed =
    !disabled &&
    (revealMode === "toggle"
      ? toggled
      : revealMode === "hover-focus"
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
  $: toggleLabel = toggled ? hideValueLabel : showValueLabel;
  $: showToggle = revealMode === "toggle" && (type === "password" || masked);
  $: toggleTooltipDirection = tooltipPosition === "top" ? "top" : "bottom";
  // Matches the copy button's own gap so both tooltips sit the same
  // distance from their trigger.
  $: toggleTooltipGaps = iconTooltipPortalGaps(
    toggleTooltipDirection,
    "center",
  );
  $: toggleTooltipOpen =
    (toggleHovered || toggleFocused) && $toggleTooltipActive;

  $: if (!showToggle) {
    toggled = false;
    scheduleObscure.cancel();
    if (toggleHovered || toggleFocused) {
      toggleHovered = false;
      toggleFocused = false;
      toggleHandoff.release();
    }
    toggleHandoff.cancel();
  }

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

  function handleToggleClick() {
    toggled = !toggled;
    if (!toggled) {
      scheduleObscure.cancel();
    } else if (revealTimeout > 0) {
      scheduleObscure(revealTimeout, () => {
        toggled = false;
      });
    }
  }

  function handleToggleMouseEnter() {
    toggleHandoff.scheduleEnter(() => {
      toggleHovered = true;
    });
  }

  function handleToggleMouseLeave() {
    toggleHandoff.scheduleLeave(() => {
      toggleHovered = false;
      if (!toggleFocused) toggleHandoff.release();
    });
  }

  function handleToggleFocus() {
    toggleFocused = true;
    toggleHandoff.claim();
  }

  function handleToggleBlur() {
    toggleFocused = false;
    if (!toggleHovered) toggleHandoff.release();
  }

  onMount(() => {
    return () => {
      scheduleObscure.cancel();
      toggleHandoff.cancel();
      toggleHandoff.release();
    };
  });
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
      class:bx--copy-input__field-wrapper--toggle={showToggle}
      class:bx--copy-input__field-wrapper--copy-on-hover={copyButtonVisibility ===
        "hover-focus"}
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
      {#if showToggle}
        <button
          bind:this={toggleRef}
          type="button"
          {disabled}
          aria-label={toggleLabel}
          aria-pressed={toggled}
          class:bx--copy-input__reveal-toggle={true}
          class:bx--text-input--password__visibility__toggle={true}
          class:bx--btn={true}
          class:bx--btn--icon-only={true}
          class:bx--btn--disabled={disabled}
          class:bx--tooltip__trigger={true}
          class:bx--tooltip--a11y={true}
          class:bx--tooltip--portal-active={true}
          on:click={handleToggleClick}
          on:mouseenter={handleToggleMouseEnter}
          on:mouseleave={handleToggleMouseLeave}
          on:focus={handleToggleFocus}
          on:blur={handleToggleBlur}
        >
          {#if toggled}
            <ViewOff class="bx--icon-visibility-off" />
          {:else}
            <View class="bx--icon-visibility-on" />
          {/if}
        </button>
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

{#if toggleRef}
  <PortalTooltip
    anchor={toggleRef}
    direction={toggleTooltipDirection}
    open={toggleTooltipOpen}
    text={toggleLabel}
    tooltipType="icon"
    gapTop={toggleTooltipGaps.gapTop}
    gapBottom={toggleTooltipGaps.gapBottom}
  />
{/if}
