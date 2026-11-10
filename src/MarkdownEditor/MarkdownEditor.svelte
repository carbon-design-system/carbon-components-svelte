<script>
  /**
   * @typedef {"heading" | "bold" | "italic" | "strikethrough" | "quote" | "code" | "link" | "ul" | "ol" | "task"} MarkdownEditorAction
   * @typedef {{
   *   write: string; preview: string; modes: string; toolbar: string;
   *   heading: string; bold: string; italic: string; strikethrough: string;
   *   quote: string; code: string; link: string; ul: string; ol: string; task: string;
   *   empty: string; table: string; done: string; todo: string;
   *   tabHint: string; tabReleased: string;
   * }} MarkdownEditorLabels
   */

  /**
   * @event {null} change
   * @event {{ action: MarkdownEditorAction }} action - Dispatched after a toolbar button or shortcut edits the text.
   * @restProps {textarea} Rest props are spread to the textarea.
   */

  /**
   * Specify the Markdown.
   * Follows the field when the owning form resets.
   * @type {null | string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify which tab shows. Ignored while the split view is on, which
   * shows both.
   * @type {"write" | "preview"}
   * @bindable writable
   */
  export let view = "write";

  /**
   * Set to `true` to show the text and its preview side by side when the
   * editor is `splitMinWidth` wide or more. A narrower editor keeps the
   * Write and Preview tabs.
   */
  export let split = false;

  /**
   * Specify the width, in pixels, from which `split` shows both panes. The
   * editor's own width counts, not the window's.
   */
  export let splitMinWidth = 640;

  /**
   * Whether both panes show now: `split` is on and the editor is wide enough.
   * @type {boolean}
   * @bindable readonly
   */
  export let splitActive = false;

  /**
   * Specify the toolbar buttons, in order. Set to `[]` to leave the toolbar out.
   * @type {ReadonlyArray<MarkdownEditorAction>}
   */
  export let toolbar = [
    "heading",
    "bold",
    "italic",
    "quote",
    "code",
    "link",
    "ul",
    "ol",
    "task",
  ];

  /**
   * Specify the keyboard shortcut of an action, as `Kbd` takes it. They
   * work while the textarea has focus, and show in the button's tooltip.
   * `mod` is Command on Apple platforms and Ctrl elsewhere. Pass `{}` for
   * none.
   * @type {Partial<Record<MarkdownEditorAction, string>>}
   */
  export let shortcuts = { bold: "mod+b", italic: "mod+i", link: "mod+k" };

  /**
   * Override any of the text the editor shows or announces. Each key falls
   * back to its English default.
   * @type {Partial<MarkdownEditorLabels>}
   */
  export let labels = {};

  /**
   * Specify the level of heading the toolbar's Heading button makes, as the
   * number of `#`.
   * @type {1 | 2 | 3 | 4 | 5 | 6}
   */
  export let toolbarHeadingLevel = 3;

  /**
   * Specify the heading level that `#` draws as in the preview, so the
   * preview's headings sit under the page's. `##` is one level lower.
   * @type {1 | 2 | 3 | 4 | 5 | 6}
   */
  export let headingLevel = 2;

  /**
   * Specify how long, in milliseconds, the side-by-side preview waits after
   * typing stops before it draws again. The Preview tab draws at once.
   */
  export let previewDelay = 150;

  /**
   * Specify the link schemes the preview makes links of, with the colon.
   * Anything else, such as `javascript:`, shows as text.
   * @type {ReadonlyArray<string>}
   */
  export let schemes = ["http:", "https:", "mailto:"];

  /** Specify the `target` of links in the preview */
  export let linkTarget = "_blank";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the number of rows */
  export let rows = 8;

  /**
   * Specify the max count.
   * Counts characters.
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

  /** Set to `true` to disable the editor */
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
   * Specify a name attribute for the textarea.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the textarea HTML element.
   * @bindable readonly
   * @type {null | HTMLTextAreaElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import { graphemeCount, truncateGraphemes } from "../utils/grapheme-count.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    applePlatform,
    ariaKeyShortcuts,
    formatShortcut,
    matchesShortcut,
  } from "../utils/keyboard-shortcut.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { createLimitAnnouncement } from "../utils/limit-announcement.js";
  import {
    continueList,
    indentList,
    markdownEdit,
  } from "../utils/markdown-edit.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import MarkdownEditorIcon from "./MarkdownEditorIcon.svelte";
  import MarkdownEditorPreview from "./MarkdownEditorPreview.svelte";

  const dispatch = createEventDispatcher();
  const formContext = getContext(FORM_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();

  /** @type {MarkdownEditorLabels} */
  const DEFAULT_LABELS = {
    write: "Write",
    preview: "Preview",
    modes: "Editor view",
    toolbar: "Formatting",
    heading: "Heading",
    bold: "Bold",
    italic: "Italic",
    strikethrough: "Strikethrough",
    quote: "Quote",
    code: "Code",
    link: "Link",
    ul: "Bulleted list",
    ol: "Numbered list",
    task: "Task list",
    empty: "Nothing to preview",
    table: "Table",
    done: "Done",
    todo: "To do",
    tabHint:
      "In a list, Tab indents. Press Escape, then Tab, to move focus out.",
    tabReleased: "Tab now moves focus.",
  };

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;
  $: text = { ...DEFAULT_LABELS, ...labels };

  /** @type {null | HTMLDivElement} */
  let rootRef = null;
  /** @type {null | HTMLDivElement} */
  let toolbarRef = null;
  /** @type {null | HTMLDivElement} */
  let tablistRef = null;
  /** @type {null | HTMLDivElement} */
  let previewRef = null;

  // The field's focus ring follows the text and the preview, and only when
  // the keyboard put focus there or the pointer did in the textarea. A click
  // in the preview's text leaves it plain, and a toolbar button or a tab
  // draws its own ring.
  let ringed = false;

  /** @param {FocusEvent} event */
  function handleFocusIn(event) {
    const target = event.target;
    ringed =
      target instanceof HTMLElement &&
      (target === ref || target === previewRef) &&
      target.matches(":focus-visible");
  }

  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: counterId = `counter-${id}`;
  $: hintId = `hint-${id}`;
  $: count = graphemeCount(value ?? "");
  $: hasMaxCount = typeof maxCount === "number";
  $: resolvedCounterText = counterText ?? ((c, m) => `${c} of ${m} characters`);
  $: resolvedLimitReachedText = limitReachedText ?? "Character limit reached";
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: overCount =
    typeof maxCount === "number" &&
    count > maxCount &&
    !effectiveDisabled &&
    !readonly;
  $: isFluid = fluid || !!formContext?.isFluid;
  $: errorMessageId = showInvalid && invalidText ? errorId : undefined;
  $: editable = !effectiveDisabled && !readonly;
  $: describedBy = joinDescribedBy(
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
      .join(" ") || undefined,
    editable ? hintId : undefined,
  );

  const limitAnnouncement = createLimitAnnouncement(graphemeCount(value ?? ""));
  $: limitAnnouncement.track(count, maxCount, resolvedLimitReachedText);

  // -- Views ----------------------------------------------------------------

  let width = 0;

  $: splitActive = split && width >= splitMinWidth;
  $: writeShown = splitActive || view !== "preview";
  $: previewShown = splitActive || view === "preview";
  $: showToolbar = writeShown && !readonly && toolbar.length > 0;

  // -- Preview --------------------------------------------------------------

  // What the preview draws. The Preview tab draws the text as it is; beside
  // the text, a burst of typing draws once, when it pauses.
  let previewSource = value ?? "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  $: syncPreview(value ?? "", previewShown, splitActive, previewDelay);

  /**
   * @param {string} next
   * @param {boolean} shown
   * @param {boolean} sideBySide
   * @param {number} delay
   */
  function syncPreview(next, shown, sideBySide, delay) {
    clearTimeout(timer);
    if (!shown || next === previewSource) return;
    if (!sideBySide || delay <= 0) {
      previewSource = next;
      return;
    }
    timer = setTimeout(() => {
      previewSource = value ?? "";
    }, delay);
  }

  // -- Toolbar --------------------------------------------------------------

  let tabStop = 0;
  $: if (tabStop > toolbar.length - 1)
    tabStop = Math.max(0, toolbar.length - 1);

  /**
   * @param {MarkdownEditorAction} action
   * @returns {string | undefined}
   */
  function shortcutOf(action) {
    return shortcuts?.[action] || undefined;
  }

  /**
   * @param {string} shortcut
   * @param {boolean} apple
   */
  function keysOf(shortcut, apple) {
    return formatShortcut(shortcut, { apple }).join(apple ? "" : "+");
  }

  /** The text of a button's tooltip: its name, then its keys. */
  $: tips = toolbar.map((action) => {
    const shortcut = shortcutOf(action);
    return shortcut
      ? `${text[action]} (${keysOf(shortcut, $applePlatform)})`
      : text[action];
  });

  // -- Editing --------------------------------------------------------------

  /** True while an edit of ours runs, so its own events are left alone. */
  let applying = false;
  let composing = false;
  let shiftHeld = false;
  let tabReleased = false;
  let announcement = "";

  /**
   * Replace a range through `execCommand`, which keeps the browser's undo
   * stack (Ctrl+Z undoes the whole edit at once). `setRangeText` rewrites
   * the field without telling the undo stack, which then undoes the wrong
   * thing in Chromium and WebKit, so it is only the fallback for an engine
   * where `execCommand` is missing or refuses, such as jsdom.
   * @param {import("../utils/markdown-edit.js").MarkdownEdit} edit
   */
  function applyEdit(edit) {
    if (!ref) return;
    const current = ref.value;
    // Replace only what differs, so a wrap touches little and the browser
    // groups the change as one step.
    let from = edit.from;
    let to = edit.to;
    let insert = edit.insert;
    let head = 0;
    const old = current.slice(from, to);
    while (
      head < old.length &&
      head < insert.length &&
      old[head] === insert[head]
    )
      head++;
    from += head;
    insert = insert.slice(head);
    const rest = old.slice(head);
    let tail = 0;
    while (
      tail < rest.length &&
      tail < insert.length &&
      rest[rest.length - 1 - tail] === insert[insert.length - 1 - tail]
    ) {
      tail++;
    }
    to -= tail;
    insert = insert.slice(0, insert.length - tail);

    applying = true;
    try {
      if (from !== to || insert !== "") {
        ref.setSelectionRange(from, to);
        let done = false;
        if (typeof document.execCommand === "function") {
          done =
            insert === ""
              ? document.execCommand("delete")
              : document.execCommand("insertText", false, insert);
        }
        if (!done) {
          ref.setRangeText(insert, from, to, "end");
          ref.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              inputType: insert ? "insertText" : "deleteContentBackward",
              data: insert || null,
            }),
          );
        }
      }
      ref.setSelectionRange(edit.start, edit.end);
    } finally {
      applying = false;
    }
    // Svelte 3 and 4 write the bound value back to the field once the input
    // event has updated it, and some engines then move the caret to the end.
    // That flush is queued by now, so this runs after it.
    queueMicrotask(() => {
      if (
        ref &&
        (ref.selectionStart !== edit.start || ref.selectionEnd !== edit.end)
      ) {
        ref.setSelectionRange(edit.start, edit.end);
      }
    });
  }

  /** @param {MarkdownEditorAction} action */
  function run(action) {
    if (!ref || !editable || composing) return false;
    const edit = markdownEdit(
      action,
      ref.value,
      ref.selectionStart,
      ref.selectionEnd,
      {
        headingLevel: toolbarHeadingLevel,
      },
    );
    if (!edit) return false;
    if (document.activeElement !== ref) ref.focus();
    applyEdit(edit);
    dispatch("action", { action });
    return true;
  }

  /**
   * A press on a button must not take focus from the textarea, or the
   * selection the action works on would leave with it.
   * @param {MouseEvent} event
   */
  function keepFocus(event) {
    event.preventDefault();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    shiftHeld = event.shiftKey;
    if (!ref || event.defaultPrevented || !editable) return;
    if (isImeComposition(event)) return;

    if (event.key === "Escape") {
      // From here Tab leaves the field, in a list too. The Escape goes on to
      // a Modal or whatever else is listening.
      if (indentList(ref.value, ref.selectionStart, ref.selectionEnd)) {
        tabReleased = true;
        announcement = text.tabReleased;
      }
      return;
    }

    if (
      event.key === "Tab" &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey
    ) {
      if (tabReleased) return;
      const edit = indentList(
        ref.value,
        ref.selectionStart,
        ref.selectionEnd,
        event.shiftKey,
      );
      // Off a list, Tab moves focus as in any field.
      if (!edit) return;
      event.preventDefault();
      if (edit.insert !== ref.value.slice(edit.from, edit.to)) applyEdit(edit);
      return;
    }

    if (event.key !== "Shift") {
      tabReleased = false;
      announcement = "";
    }

    // Every shortcut works, whether or not its button is in the toolbar.
    for (const action of /** @type {MarkdownEditorAction[]} */ (
      Object.keys(shortcuts ?? {})
    )) {
      const shortcut = shortcutOf(action);
      if (
        shortcut &&
        matchesShortcut(event, shortcut, { apple: $applePlatform })
      ) {
        event.preventDefault();
        run(action);
        return;
      }
    }
  }

  /** @param {InputEvent} event */
  function handleBeforeInput(event) {
    if (!ref || applying || event.isComposing) return;

    // Enter in a list starts the next item. Not with Shift, which breaks the
    // line as it is.
    if (
      editable &&
      !shiftHeld &&
      (event.inputType === "insertLineBreak" ||
        event.inputType === "insertParagraph")
    ) {
      const edit = continueList(
        ref.value,
        ref.selectionStart,
        ref.selectionEnd,
      );
      if (edit) {
        event.preventDefault();
        applyEdit(edit);
        return;
      }
    }

    if (typeof maxCount !== "number") return;
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

  function handlePointerDown() {
    tabReleased = false;
    announcement = "";
  }

  // A form reset restores the field without an input event. Svelte 5 syncs
  // `bind:value` back on its own; Svelte 3 and 4 do not, so read the field.
  function handleFormReset() {
    if (ref) value = ref.value;
  }

  // -- Tabs -----------------------------------------------------------------

  const TABS = /** @type {const} */ (["write", "preview"]);

  /** @param {"write" | "preview"} next */
  function select(next) {
    if (effectiveDisabled) return;
    view = next;
  }

  onMount(() => {
    const stop = rootRef
      ? observeResize(rootRef, (entry) => {
          width = entry.contentRect.width;
        })
      : () => {};
    return () => {
      stop();
      clearTimeout(timer);
      limitAnnouncement.cancel();
    };
  });
</script>

<div
  bind:this={rootRef}
  use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
  class:bx--form-item={true}
  class:bx--markdown-editor={true}
  class:bx--markdown-editor--split={splitActive}
  class:bx--markdown-editor--fluid={isFluid}
  class:bx--text-area--fluid={isFluid}
  style:--ccs-markdown-editor-rows={rows}
>
  {#if labelText || $$slots.labelChildren || hasMaxCount}
    <div class:bx--text-area__label-wrapper={true}>
      {#if labelText || $$slots.labelChildren}
        <label
          for={id}
          id="label-{id}"
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={effectiveDisabled}
          class:bx--label--slotted={isFluid && $$slots.labelChildren}
        >
          <slot name="labelChildren">{labelText}</slot>
        </label>
      {/if}
      {#if typeof maxCount === "number"}
        <div
          class:bx--label={true}
          class:bx--label--disabled={effectiveDisabled}
          class:bx--text-area__label-counter={true}
          class:bx--text-area__label-counter--error={overCount}
        >
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
    class:bx--markdown-editor__wrapper={true}
    class:bx--markdown-editor__wrapper--readonly={readonly}
    class:bx--markdown-editor__wrapper--disabled={effectiveDisabled}
    class:bx--markdown-editor__wrapper--warn={showWarn}
    class:bx--markdown-editor__wrapper--focused={ringed}
    on:focusin={handleFocusIn}
    on:focusout={() => (ringed = false)}
    data-invalid={showInvalid || overCount || undefined}
    data-warn={showWarn || undefined}
  >
    <div class:bx--markdown-editor__header={true}>
      {#if !splitActive}
        <div
          bind:this={tablistRef}
          role="tablist"
          aria-label={text.modes}
          class:bx--markdown-editor__tabs={true}
          use:rovingFocus={{
            selector: '[role="tab"]',
            orientation: "horizontal",
            wrap: true,
            skipDisabled: true,
            focusOnMove: true,
            rtl: () =>
              resolveLayoutDirection($layoutDirection, tablistRef) === "rtl",
            getActiveIndex: () => (view === "preview" ? 1 : 0),
            onMove: (index) => select(index === 1 ? "preview" : "write"),
          }}
        >
          {#each TABS as tab (tab)}
            <button
              type="button"
              role="tab"
              id="{id}-tab-{tab}"
              aria-selected={view === tab}
              aria-controls="{id}-panel-{tab}"
              tabindex={view === tab ? 0 : -1}
              disabled={effectiveDisabled}
              class:bx--markdown-editor__tab={true}
              class:bx--markdown-editor__tab--selected={view === tab}
              on:click={() => select(tab === "preview" ? "preview" : "write")}
              >{text[tab]}</button
            >
          {/each}
        </div>
      {/if}
      {#if showToolbar}
        <div
          bind:this={toolbarRef}
          role="toolbar"
          aria-label={text.toolbar}
          aria-controls={id}
          class:bx--markdown-editor__toolbar={true}
          use:rovingFocus={{
            selector: "button",
            orientation: "horizontal",
            wrap: true,
            skipDisabled: true,
            focusOnMove: true,
            rtl: () =>
              resolveLayoutDirection($layoutDirection, toolbarRef) === "rtl",
            getActiveIndex: () => tabStop,
            onMove: (index) => (tabStop = index),
          }}
        >
          {#each toolbar as action, index (action)}
            <Button
              kind="ghost"
              size="sm"
              iconDescription={tips[index]}
              tooltipAlign={index === 0 ? "top-start" : "top"}
              aria-label={text[action]}
              aria-keyshortcuts={shortcutOf(action)
                ? ariaKeyShortcuts(shortcutOf(action) ?? "", {
                    apple: $applePlatform,
                  })
                : undefined}
              disabled={effectiveDisabled}
              tabindex={index === tabStop ? 0 : -1}
              on:mousedown={keepFocus}
              on:focus={() => (tabStop = index)}
              on:click={() => run(action)}
            >
              <svelte:fragment slot="icon">
                <MarkdownEditorIcon name={action} class="bx--btn__icon" />
              </svelte:fragment>
            </Button>
          {/each}
        </div>
      {/if}
    </div>
    <div class:bx--markdown-editor__panels={true}>
      <div
        role={splitActive ? undefined : "tabpanel"}
        id="{id}-panel-write"
        aria-labelledby={splitActive ? undefined : `${id}-tab-write`}
        hidden={!writeShown}
        class:bx--markdown-editor__panel={true}
        class:bx--markdown-editor__panel--write={true}
      >
        <textarea
          bind:this={ref}
          bind:value
          use:formReset={handleFormReset}
          aria-invalid={showInvalid || overCount ? "true" : undefined}
          aria-errormessage={errorMessageId}
          data-warn={showWarn || undefined}
          disabled={effectiveDisabled}
          {id}
          {name}
          {rows}
          {placeholder}
          {readonly}
          class:bx--markdown-editor__input={true}
          {...$$restProps}
          aria-describedby={joinDescribedBy(
            describedBy,
            $$restProps["aria-describedby"],
          )}
          on:change
          on:input
          on:keydown
          on:keydown={handleKeydown}
          on:keyup
          on:focus
          on:blur
          on:paste
          on:mousedown={handlePointerDown}
          on:compositionstart={() => (composing = true)}
          on:compositionend={() => (composing = false)}
          on:beforeinput={handleBeforeInput}></textarea>
        {#if showInvalid && !isFluid}
          <WarningFilled class="bx--markdown-editor__status-icon" />
        {/if}
        {#if showWarn && !isFluid}
          <WarningAltFilled
            class="bx--markdown-editor__status-icon bx--markdown-editor__status-icon--warning"
          />
        {/if}
      </div>
      <!-- The preview scrolls, so it takes focus for the keyboard. -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div
        bind:this={previewRef}
        role={splitActive ? "region" : "tabpanel"}
        id="{id}-panel-preview"
        aria-labelledby={splitActive
          ? labelText || $$slots.labelChildren
            ? `label-${id} ${id}-preview-name`
            : undefined
          : `${id}-tab-preview`}
        aria-label={splitActive && !(labelText || $$slots.labelChildren)
          ? text.preview
          : undefined}
        tabindex="0"
        hidden={!previewShown}
        class:bx--markdown-editor__panel={true}
        class:bx--markdown-editor__panel--preview={true}
      >
        {#if splitActive}
          <span id="{id}-preview-name" class:bx--visually-hidden={true}
            >{text.preview}</span
          >
        {/if}
        {#if previewShown}
          <slot name="preview" value={previewSource}>
            <MarkdownEditorPreview
              source={previewSource}
              {schemes}
              {linkTarget}
              {headingLevel}
              tableLabel={text.table}
              doneLabel={text.done}
              todoLabel={text.todo}
              emptyText={text.empty}
            />
          </slot>
        {/if}
      </div>
    </div>
    {#if isFluid}
      <hr class:bx--markdown-editor__divider={true} />
      {#if showInvalid}
        <div
          id={errorId}
          class:bx--form-requirement={true}
          role={invalidText ? "alert" : undefined}
        >
          {invalidText}
          <WarningFilled class="bx--markdown-editor__status-icon" />
        </div>
      {/if}
      {#if showWarn}
        <div id={warnId} class:bx--form-requirement={true}>
          {warnText}
          <WarningAltFilled
            class="bx--markdown-editor__status-icon bx--markdown-editor__status-icon--warning"
          />
        </div>
      {/if}
    {/if}
  </div>
  {#if !isFluid && !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={effectiveDisabled}
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
  {#if editable}
    <span id={hintId} class:bx--visually-hidden={true}>{text.tabHint}</span>
  {/if}
  <span class:bx--visually-hidden={true} role="status" aria-live="polite"
    >{announcement}</span
  >
</div>
