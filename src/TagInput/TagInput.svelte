<script>
  /**
   * @event {{ value: string; source: "enter" | "delimiter" | "paste" | "blur" }} add - Cancelable. Dispatched before a tag is added; call `preventDefault()` to keep it out.
   * @event {{ value: string; index: number }} remove - Cancelable. Dispatched before a tag is removed; call `preventDefault()` to keep it.
   * @event {{ value: string; reason: "duplicate" | "max" | "validate"; message?: string }} invalid - Dispatched when a value is rejected.
   * @event {string[]} change - Dispatched after tags are added or removed.
   * @restProps {input}
   */

  /**
   * Specify the tags.
   * Follows the field when the owning form resets.
   * @type {string[]}
   * @bindable writable
   */
  export let value = [];

  /**
   * Set the size of the field. Tags scale with it.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to disable the field and its tags */
  export let disabled = false;

  /** Set to `true` to show the tags without letting users add or remove any */
  export let readonly = false;

  /** Set to `true` to require at least one tag */
  export let required = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Where the tags render: `"inline"` inside the field, ahead of the text
   * input, or `"below"` the field, for long lists.
   * @type {"inline" | "below"}
   */
  export let tagPlacement = "inline";

  /**
   * Characters (or a pattern) that split typed or pasted text into tags.
   * Enter always adds the current text; pasted line breaks always split.
   * @type {string | string[] | RegExp}
   */
  export let delimiter = ",";

  /** Set to `false` to paste text as-is instead of splitting it into tags */
  export let addOnPaste = true;

  /** Set to `true` to add the current text as a tag when the field loses focus */
  export let addOnBlur = false;

  /**
   * Transform raw text into a tag before it's checked and added.
   * Return an empty string to skip it.
   * @type {(raw: string) => string}
   */
  export let normalize = (raw) => raw.trim();

  /** Set to `true` to allow the same tag more than once */
  export let allowDuplicates = false;

  /**
   * Decide whether two tags are duplicates.
   * Defaults to a case-insensitive comparison.
   * @type {(a: string, b: string) => boolean}
   */
  export let isDuplicate = (a, b) => a.toLowerCase() === b.toLowerCase();

  /**
   * Check a tag before it's added. Return `true` to accept it, or a message
   * (or `false`) to reject it.
   * @type {(tag: string) => boolean | string}
   */
  export let validate = () => true;

  /**
   * Maximum number of tags.
   * @type {number | undefined}
   */
  export let max = undefined;

  /**
   * Props for each tag, for example a color `type` per tag.
   * @type {(tag: string, index: number) => { type?: "red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline" }}
   */
  export let tagProps = () => ({});

  /** Specify the accessible name prefix of each tag's remove button */
  export let removeTagText = "Remove";

  /** Specify the message shown when a duplicate tag is rejected */
  export let duplicateText = "This tag has already been added";

  /** Specify the message shown when a tag is rejected at `max` */
  export let maxText = "You've reached the maximum number of tags";

  /** Specify the visually hidden keyboard instructions read with the field */
  export let instructionsText =
    "Press Enter to add a tag. Press Backspace in an empty field to move to the tags, then Delete to remove one.";

  /**
   * Announcement after tags are added.
   * @type {(tags: string[], count: number) => string}
   */
  export let addedText = (tags, count) =>
    `${tags.length === 1 ? tags[0] : `${tags.length} tags`} added. ${count} ${count === 1 ? "tag" : "tags"}.`;

  /**
   * Announcement after a tag is removed.
   * @type {(tag: string, count: number) => string}
   */
  export let removedText = (tag, count) =>
    `${tag} removed. ${count} ${count === 1 ? "tag" : "tags"}.`;

  /** Set an id for the text input */
  export let id = uniqueId();

  /**
   * Specify a name to submit each tag as a hidden input with the form.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the text input element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, tick } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import EditOff from "../icons/EditOff.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TagSet from "../TagSet/TagSet.svelte";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;
  $: tagSize =
    effectiveSize === "xs" || effectiveSize === "sm"
      ? "sm"
      : effectiveSize === "xl"
        ? "lg"
        : "default";

  // Restored when the owning form resets.
  const initialValue = value.slice();

  let rootRef = null;
  let fieldRef = null;
  let draft = "";
  let focused = false;
  /** Text of the visually hidden live region. */
  let statusText = "";
  /** Message for the most recent rejected value; cleared on the next edit. */
  let rejectionText = "";

  $: interactive = !disabled && !readonly;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || !!rejectionText,
    warn,
    disabled,
    readonly,
  }));
  $: errorText = invalid ? invalidText : rejectionText;
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: instructionsId = `instructions-${id}`;

  $: delimiterPattern =
    delimiter instanceof RegExp
      ? delimiter
      : new RegExp(
          (Array.isArray(delimiter) ? delimiter : [delimiter])
            .filter(Boolean)
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|") || "$^",
        );

  // Rejoins rejected pieces that go back into the text input.
  $: joiner =
    typeof delimiter === "string"
      ? delimiter
      : Array.isArray(delimiter) && delimiter[0]
        ? delimiter[0]
        : ",";

  /** @type {(text: string, pattern?: RegExp) => string[]} */
  function split(text, pattern = delimiterPattern) {
    return text.split(new RegExp(pattern.source, "g"));
  }

  /**
   * @param {"duplicate" | "max" | "validate"} reason
   * @param {string} tag
   * @param {string} [message]
   */
  function reject(reason, tag, message) {
    rejectionText =
      reason === "duplicate"
        ? duplicateText
        : reason === "max"
          ? maxText
          : (message ?? "");
    dispatch("invalid", { value: tag, reason, message });
  }

  /**
   * Run raw strings through normalize, duplicate, max, validate, and the
   * cancelable `add` event, then add the accepted ones in one assignment.
   * Returns the raw strings that were rejected.
   *
   * @param {string[]} raws
   * @param {"enter" | "delimiter" | "paste" | "blur"} source
   * @returns {string[]}
   */
  function addTags(raws, source) {
    /** @type {string[]} */
    const accepted = [];
    /** @type {string[]} */
    const rejected = [];

    for (const raw of raws) {
      const tag = normalize(raw);
      if (!tag) continue;

      if (
        !allowDuplicates &&
        [...value, ...accepted].some((existing) => isDuplicate(existing, tag))
      ) {
        reject("duplicate", tag);
        rejected.push(raw);
        continue;
      }

      if (max != null && value.length + accepted.length >= max) {
        reject("max", tag);
        rejected.push(raw);
        continue;
      }

      const result = validate(tag);
      if (result !== true) {
        reject("validate", tag, typeof result === "string" ? result : "");
        rejected.push(raw);
        continue;
      }

      if (!dispatch("add", { value: tag, source }, { cancelable: true })) {
        rejected.push(raw);
        continue;
      }

      accepted.push(tag);
    }

    if (accepted.length > 0) {
      if (rejected.length === 0) rejectionText = "";
      value = [...value, ...accepted];
      statusText = addedText(accepted, value.length);
      dispatch("change", value);
    }

    return rejected;
  }

  /**
   * Set the text input's value, writing the DOM too. Not `bind:value`:
   * Svelte 3 and 4 run its listener after `on:input`, which would undo a
   * value set while splitting typed text.
   * @param {string} next
   */
  function setDraft(next) {
    draft = next;
    if (ref && ref.value !== next) ref.value = next;
  }

  /** @param {"enter" | "delimiter" | "blur"} source */
  function commitDraft(source) {
    if (!draft.trim()) return;
    const rejected = addTags([draft], source);
    setDraft(rejected[0] ?? "");
  }

  /** @param {{ detail: { index: number } }} event */
  function handleTagClose({ detail }) {
    if (!interactive) return;
    const { index } = detail;
    const tag = value[index];
    if (tag === undefined) return;
    if (!dispatch("remove", { value: tag, index }, { cancelable: true })) {
      return;
    }

    const hadFocus = rootRef?.contains(document.activeElement);
    value = value.filter((_, i) => i !== index);
    rejectionText = "";
    statusText = removedText(tag, value.length);
    dispatch("change", value);

    // With no tag left to take focus, keep it in the field. `TagSet` moves
    // focus to a neighbouring tag otherwise.
    if (hadFocus && value.length === 0) tick().then(() => ref?.focus());
  }

  /** @type {(index: number) => void} */
  function focusTag(index) {
    const buttons = rootRef?.querySelectorAll(
      ".bx--tag__close-icon:not(:disabled)",
    );
    if (!buttons?.length) return;
    /** @type {HTMLElement} */ (
      buttons[index < 0 ? buttons.length + index : index]
    )?.focus();
  }

  /** @param {KeyboardEvent} event */
  function handleInputKeydown(event) {
    if (event.isComposing || !interactive) return;

    if (event.key === "Enter") {
      if (!draft.trim()) return;
      event.preventDefault();
      commitDraft("enter");
      return;
    }

    const atStart =
      ref?.selectionStart === 0 && ref?.selectionEnd === 0 && value.length > 0;

    // A held Backspace that just emptied the field must not run on into the
    // tags: only a fresh press moves there.
    if (event.key === "Backspace" && atStart && !event.repeat) {
      event.preventDefault();
      focusTag(-1);
    } else if (event.key === "ArrowLeft" && atStart) {
      event.preventDefault();
      focusTag(-1);
    } else if (event.key === "Home" && draft === "" && value.length > 0) {
      event.preventDefault();
      focusTag(0);
    }
  }

  /**
   * Keys on a focused tag that hand focus back to the text input.
   * @param {KeyboardEvent} event
   */
  function handleTagKeydown(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(".bx--tag__close-icon")) return;

    const buttons = Array.from(
      rootRef?.querySelectorAll(".bx--tag__close-icon:not(:disabled)") ?? [],
    );
    const isLast = buttons[buttons.length - 1] === target;

    if (
      event.key === "Escape" ||
      event.key === "End" ||
      (event.key === "ArrowRight" && isLast)
    ) {
      event.preventDefault();
      ref?.focus();
    }
  }

  /** @param {Event & { currentTarget: HTMLInputElement }} event */
  function handleInput(event) {
    draft = event.currentTarget.value;
    rejectionText = "";
    if (!interactive) return;
    const parts = split(draft);
    if (parts.length < 2) return;
    // Everything before the last delimiter is complete; the rest is still
    // being typed.
    const rest = parts.pop() ?? "";
    const rejected = addTags(parts, "delimiter");
    setDraft([...rejected, rest].join(joiner));
  }

  /** @param {ClipboardEvent} event */
  function handlePaste(event) {
    if (!addOnPaste || !interactive || !ref) return;
    const text = event.clipboardData?.getData("text") ?? "";
    const pattern = new RegExp(`${delimiterPattern.source}|\\r?\\n`);
    if (!pattern.test(text)) return;

    event.preventDefault();
    const start = ref.selectionStart ?? draft.length;
    const end = ref.selectionEnd ?? draft.length;
    const combined = draft.slice(0, start) + text + draft.slice(end);
    const rejected = addTags(split(combined, pattern), "paste");
    setDraft(rejected.join(joiner));
  }

  function handleFocus() {
    focused = true;
  }

  function handleBlur() {
    focused = false;
    if (addOnBlur && interactive) commitDraft("blur");
  }

  /** Clicking the field's empty space focuses the text input. */
  function handleFieldClick(event) {
    if (!interactive) return;
    const target = event.target;
    if (
      target === fieldRef ||
      (target instanceof HTMLElement &&
        target.matches(".bx--tag-set, .bx--tag-set__space"))
    ) {
      ref?.focus();
    }
  }

  function handleFormReset() {
    value = initialValue.slice();
    setDraft("");
    rejectionText = "";
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={rootRef}
  class:bx--form-item={true}
  on:keydown={handleTagKeydown}
>
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}
    >
      <slot name="labelChildren">{labelText}</slot>
    </label>
  {/if}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={fieldRef}
    data-invalid={showInvalid || undefined}
    data-warn={showWarn || undefined}
    class:bx--tag-input={true}
    class:bx--tag-input--xs={effectiveSize === "xs"}
    class:bx--tag-input--sm={effectiveSize === "sm"}
    class:bx--tag-input--xl={effectiveSize === "xl"}
    class:bx--tag-input--focused={focused}
    class:bx--tag-input--invalid={showInvalid}
    class:bx--tag-input--disabled={disabled}
    class:bx--tag-input--readonly={readonly}
    class:bx--tag-input--status={readonly || showInvalid || showWarn}
    on:click={handleFieldClick}
  >
    {#if readonly}
      <EditOff class="bx--text-input__readonly-icon" />
    {:else if showInvalid}
      <WarningFilled class="bx--text-input__invalid-icon" />
    {:else if showWarn}
      <WarningAltFilled
        class="bx--text-input__invalid-icon bx--text-input__invalid-icon--warning"
      />
    {/if}
    <TagSet
      id="{id}-tags"
      class="bx--tag-input__tags"
      navigation="roving"
      multiline
      size={tagSize}
      on:close:tag={handleTagClose}
    >
      {#if tagPlacement === "inline"}
        {#each value as tag, index (index)}
          <Tag
            {...tagProps(tag, index)}
            filter={!readonly}
            {disabled}
            value={tag}
            title={removeTagText}
            maxWidth="13rem"
          >
            {tag}
          </Tag>
        {/each}
      {/if}
      <input
        bind:this={ref}
        value={draft}
        use:formReset={handleFormReset}
        type="text"
        autocomplete="off"
        aria-invalid={showInvalid || undefined}
        aria-errormessage={showInvalid ? errorId : undefined}
        aria-describedby={joinDescribedBy(
          interactive && instructionsId,
          resolveStatusDescribedBy({
            showInvalid,
            showWarn,
            helperText,
            errorId,
            warnId,
            helperId,
            includeErrorId: false,
          }),
        )}
        {disabled}
        {id}
        {placeholder}
        {readonly}
        required={required && value.length === 0}
        class:bx--tag-input__input={true}
        {...$$restProps}
        on:input={handleInput}
        on:keydown={handleInputKeydown}
        on:keydown
        on:paste={handlePaste}
        on:focus={handleFocus}
        on:focus
        on:blur={handleBlur}
        on:blur
      >
    </TagSet>
  </div>
  {#if tagPlacement === "below" && value.length > 0}
    <TagSet
      id="{id}-tags-below"
      class="bx--tag-input__tags--below"
      navigation="roving"
      multiline
      size={tagSize}
      on:close:tag={handleTagClose}
    >
      {#each value as tag, index (index)}
        <Tag
          {...tagProps(tag, index)}
          filter={!readonly}
          {disabled}
          value={tag}
          title={removeTagText}
          maxWidth="13rem"
        >
          {tag}
        </Tag>
      {/each}
    </TagSet>
  {/if}
  {#if !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if showInvalid}
    <div class:bx--form-requirement={true} id={errorId} role="alert">
      {errorText}
    </div>
  {/if}
  {#if showWarn}
    <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
  {/if}
  {#if name}
    {#each value as tag, index (index)}
      <input type="hidden" {name} value={tag} {disabled}>
    {/each}
  {/if}
  <span id={instructionsId} class:bx--visually-hidden={true}
    >{instructionsText}</span
  >
  <!-- Always rendered (even while empty) so assistive tech registers the
       region before its text changes. -->
  <span role="status" aria-live="polite" class:bx--visually-hidden={true}
    >{statusText}</span
  >
</div>
