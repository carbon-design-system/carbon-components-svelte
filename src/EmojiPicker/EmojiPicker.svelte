<script context="module">
  /** @param {number} count */
  function defaultResultsText(count) {
    if (count === 0) return "No results";
    return count === 1 ? "1 result" : `${count} results`;
  }

  /**
   * The names of the six skin tones, `0` for the default one.
   * @type {ReadonlyArray<string>}
   */
  const DEFAULT_TONE_NAMES = [
    "Default skin tone",
    "Light skin tone",
    "Medium-light skin tone",
    "Medium skin tone",
    "Medium-dark skin tone",
    "Dark skin tone",
  ];
</script>

<script>
  /**
   * @restProps {button}
   * @event {{ id: string; item: import("./emoji-items.js").EmojiPickerItem; emoji: string; selected: boolean; }} select - Fires when the user chooses an emoji, or in multiple selection, chooses or clears one. `id` is the shortcode, and `emoji` is the glyph in the chosen skin tone.
   * @event {null} open
   * @event {null} close
   * @slot {{}} labelChildren - Replaces the label text.
   */

  /**
   * Specify the emoji: the groups of `carbon-components-svelte/emoji-data`,
   * or a function that returns a promise of them, which loads them when the
   * picker first opens, or when `value` is set. A page that only renders the
   * field or button then does not download the data. Pass
   * `() => import("carbon-components-svelte/emoji-data")`. An array of
   * `EmojiPickerItem` shows your own set.
   * @type {import("./emoji-items.js").EmojiSource | (() => Promise<import("./emoji-items.js").EmojiSource | { default: import("./emoji-items.js").EmojiSource }>)}
   */
  export let items = [];

  /**
   * Specify the order and the labels of the categories. Left empty, the
   * groups of the data set them.
   * @type {ReadonlyArray<{ id: string; label?: string }>}
   */
  export let categories = [];

  /**
   * Set to `"button"` for an icon button that opens the picker, to react or
   * insert an emoji, or `"inline"` to show the grid on the page, with no
   * trigger and no popover. The default is a field that shows the chosen
   * emoji.
   * @type {"field" | "button" | "inline"}
   */
  export let variant = "field";

  /**
   * Set to `"multiple"` to let the user choose several emoji, as in a
   * reactions picker. A click then toggles the emoji and the picker stays
   * open. A field always takes one.
   * @type {"single" | "multiple"}
   */
  export let selectionMode = "single";

  /**
   * Specify the `id` (the shortcode) of the chosen emoji, in single
   * selection. A button does not keep a choice: it only reports it.
   * @type {string | undefined}
   * @bindable writable
   */
  export let value = undefined;

  /**
   * Specify the `id`s of the chosen emoji, in multiple selection.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let values = [];

  /**
   * Specify the skin tone: `0` is the default, and `1` to `5` run from
   * light to dark. It applies to every emoji that has skin tone variants.
   * Persist it with `LocalStorage`.
   * @type {0 | 1 | 2 | 3 | 4 | 5}
   * @bindable writable
   */
  export let skinTone = 0;

  /**
   * Set to `true` to open the popover.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the `id`s of the emoji chosen most recently, newest first. The
   * picker adds each emoji the user chooses. Persist it with `LocalStorage`.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let recent = [];

  /**
   * Specify how many times the user chose each emoji, by `id`. The first
   * section shows the most used, and among equals the most recent. Persist
   * it with `LocalStorage`.
   * @type {Record<string, number>}
   * @bindable writable
   */
  export let usage = {};

  /** Specify how many frequently used emoji to show. Set to `0` to hide the section and stop counting. */
  export let recentLimit = 16;

  /**
   * Specify the newest Unicode emoji version to show, such as `15`. Left
   * unset, the picker draws a few emoji on a canvas, once, and hides the
   * versions this browser cannot draw, and the flags of countries where the
   * browser draws them as letters. Set `Infinity` to show every emoji.
   * @type {number | undefined}
   */
  export let maxVersion = undefined;

  /**
   * Set to `true` to close the popover when the user chooses an emoji. Left
   * unset, it closes in single selection and stays open in multiple
   * selection.
   * @type {boolean | undefined}
   */
  export let closeOnSelect = undefined;

  /**
   * Set the size of the field, or of the button.
   * @type {"sm" | "md" | "lg" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to disable the field or button */
  export let disabled = false;

  /** Set to `true` to show the chosen emoji but keep it from being changed */
  export let readonly = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text. A button has no visible label, so it is the button's name and tooltip: "Add emoji" when empty. */
  export let labelText = "";

  /** Set to `true` to visually hide the label */
  export let hideLabel = false;

  /** Specify the text of the field while no emoji is chosen */
  export let placeholder = "Choose an emoji";

  /** Specify the accessible name of the grid of emoji */
  export let emojiLabelText = "Emoji";

  /** Specify the label of the search field */
  export let searchLabelText = "Search emoji";

  /** Specify the placeholder of the search field */
  export let searchPlaceholder = "Search emoji";

  /** Specify the accessible name of the category buttons */
  export let categoriesLabelText = "Categories";

  /** Specify the header of the frequently used section */
  export let frequentText = "Frequently used";

  /** Specify the text shown in the grid when there are no emoji */
  export let emptyText = "No emoji to choose from";

  /** Specify the text shown in the grid while the emoji load */
  export let loadingText = "Loading emoji";

  /** Specify the text shown in the grid when the emoji fail to load */
  export let errorText = "The emoji could not be loaded";

  /** Specify the text shown when the search matches no emoji */
  export let noResultsText = "No emoji match your search";

  /**
   * Build the announcement of the number of matches, read after the user
   * stops typing.
   * @type {(count: number) => string}
   */
  export let resultsText = defaultResultsText;

  /** Specify the accessible name of the skin tone selector */
  export let skinToneLabelText = "Skin tone";

  /**
   * Specify the names of the six skin tones, the default first.
   * @type {ReadonlyArray<string>}
   */
  export let skinToneNames = DEFAULT_TONE_NAMES;

  /** Specify the name of the form field. A hidden input then holds the chosen emoji, as a glyph. */
  export let name = "";

  /**
   * Set an id for the field.
   * @type {string}
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the field or button.
   * @type {null | HTMLButtonElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set to `true` to always render the popover in a portal, or `false` to
   * keep it in place. Left unset, it moves to a portal inside a `Modal`, or
   * when a box around it would cut it off.
   * @type {boolean | undefined}
   */
  export let portalPopover = undefined;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Layer from "../Layer/Layer.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import Popover from "../Popover/Popover.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import FaceAdd from "../icons/FaceAdd.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";
  import EmojiPickerGrid from "./EmojiPickerGrid.svelte";
  import { applySkinTone, resolveEmojiSource } from "./emoji-items.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  /** @type {null | HTMLDivElement} */
  let wrapperRef = null;
  /** @type {null | HTMLDivElement} */
  let popoverRef = null;
  /** @type {null | EmojiPickerGrid} */
  let gridRef = null;
  let inDisabledFieldset = false;
  // The grid builds on the first open, then stays: a closed popover holds
  // no cells, and a reopened one keeps its place.
  let openedOnce = false;
  let prevOpen = false;
  let destroyed = false;
  let disconnectModalObserver = noop;
  /** @type {import("./emoji-items.js").EmojiSource} */
  let fetchedSource = [];
  /** @type {"idle" | "loading" | "ready" | "error"} */
  let sourceStatus = "idle";
  /** @type {unknown} */
  let fetchedFrom;

  $: effectiveDisabled = disabled || inDisabledFieldset;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: mode = variant === "field" ? "single" : selectionMode;
  $: wantItems =
    typeof items === "function" &&
    (open || value !== undefined || variant === "inline");
  $: if (wantItems) fetchItems(items);
  $: resolved = resolveEmojiSource(
    typeof items === "function" ? fetchedSource : items,
  );
  $: pickerCategories =
    categories.length > 0 ? categories : resolved.categories;
  $: itemsById = new Map(resolved.items.map((item) => [item.id, item]));
  $: gridEmptyText =
    sourceStatus === "error"
      ? errorText
      : sourceStatus === "loading"
        ? loadingText
        : emptyText;
  $: selectedItem = value === undefined ? undefined : itemsById.get(value);
  $: selectedEmoji = selectedItem
    ? applySkinTone(selectedItem.emoji, skinTone, selectedItem.tones)
    : "";
  $: buttonName = labelText || "Add emoji";
  $: closes = closeOnSelect ?? mode === "single";
  $: panelId = `${id}-panel`;
  $: effectivePortal =
    portalPopover === undefined ? !!insideModal : portalPopover;
  // Left unset outside a `Modal`, Popover moves to a portal when clipped.
  $: popoverPortal = portalPopover ?? (insideModal ? true : undefined);
  $: if (effectiveDisabled || readonly || variant === "inline") open = false;
  $: if (open) openedOnce = true;
  $: notifyOpenChange(open);
  $: syncOpen(open);
  $: describedBy = joinDescribedBy(
    showInvalid
      ? errorId
      : showWarn
        ? warnId
        : helperText
          ? helperId
          : undefined,
  );

  // Close when an ancestor modal closes so the portalled popover does not linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortal && ref ? observeModalClose(ref, closePopover) : noop;
  }

  /**
   * Ask a function source for the emoji, once for each function.
   * @param {unknown} source
   */
  function fetchItems(source) {
    if (typeof source !== "function" || source === fetchedFrom) return;
    fetchedFrom = source;
    sourceStatus = "loading";
    Promise.resolve(source())
      .then((loaded) => {
        if (fetchedFrom !== source || destroyed) return;
        fetchedSource = Array.isArray(loaded) ? loaded : loaded.default;
        sourceStatus = "ready";
      })
      .catch(() => {
        if (fetchedFrom !== source || destroyed) return;
        sourceStatus = "error";
      });
  }

  function openPopover() {
    if (effectiveDisabled || readonly) return;
    open = true;
  }

  /**
   * Put the cursor on the chosen emoji and focus the search when the popover
   * opens, however it was opened.
   * @param {boolean} next
   */
  function syncOpen(next) {
    const opened = next && !prevOpen;
    prevOpen = next;
    if (!opened) return;
    tick().then(() => {
      gridRef?.reset();
      gridRef?.focus();
    });
  }

  function closePopover() {
    open = false;
  }

  function toggle() {
    if (open) closePopover();
    else openPopover();
  }

  /** @param {KeyboardEvent} event */
  function handleTriggerKeydown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openPopover();
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key !== "Escape" || !open) return;
    // Escape that cancels an IME composition, or clears the search, is not a close.
    if (isImeComposition(event) || event.defaultPrevented) return;
    event.stopPropagation();
    closePopover();
    ref?.focus();
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    if (!open || event.relatedTarget === null) return;
    const inside = [wrapperRef, popoverRef].some((node) =>
      node?.contains(/** @type {Node} */ (event.relatedTarget)),
    );
    if (!inside) closePopover();
  }

  /** @param {Event} event */
  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, [wrapperRef, popoverRef])) closePopover();
  }

  /** @param {CustomEvent<{ id: string; item: import("./emoji-items.js").EmojiPickerItem; emoji: string; selected: boolean }>} event */
  function handleSelect(event) {
    // A button reports a choice. It does not hold one. Svelte 3 and 4 ignore
    // a parent's change to a bound prop in the update that the child's own
    // change started, so the choice is cleared after it.
    if (variant === "button" && mode === "single") {
      tick().then(() => {
        value = undefined;
      });
    }
    if (variant !== "inline" && closes) {
      closePopover();
      ref?.focus();
    }
    dispatch("select", event.detail);
  }

  onMount(() => {
    return () => {
      destroyed = true;
      disconnectModalObserver();
    };
  });
