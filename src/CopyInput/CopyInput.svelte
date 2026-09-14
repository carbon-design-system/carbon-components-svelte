<script>
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
   * Control when a `type="password"` value is revealed.
   * Has no effect unless `type` is `"password"`.
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
  export let selectOnFocus = false;

  /**
   * Set the size of the input.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input and copy button */
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
  export let feedbackTimeout = 2000;

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
   * Set how the feedback tooltip is rendered.
   * By default, it is rendered in a portal so it is never clipped by an
   * `overflow: hidden` container. Set to `false` to use Carbon's inline
   * feedback caret instead.
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
  export let tooltipAlignment = "center";

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import View from "../icons/View.svelte";
  import ViewOff from "../icons/ViewOff.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:Form");

  let focused = false;
  let hovered = false;
  let toggled = false;
  let toggleHovered = false;
  let toggleFocused = false;

  /** @type {null | HTMLButtonElement} */
  let toggleRef = null;

  let revealTimer;

  $: revealed =
    revealMode === "toggle"
      ? toggled
      : revealMode === "hover-focus"
        ? focused || hovered
        : revealMode === "focus"
          ? focused
          : false;
  $: inputType = type === "password" && !revealed ? "password" : "text";
  $: isFluid = !inline && (fluid || !!ctx?.isFluid);
  $: helperId = `helper-${id}`;
  $: toggleLabel = toggled ? hideValueLabel : showValueLabel;

  $: if (revealMode !== "toggle" && toggled) {
    toggled = false;
    clearTimeout(revealTimer);
  }

  function handleFocus() {
    focused = true;
    if (selectOnFocus && !disabled) {
      ref?.select();
    }
  }

  function handleBlur() {
    focused = false;
  }

  function handleToggleClick() {
    toggled = !toggled;
    if (toggled) {
      if (revealTimeout > 0) {
        clearTimeout(revealTimer);
        revealTimer = setTimeout(() => {
          toggled = false;
        }, revealTimeout);
      }
    } else {
      clearTimeout(revealTimer);
    }
  }

  onMount(() => {
    return () => {
      clearTimeout(revealTimer);
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
  class:bx--text-input-wrapper--light={light}
  class:bx--text-input--fluid={isFluid}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if inline}
    <div class:bx--text-input__label-helper-wrapper={true}>
      {#if labelText || $$slots.labelChildren}
        <label
          for={id}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={disabled}
          class:bx--label--inline={inline}
          class:bx--label--inline--sm={size === "sm"}
          class:bx--label--inline--xl={size === "xl"}
          class:bx--label--slotted={isFluid && $$slots.labelChildren}
        >
          <slot name="labelChildren"> {labelText} </slot>
        </label>
      {/if}
      {#if !isFluid && helperText}
        <div
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
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </label>
  {/if}
  <div
    class:bx--text-input__field-outer-wrapper={true}
    class:bx--text-input__field-outer-wrapper--inline={inline}
  >
    <div
      class:bx--text-input__field-wrapper={true}
      class:bx--copy-input__field-wrapper={true}
      class:bx--copy-input__field-wrapper--toggle={type === "password" &&
        revealMode === "toggle"}
      class:bx--copy-input__field-wrapper--copy-on-hover={copyButtonVisibility ===
        "hover-focus"}
    >
      <input
        bind:this={ref}
        readonly
        type={inputType}
        {value}
        aria-describedby={helperText && !isFluid ? helperId : undefined}
        {disabled}
        {id}
        {name}
        class:bx--text-input={true}
        class:bx--text-input--light={light}
        class:bx--text-input--sm={size === "sm"}
        class:bx--text-input--xl={size === "xl"}
        {...$$restProps}
        on:focus
        on:focus={handleFocus}
        on:blur
        on:blur={handleBlur}
        on:mouseenter={() => (hovered = true)}
        on:mouseleave={() => (hovered = false)}
      >
      {#if isFluid}
        <hr class:bx--text-input__divider={true}>
      {/if}
      {#if type === "password" && revealMode === "toggle"}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
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
          on:mouseenter={() => (toggleHovered = true)}
          on:mouseleave={() => (toggleHovered = false)}
          on:focus={() => (toggleFocused = true)}
          on:blur={() => (toggleFocused = false)}
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
        {disabled}
        {copy}
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
    direction={tooltipPosition === "top" ? "top" : "bottom"}
    open={toggleHovered || toggleFocused}
    text={toggleLabel}
    tooltipType="icon"
  />
{/if}
