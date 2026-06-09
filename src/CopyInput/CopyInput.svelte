<script>
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
   * When unset, the value stays obscured; the copy button still copies the full value.
   * @type {"focus" | "hover-focus"}
   */
  export let revealMode = undefined;

  /**
   * Set to `false` to skip selecting the full value when the input receives focus.
   * @type {boolean}
   */
  export let selectOnFocus = true;

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

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

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
   * Override the default copy behavior of using the navigator.clipboard.writeText API to copy text.
   * @type {(text: string) => void | Promise<void>}
   */
  export let copy = undefined;

  /**
   * Set to `true` to render the feedback tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { createEventDispatcher, getContext } from "svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:Form");
  const isFluid = !!ctx && ctx.isFluid;

  let focused = false;
  let hovered = false;

  $: revealed =
    revealMode === "hover-focus"
      ? focused || hovered
      : revealMode === "focus"
        ? focused
        : false;
  $: inputType = type === "password" && !revealed ? "password" : "text";
  $: helperId = `helper-${id}`;

  function handleFocus() {
    focused = true;
    if (selectOnFocus && !disabled) {
      ref?.select();
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
  class:bx--text-input-wrapper--light={light}
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
    >
      <input
        bind:this={ref}
        readonly
        type={inputType}
        {value}
        aria-describedby={helperText ? helperId : undefined}
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
      <CopyButton
        text={value}
        {feedback}
        {feedbackIcon}
        {feedbackTimeout}
        {iconDescription}
        {portalTooltip}
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
