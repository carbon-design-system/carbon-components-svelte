<script>
  /**
   * Specify the textarea value.
   * Follows the field when the owning form resets.
   * @type {null | string}
   * @bindable writable
   */
  export let value = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /**
   * Specify the number of cols.
   * If specified, the textarea will not be resizable.
   * Override this using the `resize` style attribute.
   * @type {number}
   */
  export let cols = undefined;

  /** Specify the number of rows */
  export let rows = 4;

  /**
   * Set to `true` to grow the textarea with its content.
   * `rows` is the minimum height. Default `false`.
   */
  export let grow = false;

  /**
   * Maximum number of rows when `grow` is `true`.
   * Unset means the field grows without a cap.
   * @type {number | undefined}
   */
  export let maxRows = undefined;

  /**
   * Specify the max character count.
   * @type {number}
   */
  export let maxCount = undefined;

  /**
   * Override the character counter text read by screen readers.
   * @type {(count: number, max: number) => string}
   */
  export let counterText = function counterText(count, max) {
    return `${count} of ${max} characters`;
  };

  /** Specify the text announced when the character limit is reached */
  export let limitReachedText = "Character limit reached";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

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

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /** Set an id for the textarea element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the textarea HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to select the textarea's text when it receives focus */
  export let selectTextOnFocus = false;

  import { afterUpdate, getContext, onMount, tick } from "svelte";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { formReset } from "../utils/form-reset.js";
  import { graphemeCount, truncateGraphemes } from "../utils/grapheme-count.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { uniqueId } from "../utils/unique-id.js";

  const formContext = getContext(FORM_CONTEXT_KEY);

  $: helperId = `helper-${id}`;
  $: counterId = `counter-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: count = graphemeCount(value ?? "");
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
  $: overCount =
    typeof maxCount === "number" && count > maxCount && !disabled && !readonly;
  $: isFluid = fluid || !!formContext?.isFluid;
  $: hasMaxCount = typeof maxCount === "number";
  $: errorMessageId = showInvalid ? errorId : undefined;
  $: describedBy =
    [
      showInvalid
        ? null
        : showWarn && !isFluid
          ? warnId
          : helperText && !isFluid
            ? helperId
            : null,
      hasMaxCount ? counterId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  let prevCount = graphemeCount(value ?? "");
  let limitAnnouncement = "";

  $: {
    if (
      typeof maxCount === "number" &&
      maxCount > 0 &&
      count === maxCount &&
      prevCount !== maxCount
    ) {
      limitAnnouncement = limitReachedText;
    } else if (count !== maxCount) {
      limitAnnouncement = "";
    }
    prevCount = count;
  }

  function handleFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => ref?.select());
    }
  }

  // A form reset restores the field without an input event. Svelte 5 syncs
  // `bind:value` back on its own; Svelte 3 and 4 do not, so read the field.
  function handleFormReset() {
    if (ref) value = ref.value;
  }

  function resize() {
    if (!ref) return;

    const computed = getComputedStyle(ref);
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;
    const isBorderBox = computed.boxSizing === "border-box";

    // `height` excludes padding/border under content-box but includes them
    // under border-box, while `scrollHeight` always includes padding only.
    const toStyleHeight = (contentAndPaddingHeight) =>
      isBorderBox
        ? contentAndPaddingHeight + borderTop + borderBottom
        : contentAndPaddingHeight - paddingTop - paddingBottom;

    ref.style.height = "auto";
    const { scrollHeight } = ref;

    let maxContentAndPaddingHeight;
    if (typeof maxRows === "number" && maxRows > 0) {
      let lineHeight = Number.parseFloat(computed.lineHeight);
      if (Number.isNaN(lineHeight)) {
        lineHeight = Number.parseFloat(computed.fontSize);
      }
      maxContentAndPaddingHeight =
        maxRows * lineHeight + paddingTop + paddingBottom;
    }

    if (
      maxContentAndPaddingHeight !== undefined &&
      scrollHeight > maxContentAndPaddingHeight
    ) {
      ref.style.height = `${toStyleHeight(maxContentAndPaddingHeight)}px`;
      ref.style.overflowY = "auto";
    } else {
      ref.style.height = `${toStyleHeight(scrollHeight)}px`;
      ref.style.overflowY = "hidden";
    }
  }

  const scheduleResize = rafThrottle(resize);

  afterUpdate(() => {
    if (!ref) return;

    if (grow) {
      scheduleResize();
    } else {
      ref.style.height = "";
      ref.style.overflowY = "";
    }
  });

  let lastWidth;

  onMount(() => {
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      if (grow && width !== lastWidth) {
        lastWidth = width;
        scheduleResize();
      }
    });
    if (ref) observer.observe(ref);

    document.fonts?.ready?.then(() => {
      if (grow) scheduleResize();
    });

    return () => {
      observer.disconnect();
      scheduleResize.cancel();
    };
  });

  /** @param {InputEvent} event */
  function handleBeforeInput(event) {
    if (typeof maxCount !== "number" || event.isComposing || !ref) return;
    if (!event.inputType.startsWith("insert")) return;

    const data =
      event.data ??
      event.dataTransfer?.getData("text/plain") ??
      (event.inputType === "insertLineBreak" ||
      event.inputType === "insertParagraph"
        ? "\n"
        : "");
    if (!data) return;

    const { value: current, selectionStart: start, selectionEnd: end } = ref;
    const kept = current.slice(0, start) + current.slice(end);
    if (
      graphemeCount(kept.slice(0, start) + data + kept.slice(start)) <= maxCount
    ) {
      return;
    }

    event.preventDefault();

    const room = maxCount - graphemeCount(kept);
    if (room <= 0) return;

    ref.setRangeText(truncateGraphemes(data, room), start, end, "end");
    ref.dispatchEvent(new Event("input", { bubbles: true }));
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class:bx--form-item={true}
  class:bx--text-area--fluid={isFluid}
>
  {#if labelText || $$slots.labelChildren || hasMaxCount}
    <div class:bx--text-area__label-wrapper={true}>
      {#if labelText || $$slots.labelChildren}
        <label
          for={id}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel && !isFluid}
          class:bx--label--disabled={disabled}
          class:bx--label--slotted={isFluid && $$slots.labelChildren}
        >
          <slot name="labelChildren"> {labelText} </slot>
        </label>
      {/if}
      {#if hasMaxCount}
        <div
          class:bx--label={true}
          class:bx--label--disabled={disabled}
          class:bx--text-area__label-counter={true}
          class:bx--text-area__label-counter--error={overCount}
        >
          <span aria-hidden="true">{count}/{maxCount}</span>
          <span id={counterId} class:bx--visually-hidden={true}>
            {counterText(count, maxCount)}
          </span>
        </div>
      {/if}
    </div>
  {/if}
  {#if typeof maxCount === "number"}
    <div class:bx--visually-hidden={true} aria-live="polite" aria-atomic="true">
      {limitAnnouncement}
    </div>
  {/if}
  <div
    class:bx--text-area__wrapper={true}
    class:bx--text-area__wrapper--readonly={readonly}
    class:bx--text-area__wrapper--warn={showWarn}
    data-invalid={showInvalid || undefined}
    data-warn={showWarn || undefined}
  >
    {#if showInvalid && !isFluid}
      <WarningFilled class="bx--text-area__invalid-icon" />
    {/if}
    {#if showWarn && !isFluid}
      <WarningAltFilled
        class="bx--text-area__invalid-icon
        bx--text-area__invalid-icon--warning"
      />
    {/if}
    <textarea
      bind:this={ref}
      use:formReset={handleFormReset}
      bind:value
      aria-invalid={showInvalid || overCount || undefined}
      aria-errormessage={errorMessageId}
      aria-describedby={describedBy}
      data-warn={showWarn || undefined}
      {disabled}
      {id}
      {name}
      {cols}
      {rows}
      {placeholder}
      {readonly}
      class:bx--text-area={true}
      class:bx--text-area--light={light}
      class:bx--text-area--invalid={showInvalid}
      class:bx--text-area--warning={showWarn}
      style:resize={typeof cols === "number" || grow ? "none" : undefined}
      {...$$restProps}
      on:change
      on:input
      on:keydown
      on:keyup
      on:focus
      on:focus={handleFocus}
      on:blur
      on:paste
      on:beforeinput={handleBeforeInput}
    ></textarea>
    {#if isFluid}
      <hr class:bx--text-area__divider={true}>
      {#if showInvalid}
        <div id={errorId} class:bx--form-requirement={true} role="alert">
          {invalidText}
          <WarningFilled class="bx--text-area__invalid-icon" />
        </div>
      {/if}
      {#if showWarn}
        <div id={warnId} class:bx--form-requirement={true}>
          {warnText}
          <WarningAltFilled
            class="bx--text-area__invalid-icon
            bx--text-area__invalid-icon--warning"
          />
        </div>
      {/if}
    {/if}
  </div>
  {#if !isFluid && !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if !isFluid && showInvalid}
    <div id={errorId} class:bx--form-requirement={true} role="alert">
      {invalidText}
    </div>
  {/if}
  {#if !isFluid && showWarn}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
</div>
