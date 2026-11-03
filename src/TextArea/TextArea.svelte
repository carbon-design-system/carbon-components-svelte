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
   * @type {number | undefined}
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
   * Specify the max count.
   * Counts characters by default; see `counterMode`.
   * @type {number | undefined}
   */
  export let maxCount = undefined;

  /**
   * Specify what `maxCount` limits.
   * `"word"` counts words with `Intl.Segmenter` when available.
   * @type {"character" | "word"}
   */
  export let counterMode = "character";

  /**
   * Override the counter text read by screen readers.
   * @type {((count: number, max: number) => string) | undefined}
   * @default `${count} of ${max} characters`, or `${count} of ${max} words` when `counterMode` is `"word"`
   */
  export let counterText = undefined;

  /**
   * Specify the text announced when the limit is reached.
   * @type {string | undefined}
   * @default "Character limit reached", or "Word limit reached" when `counterMode` is `"word"`
   */
  export let limitReachedText = undefined;

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
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the textarea HTML element.
   * @bindable readonly
   * @type {null | HTMLTextAreaElement}
   */
  export let ref = null;

  /** Set to `true` to select the textarea's text when it receives focus */
  export let selectTextOnFocus = false;

  import { afterUpdate, getContext, onMount, tick } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { createFrameJob } from "../utils/frame-batch.js";
  import { graphemeCount, truncateGraphemes } from "../utils/grapheme-count.js";
  import { createLimitAnnouncement } from "../utils/limit-announcement.js";
  import { noop } from "../utils/noop.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { wordCount, wordLimitAction } from "../utils/word-count.js";

  const formContext = getContext(FORM_CONTEXT_KEY);

  /**
   * @param {string} text
   * @param {"character" | "word"} mode
   */
  function measure(text, mode) {
    return mode === "word" ? wordCount(text) : graphemeCount(text);
  }

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);

  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: counterId = `counter-${id}`;
  $: count = measure(value ?? "", counterMode);
  $: resolvedCounterText =
    counterText ??
    ((c, m) =>
      `${c} of ${m} ${counterMode === "word" ? "words" : "characters"}`);
  $: resolvedLimitReachedText =
    limitReachedText ??
    (counterMode === "word" ? "Word limit reached" : "Character limit reached");
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: overCount =
    typeof maxCount === "number" && count > maxCount && !disabled && !readonly;
  $: isFluid = fluid || !!formContext?.isFluid;
  $: hasMaxCount = typeof maxCount === "number";
  $: errorMessageId = showInvalid && invalidText ? errorId : undefined;
  $: describedBy =
    [
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
      hasMaxCount ? counterId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const limitAnnouncement = createLimitAnnouncement(
    measure(value ?? "", counterMode),
  );

  onMount(() => limitAnnouncement.cancel);

  $: limitAnnouncement.track(count, maxCount, resolvedLimitReachedText);

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

  // Resizing reads styles, collapses the height to measure the content, then
  // sets the final height. Every growing TextArea scheduled in a frame runs
  // each of those steps together, so they share one layout rather than
  // forcing one apiece.

  /** Read the styles that size the field, before any height is written. */
  function readSizing() {
    if (!ref) return;

    const computed = getComputedStyle(ref);
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;
    const isBorderBox = computed.boxSizing === "border-box";

    let maxContentAndPaddingHeight;
    if (typeof maxRows === "number" && maxRows > 0) {
      let lineHeight = Number.parseFloat(computed.lineHeight);
      if (Number.isNaN(lineHeight)) {
        lineHeight = Number.parseFloat(computed.fontSize);
      }
      maxContentAndPaddingHeight =
        maxRows * lineHeight + paddingTop + paddingBottom;
    }

    return {
      paddingTop,
      paddingBottom,
      borderTop,
      borderBottom,
      isBorderBox,
      maxContentAndPaddingHeight,
    };
  }

  /** @param {ReturnType<typeof readSizing>} sizing */
  function collapse(sizing) {
    if (!ref || !sizing) return;
    ref.style.height = "auto";
    return sizing;
  }

  /** @param {ReturnType<typeof readSizing>} sizing */
  function measureContent(sizing) {
    if (!ref || !sizing) return;
    return { sizing, scrollHeight: ref.scrollHeight };
  }

  /** @param {ReturnType<typeof measureContent>} measured */
  function applyHeight(measured) {
    if (!ref || !measured) return;

    const { sizing, scrollHeight } = measured;
    const { paddingTop, paddingBottom, borderTop, borderBottom } = sizing;
    const { maxContentAndPaddingHeight } = sizing;

    // `height` excludes padding/border under content-box but includes them
    // under border-box, while `scrollHeight` always includes padding only.
    const toStyleHeight = (contentAndPaddingHeight) =>
      sizing.isBorderBox
        ? contentAndPaddingHeight + borderTop + borderBottom
        : contentAndPaddingHeight - paddingTop - paddingBottom;

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

  const resizeJob = createFrameJob([
    readSizing,
    collapse,
    measureContent,
    applyHeight,
  ]);

  afterUpdate(() => {
    if (!ref) return;

    if (grow) {
      resizeJob.schedule();
    } else {
      ref.style.height = "";
      ref.style.overflowY = "";
    }
  });

  let lastWidth;

  onMount(() => {
    if (typeof ResizeObserver === "undefined") return;

    const stopObserving = ref
      ? observeResize(ref, (entry) => {
          const { width } = entry.contentRect;
          if (grow && width !== lastWidth) {
            lastWidth = width;
            resizeJob.schedule();
          }
        })
      : noop;

    document.fonts?.ready?.then(() => {
      if (grow) resizeJob.schedule();
    });

    return () => {
      stopObserving();
      resizeJob.cancel();
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

    if (counterMode === "word") {
      const action = wordLimitAction(current, start, end, data, maxCount);
      if (action === "allow") return;

      event.preventDefault();
      if (action === "block") return;

      ref.setRangeText(action.insert, start, end, "end");
      ref.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

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
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={disabled}
          class:bx--label--slotted={isFluid && $$slots.labelChildren}
          use:titleWhenTruncated={{
            enabled: isFluid && !$$slots.labelChildren,
          }}
        >
          <slot name="labelChildren">{labelText}</slot>
        </label>
      {/if}
      {#if hasMaxCount}
        <div
          class:bx--label={true}
          class:bx--label--disabled={disabled}
          class:bx--text-area__label-counter={true}
          class:bx--text-area__label-counter--error={overCount}
        >
          <!-- The hidden text comes first, so its 1px box sits at the start
               of the count. After it, the box would hang 1px past a counter
               flush with the page edge and scroll the page. -->
          <span id={counterId} class:bx--visually-hidden={true}>
            {resolvedCounterText(count, maxCount)}
          </span>
          <span aria-hidden="true">{count}/{maxCount}</span>
        </div>
      {/if}
    </div>
  {/if}
  {#if typeof maxCount === "number"}
    <div class:bx--visually-hidden={true} aria-live="polite" aria-atomic="true">
      {$limitAnnouncement}
    </div>
  {/if}
  <div
    class:bx--text-area__wrapper={true}
    class:bx--text-area__wrapper--readonly={readonly}
    class:bx--text-area__wrapper--warn={showWarn}
    class:bx--text-area__wrapper--decorator={$$slots.decorator && !isFluid}
    class:bx--text-area__wrapper--ai-label={$aiLabelState === "active"}
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
      use:preserveFocusSelection={selectTextOnFocus && !disabled}
      use:formReset={handleFormReset}
      bind:value
      aria-invalid={showInvalid || overCount ? "true" : undefined}
      aria-errormessage={errorMessageId}
      data-warn={showWarn || undefined}
      {disabled}
      {id}
      {name}
      {cols}
      {rows}
      {placeholder}
      {readonly}
      class:bx--text-area={true}
      class:bx--text-area--invalid={showInvalid}
      class:bx--text-area--warning={showWarn}
      style:resize={typeof cols === "number" || grow ? "none" : undefined}
      {...$$restProps}
      aria-describedby={joinDescribedBy(
        describedBy,
        $$restProps["aria-describedby"],
      )}
      on:change
      on:input
      on:keydown
      on:keyup
      on:focus
      on:focus={handleFocus}
      on:blur
      on:paste
      on:beforeinput={handleBeforeInput}></textarea>
    {#if $$slots.decorator}
      <Decorator
        class="bx--field-decorator bx--text-area__inner-wrapper--decorator"
        state={aiLabelState}
      >
        <slot name="decorator" />
      </Decorator>
    {/if}
    {#if isFluid}
      <hr class:bx--text-area__divider={true} />
      {#if showInvalid}
        <div
          id={errorId}
          class:bx--form-requirement={true}
          role={invalidText ? "alert" : undefined}
        >
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
  {#if !isFluid && showInvalid && invalidText}
    <div id={errorId} class:bx--form-requirement={true} role="alert">
      {invalidText}
    </div>
  {/if}
  {#if !isFluid && showWarn && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
</div>
