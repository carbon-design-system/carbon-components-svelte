<script context="module">
  /** @param {number} count */
  function defaultResultsText(count) {
    if (count === 0) return "No results";
    return count === 1 ? "1 result" : `${count} results`;
  }
</script>

<script>
  /**
   * @restProps {button}
   * @event {{ value: string; item: import("./icon-items.js").IconPickerItem; icon: import("../utils/icon-component.js").IconComponent; }} change - Fires when the user chooses an icon. `icon` is the component, so the app can render it without importing it by name. It is `null` when the icon failed to load.
   * @event {{ recent: string[]; }} recent:change
   * @event {null} open
   * @event {null} close
   * @slot {{}} labelChildren - Replaces the label text.
   */

  /**
   * Specify the icons: `toIconItems` builds them from `import.meta.glob`.
   * Give each an `icon`, or a `load` that imports it, so the app bundles
   * only the icons it shows.
   *
   * A function that returns a promise of the items loads them when the
   * picker first opens, or when `value` is set, so an app that only renders
   * the field does not download the list of icons. Return
   * `import("./icons.js").then((module) => module.default)`.
   * @type {ReadonlyArray<import("./icon-items.js").IconPickerItem> | (() => Promise<ReadonlyArray<import("./icon-items.js").IconPickerItem>>)}
   */
  export let items = [];

  /**
   * Specify the name of the chosen icon.
   * @type {string | undefined}
   * @bindable writable
   */
  export let value = undefined;

  /**
   * Specify the order and the labels of the categories. An icon with no
   * `category`, or one not listed, follows them.
   * @type {ReadonlyArray<{ id: string; label?: string }>}
   */
  export let categories = [];

  /**
   * Specify the size of the icons in the picker, in pixels. The cell is 16
   * pixels larger. Use `48` or `64` for pictograms.
   * @type {16 | 20 | 24 | 32 | 48 | 64}
   */
  export let iconSize = 24;

  /**
   * Set to `"inline"` to show the grid on the page, with no field and no
   * popover.
   * @type {"popover" | "inline"}
   */
  export let variant = "popover";

  /**
   * Set to `true` to open the popover.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the names of the icons used most recently, newest first. The
   * picker adds each icon the user chooses. Persist it with `LocalStorage`.
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let recent = [];

  /** Specify how many recent icons to keep. Set to `0` to hide the recent section. */
  export let recentLimit = 12;

  /**
   * Set the size of the field.
   * @type {"sm" | "md" | "lg" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Set to `true` to show the chosen icon but keep it from being changed */
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

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label */
  export let hideLabel = false;

  /** Specify the text of the field while no icon is chosen */
  export let placeholder = "Choose an icon";

  /** Specify the accessible name of the grid of icons */
  export let iconsLabelText = "Icons";

  /** Specify the label of the search field */
  export let searchLabelText = "Search icons";

  /** Specify the placeholder of the search field */
  export let searchPlaceholder = "Search icons";

  /** Specify the header of the recent section */
  export let recentText = "Recent";

  /** Specify the header of the icons that have no category */
  export let otherText = "All";

  /** Specify the text shown in the grid when there are no icons */
  export let emptyText = "No icons to choose from";

  /** Specify the text shown in the grid while the items load */
  export let loadingText = "Loading icons";

  /** Specify the text shown in the grid when the items fail to load */
  export let errorText = "The icons could not be loaded";

  /** Specify the text shown when the search matches no icon */
  export let noResultsText = "No icons match your search";

  /**
   * Build the announcement of the number of matches, read after the user
   * stops typing.
   * @type {(count: number) => string}
   */
  export let resultsText = defaultResultsText;

  /** Specify the accessible name of the category buttons */
  export let categoriesLabelText = "Categories";

  /** Specify the name of the form field. A hidden input then holds the icon's name. */
  export let name = "";

  /**
   * Set an id for the field.
   * @type {string}
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the field.
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
  import { get } from "svelte/store";
  import Layer from "../Layer/Layer.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import Popover from "../Popover/Popover.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
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
  import IconPickerGrid from "./IconPickerGrid.svelte";
  import { createIconLoader, resolveIcon } from "./icon-loader.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  /** @type {null | HTMLDivElement} */
  let wrapperRef = null;
  /** @type {null | HTMLDivElement} */
  let popoverRef = null;
  /** @type {null | IconPickerGrid} */
  let gridRef = null;
  let inDisabledFieldset = false;
  // The grid builds on the first open, then stays: a closed popover holds
  // no cells, and a reopened one keeps its place.
  let openedOnce = false;
  let prevOpen = false;
  let destroyed = false;
  let disconnectModalObserver = noop;
  /** @type {ReadonlyArray<import("./icon-items.js").IconPickerItem>} */
  let fetchedItems = [];
  /** @type {"idle" | "loading" | "ready" | "error"} */
  let itemsStatus = "idle";
  /** @type {unknown} */
  let fetchedFrom;
  const loader = createIconLoader();
  const icons = loader.icons;

  $: effectiveDisabled = disabled || inDisabledFieldset;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: wantItems =
    typeof items === "function" &&
    (open || value !== undefined || variant === "inline");
  $: if (wantItems) fetchItems(items);
  $: resolvedItems = typeof items === "function" ? fetchedItems : items;
  $: itemsById = new Map(resolvedItems.map((item) => [item.id, item]));
  $: gridEmptyText =
    itemsStatus === "error"
      ? errorText
      : itemsStatus === "loading"
        ? loadingText
        : emptyText;
  $: selectedItem = value === undefined ? undefined : itemsById.get(value);
  $: cellSize = iconSize + 16;
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
  $: loader.load(selectedItem ? [selectedItem] : []);

  // Close when an ancestor modal closes so the portalled popover does not linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortal && ref ? observeModalClose(ref, closePopover) : noop;
  }

  /**
   * Ask a function source for the items, once for each function.
   * @param {unknown} source
   */
  function fetchItems(source) {
    if (typeof source !== "function" || source === fetchedFrom) return;
    fetchedFrom = source;
    itemsStatus = "loading";
    Promise.resolve(source())
      .then((list) => {
        if (fetchedFrom !== source || destroyed) return;
        fetchedItems = list;
        itemsStatus = "ready";
      })
      .catch(() => {
        if (fetchedFrom !== source || destroyed) return;
        itemsStatus = "error";
      });
  }

  function openPopover() {
    if (effectiveDisabled || readonly) return;
    open = true;
  }

  /**
   * Put the cursor on the chosen icon and focus the search when the popover
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
  function handleFieldKeydown(event) {
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

  /** @param {CustomEvent<{ id: string; item: import("./icon-items.js").IconPickerItem }>} event */
  async function handleSelect(event) {
    const { item } = event.detail;
    value = item.id;
    if (variant === "popover") {
      closePopover();
      ref?.focus();
    }
    if (!resolveIcon(item, get(icons))) {
      // The icon was picked before it arrived: wait for it.
      await loader.load([item]);
    }
    dispatch("change", {
      value: item.id,
      item,
      icon: resolveIcon(item, get(icons)),
    });
  }

  onMount(() => {
    return () => {
      destroyed = true;
      loader.destroy();
      disconnectModalObserver();
    };
  });
