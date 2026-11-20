<script>
  /**
   * @template {TransferListItem} [Item=TransferListItem]
   * @restProps {fieldset}
   * @event {{ ids: ReadonlyArray<string | number>; from: "available" | "selected"; to: "available" | "selected"; selectedIds: ReadonlyArray<string | number> }} move - Cancelable. Dispatched before items move, with the `selectedIds` the move would set; call `preventDefault()` to keep the lists as they are.
   * @event {{ selectedIds: ReadonlyArray<string | number>; movedIds: ReadonlyArray<string | number>; direction: "add" | "remove" | "reorder" }} change
   * @slot {{}} legendChildren
   */

  /**
   * @typedef {object} TransferListItem
   * @property {string | number} id
   * @property {string} text
   * @property {boolean} [disabled] Set to `true` to keep the item where it is.
   */

  /**
   * @typedef {object} TransferListAnnouncement
   * @property {"add" | "remove" | "reorder"} type
   * @property {number} count - How many items moved.
   * @property {string} [text] - The text of the item, when one moved.
   * @property {number} [position] - Where the item landed in the selected list, when one was reordered.
   * @property {number} [total] - How many items the selected list holds, when one was reordered.
   */

  /**
   * Specify the items to choose from.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Specify the ids of the selected items, in the order the selected list
   * shows them. The available list holds the rest, in the order of `items`.
   * @type {ReadonlyArray<string | number>}
   * @bindable writable
   */
  export let selectedIds = [];

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

  /**
   * Specify the size of the rows and the controls.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Specify the number of rows each list shows before it scrolls */
  export let rows = 8;

  /** Set to `true` to show a search field above each list */
  export let filterable = false;

  /**
   * Determine if an item is kept by what a search field holds.
   * Matches the text of the item, anywhere in it, by default.
   * @type {(item: Item, value: string) => boolean}
   */
  export let shouldFilterItem = defaultShouldFilterItem;

  /** Set to `true` to let the selected list be reordered */
  export let reorderable = true;

  /**
   * Set to `false` to turn off dragging items between the lists and within
   * the selected list with a mouse or pen.
   */
  export let dragDrop = true;

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
   * Set to `true` to require at least one selected item. A wrapping `<form>`
   * blocks submission while none is selected, and the field shows its
   * invalid state with `requiredInvalidText`.
   */
  export let required = false;

  /**
   * Specify the invalid state text shown when `required` blocks a submission.
   * `invalid` and `invalidText` take precedence.
   */
  export let requiredInvalidText = "Select at least one item";

  /** Set to `true` to disable the component */
  export let disabled = false;

  /**
   * Set to `true` to use the read-only variant. The lists scroll and mark
   * items, but nothing moves.
   */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /**
   * Specify a name for the form. One hidden input per selected item submits
   * the item's id under it, in the order the selected list shows.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate
   * the hidden inputs with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /** Specify the heading of the available list */
  export let availableTitleText = "Available";

  /** Specify the heading of the selected list */
  export let selectedTitleText = "Selected";

  /** Specify the placeholder of the search fields */
  export let searchPlaceholder = "Search";

  /** Specify the accessible name of the available list's search field */
  export let availableSearchText = "Search available items";

  /** Specify the accessible name of the selected list's search field */
  export let selectedSearchText = "Search selected items";

  /** Specify the text of the search fields' clear button */
  export let clearSearchText = "Clear search input";

  /** Specify the text shown in the available list when it has no items */
  export let availableEmptyText = "No items available";

  /** Specify the text shown in the selected list when it has no items */
  export let selectedEmptyText = "No items selected";

  /** Specify the text shown in a list when a search matches nothing */
  export let noMatchText = "No matches";

  /** Specify the accessible name of the toolbar of move buttons */
  export let moveToolbarDescription = "Move items";

  /** Specify the accessible name of the button that selects the marked items */
  export let addText = "Add selected items";

  /** Specify the accessible name of the button that selects every item shown */
  export let addAllText = "Add all items";

  /** Specify the accessible name of the button that returns the marked items */
  export let removeText = "Remove selected items";

  /** Specify the accessible name of the button that returns every item shown */
  export let removeAllText = "Remove all items";

  /** Specify the accessible name of the toolbar that reorders the selected list */
  export let reorderToolbarDescription = "Reorder selected items";

  /** Specify the accessible name of the button that moves the marked items up */
  export let moveUpText = "Move up";

  /** Specify the accessible name of the button that moves the marked items down */
  export let moveDownText = "Move down";

  /**
   * Build the text that counts a list's items, shown in its heading and
   * read when the list takes focus.
   * @type {(counts: { marked: number; shown: number; total: number }) => string}
   */
  export let countText = defaultCountText;

  /**
   * Build the message announced after items move.
   * @type {(announcement: TransferListAnnouncement) => string}
   */
  export let announcementDescription = defaultAnnouncementDescription;

  /**
   * Set an id for the component.
   * The ids of the lists and messages derive from it.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Obtain a reference to the available list's listbox element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let availableRef = null;

  /**
   * Obtain a reference to the selected list's listbox element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let selectedRef = null;

  /**
   * Move focus to the available list.
   * @returns {void}
   */
  export function focus() {
    availablePanel?.focus();
  }

  import { createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ListBoxRequiredInput from "../ListBox/ListBoxRequiredInput.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import DoubleChevronLeft from "./DoubleChevronLeft.svelte";
  import DoubleChevronRight from "./DoubleChevronRight.svelte";
  import TransferListPanel from "./TransferListPanel.svelte";
  import {
    addIds,
    defaultShouldFilterItem,
    enabledIds,
    filterRows,
    insertIds,
    partitionItems,
    removeIds,
    reorderIds,
  } from "./transfer-list-utils.js";

  const dispatch = createEventDispatcher();

  const fallbackId = uniqueId();
  const fallbackHelperId = uniqueId();
  const fallbackErrorId = uniqueId();
  const fallbackWarnId = uniqueId();
  const fallbackReadonlyId = uniqueId();

  /**
   * @param {{ marked: number; shown: number; total: number }} counts
   * @returns {string}
   */
  function defaultCountText({ marked, shown, total }) {
    const noun = (/** @type {number} */ n) => (n === 1 ? "item" : "items");
    if (marked > 0) return `${marked} of ${shown} selected`;
    if (shown !== total) return `${shown} of ${total} ${noun(total)}`;
    return `${total} ${noun(total)}`;
  }

  /**
   * @param {TransferListAnnouncement} announcement
   * @returns {string}
   */
  function defaultAnnouncementDescription({
    type,
    count,
    text,
    position,
    total,
  }) {
    const things = count === 1 && text ? text : `${count} items`;
    if (type === "add") return `${things} added to the selected list.`;
    if (type === "remove") return `${things} removed from the selected list.`;
    return count === 1 && position !== undefined
      ? `${things} moved to position ${position} of ${total}.`
      : `${things} moved.`;
  }

  /** The most recent move, for the live region. */
  let announcement = "";
  /** The selection the form resets to. */
  const initialSelectedIds = selectedIds.slice();
  let requiredError = false;

  /** @type {import("./TransferListPanel.svelte").default<Item> | null} */
  let availablePanel = null;
  /** @type {import("./TransferListPanel.svelte").default<Item> | null} */
  let selectedPanel = null;
  /** @type {HTMLElement | null} */
  let fieldsetRef = null;
  /** @type {HTMLDivElement | null} */
  let moveToolbarRef = null;
  /** @type {HTMLDivElement | null} */
  let reorderToolbarRef = null;

  let availableSearch = "";
  let selectedSearch = "";
  /** @type {ReadonlySet<string | number>} */
  let availableMarked = new Set();
  /** @type {ReadonlySet<string | number>} */
  let selectedMarked = new Set();

  $: baseId = id || fallbackId;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || requiredError,
    warn,
    disabled,
    readonly,
  }));
  $: ids = buildFieldIds(id, {
    helperId: fallbackHelperId,
    errorId: fallbackErrorId,
    warnId: fallbackWarnId,
    readonlyId: fallbackReadonlyId,
  });
  $: helperId = ids.helperId ?? fallbackHelperId;
  $: errorId = ids.errorId ?? fallbackErrorId;
  $: warnId = ids.warnId ?? fallbackWarnId;
  $: readonlyId = ids.readonlyId ?? fallbackReadonlyId;
  $: shownInvalidText =
    requiredError && !invalid ? requiredInvalidText : invalidText;
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  /** @type {{ available: Item[]; selected: Item[] }} */
  let lists;
  $: lists = partitionItems(items, selectedIds);
  $: ordinals = new Map(items.map((item, index) => [item.id, index]));
  $: availableRows = filterRows(
    lists.available,
    availableSearch,
    shouldFilterItem,
  );
  $: selectedRows = filterRows(
    lists.selected,
    selectedSearch,
    shouldFilterItem,
  );
  $: if (!required || lists.selected.length > 0) requiredError = false;

  $: availableCount = countText({
    marked: availableMarked.size,
    shown: availableRows.length,
    total: lists.available.length,
  });
  $: selectedCount = countText({
    marked: selectedMarked.size,
    shown: selectedRows.length,
    total: lists.selected.length,
  });

  /**
   * The marked ids of a list that a move can act on.
   * @param {ReadonlyArray<Item>} shown
   * @param {ReadonlySet<string | number>} marks
   * @returns {Array<string | number>}
   */
  function markedIds(shown, marks) {
    return shown
      .filter((item) => marks.has(item.id) && !item.disabled)
      .map((item) => item.id);
  }

  $: idle = disabled || readonly;
  $: canAdd = !idle && markedIds(availableRows, availableMarked).length > 0;
  $: canAddAll = !idle && enabledIds(availableRows).length > 0;
  $: canRemove = !idle && markedIds(selectedRows, selectedMarked).length > 0;
  $: canRemoveAll = !idle && enabledIds(selectedRows).length > 0;
  $: canReorder = !idle && reorderable && selectedMarked.size > 0;

  /**
   * Offer the move to the consumer, who may cancel it. Then hand over the
   * new selection and say what moved.
   * @param {ReadonlyArray<string | number>} next
   * @param {ReadonlyArray<string | number>} moved
   * @param {"add" | "remove" | "reorder"} direction
   */
  function commit(next, moved, direction) {
    const from = direction === "add" ? "available" : "selected";
    const to = direction === "remove" ? "available" : "selected";
    const proceed = dispatch(
      "move",
      { ids: moved, from, to, selectedIds: next },
      { cancelable: true },
    );
    if (!proceed) return;

    selectedIds = next;
    dispatch("change", { selectedIds: next, movedIds: moved, direction });

    const only =
      moved.length === 1 ? items[ordinals.get(moved[0]) ?? -1] : undefined;
    const position = only ? next.indexOf(only.id) + 1 : undefined;
    announce(
      announcementDescription({
        type: direction,
        count: moved.length,
        text: only?.text,
        position,
        total: next.length,
      }),
    );
  }

  /** @param {string} message */
  function announce(message) {
    // Clear first so the same message twice in a row is read twice.
    announcement = "";
    tick().then(() => {
      announcement = message;
    });
  }

  /**
   * A button that moves its last item disables itself, and a disabled button
   * cannot keep focus. Hand focus to the list it moved items out of, or to
   * the other when that is now empty, so the keys carry on.
   * @param {"available" | "selected"} source
   */
  async function returnFocus(source) {
    await tick();
    const active = document.activeElement;
    const lost =
      active === document.body ||
      (active instanceof HTMLButtonElement &&
        active.disabled &&
        fieldsetRef?.contains(active));
    if (!lost) return;
    const emptied =
      (source === "available" ? availableRows : selectedRows).length === 0;
    const toAvailable = (source === "available") !== emptied;
    (toAvailable ? availablePanel : selectedPanel)?.focus();
  }

  /** @param {ReadonlyArray<string | number>} ids */
  function add(ids) {
    if (idle || ids.length === 0) return;
    commit(addIds(selectedIds, ids), ids, "add");
  }

  /** @param {ReadonlyArray<string | number>} ids */
  function remove(ids) {
    if (idle || ids.length === 0) return;
    commit(removeIds(selectedIds, ids), ids, "remove");
  }

  /**
   * @param {ReadonlyArray<string | number>} ids
   * @param {"up" | "down" | "top" | "bottom"} direction
   */
  function reorder(ids, direction) {
    if (idle || !reorderable || ids.length === 0) return;
    const next = reorderIds(
      selectedIds,
      selectedRows.map((item) => item.id),
      new Set(ids),
      direction,
    );
    if (next === selectedIds) return;
    commit(next, ids, "reorder");
    tick().then(() => selectedPanel?.reveal());
  }

  // --- Drag and drop -----------------------------------------------------

  /** @type {null | { ids: Array<string | number>; from: "available" | "selected"; x: number; y: number }} */
  let drag = null;
  /** @type {"available" | "selected" | null} */
  let dropList = null;
  /** @type {number | null} */
  let selectedDropAt = null;

  /**
   * @param {"available" | "selected"} from
   * @param {CustomEvent<{ ids: Array<string | number>; event: PointerEvent }>} event
   */
  function handleDragMove(from, event) {
    const { ids, event: pointer } = event.detail;
    drag = { ids, from, x: pointer.clientX, y: pointer.clientY };
    const under = document
      .elementFromPoint(pointer.clientX, pointer.clientY)
      ?.closest("[data-transfer-list-panel]");
    const over = under?.getAttribute("data-transfer-list-panel");
    const list =
      over === `${baseId}-available`
        ? "available"
        : over === `${baseId}-selected`
          ? "selected"
          : null;

    dropList = list === from && from === "available" ? null : list;
    if (list === "selected" && from === "selected" && !reorderable) {
      dropList = null;
    }
    selectedDropAt =
      dropList === "selected"
        ? (selectedPanel?.dropIndexAt(pointer.clientY) ?? null)
        : null;
  }

  /**
   * @param {"available" | "selected"} from
   * @param {CustomEvent<{ ids: Array<string | number>; event: PointerEvent }>} event
   */
  function handleDragEnd(from, event) {
    const { ids, event: pointer } = event.detail;
    const target = dropList;
    const at = selectedDropAt;
    drag = null;
    dropList = null;
    selectedDropAt = null;
    if (pointer.type === "pointercancel" || idle || target === null) return;

    if (target === "selected") {
      const beforeId = at === null ? null : (selectedRows[at]?.id ?? null);
      const next = insertIds(
        selectedIds,
        selectedRows.map((item) => item.id),
        ids,
        beforeId,
      );
      if (from === "available") commit(next, ids, "add");
      else if (
        reorderable &&
        next.some((value, i) => value !== selectedIds[i])
      ) {
        commit(next, ids, "reorder");
      }
    } else if (from === "selected") {
      remove(ids);
    }
  }

  // --- Toolbars ----------------------------------------------------------

  /**
   * The buttons of a toolbar, in tab order.
   * @param {HTMLElement | null} toolbar
   * @returns {HTMLElement[]}
   */
  function toolbarButtons(toolbar) {
    return toolbar
      ? /** @type {HTMLElement[]} */ (
          Array.from(toolbar.querySelectorAll("button"))
        )
      : [];
  }

  /**
   * Roving options for a toolbar: every arrow key moves, whichever way the
   * buttons run, so the stacked layout works as the side by side one does.
   * @param {() => HTMLElement | null} getToolbar
   * @returns {import("../utils/roving-focus.js").RovingFocusOptions}
   */
  function toolbarOptions(getToolbar) {
    return {
      selector: "button",
      orientation: "both",
      skipDisabled: true,
      focusOnMove: true,
      wrap: false,
      getItems: () => toolbarButtons(getToolbar()),
      getActiveIndex: () =>
        toolbarButtons(getToolbar()).indexOf(
          /** @type {HTMLElement} */ (document.activeElement),
        ),
    };
  }

  /** Buttons move rows, so a pressed one that disables itself loses focus. */
  $: moveButtons = [
    { key: "add", text: addText, can: canAdd, icon: ChevronRight, all: false },
    {
      key: "add-all",
      text: addAllText,
      can: canAddAll,
      icon: DoubleChevronRight,
      all: true,
    },
    {
      key: "remove",
      text: removeText,
      can: canRemove,
      icon: ChevronLeft,
      all: false,
    },
    {
      key: "remove-all",
      text: removeAllText,
      can: canRemoveAll,
      icon: DoubleChevronLeft,
      all: true,
    },
  ];

  /** @param {string} key */
  function pressMove(key) {
    if (key === "add") add(markedIds(availableRows, availableMarked));
    else if (key === "add-all") add(enabledIds(availableRows));
    else if (key === "remove") remove(markedIds(selectedRows, selectedMarked));
    else remove(enabledIds(selectedRows));
    returnFocus(key.startsWith("add") ? "available" : "selected");
  }

  /** @type {"small" | "field" | "default"} */
  let buttonSize;
  $: buttonSize = size === "sm" ? "small" : size === "md" ? "field" : "default";

  /** Which button holds the toolbar's one tab stop. */
  $: moveStop = moveButtons.findIndex((button) => button.can);
  $: reorderStop = canReorder ? 0 : -1;

  // A form reset puts the selection back to where it started.
  function handleFormReset() {
    selectedIds = initialSelectedIds.slice();
    availableSearch = "";
    selectedSearch = "";
    requiredError = false;
  }
