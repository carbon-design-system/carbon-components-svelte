<script>
  /**
   * @template {MultiSelectItem<any>} [Item=MultiSelectItem<any>]
   */

  /**
   * @typedef {string} MultiSelectItemText
   * @typedef {object} MultiSelectItem<Id=any>
   * @property {Id} id
   * @property {MultiSelectItemText} text
   * @property {boolean} [disabled] - Whether the item is disabled
   * @property {boolean} [isSelectAll] - Whether this item acts as a "select all" toggle
   * @event select
   * @type {object}
   * @property {Item["id"][]} selectedIds
   * @property {Item[]} selected
   * @property {Item[]} unselected
   * @event {KeyboardEvent | MouseEvent} clear
   * @event {FocusEvent | CustomEvent<FocusEvent>} blur
   * @event {{ trigger: "escape-key" | "outside-click" }} close
   * @event {{ scrollTop: number; scrollHeight: number; clientHeight: number }} scrollend
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }}
   * @restProps {input | button}
   */

  /**
   * Set the multiselect items.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Override the display of a multiselect item.
   * @type {(item: Item) => string | Item["id"]}
   */
  export let itemToString = function itemToString(item) {
    return item.text ?? item.id;
  };

  /**
   * Override `name`/`value` for the hidden inputs that mirror the current
   * selection for native form submission, and `title`/`labelText` for the
   * visible option checkbox. `name`/`value` do not reach the option
   * checkbox itself -- it is decorative and excluded from form
   * participation, even while the menu is open.
   * @type {(item: Item) => { name?: string; labelText?: any; title?: string; value?: string }}
   */
  export let itemToInput = function itemToInput(_item) {};

  /**
   * Set the selected ids.
   * @type {ReadonlyArray<Item["id"]>}
   * @bindable writable
   */
  export let selectedIds = [];

  /**
   * Specify the multiselect value.
   * @bindable writable
   */
  export let value = "";

  /**
   * Set the size of the multiselect.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the type of multiselect.
   * @type {"default" | "inline"}
   */
  export let type = "default";

  /**
   * Specify the direction of the multiselect dropdown menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Specify the selection feedback after selecting items.
   * @type {"top" | "fixed" | "top-after-reopen"}
   */
  export let selectionFeedback = "top-after-reopen";

  /**
   * Cap how many items can be selected at once.
   * Unset or a non-positive value means unlimited.
   * When set, select-all is unavailable and unchecked items disable once the cap is reached.
   * @type {number | undefined}
   */
  export let maxSelectedItems = undefined;

  /** Set to `true` to disable the dropdown */
  export let disabled = false;

  /** Set to `true` to filter items */
  export let filterable = false;

  /**
   * Override the filtering logic.
   * The default matches items whose `text` contains the typed value,
   * ignoring case and leading or trailing whitespace.
   * @type {(item: Item, value: string) => boolean}
   */
  export let filterItem = function filterItem(item, value) {
    return item.text.toLowerCase().includes(value.trim().toLowerCase());
  };

  /**
   * Set to `true` to select all text in the filter input when it receives
   * focus (e.g. on tab or click). Only applies when `filterable` is `true`.
   */
  export let selectTextOnFocus = false;

  /**
   * Set to `true` to open the dropdown.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   * Cannot be combined with the inline variant.
   */
  export let fluid = false;

  /**
   * Set to `true` to render condensed menu items in the fluid variant.
   * Menu items use the default height instead of the taller fluid height.
   * Only applies when the fluid variant is active.
   */
  export let condensed = false;

  /** Specify the locale */
  export let locale = "en";

  /** Specify the placeholder text */
  export let placeholder = "";

  /**
   * Override the sorting logic.
   * The default sorting compare the item text value.
   * Set to `false` to skip sorting and keep the original `items` order.
   * @type {((a: Item, b: Item) => number) | (() => void) | false}
   */
  export let sortItem = function sortItem(a, b) {
    return getSortCollator().compare(a.text, b.text);
  };

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @type {(id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = undefined;

  /**
   * Override the label of the clear button when the input has a selection.
   * Defaults to "Clear selected item" and "Clear all items" if more than one item is selected.
   * @type {(id: import("../ListBox/ListBoxSelection.svelte").ListBoxSelectionTranslationId) => string}
   */
  export let translateWithIdSelection = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to pass the item to `itemToString` in the checkbox */
  export let useTitleInItem = false;

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

  /** Specify the list box label */
  export let label = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the list box component */
  export let id = uniqueId();

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Specify the assistive text announced to screen readers when read-only.
   * Exposed because VoiceOver does not announce `aria-readonly`.
   */
  export let readonlyText = "Read-only";

  /**
   * Specify the assistive text describing options disabled by `maxSelectedItems`.
   * Announced so screen reader users learn why an option refuses selection,
   * not just that it is disabled.
   */
  export let maxSelectedText = "Maximum items selected";

  /**
   * Specify the assistive text advertising the keyboard shortcut that clears
   * the selection. Appended to the field's visually-hidden description
   * whenever there is a selection to clear.
   */
  export let clearSelectionText =
    "To clear the selection, press Delete or Backspace";

  /**
   * Specify the assistive text announced through the status live region when
   * the selection is cleared via the keyboard or the clear button.
   */
  export let selectionClearedText = "All items cleared";

  /**
   * Set to `true` to reopen the dropdown menu after clearing the selection.
   * This allows users to immediately see all available items after clearing.
   */
  export let openOnClear = false;

  /**
   * Build the assistive message announced through the status live region when
   * typing in the filterable variant changes how many options match.
   * The count excludes any "select all" item.
   * @type {(count: number) => string}
   */
  export let filterResultsText = function filterResultsText(count) {
    return count === 0
      ? "No results"
      : `${count} result${count === 1 ? "" : "s"} available`;
  };

  /**
   * Default group name for the hidden inputs that mirror the current
   * selection for native form submission (`FormData`). Used per item
   * unless `itemToInput` returns its own `name`. Each input's value
   * defaults to the item `id` unless `itemToInput` returns a `value`.
   * Not applied to the
   * filterable text input, which is a query box, not the form value.
   * Omitted from submission when the multi-select is disabled.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let inputRef = null;

  /**
   * Obtain a reference to the outer div element.
   * @bindable readonly
   */
  export let multiSelectRef = null;

  /**
   * Obtain a reference to the field box element.
   * @type {null | HTMLButtonElement}
   * @bindable readonly
   */
  export let fieldRef = null;

  /**
   * Obtain a reference to the selection element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let selectionRef = null;

  /**
   * Id of the highlighted ListBoxMenuItem.
   * @type {null | Item["id"]}
   * @bindable readonly
   */
  export let highlightedId = null;

  /**
   * The post-sort, post-selection-feedback list of items rendered by the dropdown.
   * Bind to read the resolved order without recomputing it from `items`, `selectedIds`, and `sortItem`.
   * @type {ReadonlyArray<Item & { checked: boolean }>}
   * @bindable readonly
   */
  export let sortedItems = [];

  /**
   * Enable virtualization for large lists. Virtualization renders only the items currently visible in the viewport, improving performance for large lists.
   *
   * By default, virtualization is automatically enabled for lists with more than 100 items.
   *
   * Set `virtualize={false}` to explicitly disable virtualization, even for large lists.
   *
   * Set `virtualize={true}` to explicitly enable virtualization with default settings.
   *
   * Provide an object to customize virtualization behavior:
   * - `itemHeight` (default: size-based, or 64px for fluid unless `condensed`): Height of each item in pixels. Override when custom slots change row height. Under `wrapOptions`, heights are measured from the rendered options and this serves as the starting estimate for ones not yet measured.
   * - `containerHeight` (default: 300): The maximum height in pixels of the dropdown container.
   * - `overscan` (default: 3): The number of extra items to render above and below the viewport for smoother scrolling. Higher values may cause more flickering during very fast scrolling.
   * - `threshold` (default: 100): The minimum number of items required before virtualization activates. Lists with fewer items will render all items normally without virtualization.
   * - `maxItems` (default: undefined): The maximum number of items to render. When undefined, all visible items are rendered.
   * @type {undefined | boolean | { itemHeight?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number }}
   */
  export let virtualize = undefined;

  /**
   * Set to `true` to let an option's label wrap onto as many lines as it needs
   * instead of being truncated with an ellipsis.
   * @type {boolean}
   */
  export let wrapOptions = false;

  /**
   * Set to `true` to render the dropdown menu in a portal,
   * allowing it to escape containers with `overflow: hidden`.
   * When inside a Modal, defaults to `true` unless explicitly set to `false`.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /**
   * Obtain a reference to the list HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let listRef = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import {
    FORM_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import HighlightSlot from "../ListBox/HighlightSlot.svelte";
  import {
    ListBox,
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
    ListBoxSelection,
  } from "../ListBox/index.js";
  import { shouldVirtualizeMenu } from "../ListBox/list-box-utils.js";
  import {
    createMenuWindow,
    scheduleHighlightScroll,
  } from "../ListBox/menu-window.js";
  import { debounce } from "../utils/debounce.js";
  import { deepEqual } from "../utils/deep-equal.js";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { createScrollEndTracker } from "../utils/is-scroll-near-end.js";
  import { moveIndex } from "../utils/move-index.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { resetVirtualScrollOnClose } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();
  const scrollEndTracker = createScrollEndTracker();
  const formContext = getContext(FORM_CONTEXT_KEY);
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal : portalMenu;

  let sortCollatorLocale;
  let sortCollator;
  function getSortCollator() {
    if (!sortCollator || sortCollatorLocale !== locale) {
      sortCollatorLocale = locale;
      sortCollator = new Intl.Collator(locale, { numeric: true });
    }
    return sortCollator;
  }

  let fieldFocused = false;
  let highlightedIndex = -1;
  let highlightOrigin = /** @type {"keyboard" | "pointer" | null} */ (null);
  let prevHighlightedIndex = -1;
  let prevChecked = [];
  let initialRender = true;
  let listScrollTop = 0;
  let prevOpen = false;
  // A copy, not the prop reference: `sameSelectedIds` value-compares against
  // this, and a live reference would silently track any in-place mutation a
  // consumer made to the array it previously handed over.
  let prevSelectedIds = selectedIds.slice();
  /** Anchor item id for shift+click range selection; cleared when selection is reset entirely. */
  let prevSelectedItemId = null;
  /** Text content of the visually-hidden status live region. */
  let statusText = "";
  /** Accumulated characters for first-character typeahead in the non-filterable field. */
  /** @type {import("../ListBox/menu-window.js").MenuWindowState} */
  let menuState;

  const menuWindow = createMenuWindow({
    getContainer: () => listRef,
    onScrollTop: (scrollTop) => {
      listScrollTop = scrollTop;
    },
    onState: (state) => {
      menuState = state;
    },
  });

  const typeahead = createTypeaheadBuffer();

  /**
   * @type {(data: { key: "field" | "selection"; ref: HTMLDivElement | HTMLButtonElement }) => void}
   */
  function declareRef({ key, ref }) {
    switch (key) {
      case "field":
        fieldRef = ref;
        break;
      case "selection":
        selectionRef = ref;
        break;
    }
  }

  setContext("carbon:MultiSelect", {
    declareRef,
  });

  /**
   * Whether an item should be treated as disabled for selection and keyboard nav.
   * Checked items stay enabled at the cap so they can be cleared.
   * @param {Item & { checked?: boolean }} item
   */
  function isItemDisabled(item) {
    if (item.disabled) return true;
    if (hasMaxSelectedItems && item.isSelectAll) return true;
    if (isAtSelectionCap && !item.checked) return true;
    return false;
  }

  /**
   * @param {MouseEvent} event
   * @param {Item & { checked?: boolean }} item
   * @param {number} index Index into `itemsToUse`.
   * @param {boolean} itemDisabled
   */
  function handleOptionClick(event, item, index, itemDisabled) {
    if (itemDisabled) {
      event.stopPropagation();
      return;
    }
    // Label default synthesizes a second click; without this,
    // selectItem runs twice and the toggle nets to no change.
    event.preventDefault();
    const usedRange =
      event.shiftKey &&
      prevSelectedItemId !== null &&
      !item.isSelectAll &&
      selectItemRange(index, !item.checked);
    if (!usedRange) {
      selectItem(item);
    }
    prevSelectedItemId = item.id;
  }

  /**
   * Select the item keyboard-highlighted at `index` (into `itemsToUse`), or
   * with `shiftKey` select the range from the anchor to it, matching
   * shift+click (`handleOptionClick`). Ignored unless the highlight came
   * from the keyboard: a hover highlight must not become selectable by
   * pressing Enter/Space elsewhere.
   * @param {number} index
   * @param {boolean} shiftKey
   */
  function selectHighlightedItem(index, shiftKey) {
    if (highlightOrigin !== "keyboard" || index < 0) return;
    const item = itemsToUse[index];
    if (!item) return;
    const usedRange =
      shiftKey &&
      prevSelectedItemId !== null &&
      !item.isSelectAll &&
      selectItemRange(index, !item.checked);
    if (!usedRange) selectItem(item);
    prevSelectedItemId = item.id;
  }

  /**
   * @param {number} index Index into `itemsToUse`.
   * @param {boolean} itemDisabled
   */
  function handleOptionMouseenter(index, itemDisabled) {
    if (itemDisabled) return;
    highlightedIndex = index;
    highlightOrigin = "pointer";
  }

  function change(step) {
    // Disabled options stay in the keyboard navigation sequence (APG:
    // "Focusability of disabled controls") so assistive-tech users can
    // discover them; selectItem and the option click handlers refuse the
    // actual selection.
    //
    // `filteredItems` is gated on `open` and recomputes reactively, so it can
    // still be stale/empty here immediately after synchronously flipping
    // `open` to `true` in the same keydown handler (before the reactive
    // statement re-runs). Fall back to `sortedItems` in that case, matching
    // ComboBox's `filteredItems?.length ? filteredItems : items` guard.
    const navigableItems = filteredItems.length ? filteredItems : sortedItems;
    highlightedIndex = moveIndex(highlightedIndex, step, navigableItems.length);
    highlightOrigin = "keyboard";
  }

  /**
   * Move the (keyboard) highlight to the next enabled item whose text starts
   * with the accumulating typed characters, wrapping once. Only wired for
   * the non-filterable field, since the filterable text input filters as
   * you type. Matches Dropdown's `typeaheadSearch`: it moves the highlight,
   * it never selects.
   * @param {string} character
   */
  function typeaheadSearch(character) {
    if (itemsToUse.length === 0) return;

    const query = typeahead.push(character);

    highlightedIndex = typeaheadIndex({
      items: itemsToUse,
      query,
      itemToString,
      index: highlightedIndex,
    });
    highlightOrigin = "keyboard";
  }

  /**
   * Sync the isSelectAll pseudo-item's checked state to whether every selectable item is
   * checked. Mutates `sortedItems` in place; callers reassign it afterward.
   */
  function syncSelectAllItem() {
    if (!hasSelectAll) return;

    // Recomputed fresh from `sortedItems`/`value` (plain reads) rather than
    // the `$:`-derived `selectAllScope`/`selectableItems`, which haven't
    // picked up the mutation callers make to `sortedItems` just before
    // calling this (reactive statements only re-run on the next tick).
    const scope =
      filterable && open
        ? sortedItems.filter(
            (sortedItem) =>
              sortedItem.isSelectAll || filterItem(sortedItem, value),
          )
        : sortedItems;
    const selectable = scope.filter(
      (sortedItem) => !sortedItem.disabled && !sortedItem.isSelectAll,
    );
    const newSelectableChecked = selectable.filter(
      (sortedItem) => sortedItem.checked,
    ).length;
    const newAllSelected =
      selectable.length > 0 && newSelectableChecked === selectable.length;
    const selectAllIndex = sortedItems.findIndex(
      (sortedItem) => sortedItem.isSelectAll,
    );
    if (
      selectAllIndex !== -1 &&
      sortedItems[selectAllIndex].checked !== newAllSelected
    ) {
      sortedItems[selectAllIndex] = {
        ...sortedItems[selectAllIndex],
        checked: newAllSelected,
      };
    }
  }

  /**
   * Mirror an external `selectedIds` change onto the checked state in place,
   * without reordering, for the modes that defer re-sorting.
   */
  function syncCheckedFromSelectedIds() {
    const ids = new Set(selectedIds);
    sortedItems = sortedItems.map((entry) =>
      entry.isSelectAll || entry.checked === ids.has(entry.id)
        ? entry
        : { ...entry, checked: ids.has(entry.id) },
    );
    syncSelectAllItem();
    prevChecked = sortedItems.filter((item) => item.checked);
  }

  /** Apply `selectionFeedback: "top"` bookkeeping after a checked-state change. */
  function applyTopSelectionFeedback() {
    if (selectionFeedback !== "top") return;

    selectedIds = sortedItems
      .filter((sortedItem) => sortedItem.checked && !sortedItem.isSelectAll)
      .map((sortedItem) => sortedItem.id);
    prevSelectedIds = selectedIds.slice();
    sortedItems = sort();
  }

  /**
   * Set every non-disabled item within `selectAllScope` to `checked`
   * (including the isSelectAll pseudo-item, if present, so its own checkbox
   * follows along without a separate `syncSelectAllItem()` call). Shared by
   * the isSelectAll pseudo-item's toggle and Ctrl+A.
   * @param {boolean} checked
   */
  function setSelectAllScopeChecked(checked) {
    sortedItems = sortedItems.map((sortedItem) =>
      !selectAllScopeIds.has(sortedItem.id) ||
      sortedItem.disabled ||
      sortedItem.checked === checked
        ? sortedItem
        : { ...sortedItem, checked },
    );
  }

  /** Handle selection of an item, including isSelectAll logic. */
  function selectItem(item) {
    // Read-only allows opening and navigating the menu to review values, but
    // never changing them. Guarding here covers every path (click, Enter,
    // label click, select-all) so callers don't each need a readonly check.
    if (readonly || isItemDisabled(item)) return;

    if (item.isSelectAll) {
      setSelectAllScopeChecked(!allSelected);
    } else {
      const itemIndex = sortedItems.indexOf(item);
      if (itemIndex !== -1) {
        sortedItems[itemIndex] = { ...item, checked: !item.checked };
      }

      syncSelectAllItem();
      sortedItems = [...sortedItems];
    }

    applyTopSelectionFeedback();
  }

  /**
   * Select or deselect every selectable item currently in scope (filtered
   * when `filterable` and `open`), toggling to the opposite of `allSelected`.
   * Same semantics as clicking the isSelectAll pseudo-item, whether or not
   * `items` declares one. Bound to Ctrl+A in
   * the non-filterable field; the filterable text input intentionally never
   * calls this so native text selection (Ctrl+A on the input) keeps working.
   */
  function selectAllViaKeyboard() {
    if (readonly || hasMaxSelectedItems || selectableItems.length === 0) {
      return;
    }
    setSelectAllScopeChecked(!allSelected);
    applyTopSelectionFeedback();
  }

  /**
   * Apply `checked` to every selectable item between the anchor item and `targetIndex`
   * (inclusive), where `targetIndex` is a position in `itemsToUse`. Returns `false` if the
   * anchor item is no longer present (for example, filtered out), so the caller can fall
   * back to a single toggle.
   * @type {(targetIndex: number, checked: boolean) => boolean}
   */
  function selectItemRange(targetIndex, checked) {
    if (readonly) return false;

    const anchorIndex = itemsToUse.findIndex(
      (item) => item.id === prevSelectedItemId,
    );
    if (anchorIndex === -1) return false;

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);
    const rangeIds = new Set(
      itemsToUse
        .slice(start, end + 1)
        .filter((item) => !item.isSelectAll && !isItemDisabled(item))
        .map((item) => item.id),
    );

    sortedItems = sortedItems.map((sortedItem) =>
      rangeIds.has(sortedItem.id) && sortedItem.checked !== checked
        ? { ...sortedItem, checked }
        : sortedItem,
    );

    syncSelectAllItem();
    applyTopSelectionFeedback();

    return true;
  }

  /**
   * Announce a message through the visually-hidden status region. The text is
   * reset first so announcing the same message twice still mutates the DOM —
   * live regions only fire on an actual text change.
   * @param {string} text
   */
  async function announceStatus(text) {
    statusText = "";
    await tick();
    statusText = text;
  }

  /**
   * Clear the multiselect selection programmatically.
   * By default, focuses the multiselect after clearing. Set `options.focus` to `false` to prevent focusing.
   * Set `options.open` to `true` to open the dropdown menu after clearing.
   * @type {(options?: { focus?: boolean; open?: boolean; }) => Promise<void>}
   * @example
   * ```svelte
   * <MultiSelect bind:this={multiSelect} items={items} />
   * <button on:click={() => multiSelect.clear()}>Clear</button>
   * ```
   */
  export async function clear(options = {}) {
    if (readonly || selectionCount === 0) return;
    selectedIds = [];
    prevSelectedIds = [];
    prevSelectedItemId = null;
    sortedItems = sortedItems.map((item) => ({ ...item, checked: false }));
    announceStatus(selectionClearedText);
    await tick();
    if (options?.open === true) open = true;
    if (options?.focus !== false) (filterable ? inputRef : fieldRef)?.focus();
  }

  /** Filter result count last announced; null when the menu is closed so reopening announces again. */
  let announcedFilterCount = null;

  const announceFilterResults = debounce((count) => {
    if (count === announcedFilterCount) return;
    announcedFilterCount = count;
    announceStatus(filterResultsText(count));
  }, 800);

  onMount(() => {
    return () => {
      announceFilterResults.cancel();
      typeahead.clear();
      menuWindow.destroy();
    };
  });

  afterUpdate(() => {
    // Compare by length, not by IDs. This is intentional: `on:select`
    // should only fire in response to UI interaction (toggle/clear),
    // not programmatic `selectedIds` changes. A length check is sufficient
    // because `selectItem` only ever toggles one item at a time, so user-
    // driven changes always alter the count.
    if (checked.length !== prevChecked.length) {
      prevChecked = checked;
      selectedIds = checked
        .filter((item) => !item.isSelectAll)
        .map((item) => item.id);
      prevSelectedIds = selectedIds.slice();
      if (!initialRender) {
        dispatch("select", {
          selectedIds,
          selected: checked.filter((item) => !item.isSelectAll),
          unselected: unchecked.filter((item) => !item.isSelectAll),
        });
      }
    }
    initialRender = false;

    if (!open) {
      highlightedIndex = -1;
      highlightOrigin = null;
      prevHighlightedIndex = -1;
      typeahead.clear();
      if (prevOpen && filterable) {
        value = "";
      }
    }

    // Scroll to highlighted item when it changes via keyboard navigation.
    // Only scroll if the item is outside the visible viewport.
    prevHighlightedIndex = scheduleHighlightScroll({
      open,
      shouldVirtualize,
      highlightedIndex,
      prevHighlightedIndex,
      listRef,
      isMeasured,
      highlightOrigin,
      menuWindow,
    });

    // Scroll to first selected item when menu opens with virtualization
    const wasJustOpened = open && !prevOpen;
    if (wasJustOpened && shouldVirtualize && listRef) {
      tick().then(() => {
        if (!listRef) return;
        // Against `itemsToUse`, the rendered list, which sorting and filtering
        // can order differently from `items`.
        const selectedIndex =
          selectedIds && selectedIds.length > 0
            ? itemsToUse.findIndex((item) => item.id === selectedIds[0])
            : -1;
        menuWindow.scrollIntoView(selectedIndex, "top");
      });
    }
    prevOpen = open;

    menuWindow.sync();

    // Reset scroll position when menu closes
    if (!open && prevOpen && shouldVirtualize) {
      listScrollTop = resetVirtualScrollOnClose();
      if (listRef) {
        listRef.scrollTop = listScrollTop;
      }
    }
    if (!open) {
      scrollEndTracker.reset();
      menuWindow.reset();
    }
  });

  /**
   * @param {Event} event
   */
  function handleMenuScroll(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    listScrollTop = target.scrollTop;
    menuWindow.noteScroll(target.scrollTop);
    const detail = scrollEndTracker.observe({
      scrollTop: target.scrollTop,
      scrollHeight: target.scrollHeight,
      clientHeight: target.clientHeight,
      itemCount: itemsToUse.length,
    });
    if (detail) {
      dispatch("scrollend", detail);
    }
  }

  /**
   * Index `entries` by id, bucketing same-id entries in order so duplicate
   * ids pair up positionally (first old duplicate reused for the first new
   * occurrence) instead of one id silently overwriting another.
   * @type {(entries: typeof sortedItems) => Map<string, typeof sortedItems>}
   */
  function indexById(entries) {
    const map = new Map();
    for (const entry of entries) {
      const bucket = map.get(entry.id);
      if (bucket) bucket.push(entry);
      else map.set(entry.id, [entry]);
    }
    return map;
  }

  /**
   * Alphabetical order depends only on `items` and `sortItem`, never on
   * `selectedIds`, so it's cached across `sort()` calls that only change
   * selection (a toggle, an external `selectedIds` change, a close with
   * `top-after-reopen`). Keyed on `items` reference: `sort()` only runs for
   * a genuinely different `items` value (see `isAlreadySorted`), so a
   * reference change here always means the order needs recomputing.
   *
   * `sortItem` is intentionally NOT part of the cache key: like today, a new
   * `sortItem` function does nothing until some other change forces a
   * re-sort (define it outside the markup, as with `filterItem`/date rules
   * elsewhere in this library).
   */
  let baseOrderItems;
  let baseOrderPairs;
  function getBaseOrderPairs() {
    if (baseOrderItems === items) return baseOrderPairs;

    const regularItems = items.filter((item) => !item.isSelectAll);
    const regularSnapshots = prevItemsSnapshot.filter(
      (item) => !item.isSelectAll,
    );
    const pairs = regularItems.map((item, index) => ({
      item,
      snapshot: regularSnapshots[index],
    }));
    if (sortItem !== false) {
      pairs.sort((a, b) => sortItem(a.item, b.item));
    }

    baseOrderItems = items;
    baseOrderPairs = pairs;
    return pairs;
  }

  function sort() {
    const selectedIdsSet = new Set(selectedIds);

    const regularItems = items.filter((item) => !item.isSelectAll);
    const selectAllItems = items.filter((item) => item.isSelectAll);
    const selectAllSnapshots = prevItemsSnapshot.filter(
      (item) => item.isSelectAll,
    );
    const enabledRegularItems = regularItems.filter((item) => !item.disabled);
    const allChecked =
      enabledRegularItems.length > 0 &&
      enabledRegularItems.every((item) => selectedIdsSet.has(item.id));

    // Reuse the previous entry object for `item` when nothing about it
    // changed, so a keyed `{#each}` block sees the same reference and skips
    // re-evaluating that option. `snapshot` is the value `item` had the last
    // time `sortedItems` was rebuilt (positionally paired via `items`'s
    // filtered order, not by id, so it also catches an in-place mutation
    // handed back under the same id).
    const prevById = indexById(sortedItems);
    const reuseOrBuildEntry = (item, snapshot, checked) => {
      const bucket = prevById.get(item.id);
      const prev = bucket?.[0];
      if (
        prev &&
        prev.checked === checked &&
        snapshot !== undefined &&
        deepEqual(snapshot, item)
      ) {
        bucket.shift();
        return prev;
      }
      return { ...item, checked };
    };

    const selectAllEntries = selectAllItems.map((item, index) =>
      reuseOrBuildEntry(item, selectAllSnapshots[index], allChecked),
    );

    const baseOrder = getBaseOrderPairs();

    if (
      selectionFeedback === "top" ||
      selectionFeedback === "top-after-reopen"
    ) {
      // Stable partition of the cached alphabetical order: checked entries
      // first (in base order), then unchecked (in base order). Zero
      // comparator calls, and equivalent to sorting each group separately
      // (as before) because `baseOrder` is already sorted by the same
      // comparator and `Array.prototype.sort` is stable, so ties keep
      // `items` order in both designs.
      const checkedItems = [];
      const uncheckedItems = [];
      for (const { item, snapshot } of baseOrder) {
        const checked = selectedIdsSet.has(item.id);
        const entry = reuseOrBuildEntry(item, snapshot, checked);
        (checked ? checkedItems : uncheckedItems).push(entry);
      }

      return [...selectAllEntries, ...checkedItems, ...uncheckedItems];
    }

    return [
      ...selectAllEntries,
      ...baseOrder.map(({ item, snapshot }) =>
        reuseOrBuildEntry(item, snapshot, selectedIdsSet.has(item.id)),
      ),
    ];
  }

  // Shallow copies, so an item mutated in place and handed over in a new
  // array still reads as changed. Declared before the first `sort()` call,
  // which reads it to decide whether an entry can be reused.
  let prevItemsSnapshot = items.map((item) => ({ ...item }));
  sortedItems = sort();
  let prevItems = items;

  /**
   * Whether `sortedItems` already describes `nextItems` and `nextSelectedIds`,
   * so sorting again would only rebuild every option for the same result.
   * @type {(nextItems: typeof items, nextSelectedIds: typeof selectedIds) => boolean}
   */
  function isAlreadySorted(nextItems, nextSelectedIds) {
    if (!deepEqual(prevItemsSnapshot, nextItems)) return false;

    const checkedIds = new Set();
    for (const item of sortedItems) {
      if (item.checked && !item.isSelectAll) checkedIds.add(item.id);
    }

    return sameIdSet(nextSelectedIds, checkedIds);
  }

  /**
   * Whether `ids` holds exactly the ids in `idSet`, ignoring order and
   * duplicates. Sizes are compared as sets, not by `ids.length`: a duplicate
   * (`["1", "1"]` against `{"1", "2"}`) matches on length and membership
   * while selecting something different.
   * @type {(ids: typeof selectedIds, idSet: Set<typeof selectedIds[number]>) => boolean}
   */
  function sameIdSet(ids, idSet) {
    if (ids.length < idSet.size) return false;
    if (!ids.every((id) => idSet.has(id))) return false;
    return new Set(ids).size === idSet.size;
  }

  /**
   * Value-compare two `selectedIds` arrays, ignoring order: `sort()` only
   * ever tests membership via a `Set`, so a reordered-but-otherwise-equal
   * array produces the same result and shouldn't trigger a re-sort.
   * @type {(a: typeof selectedIds, b: typeof selectedIds) => boolean}
   */
  function sameSelectedIds(a, b) {
    return sameIdSet(a, new Set(b));
  }

  $: menuId = `menu-${id}`;
  $: comboId = `combo-${id}`;
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: readonlyId = `readonly-${id}`;
  $: selectionId = `selection-${id}`;
  // `aria-readonly` on a combobox/listbox does not reliably surface read-only state,
  // so the read-only state is also exposed as a visually-hidden description. The
  // single status/help id is combined with the read-only id (a describedby
  // may reference multiple ids) so it works in every state.
  $: statusDescribedById =
    showInvalid && invalidText
      ? errorId
      : showWarn && warnText
        ? warnId
        : !isFluid && !showInvalid && !showWarn && helperText
          ? helperId
          : undefined;
  $: hasSelectionDescription = !readonly && selectionCount > 0;
  $: fieldDescribedById =
    [
      readonly ? readonlyId : null,
      hasSelectionDescription ? selectionId : null,
      statusDescribedById,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  // The selection count badge is hidden from assistive tech in read-only.
  // Fold the count into the read-only description so the
  // collapsed field still announces how much there is to review.
  $: readonlyDescription =
    selectionCount > 0
      ? `${readonlyText}, ${selectionCount} selected`
      : readonlyText;
  $: inline = type === "inline";
  $: isFluid = !inline && (fluid || !!formContext?.isFluid);
  // Keep the focus outline on the field while the menu is open, not just while
  // the field itself is focused: selecting an item bounces focus to the option
  // and back, which would otherwise drop the outline mid-interaction.
  $: showFluidFieldFocus = isFluid && (fieldFocused || open);
  $: showFieldFocus = !isFluid && (fieldFocused || open);
  // Fluid (non-condensed) menu items are 64px tall (see css/_fluid-list-box.scss).
  // Portaled menus render outside the fluid wrapper, so they keep default heights.
  $: hasFluidMenuItems = isFluid && !condensed && !effectivePortalMenu;
  // Invalid/warn states are suppressed when the multi-select is disabled or read-only.
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
  // Neutral = default fluid state, i.e. none of the other wrapper modifiers apply.
  $: fluidNeutral =
    isFluid && !showInvalid && !showWarn && !disabled && !readonly;
  // Hoverable = disabled/readonly do not suppress the invalid/warning hover
  // tint. showInvalid/showWarn already exclude both, so this only matters
  // for readability of the selector it replaces.
  $: fluidHoverable = isFluid && !disabled && !readonly;
  $: ariaLabel = $$props["aria-label"] ?? "Choose an item";
  $: if (items !== prevItems) {
    prevItems = items;
    if (!isAlreadySorted(items, selectedIds)) {
      // `sort()` reads the OLD `prevItemsSnapshot` to decide which entries
      // changed, so it must run before the snapshot is refreshed to match
      // the new `items` — otherwise every entry would compare equal to its
      // own just-taken snapshot and get stale-reused.
      sortedItems = sort();
      prevItemsSnapshot = items.map((item) => ({ ...item }));
      prevChecked = sortedItems.filter((item) => item.checked);
    }
  }
  $: if (
    selectedIds &&
    ((selectionFeedback === "top" &&
      !sameSelectedIds(selectedIds, prevSelectedIds)) ||
      (selectionFeedback === "top-after-reopen" && open === false))
  ) {
    const external = !sameSelectedIds(selectedIds, prevSelectedIds);
    prevSelectedIds = selectedIds.slice();
    sortedItems = sort();
    // Set by the consumer, not by a toggle or clear(): re-baseline so
    // afterUpdate does not report it as a `select`.
    if (external) prevChecked = sortedItems.filter((item) => item.checked);
  } else if (selectedIds && !sameSelectedIds(selectedIds, prevSelectedIds)) {
    prevSelectedIds = selectedIds.slice();
    syncCheckedFromSelectedIds();
  }
  $: hasSelectAll = items.some((item) => item.isSelectAll);
  $: checked = sortedItems.filter((item) => item.checked);
  $: unchecked = sortedItems.filter((item) => !item.checked);
  // Native form participation, decoupled from what's rendered: derived from
  // `items` + `selectedIds` directly (in `items` order), never
  // `sortedItems`/`checked` (whose order shifts with `selectionFeedback`),
  // `filteredItems`, or the virtual window. Excludes the isSelectAll
  // pseudo-item and disabled items (matching native disabled checkboxes,
  // which never submit). A disabled MultiSelect disables the hidden inputs
  // themselves, so the field is omitted entirely, like a disabled native
  // control.
  $: selectedIdsSet = new Set(selectedIds);
  $: formItems = items.filter(
    (item) =>
      !item.isSelectAll && !item.disabled && selectedIdsSet.has(item.id),
  );
  // Scope select-all to the currently visible (filtered) items, so it
  // doesn't check/uncheck items hidden by an active filter.
  $: selectAllScope = filterable && open ? filteredItems : sortedItems;
  $: selectAllScopeIds = new Set(selectAllScope.map((item) => item.id));
  $: selectableItems = selectAllScope.filter(
    (item) => !item.disabled && !item.isSelectAll,
  );
  $: selectableCheckedCount = selectableItems.filter(
    (item) => item.checked,
  ).length;
  $: allSelected =
    selectableItems.length > 0 &&
    selectableCheckedCount === selectableItems.length;
  $: selectAllIndeterminate =
    hasSelectAll && selectableCheckedCount > 0 && !allSelected;
  $: selectionCount = hasSelectAll
    ? checked.filter((item) => !item.isSelectAll).length
    : checked.length;
  $: hasMaxSelectedItems =
    typeof maxSelectedItems === "number" && maxSelectedItems > 0;
  $: isAtSelectionCap =
    hasMaxSelectedItems && selectionCount >= maxSelectedItems;
  $: maxSelectedId = `max-selected-${id}`;
  $: filteredItems =
    filterable && open
      ? sortedItems.filter(
          (item) => item.isSelectAll || filterItem(item, value),
        )
      : [];
  $: filterResultCount = filteredItems.filter(
    (item) => !item.isSelectAll,
  ).length;
  $: if (filterable && open && value?.length > 0) {
    announceFilterResults(filterResultCount);
  } else {
    announceFilterResults.cancel();
  }
  $: if (!open) {
    announcedFilterCount = null;
    statusText = "";
  }
  $: highlightedId =
    highlightedIndex > -1
      ? ((filterable ? filteredItems : sortedItems)[highlightedIndex]?.id ??
        null)
      : null;
  $: activeDescendantId =
    highlightedId == null ? null : `${id}-${highlightedId}`;

  $: shouldVirtualize = shouldVirtualizeMenu({ items, virtualize });

  $: itemsToUse = filterable ? filteredItems : sortedItems;
  $: scrollEndTracker.noteItemCount(itemsToUse.length);

  $: menuState = menuWindow.update({
    items: itemsToUse,
    getKey: (item) => item.id,
    shouldVirtualize,
    virtualize,
    wrapOptions,
    size,
    fluid: hasFluidMenuItems,
    scrollTop: listScrollTop,
  });
  $: ({
    itemsToRender,
    isVirtualized,
    startIndex,
    offsetY,
    totalHeight,
    menuMaxHeight,
    isWindowed,
    isMeasured,
  } = menuState);

  $: multiSelectListBoxClass = [
    "bx--multi-select",
    direction === "top" && "bx--list-box--up",
    filterable && "bx--combo-box",
    filterable && "bx--multi-select--filterable",
    showInvalid && "bx--multi-select--invalid",
    inline && "bx--multi-select--inline",
    readonly && "bx--multi-select--readonly",
    selectionCount > 0 && "bx--multi-select--selected",
    hasSelectAll && "bx--multi-select--selectall",
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * Dismiss the menu and notify consumers of the cause. Guarded on `open` so a
   * dismissal gesture fired while already closed does not emit a phantom event.
   * @type {(trigger: "escape-key" | "outside-click") => void}
   */
  function close(trigger) {
    if (open) {
      open = false;
      dispatch("close", { trigger });
    }
  }

  function handleOutsideInteraction(event) {
    if (
      open &&
      isOutsideClick(event, [multiSelectRef, effectivePortalMenu && listRef])
    ) {
      close("outside-click");
    }
  }
</script>

<div
  bind:this={multiSelectRef}
  use:dismiss={{
    enabled: open,
    type: ["click", "focusin"],
    handler: handleOutsideInteraction,
  }}
  class:bx--multi-select__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--multi-select__wrapper--inline={inline}
  class:bx--list-box__wrapper--inline={inline}
  class:bx--multi-select__wrapper--inline--invalid={inline && showInvalid}
  class:bx--list-box__wrapper--fluid={isFluid}
  class:bx--list-box__wrapper--fluid--neutral={fluidNeutral}
  class:bx--list-box__wrapper--fluid--hoverable={fluidHoverable}
  class:bx--list-box__wrapper--fluid--invalid={isFluid && showInvalid}
  class:bx--list-box__wrapper--fluid--warning={isFluid && showWarn}
  class:bx--list-box__wrapper--fluid--disabled={isFluid && disabled}
  class:bx--list-box__wrapper--fluid--readonly={isFluid && readonly}
  class:bx--list-box__wrapper--fluid--condensed={isFluid && condensed}
  class:bx--multi-select--filterable__wrapper={isFluid && filterable}
>
  {#each formItems as item (item.id)}
    {@const itemInput = itemToInput(item) ?? {}}
    <input
      type="hidden"
      name={itemInput.name ?? name ?? item.id}
      value={itemInput.value ?? (name ? item.id : "")}
      {disabled}
    >
  {/each}
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </label>
  {/if}
  <ListBox
    id={comboId}
    aria-label={ariaLabel}
    {disabled}
    invalid={showInvalid}
    invalidText={isFluid ? "" : invalidText}
    invalidId={errorId}
    {open}
    {light}
    {size}
    warn={showWarn}
    warnText={isFluid ? "" : warnText}
    {warnId}
    class={multiSelectListBoxClass}
  >
    {#if showInvalid}
      <WarningFilled class="bx--list-box__invalid-icon" />
    {/if}
    {#if showWarn}
      <WarningAltFilled
        class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
      />
    {/if}
    {#if filterable}
      <div
        style={isFluid ? undefined : "display: contents"}
        class:bx--list-box__field--wrapper={isFluid}
        class:bx--list-box__field--wrapper--input-focused={showFluidFieldFocus}
      >
        <div
          class:bx--list-box__field={true}
          class:bx--list-box__field--wrapper--input-focused={!isFluid &&
            showFieldFocus}
        >
          {#if selectionCount > 0}
            <ListBoxSelection
              {selectionCount}
              on:clear
              on:clear={() => clear({ open: openOnClear })}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
            />
          {/if}
          <input
            bind:this={inputRef}
            bind:value
            {...$$restProps}
            role="combobox"
            tabindex="0"
            autocomplete="off"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-activedescendant={activeDescendantId}
            aria-disabled={disabled || undefined}
            aria-readonly={readonly || undefined}
            aria-controls={open ? menuId : undefined}
            aria-describedby={fieldDescribedById}
            class:bx--text-input={true}
            class:bx--text-input--empty={value === ""}
            class:bx--text-input--light={light}
            on:click={() => {
            if (disabled) return;
            open = true;
          }}
            on:keydown
            on:keydown|stopPropagation={(event) => {
            // Read-only opens and navigates the menu to review values, but the
            // keys that clear the selection are blocked; selectItem guards the
            // rest (Enter/option toggle).
            if (readonly && (event.key === "Backspace" || event.key === "Delete")) {
              return;
            }
            if (event.key === "Enter") {
              selectHighlightedItem(highlightedIndex, event.shiftKey);
            } else if (event.key === "Tab") {
              // Tab dismisses without selecting; report it as a keyboard
              // dismissal, like Dropdown and ComboBox.
              close("escape-key");
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              if (event.altKey) {
                // APG combobox pattern: Alt+ArrowDown opens a closed menu
                // without moving the highlight; Alt+ArrowUp closes an open one.
                if (event.key === "ArrowDown" && !open) {
                  open = true;
                } else if (event.key === "ArrowUp" && open) {
                  close("escape-key");
                }
              } else {
                if (!open) open = true;
                change(step);
              }
            } else if (event.key === "Escape") {
              close("escape-key");
            } else if (event.key === " ") {
              if (readonly) event.preventDefault();
              if (!open) open = true;
            } else if (event.key === "Backspace" && value === "") {
              clear({ open: openOnClear });
            } else if (event.key === "Delete") {
              value = "";
              if (!open) clear({ open: openOnClear });
            }
          }}
            on:input
            on:input={() => {
            if (!open) open = true;
          }}
            on:keyup
            on:focus
            on:focus={() => {
            fieldFocused = true;
            if (selectTextOnFocus && !disabled) {
              tick().then(() => inputRef?.select());
            }
          }}
            on:blur
            on:blur={() => {
            fieldFocused = false;
          }}
            on:paste
            {disabled}
            {readonly}
            {placeholder}
            {id}
          >
          {#if value}
            <ListBoxSelection
              on:clear={() => {
              value = "";
              open = false;
              // `bind:value` writes the DOM value without firing "input",
              // so the `on:input` below would miss this clear. Set the
              // node first, then dispatch. Svelte's `bind:value` listener
              // reads `event.target.value`, and the reactive assignment
              // above has not flushed yet.
              if (inputRef) {
                inputRef.value = "";
                inputRef.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
              {open}
            />
          {/if}
          <ListBoxMenuIcon
            on:click={(event) => {
            if (disabled) return;
            event.stopPropagation();
            open = !open;
          }}
            {translateWithId}
            {open}
          />
        </div>
      </div>
    {:else}
      <!-- The visible focus outline renders on this wrapper, not the field
           itself: Carbon resets `.bx--list-box__field:focus` to a transparent
           outline, which outranks the `--input-focused` rule when both target
           the focused field. Placing `--input-focused` on the (unfocused)
           wrapper avoids that `:focus` specificity bump. -->
      <div
        class:bx--list-box__field--wrapper={true}
        class:bx--list-box__field--wrapper--input-focused={isFluid
          ? showFluidFieldFocus
          : showFieldFocus}
      >
        <ListBoxField
          {...$$restProps}
          role="combobox"
          tabindex="0"
          aria-expanded={open}
          aria-activedescendant={activeDescendantId}
          aria-controls={open ? menuId : undefined}
          aria-describedby={fieldDescribedById}
          on:focus={() => {
          fieldFocused = true;
        }}
          on:click={() => {
          if (disabled) return;
          open = !open;
        }}
          on:keydown={(event) => {
          // The field is only aria-disabled, so a click can still focus it.
          if (disabled) return;
          if (
            event.key === " " ||
            event.key === "Enter" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown"
          ) {
            // Prevent the native button from synthesizing a click (which would
            // toggle the menu) so these keys are handled solely below.
            event.preventDefault();
          }
          // Read-only still opens and navigates the menu; selectItem is the
          // single guard that blocks the actual selection change.
          if (event.key === " ") {
            if (open) {
              selectHighlightedItem(highlightedIndex, event.shiftKey);
            } else {
              open = true;
            }
          } else if (event.key === "Tab") {
            // Tab dismisses without selecting; report it as a keyboard
            // dismissal, like Dropdown and ComboBox.
            close("escape-key");
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const step = event.key === "ArrowDown" ? 1 : -1;
            if (event.altKey) {
              // APG combobox pattern: Alt+ArrowDown opens a closed menu
              // without moving the highlight; Alt+ArrowUp closes an open one.
              if (event.key === "ArrowDown" && !open) {
                open = true;
              } else if (event.key === "ArrowUp" && open) {
                close("escape-key");
              }
            } else {
              if (!open) open = true;
              change(step);
            }
          } else if (event.key === "Enter") {
            if (open) {
              selectHighlightedItem(highlightedIndex, event.shiftKey);
            } else {
              open = true;
            }
          } else if (event.key === "Escape") {
            close("escape-key");
          } else if (event.key === "Home" || event.key === "End") {
            // APG select-only combobox: Home/End open a closed listbox, then
            // move the highlight to the first/last option. The filterable
            // variant deliberately leaves these keys to the text caret.
            event.preventDefault();
            if (!open) open = true;
            highlightedIndex =
              event.key === "Home" ? 0 : itemsToUse.length - 1;
            highlightOrigin = "keyboard";
          } else if (event.key === "Delete" || event.key === "Backspace") {
            // Clear the whole selection from the keyboard, menu open or
            // closed, matching the filterable variant. Read-only reviews the
            // menu but never changes the selection.
            if (readonly) return;
            event.preventDefault();
            clear({ open: openOnClear });
          } else if (
            open &&
            (event.key === "a" || event.key === "A") &&
            (event.ctrlKey || event.metaKey)
          ) {
            // Only wired for the non-filterable field: the filterable text
            // input's Ctrl+A must keep selecting the filter text, not the
            // options, so it is deliberately left unhandled there.
            event.preventDefault();
            selectAllViaKeyboard();
          } else if (open && isTypeaheadKey(event)) {
            event.preventDefault();
            typeaheadSearch(event.key);
          }
        }}
          on:blur={(event) => {
          fieldFocused = false;
          dispatch("blur", event);
        }}
          {id}
          {disabled}
          {readonly}
        >
          {#if selectionCount > 0}
            <ListBoxSelection
              {selectionCount}
              on:clear
              on:clear={() => clear({ open: openOnClear })}
              translateWithId={translateWithIdSelection}
              {disabled}
              {readonly}
            />
          {/if}
          <span class:bx--list-box__label={true}>{label}</span>
          <ListBoxMenuIcon {open} {translateWithId} />
        </ListBoxField>
      </div>
    {/if}
    {#if open}
      <ListBoxMenu
        aria-label={ariaLabel}
        {id}
        portal={effectivePortalMenu}
        portalHostClass="bx--multi-select bx--list-box--expanded"
        {open}
        anchor={fieldRef}
        {direction}
        highlightedId={activeDescendantId}
        {wrapOptions}
        highlightScroll={highlightOrigin !== "pointer"}
        aria-multiselectable="true"
        aria-readonly={readonly || undefined}
        on:scroll
        on:scroll={handleMenuScroll}
        on:mouseleave={() => {
          // Clear the hover highlight when the cursor leaves the menu so the
          // highlighted state does not linger on the last hovered item.
          highlightedIndex = -1;
          highlightOrigin = null;
        }}
        bind:ref={listRef}
        style={isWindowed
          ? `max-height: ${menuMaxHeight}; overflow-y: auto;`
          : effectivePortalMenu
            ? `max-height: ${menuMaxHeight};`
            : undefined}
      >
        {#if isVirtualized}
          <div style:height="{totalHeight}px" style:position="relative">
            <div style:transform="translateY({offsetY}px)">
              {#each itemsToRender as item, index (item.id)}
                {@const actualIndex = startIndex + index}
                {@const optionId = `${id}-${item.id}`}
                {@const itemDisabled =
                  item.disabled ||
                  (hasMaxSelectedItems && !!item.isSelectAll) ||
                  (isAtSelectionCap && !item.checked)}
                {@const capDisabled =
                  isAtSelectionCap &&
                  !item.checked &&
                  !item.disabled &&
                  !item.isSelectAll}
                <ListBoxMenuItem
                  id={optionId}
                  role="option"
                  aria-labelledby="checkbox-{id}-{item.id}"
                  aria-describedby={capDisabled ? maxSelectedId : undefined}
                  aria-selected={item.isSelectAll ? allSelected : item.checked}
                  aria-checked={item.isSelectAll
                    ? selectAllIndeterminate
                      ? "mixed"
                      : allSelected
                    : item.checked}
                  aria-setsize={itemsToUse.length}
                  aria-posinset={actualIndex + 1}
                  data-virtual-index={isMeasured ? actualIndex : undefined}
                  active={item.isSelectAll ? false : item.checked}
                  disabled={itemDisabled}
                  on:click={(event) => handleOptionClick(event, item, actualIndex, itemDisabled)}
                  on:mousedown={(event) => {
                    // Keep focus on the field so screen readers don't
                    // re-announce it on every option click.
                    event.preventDefault();
                  }}
                  on:mouseenter={() => handleOptionMouseenter(actualIndex, itemDisabled)}
                >
                  <HighlightSlot {optionId} let:highlighted>
                    <Checkbox
                      title={useTitleInItem ? itemToString(item) : undefined}
                      {...itemToInput(item)}
                      name={undefined}
                      tabindex="-1"
                      decorative
                      id="checkbox-{id}-{item.id}"
                      checked={item.isSelectAll ? allSelected : item.checked}
                      indeterminate={item.isSelectAll
                        ? selectAllIndeterminate
                        : false}
                      disabled={itemDisabled}
                      {readonly}
                    >
                      <slot
                        slot="labelChildren"
                        {item}
                        index={actualIndex}
                        selected={item.isSelectAll ? allSelected : item.checked}
                        {highlighted}
                      >
                        {itemToString(item)}
                      </slot>
                    </Checkbox>
                  </HighlightSlot>
                </ListBoxMenuItem>
              {/each}
            </div>
          </div>
        {:else}
          {#each itemsToRender as item, index (item.id)}
            {@const optionId = `${id}-${item.id}`}
            {@const itemDisabled =
              item.disabled ||
              (hasMaxSelectedItems && !!item.isSelectAll) ||
              (isAtSelectionCap && !item.checked)}
            {@const capDisabled =
              isAtSelectionCap &&
              !item.checked &&
              !item.disabled &&
              !item.isSelectAll}
            <ListBoxMenuItem
              id={optionId}
              role="option"
              aria-labelledby="checkbox-{id}-{item.id}"
              aria-describedby={capDisabled ? maxSelectedId : undefined}
              aria-selected={item.isSelectAll ? allSelected : item.checked}
              aria-checked={item.isSelectAll
                ? selectAllIndeterminate
                  ? "mixed"
                  : allSelected
                : item.checked}
              data-virtual-index={isMeasured ? index : undefined}
              active={item.isSelectAll ? false : item.checked}
              disabled={itemDisabled}
              on:click={(event) => handleOptionClick(event, item, index, itemDisabled)}
              on:mousedown={(event) => {
                // Keep focus on the field so screen readers don't
                // re-announce it on every option click.
                event.preventDefault();
              }}
              on:mouseenter={() => handleOptionMouseenter(index, itemDisabled)}
            >
              <HighlightSlot {optionId} let:highlighted>
                <Checkbox
                  title={useTitleInItem ? itemToString(item) : undefined}
                  {...itemToInput(item)}
                  name={undefined}
                  tabindex="-1"
                  decorative
                  id="checkbox-{id}-{item.id}"
                  checked={item.isSelectAll ? allSelected : item.checked}
                  indeterminate={item.isSelectAll
                    ? selectAllIndeterminate
                    : false}
                  disabled={itemDisabled}
                  {readonly}
                >
                  <slot
                    slot="labelChildren"
                    {item}
                    {index}
                    selected={item.isSelectAll ? allSelected : item.checked}
                    {highlighted}
                  >
                    {itemToString(item)}
                  </slot>
                </Checkbox>
              </HighlightSlot>
            </ListBoxMenuItem>
          {/each}
        {/if}
      </ListBoxMenu>
    {/if}
  </ListBox>
  {#if isFluid}
    <hr class:bx--list-box__divider={true}>
  {/if}
  {#if isFluid && showInvalid && invalidText}
    <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
  {#if isFluid && showWarn && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
  {#if !inline && !isFluid && !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if hasMaxSelectedItems}
    <span id={maxSelectedId} class:bx--visually-hidden={true}
      >{maxSelectedText}</span
    >
  {/if}
  {#if readonly}
    <span id={readonlyId} class:bx--visually-hidden={true}
      >{readonlyDescription}</span
    >
  {/if}
  {#if hasSelectionDescription}
    <span id={selectionId} class:bx--visually-hidden={true}
      >{selectionCount}
      selected. {clearSelectionText}</span
    >
  {/if}
  <!-- Live region for selection announcements. Always rendered (even while
       empty) so assistive tech registers the region before its text changes. -->
  <span role="status" aria-live="polite" class:bx--visually-hidden={true}
    >{statusText}</span
  >
</div>
