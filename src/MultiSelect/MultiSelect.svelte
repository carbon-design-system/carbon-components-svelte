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
   * @event {null} clear
   * @event {FocusEvent | CustomEvent<FocusEvent>} blur
   * @event {{ trigger: "escape-key" | "outside-click" }} close
   * @event {{ scrollTop: number; scrollHeight: number; clientHeight: number }} scrollend
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }}
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
  export let itemToString = (item) => item.text ?? item.id;

  /**
   * Override the item name, title, labelText, or value passed to the user-selectable checkbox input as well as the hidden inputs.
   * @type {(item: Item) => { name?: string; labelText?: any; title?: string; value?: string }}
   */
  export let itemToInput = (_item) => {};

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
   * The default filtering is an exact string comparison.
   * @type {(item: Item, value: string) => boolean}
   */
  export let filterItem = (item, value) =>
    item.text.toLowerCase().includes(value.trim().toLowerCase());

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
   * @type {((a: Item, b: Item) => number) | (() => void)}
   */
  export let sortItem = (a, b) => getSortCollator().compare(a.text, b.text);

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
   * Build the assistive message announced through the status live region when
   * typing in the filterable variant changes how many options match.
   * The count excludes any "select all" item.
   * @type {(count: number) => string}
   */
  export let filterResultsText = (count) =>
    count === 0
      ? "No results"
      : `${count} result${count === 1 ? "" : "s"} available`;

  /**
   * Specify a name attribute for the select.
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
   * - `itemHeight` (default: size-based, or 64px for fluid unless `condensed`): Height of each item in pixels. Override when custom slots change row height.
   * - `containerHeight` (default: 300): The maximum height in pixels of the dropdown container.
   * - `overscan` (default: 3): The number of extra items to render above and below the viewport for smoother scrolling. Higher values may cause more flickering during very fast scrolling.
   * - `threshold` (default: 100): The minimum number of items required before virtualization activates. Lists with fewer items will render all items normally without virtualization.
   * - `maxItems` (default: undefined): The maximum number of items to render. When undefined, all visible items are rendered.
   * @type {undefined | boolean | { itemHeight?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number }}
   */
  export let virtualize = undefined;

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
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    ListBox,
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
    ListBoxSelection,
  } from "../ListBox";
  import HighlightSlot from "../ListBox/HighlightSlot.svelte";
  import {
    getMenuItemHeight,
    getMenuMaxHeight,
  } from "../ListBox/list-box-utils.js";
  import { debounce } from "../utils/debounce.js";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";
  import { createScrollEndTracker } from "../utils/isScrollNearEnd.js";
  import { moveIndex } from "../utils/moveIndex.js";
  import { uniqueId } from "../utils/uniqueId.js";
  import {
    resetVirtualScrollOnClose,
    scrollHighlightedIntoView,
    scrollSelectedIntoView,
    virtualListState,
  } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();
  const scrollEndTracker = createScrollEndTracker();
  const formContext = getContext("carbon:Form");
  const insideModal = getContext("carbon:Modal");

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
  let isInitialRender = true;
  let listScrollTop = 0;
  let prevOpen = false;
  let internalSelectedIdsRef = selectedIds;
  /** Anchor item id for shift+click range selection; cleared when selection is reset entirely. */
  let lastSelectedItemId = null;
  /** Text content of the visually-hidden status live region. */
  let statusText = "";

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
   * Sync the isSelectAll pseudo-item's checked state to whether every selectable item is
   * checked. Mutates `sortedItems` in place; callers reassign it afterward.
   */
  function syncSelectAllItem() {
    if (!hasSelectAll) return;

    const newSelectableChecked = sortedItems.filter(
      (sortedItem) =>
        !sortedItem.disabled && !sortedItem.isSelectAll && sortedItem.checked,
    ).length;
    const newAllSelected =
      selectableItems.length > 0 &&
      newSelectableChecked === selectableItems.length;
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

  /** Apply `selectionFeedback: "top"` bookkeeping after a checked-state change. */
  function applyTopSelectionFeedback() {
    if (selectionFeedback !== "top") return;

    selectedIds = sortedItems
      .filter((sortedItem) => sortedItem.checked && !sortedItem.isSelectAll)
      .map((sortedItem) => sortedItem.id);
    internalSelectedIdsRef = selectedIds;
    sortedItems = sort();
  }

  /** Handle selection of an item, including isSelectAll logic. */
  function selectItem(item) {
    // Read-only allows opening and navigating the menu to review values, but
    // never changing them. Guarding here covers every path (click, Enter,
    // label click, select-all) so callers don't each need a readonly check.
    if (readonly || isItemDisabled(item)) return;

    if (item.isSelectAll) {
      const target = !allSelected;
      sortedItems = sortedItems.map((sortedItem) =>
        sortedItem.disabled || sortedItem.checked === target
          ? sortedItem
          : { ...sortedItem, checked: target },
      );
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
   * Apply `checked` to every selectable item between the anchor item and `targetIndex`
   * (inclusive), where `targetIndex` is a position in `itemsToUse`. Returns `false` if the
   * anchor item is no longer present (for example, filtered out), so the caller can fall
   * back to a single toggle.
   * @type {(targetIndex: number, checked: boolean) => boolean}
   */
  function selectItemRange(targetIndex, checked) {
    if (readonly) return false;

    const anchorIndex = itemsToUse.findIndex(
      (item) => item.id === lastSelectedItemId,
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
   * Clear every selected item and announce it. Shared by the clear button and
   * the Delete/Backspace shortcuts in both field variants. No-op when nothing
   * is selected so a bare Delete press does not announce a phantom clear.
   */
  function clearSelection() {
    if (selectionCount === 0) return;
    selectedIds = [];
    lastSelectedItemId = null;
    sortedItems = sortedItems.map((item) => ({ ...item, checked: false }));
    announceStatus(selectionClearedText);
  }

  /** Filter result count last announced; null when the menu is closed so reopening announces again. */
  let announcedFilterCount = null;

  const announceFilterResults = debounce((count) => {
    if (count === announcedFilterCount) return;
    announcedFilterCount = count;
    announceStatus(filterResultsText(count));
  }, 800);

  onMount(() => announceFilterResults.cancel);

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
      internalSelectedIdsRef = selectedIds;
      if (!isInitialRender) {
        dispatch("select", {
          selectedIds,
          selected: checked.filter((item) => !item.isSelectAll),
          unselected: unchecked.filter((item) => !item.isSelectAll),
        });
      }
    }
    isInitialRender = false;

    if (!open) {
      highlightedIndex = -1;
      highlightOrigin = null;
      prevHighlightedIndex = -1;
      if (prevOpen && filterable) {
        value = "";
      }
    }

    // Scroll to highlighted item when it changes via keyboard navigation.
    // Only scroll if the item is outside the visible viewport.
    if (
      open &&
      shouldVirtualize &&
      virtualConfig &&
      highlightedIndex !== prevHighlightedIndex &&
      highlightedIndex >= 0 &&
      listRef
    ) {
      tick().then(() => {
        if (listRef && virtualConfig && highlightedIndex >= 0) {
          const nextScrollTop = scrollHighlightedIntoView({
            highlightedIndex,
            currentScrollTop: listRef.scrollTop ?? listScrollTop,
            itemCount: itemsToUse.length,
            itemHeight: virtualConfig.itemHeight,
            containerHeight: virtualConfig.containerHeight,
            overscan: virtualConfig.overscan ?? 3,
            maxItems: virtualConfig.maxItems,
          });
          if (nextScrollTop !== null) {
            listScrollTop = nextScrollTop;
            listRef.scrollTop = nextScrollTop;
          }
        }
      });
      prevHighlightedIndex = highlightedIndex;
    }

    // Scroll to first selected item when menu opens with virtualization
    const wasJustOpened = open && !prevOpen;
    if (wasJustOpened && shouldVirtualize && listRef) {
      tick().then(() => {
        if (listRef && virtualConfig) {
          // Find the index of the first selected item in the itemsToUse array
          // (the actual rendered list, which may be sorted/filtered).
          const selectedIndex =
            selectedIds && selectedIds.length > 0
              ? itemsToUse.findIndex((item) => item.id === selectedIds[0])
              : -1;
          const nextScrollTop = scrollSelectedIntoView({
            selectedIndex,
            itemCount: itemsToUse.length,
            itemHeight: virtualConfig.itemHeight,
            containerHeight: virtualConfig.containerHeight,
          });

          listScrollTop = nextScrollTop;
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            if (listRef) {
              listRef.scrollTop = nextScrollTop;
            }
          });
        }
      });
    }
    prevOpen = open;

    // Reset scroll position when menu closes
    if (!open && prevOpen && shouldVirtualize) {
      listScrollTop = resetVirtualScrollOnClose();
      if (listRef) {
        listRef.scrollTop = listScrollTop;
      }
    }
    if (!open) {
      scrollEndTracker.reset();
    }
  });

  /**
   * @param {Event} event
   */
  function handleMenuScroll(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    listScrollTop = target.scrollTop;
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

  function sort() {
    const selectedIdsSet = new Set(selectedIds);

    const regularItems = items.filter((item) => !item.isSelectAll);
    const enabledRegularItems = regularItems.filter((item) => !item.disabled);
    const allChecked =
      enabledRegularItems.length > 0 &&
      enabledRegularItems.every((item) => selectedIdsSet.has(item.id));
    const selectAllEntries = items
      .filter((item) => item.isSelectAll)
      .map((item) => ({ ...item, checked: allChecked }));

    if (
      selectionFeedback === "top" ||
      selectionFeedback === "top-after-reopen"
    ) {
      const checkedItems = regularItems
        .filter((item) => selectedIdsSet.has(item.id))
        .map((item) => ({ ...item, checked: true }));
      const uncheckedItems = regularItems
        .filter((item) => !selectedIdsSet.has(item.id))
        .map((item) => ({ ...item, checked: false }));

      return [
        ...selectAllEntries,
        ...(checkedItems.length > 1
          ? checkedItems.sort(sortItem)
          : checkedItems),
        ...uncheckedItems.sort(sortItem),
      ];
    }

    return [
      ...selectAllEntries,
      ...regularItems
        .map((item) => ({
          ...item,
          checked: selectedIdsSet.has(item.id),
        }))
        .sort(sortItem),
    ];
  }

  sortedItems = sort();
  let prevItemsRef = items;

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
  $: ariaLabel = $$props["aria-label"] ?? "Choose an item";
  $: if (items !== prevItemsRef) {
    prevItemsRef = items;
    sortedItems = sort();
    prevChecked = sortedItems.filter((item) => item.checked);
  }
  $: if (
    selectedIds &&
    ((selectionFeedback === "top" && selectedIds !== internalSelectedIdsRef) ||
      (selectionFeedback === "top-after-reopen" && open === false))
  ) {
    internalSelectedIdsRef = selectedIds;
    sortedItems = sort();
  }
  $: hasSelectAll = items.some((item) => item.isSelectAll);
  $: checked = sortedItems.filter((item) => item.checked);
  $: unchecked = sortedItems.filter((item) => !item.checked);
  $: selectableItems = sortedItems.filter(
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

  $: shouldVirtualize =
    virtualize === false
      ? false
      : virtualize !== undefined || items.length > 100;

  $: itemsToUse = filterable ? filteredItems : sortedItems;
  $: scrollEndTracker.noteItemCount(itemsToUse.length);

  $: menuMaxHeight = getMenuMaxHeight(size);

  $: virtualState = virtualListState({
    items: itemsToUse,
    scrollTop: listScrollTop,
    shouldVirtualize,
    virtualize,
    defaults: {
      itemHeight: getMenuItemHeight(size, { fluid: hasFluidMenuItems }),
    },
  });
  $: virtualConfig = virtualState.config;
  $: virtualData = virtualState.data;
  $: itemsToRender = virtualState.itemsToRender;

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
  class:bx--list-box__wrapper--fluid--invalid={isFluid && showInvalid}
  class:bx--list-box__wrapper--fluid--warning={isFluid && showWarn}
  class:bx--list-box__wrapper--fluid--disabled={isFluid && disabled}
  class:bx--list-box__wrapper--fluid--readonly={isFluid && readonly}
  class:bx--list-box__wrapper--fluid--condensed={isFluid && condensed}
  class:bx--multi-select--filterable__wrapper={isFluid && filterable}
>
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
              on:clear={clearSelection}
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
              if (highlightOrigin === "keyboard" && highlightedId) {
                const highlightedItem = sortedItems.find(
                  (item) => item.id === highlightedId,
                );
                if (highlightedItem) selectItem(highlightedItem);
              }
            } else if (event.key === "Tab") {
              open = false;
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
              clearSelection();
            } else if (event.key === "Delete") {
              value = "";
              if (!open) clearSelection();
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
            {name}
          >
          {#if value}
            <ListBoxSelection
              on:clear={() => {
              value = "";
              open = false;
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
            if (!open) {
              open = true;
            } else if (highlightOrigin === "keyboard" && highlightedIndex > -1) {
              const item = (filterable ? filteredItems : sortedItems)[
                highlightedIndex
              ];
              if (item) selectItem(item);
            }
          } else if (event.key === "Tab") {
            open = false;
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
            if (highlightOrigin === "keyboard" && highlightedIndex > -1) {
              const item = (filterable ? filteredItems : sortedItems)[
                highlightedIndex
              ];
              if (item) selectItem(item);
            }
          } else if (event.key === "Escape") {
            close("escape-key");
          } else if (event.key === "Home" || event.key === "End") {
            // APG select-only combobox: Home/End open a closed listbox, then
            // move the highlight to the first/last option. The filterable
            // variant deliberately leaves these keys to the text caret.
            event.preventDefault();
            if (!open) open = true;
            const navigableItems = filterable ? filteredItems : sortedItems;
            highlightedIndex =
              event.key === "Home" ? 0 : navigableItems.length - 1;
            highlightOrigin = "keyboard";
          } else if (event.key === "Delete" || event.key === "Backspace") {
            // Clear the whole selection from the keyboard, menu open or
            // closed, matching the filterable variant. Read-only reviews the
            // menu but never changes the selection.
            if (readonly) return;
            event.preventDefault();
            clearSelection();
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
              on:clear={clearSelection}
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
        style={effectivePortalMenu
          ? `max-height: ${virtualConfig
              ? `${virtualConfig.containerHeight}px; overflow-y: auto`
              : menuMaxHeight};`
          : virtualConfig
            ? `max-height: ${virtualConfig.containerHeight}px; overflow-y: auto;`
            : undefined}
      >
        {#if virtualData?.isVirtualized}
          <div style="height: {virtualData.totalHeight}px; position: relative;">
            <div style="transform: translateY({virtualData.offsetY}px);">
              {#each itemsToRender as item, index (item.id)}
                {@const actualIndex = virtualData.startIndex + index}
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
                  active={item.isSelectAll ? false : item.checked}
                  disabled={itemDisabled}
                  on:click={(event) => {
                    if (itemDisabled) {
                      event.stopPropagation();
                      return;
                    }
                    // Label default synthesizes a second click; without this,
                    // selectItem runs twice and the toggle nets to no change.
                    event.preventDefault();
                    const usedRange =
                      event.shiftKey &&
                      lastSelectedItemId !== null &&
                      !item.isSelectAll &&
                      selectItemRange(actualIndex, !item.checked);
                    if (!usedRange) {
                      selectItem(item);
                    }
                    lastSelectedItemId = item.id;
                  }}
                  on:mousedown={(event) => {
                    // Keep focus on the field so screen readers don't
                    // re-announce it on every option click.
                    event.preventDefault();
                  }}
                  on:mouseenter={() => {
                    if (itemDisabled) return;
                    highlightedIndex = actualIndex;
                    highlightOrigin = "pointer";
                  }}
                >
                  <HighlightSlot {optionId} let:highlighted>
                    <Checkbox
                      name={item.id}
                      title={useTitleInItem ? itemToString(item) : undefined}
                      {...itemToInput(item)}
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
              active={item.isSelectAll ? false : item.checked}
              disabled={itemDisabled}
              on:click={(event) => {
                if (itemDisabled) {
                  event.stopPropagation();
                  return;
                }
                // Label default synthesizes a second click; without this,
                // selectItem runs twice and the toggle nets to no change.
                event.preventDefault();
                const usedRange =
                  event.shiftKey &&
                  lastSelectedItemId !== null &&
                  !item.isSelectAll &&
                  selectItemRange(index, !item.checked);
                if (!usedRange) {
                  selectItem(item);
                }
                lastSelectedItemId = item.id;
              }}
              on:mousedown={(event) => {
                // Keep focus on the field so screen readers don't
                // re-announce it on every option click.
                event.preventDefault();
              }}
              on:mouseenter={() => {
                if (itemDisabled) return;
                highlightedIndex = index;
                highlightOrigin = "pointer";
              }}
            >
              <HighlightSlot {optionId} let:highlighted>
                <Checkbox
                  name={item.id}
                  title={useTitleInItem ? itemToString(item) : undefined}
                  {...itemToInput(item)}
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