</script>

<fieldset
  bind:this={fieldsetRef}
  use:formReset={handleFormReset}
  id={baseId}
  {form}
  {disabled}
  class:bx--transfer-list={true}
  class:bx--transfer-list--sm={size === "sm"}
  class:bx--transfer-list--md={size === "md"}
  class:bx--transfer-list--lg={size === "lg"}
  class:bx--transfer-list--invalid={showInvalid}
  class:bx--transfer-list--warning={showWarn}
  class:bx--transfer-list--readonly={readonly}
  class:bx--transfer-list--disabled={disabled}
  class:bx--transfer-list--dragging={drag !== null}
  data-invalid={showInvalid || undefined}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledBy}
  aria-describedby={joinDescribedBy(
    readonly ? readonlyId : null,
    resolveStatusDescribedBy({
      showInvalid,
      showWarn,
      invalidText: shownInvalidText,
      warnText,
      helperText,
      errorId,
      warnId,
      helperId,
    }),
    ariaDescribedBy,
  )}
  {...wrapperProps}
>
  {#if name}
    {#each lists.selected as item (item.id)}
      <input type="hidden" {name} value={item.id} {disabled} {form} />
    {/each}
  {/if}
  {#if legendText || $$slots.legendChildren}
    <legend class:bx--label={true} class:bx--visually-hidden={hideLegend}>
      <slot name="legendChildren">{legendText}</slot>
    </legend>
  {/if}
  {#if required}
    <ListBoxRequiredInput
      hasValue={lists.selected.length > 0}
      {disabled}
      {readonly}
      {form}
      focusTarget={selectedRef}
      on:invalid={() => (requiredError = true)}
      on:reset={() => (requiredError = false)}
    />
  {/if}
  <!-- Helper text and messages sit under the legend, before the tall lists. -->
  <div class:bx--transfer-list__validation-msg={true}>
    {#if showInvalid}
      <WarningFilled class="bx--transfer-list__invalid-icon" />
      {#if shownInvalidText}
        <div id={errorId} class:bx--form-requirement={true} role="alert">
          {shownInvalidText}
        </div>
      {/if}
    {:else if showWarn}
      <WarningAltFilled
        class="bx--transfer-list__invalid-icon bx--transfer-list__invalid-icon--warning"
      />
      {#if warnText}
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
    {/if}
  </div>
  {#if readonly}
    <span id={readonlyId} class:bx--visually-hidden={true}>{readonlyText}</span>
  {/if}
  {#if helperText && !showInvalid && !showWarn}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  <div class:bx--transfer-list__body={true}>
    <TransferListPanel
      bind:this={availablePanel}
      bind:ref={availableRef}
      bind:marked={availableMarked}
      bind:search={availableSearch}
      id="{baseId}-available"
      title={availableTitleText}
      countLabel={availableCount}
      rows={availableRows}
      {ordinals}
      {filterable}
      {size}
      visibleRows={rows}
      searchLabelText={availableSearchText}
      {searchPlaceholder}
      {clearSearchText}
      emptyText={lists.available.length === 0
        ? availableEmptyText
        : noMatchText}
      {disabled}
      {readonly}
      draggable={dragDrop}
      dropTarget={dropList === "available"}
      searchStatus={availableSearch ? availableCount : ""}
      on:move={(event) => add(event.detail.ids)}
      on:dragmove={(event) => handleDragMove("available", event)}
      on:dragend={(event) => handleDragEnd("available", event)}
    />
    <div
      bind:this={moveToolbarRef}
      class:bx--transfer-list__controls={true}
      role="toolbar"
      aria-label={moveToolbarDescription}
      use:rovingFocus={toolbarOptions(() => moveToolbarRef)}
    >
      {#each moveButtons as button, index (button.key)}
        <Button
          class="bx--transfer-list__move bx--transfer-list__move--{button.key}"
          kind="tertiary"
          size={buttonSize}
          icon={button.icon}
          iconDescription={button.text}
          tooltipPosition="top"
          tabindex={index === moveStop ? "0" : "-1"}
          disabled={!button.can}
          on:click={() => pressMove(button.key)}
        />
      {/each}
    </div>
    <TransferListPanel
      bind:this={selectedPanel}
      bind:ref={selectedRef}
      bind:marked={selectedMarked}
      bind:search={selectedSearch}
      id="{baseId}-selected"
      title={selectedTitleText}
      countLabel={selectedCount}
      rows={selectedRows}
      {ordinals}
      {filterable}
      {size}
      visibleRows={rows}
      searchLabelText={selectedSearchText}
      {searchPlaceholder}
      {clearSearchText}
      emptyText={lists.selected.length === 0 ? selectedEmptyText : noMatchText}
      {disabled}
      {readonly}
      deletes
      {reorderable}
      draggable={dragDrop}
      dropTarget={dropList === "selected"}
      dropAt={dropList === "selected" ? selectedDropAt : null}
      invalid={showInvalid}
      errorId={showInvalid && shownInvalidText ? errorId : undefined}
      searchStatus={selectedSearch ? selectedCount : ""}
      on:move={(event) => remove(event.detail.ids)}
      on:reorder={(event) => reorder(event.detail.ids, event.detail.direction)}
      on:dragmove={(event) => handleDragMove("selected", event)}
      on:dragend={(event) => handleDragEnd("selected", event)}
    >
      <svelte:fragment slot="actions">
        {#if reorderable}
          <div
            bind:this={reorderToolbarRef}
            class:bx--transfer-list__reorder={true}
            role="toolbar"
            aria-label={reorderToolbarDescription}
            use:rovingFocus={toolbarOptions(() => reorderToolbarRef)}
          >
            <Button
              kind="ghost"
              size="small"
              icon={ArrowUp}
              iconDescription={moveUpText}
              tabindex={reorderStop === 0 ? "0" : "-1"}
              disabled={!canReorder}
              on:click={() =>
                reorder(markedIds(selectedRows, selectedMarked), "up")}
            />
            <Button
              kind="ghost"
              size="small"
              icon={ArrowDown}
              iconDescription={moveDownText}
              tabindex="-1"
              disabled={!canReorder}
              on:click={() =>
                reorder(markedIds(selectedRows, selectedMarked), "down")}
            />
          </div>
        {/if}
      </svelte:fragment>
    </TransferListPanel>
  </div>
  <span role="status" aria-live="polite" class:bx--visually-hidden={true}
    >{announcement}</span
  >
  {#if drag}
    <div
      class:bx--transfer-list__ghost={true}
      aria-hidden="true"
      style:transform="translate({drag.x + 12}px, {drag.y + 12}px)"
    >
      {drag.ids.length === 1
        ? (items[ordinals.get(drag.ids[0]) ?? -1]?.text ?? "")
        : countText({
            marked: drag.ids.length,
            shown: drag.ids.length,
            total: drag.ids.length,
          })}
    </div>
  {/if}
</fieldset>