</script>

{#if variant === "inline"}
  <div
    use:fieldsetDisabled={(state) => (inDisabledFieldset = state)}
    class:bx--icon-picker={true}
    class:bx--icon-picker--inline={true}
  >
    {#if labelText || $$slots.labelChildren}
      <div class:bx--label={true} class:bx--visually-hidden={hideLabel}>
        <slot name="labelChildren">{labelText}</slot>
      </div>
    {/if}
    <IconPickerGrid
      bind:this={gridRef}
      id="{id}-grid"
      items={resolvedItems}
      {categories}
      {iconSize}
      {loader}
      {recentText}
      {otherText}
      {noResultsText}
      {categoriesLabelText}
      {searchLabelText}
      {searchPlaceholder}
      {recentLimit}
      {resultsText}
      emptyText={gridEmptyText}
      labelText={iconsLabelText}
      bind:value
      bind:recent
      on:select={handleSelect}
      on:recent:change
    />
  </div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={wrapperRef}
    use:fieldsetDisabled={(state) => (inDisabledFieldset = state)}
    use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
    class:bx--icon-picker={true}
    class:bx--list-box__wrapper={true}
    on:keydown={handleKeydown}
    on:focusout={handleFocusout}
  >
    {#if labelText || $$slots.labelChildren}
      <label
        for={id}
        class:bx--label={true}
        class:bx--label--disabled={effectiveDisabled}
        class:bx--visually-hidden={hideLabel}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    {/if}
    {#if name}
      <input
        type="hidden"
        {name}
        value={value ?? ""}
        disabled={effectiveDisabled}
      />
    {/if}
    <div class:bx--icon-picker__field={true}>
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
          class:bx--icon-picker__trigger={true}
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
          on:keydown={handleFieldKeydown}
        >
          {#if selectedItem}
            <span class:bx--icon-picker__chosen={true} aria-hidden="true">
              {#if resolveIcon(selectedItem, $icons)}
                <svelte:component
                  this={resolveIcon(selectedItem, $icons)}
                  width={16}
                  height={16}
                />
              {:else}
                <span
                  class:bx--icon-picker__placeholder={true}
                  style:--ccs-icon-picker-size="16px"
                ></span>
              {/if}
            </span>
          {/if}
          <span class:bx--list-box__label={true}>
            {selectedItem ? selectedItem.label : (value ?? placeholder)}
          </span>
          <ListBoxMenuIcon {open} />
        </button>
      </ListBox>
      {#if openedOnce}
        <Popover
          bind:ref={popoverRef}
          {open}
          align="bottom-start"
          portalPopover={popoverPortal}
          class="bx--icon-picker__popover"
        >
          <!-- In a portal, the panel is outside the wrapper's listeners. -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            id={panelId}
            role="dialog"
            tabindex="-1"
            aria-label={labelText || placeholder}
            class:bx--icon-picker__panel={true}
            on:keydown={handleKeydown}
            on:focusout={handleFocusout}
          >
            <Layer>
              <IconPickerGrid
                bind:this={gridRef}
                id="{id}-grid"
                items={resolvedItems}
                {categories}
                {iconSize}
                {loader}
                {recentText}
                {otherText}
                {noResultsText}
                {categoriesLabelText}
                {searchLabelText}
                {searchPlaceholder}
                {recentLimit}
                {resultsText}
                emptyText={gridEmptyText}
                labelText={iconsLabelText}
                bind:value
                bind:recent
                on:select={handleSelect}
                on:recent:change
              />
            </Layer>
          </div>
        </Popover>
      {/if}
    </div>
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
  </div>
{/if}