</script>

{#if variant === "inline"}
  <div
    use:fieldsetDisabled={(state) => (inDisabledFieldset = state)}
    class:bx--emoji-picker={true}
    class:bx--emoji-picker--inline={true}
  >
    {#if labelText || $$slots.labelChildren}
      <div class:bx--label={true} class:bx--visually-hidden={hideLabel}>
        <slot name="labelChildren">{labelText}</slot>
      </div>
    {/if}
    <EmojiPickerGrid
      bind:this={gridRef}
      id="{id}-grid"
      emoji={resolved.items}
      categories={pickerCategories}
      selectionMode={mode}
      {maxVersion}
      {recentLimit}
      recentText={frequentText}
      {noResultsText}
      {categoriesLabelText}
      {searchLabelText}
      {searchPlaceholder}
      {resultsText}
      {skinToneLabelText}
      {skinToneNames}
      emptyText={gridEmptyText}
      labelText={emojiLabelText}
      bind:value
      bind:values
      bind:skinTone
      bind:recent
      bind:usage
      on:select={handleSelect}
    />
  </div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={wrapperRef}
    use:fieldsetDisabled={(state) => (inDisabledFieldset = state)}
    use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
    class:bx--emoji-picker={true}
    class:bx--emoji-picker--button={variant === "button"}
    class:bx--list-box__wrapper={variant === "field"}
    on:keydown={handleKeydown}
    on:focusout={handleFocusout}
  >
    {#if variant === "field" && (labelText || $$slots.labelChildren)}
      <label
        for={id}
        class:bx--label={true}
        class:bx--label--disabled={effectiveDisabled}
        class:bx--visually-hidden={hideLabel}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    {/if}
    {#if name && variant === "field"}
      <input
        type="hidden"
        {name}
        value={selectedEmoji}
        disabled={effectiveDisabled}
      />
    {/if}
    <div class:bx--emoji-picker__field={true}>
      {#if variant === "button"}
        <Button
          bind:ref
          kind="ghost"
          {size}
          {id}
          icon={FaceAdd}
          iconDescription={buttonName}
          hideTooltip={open}
          disabled={effectiveDisabled || readonly}
          aria-haspopup="dialog"
          aria-expanded={open ? "true" : "false"}
          aria-controls={openedOnce ? panelId : undefined}
          {...$$restProps}
          on:click={toggle}
        />
      {:else}
        <ListBox
          {size}
          disabled={effectiveDisabled}
          {open}
          invalid={showInvalid}
          warn={showWarn}
          on:click={(/** @type {Event} */ event) => {
            if (effectiveDisabled || readonly) return;
            if (!ref?.contains(/** @type {Node} */ (event.target))) toggle();
          }}
        >
          {#if showInvalid}
            <WarningFilled class="bx--list-box__invalid-icon" />
          {/if}
          {#if showWarn}
            <WarningAltFilled
              class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
            />
          {/if}
          <button
            bind:this={ref}
            type="button"
            role="combobox"
            {id}
            class:bx--list-box__field={true}
            class:bx--emoji-picker__trigger={true}
            aria-haspopup="dialog"
            aria-expanded={open ? "true" : "false"}
            aria-controls={openedOnce ? panelId : undefined}
            aria-readonly={readonly ? "true" : undefined}
            aria-invalid={showInvalid ? "true" : undefined}
            disabled={effectiveDisabled}
            {...$$restProps}
            aria-describedby={joinDescribedBy(
              describedBy,
              $$restProps["aria-describedby"],
            )}
            on:click={toggle}
            on:keydown={handleTriggerKeydown}
          >
            {#if selectedItem}
              <span class:bx--emoji-picker__chosen={true} aria-hidden="true"
                >{selectedEmoji}</span
              >
            {/if}
            <span class:bx--list-box__label={true}>
              {selectedItem ? selectedItem.label : (value ?? placeholder)}
            </span>
            <ListBoxMenuIcon {open} />
          </button>
        </ListBox>
      {/if}
      {#if openedOnce}
        <Popover
          bind:ref={popoverRef}
          {open}
          align="bottom-start"
          portalPopover={popoverPortal}
          class="bx--emoji-picker__popover"
        >
          <!-- In a portal, the panel is outside the wrapper's listeners. -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            id={panelId}
            role="dialog"
            tabindex="-1"
            aria-label={variant === "button"
              ? buttonName
              : labelText || placeholder}
            class:bx--emoji-picker__panel={true}
            on:keydown={handleKeydown}
            on:focusout={handleFocusout}
          >
            <Layer>
              <EmojiPickerGrid
                bind:this={gridRef}
                id="{id}-grid"
                emoji={resolved.items}
                categories={pickerCategories}
                selectionMode={mode}
                {maxVersion}
                {recentLimit}
                recentText={frequentText}
                {noResultsText}
                {categoriesLabelText}
                {searchLabelText}
                {searchPlaceholder}
                {resultsText}
                {skinToneLabelText}
                {skinToneNames}
                emptyText={gridEmptyText}
                labelText={emojiLabelText}
                bind:value
                bind:values
                bind:skinTone
                bind:recent
                bind:usage
                on:select={handleSelect}
              />
            </Layer>
          </div>
        </Popover>
      {/if}
    </div>
    {#if variant === "field"}
      {#if showInvalid && invalidText}
        <div id={errorId} class:bx--form-requirement={true} role="alert">
          {invalidText}
        </div>
      {/if}
      {#if showWarn && warnText}
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
      {#if !showInvalid && !showWarn && helperText}
        <div
          id={helperId}
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={effectiveDisabled}
        >
          {helperText}
        </div>
      {/if}
    {/if}
  </div>
{/if}
