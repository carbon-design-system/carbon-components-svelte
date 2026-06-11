<script>
  /**
   * @template {DropdownItem<any>} [Item=DropdownItem<any>]
   */

  /**
   * @typedef {object} DropdownItem<Id=any>
   * @property {Id} id
   * @property {string} text
   * @property {boolean} [disabled] - Whether the item is disabled
   * @property {any} [icon] - Icon component shown left of the item text
   * @event select
   * @type {object}
   * @property {Item["id"]} selectedId
   * @property {Item} selectedItem
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }}
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }} icon
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }} iconRight
   */

  /**
   * Set the dropdown items.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Override the display of a dropdown item.
   * @type {(item: Item) => string}
   */
  export let itemToString = (item) => item.text ?? item.id;

  /**
   * Specify the selected item id.
   * @type {Item["id"] | undefined}
   * @bindable writable
   */
  export let selectedId = undefined;

  /**
   * Specify the type of dropdown.
   * @type {"default" | "inline"}
   */
  export let type = "default";

  /**
   * Specify the direction of the dropdown menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Specify the size of the dropdown field.
   * @type {"sm" | "lg" | "xl"}
   */
  export let size = undefined;

  /**
   * Set to `true` to open the dropdown.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the dropdown */
  export let disabled = false;

  /** Specify the title text */
  export let labelText = "";

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

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

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

  /**
   * Specify the list box label.
   * @type {string}
   */
  export let label = undefined;

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @type {(id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = undefined;

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

  /** Set an id for the list box component */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the list box.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   */
  export let ref = null;

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
    tick,
  } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    ListBox,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
  } from "../ListBox";
  import {
    getMenuItemHeight,
    getMenuMaxHeight,
  } from "../ListBox/list-box-utils.js";
  import { debounce } from "../utils/debounce.js";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";
  import { nextEnabledIndex } from "../utils/moveIndex.js";
  import { typeaheadIndex } from "../utils/typeahead.js";
  import {
    resetVirtualScrollOnClose,
    scrollHighlightedIntoView,
    scrollSelectedIntoView,
    virtualListState,
  } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext("carbon:Modal");
  const formContext = getContext("carbon:Form");

  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal : portalMenu;

  $: menuAriaLabel = $$props["aria-label"] ?? (labelText || "Choose an item");

  let highlightedIndex = -1;
  let prevHighlightedIndex = -1;
  let typeaheadBuffer = "";
  let listScrollTop = 0;
  let prevOpen = false;
  let fieldFocused = false;
  let itemsById = new Map();

  const TYPEAHEAD_DELAY = 500;

  // Clear the typeahead buffer once the user stops typing for TYPEAHEAD_DELAY ms.
  const resetTypeaheadBuffer = debounce(() => {
    typeaheadBuffer = "";
  }, TYPEAHEAD_DELAY);

  onMount(() => {
    return () => {
      resetTypeaheadBuffer.cancel();
    };
  });

  $: inline = type === "inline";
  $: {
    itemsById = new Map();
    for (let index = 0; index < items.length; index++) {
      itemsById.set(items[index].id, items[index]);
    }
  }
  $: menuId = `menu-${id}`;
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  // Invalid/warn states are suppressed when the dropdown is disabled or read-only.
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
  $: isFluid = !inline && (fluid || !!formContext?.isFluid);
  $: showFieldFocus = isFluid && (fieldFocused || open);
  // Scope the option id with the instance `id` so multiple Dropdowns on a
  // page do not produce duplicate DOM ids. `aria-activedescendant` references
  // this same scoped value (see the `ListBoxMenuItem` ids below).
  $: highlightedId =
    highlightedIndex > -1 && items[highlightedIndex]
      ? `${id}-${items[highlightedIndex].id}`
      : undefined;
  $: selectedItem = itemsById.get(selectedId);
  $: if (!open) {
    highlightedIndex = -1;
    prevHighlightedIndex = -1;
    typeaheadBuffer = "";
    resetTypeaheadBuffer.cancel();
  }

  $: shouldVirtualize =
    virtualize === false
      ? false
      : virtualize !== undefined || items.length > 100;

  $: menuMaxHeight = getMenuMaxHeight(size);

  // Fluid (non-condensed) menu items are 64px tall (see css/_fluid-list-box.scss).
  // Portaled menus render outside the fluid wrapper, so they keep default heights.
  $: hasFluidMenuItems = isFluid && !condensed && !effectivePortalMenu;

  $: virtualState = virtualListState({
    items,
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

  afterUpdate(() => {
    // Scroll to highlighted item when it changes via keyboard navigation
    // Only scroll if the item is outside the visible viewport
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
            itemCount: items.length,
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

    // Set highlighted index to selected item when menu opens
    const wasJustOpened = open && !prevOpen;
    const selectedIndex =
      wasJustOpened && selectedId !== undefined && selectedItem
        ? items.findIndex((item) => item.id === selectedId)
        : -1;
    if (wasJustOpened && selectedIndex >= 0) {
      // Set highlighted index to selected item so keyboard nav starts there
      highlightedIndex = selectedIndex;
      prevHighlightedIndex = selectedIndex;
    }

    // Scroll to selected item when menu opens without virtualization.
    // The list may overflow its max-height even below the virtualization threshold.
    if (
      wasJustOpened &&
      !shouldVirtualize &&
      listRef &&
      selectedId !== undefined &&
      selectedItem
    ) {
      tick().then(() => {
        if (!listRef) return;
        const selectedEl = listRef.querySelector('[aria-selected="true"]');
        if (!selectedEl) return;
        // Adjust the menu's own scrollTop instead of scrollIntoView,
        // which would also scroll the document.
        listRef.scrollTop +=
          selectedEl.getBoundingClientRect().top -
          listRef.getBoundingClientRect().top;
      });
    }

    // Scroll to selected item when menu opens with virtualization
    if (wasJustOpened && shouldVirtualize && listRef) {
      tick().then(() => {
        if (listRef && virtualConfig) {
          const nextScrollTop = scrollSelectedIntoView({
            selectedIndex,
            itemCount: items.length,
            itemHeight: virtualConfig.itemHeight,
            containerHeight: virtualConfig.containerHeight,
          });
          listScrollTop = nextScrollTop;
          listRef.scrollTop = nextScrollTop;
        }
      });
    }
    prevOpen = open;

    // Reset scroll position when menu closes
    if (!open && shouldVirtualize) {
      listScrollTop = resetVirtualScrollOnClose();
    }
  });

  function change(step) {
    highlightedIndex = nextEnabledIndex({
      items,
      index: highlightedIndex,
      step,
    });
  }

  function typeaheadSearch(character) {
    if (items.length === 0) return;

    typeaheadBuffer += character.toLowerCase();
    resetTypeaheadBuffer();

    highlightedIndex = typeaheadIndex({
      items,
      query: typeaheadBuffer,
      itemToString,
      index: highlightedIndex,
    });
  }

  function dispatchSelect() {
    dispatch("select", {
      selectedId,
      selectedItem: itemsById.get(selectedId),
    });
  }

  function selectHighlighted() {
    open = !open;
    if (highlightedIndex > -1 && items[highlightedIndex].id !== selectedId) {
      selectedId = items[highlightedIndex].id;
      dispatchSelect();
      open = false;
    }
  }

  $: dropdownListBoxClass = [
    "bx--dropdown",
    direction === "top" && "bx--list-box--up",
    showInvalid && "bx--dropdown--invalid",
    showWarn && "bx--dropdown--warning",
    open && "bx--dropdown--open",
    size === "sm" && "bx--dropdown--sm",
    size === "xl" && "bx--dropdown--xl",
    inline && "bx--dropdown--inline",
    disabled && "bx--dropdown--disabled",
    light && "bx--dropdown--light",
    readonly && "bx--dropdown--readonly",
  ]
    .filter(Boolean)
    .join(" ");

  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, [ref, effectivePortalMenu && listRef])) {
      open = false;
    }
  }
</script>

<div
  class:bx--dropdown__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--dropdown__wrapper--inline={inline}
  class:bx--list-box__wrapper--inline={inline}
  class:bx--dropdown__wrapper--inline--invalid={inline && showInvalid}
  class:bx--list-box__wrapper--fluid={isFluid}
  class:bx--list-box__wrapper--fluid--invalid={isFluid && showInvalid}
  class:bx--list-box__wrapper--fluid--warning={isFluid && showWarn}
  class:bx--list-box__wrapper--fluid--disabled={isFluid && disabled}
  class:bx--list-box__wrapper--fluid--readonly={isFluid && readonly}
  class:bx--list-box__wrapper--fluid--condensed={isFluid && condensed}
  use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
  {...$$restProps}
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
    {type}
    {size}
    {name}
    aria-label={$$props["aria-label"]}
    class={dropdownListBoxClass}
    on:click={(event) => {
      if (disabled || readonly) return;
      open = ref.contains(event.target) ? !open : false;
    }}
    {disabled}
    {open}
    invalid={showInvalid}
    {light}
    warn={showWarn}
  >
    {#if showInvalid}
      <WarningFilled class="bx--list-box__invalid-icon" />
    {/if}
    {#if showWarn}
      <WarningAltFilled
        class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
      />
    {/if}
    <div
      style={isFluid ? undefined : "display: contents"}
      class:bx--list-box__field--wrapper={isFluid}
      class:bx--list-box__field--wrapper--input-focused={showFieldFocus}
    >
      <button
        bind:this={ref}
        type="button"
        role="combobox"
        class:bx--list-box__field={true}
        tabindex="0"
        aria-expanded={open}
        aria-disabled={readonly || undefined}
        aria-readonly={readonly || undefined}
        aria-haspopup="listbox"
        aria-activedescendant={highlightedId ?? ""}
        aria-controls={open ? menuId : undefined}
        aria-describedby={showInvalid && invalidText
          ? errorId
          : showWarn && warnText
            ? warnId
            : !inline && !isFluid && !showInvalid && !showWarn && helperText
              ? helperId
              : undefined}
        on:focus={() => {
          if (isFluid) fieldFocused = true;
        }}
        on:blur={() => {
          if (isFluid) fieldFocused = false;
        }}
        on:keydown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === "ArrowDown" ||
          event.key === "ArrowUp"
        ) {
          event.preventDefault();
        }

        if (readonly) return;

        if (event.key === "Enter") {
          selectHighlighted();
        } else if (event.key === "Tab") {
          open = false;
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const step = event.key === "ArrowDown" ? 1 : -1;
          if (event.altKey) {
            // APG combobox pattern: Alt+ArrowDown opens a closed menu without
            // moving the highlight; Alt+ArrowUp closes an open one.
            if (event.key === "ArrowDown" && !open) {
              open = true;
            } else if (event.key === "ArrowUp" && open) {
              open = false;
            }
          } else if (open) {
            change(step);
          } else {
            open = true;
            // `afterUpdate` highlights any selected item only after the open
            // state flushes; if nothing is highlighted by then, start at the
            // first (ArrowDown) or last (ArrowUp) enabled item.
            tick().then(() => {
              if (highlightedIndex === -1) change(step);
            });
          }
        } else if (event.key === "Escape") {
          open = false;
        } else if (
          open &&
          event.key.length === 1 &&
          event.key !== " " &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          event.preventDefault();
          typeaheadSearch(event.key);
        }
      }}
        on:keyup={(event) => {
        if (event.key === " ") {
          event.preventDefault();
        } else {
          return;
        }
        selectHighlighted();
      }}
        {disabled}
        {id}
      >
        <span class:bx--list-box__label={true}>
          {#if selectedItem}
            {itemToString(selectedItem)}
          {:else}
            {label}
          {/if}
        </span>
        <ListBoxMenuIcon
          on:click={(event) => {
          event.stopPropagation();
          if (disabled || readonly) return;
          open = !open;
        }}
          {translateWithId}
          {open}
        />
      </button>
    </div>
    {#if open}
      <ListBoxMenu
        aria-label={menuAriaLabel}
        {id}
        portal={effectivePortalMenu}
        {open}
        anchor={ref}
        {direction}
        on:scroll
        on:scroll={(event) => {
          listScrollTop = event.target.scrollTop;
        }}
        on:mouseleave={() => {
          // Clear the hover highlight when the cursor leaves the menu so the
          // highlighted state does not linger on the last hovered item.
          highlightedIndex = -1;
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
                {@const selected = selectedId === item.id}
                {@const highlighted = highlightedIndex === actualIndex}
                <ListBoxMenuItem
                  id="{id}-{item.id}"
                  active={selectedId === item.id}
                  {highlighted}
                  disabled={item.disabled}
                  hasLeftIcon={Boolean($$slots.icon || item.icon)}
                  on:click={(event) => {
                    if (item.disabled) {
                      event.stopPropagation();
                      return;
                    }
                    selectedId = item.id;
                    dispatchSelect();
                    open = false;
                    ref.focus();
                  }}
                  on:mouseenter={() => {
                    if (item.disabled) return;
                    highlightedIndex = actualIndex;
                  }}
                >
                  {#if $$slots.icon || item.icon}
                    <span
                      class:bx--list-box__menu-item__icon={true}
                      class:bx--list-box__menu-item__icon--left={true}
                    >
                      <slot
                        name="icon"
                        {item}
                        index={actualIndex}
                        {selected}
                        {highlighted}
                      >
                        <svelte:component this={item.icon} />
                      </slot>
                    </span>
                  {/if}
                  <slot {item} index={actualIndex} {selected} {highlighted}>
                    {itemToString(item)}
                  </slot>
                  {#if $$slots.iconRight}
                    <span
                      class:bx--list-box__menu-item__icon={true}
                      class:bx--list-box__menu-item__icon--right={true}
                    >
                      <slot
                        name="iconRight"
                        {item}
                        index={actualIndex}
                        {selected}
                        {highlighted}
                      />
                    </span>
                  {:else if selected}
                    <Checkmark class="bx--list-box__menu-item__selected-icon" />
                  {/if}
                </ListBoxMenuItem>
              {/each}
            </div>
          </div>
        {:else}
          {#each itemsToRender as item, index (item.id)}
            {@const selected = selectedId === item.id}
            {@const highlighted = highlightedIndex === index}
            <ListBoxMenuItem
              id="{id}-{item.id}"
              active={selectedId === item.id}
              {highlighted}
              disabled={item.disabled}
              hasLeftIcon={Boolean($$slots.icon || item.icon)}
              on:click={(event) => {
                if (item.disabled) {
                  event.stopPropagation();
                  return;
                }
                selectedId = item.id;
                dispatchSelect();
                open = false;
                ref.focus();
              }}
              on:mouseenter={() => {
                if (item.disabled) return;
                highlightedIndex = index;
              }}
            >
              {#if $$slots.icon || item.icon}
                <span
                  class:bx--list-box__menu-item__icon={true}
                  class:bx--list-box__menu-item__icon--left={true}
                >
                  <slot name="icon" {item} {index} {selected} {highlighted}>
                    <svelte:component this={item.icon} />
                  </slot>
                </span>
              {/if}
              <slot {item} {index} {selected} {highlighted}>
                {itemToString(item)}
              </slot>
              {#if $$slots.iconRight}
                <span
                  class:bx--list-box__menu-item__icon={true}
                  class:bx--list-box__menu-item__icon--right={true}
                >
                  <slot
                    name="iconRight"
                    {item}
                    {index}
                    {selected}
                    {highlighted}
                  />
                </span>
              {:else if selected}
                <Checkmark class="bx--list-box__menu-item__selected-icon" />
              {/if}
            </ListBoxMenuItem>
          {/each}
        {/if}
      </ListBoxMenu>
    {/if}
  </ListBox>
  {#if isFluid}
    <hr class:bx--list-box__divider={true}>
  {/if}
  {#if showInvalid && invalidText}
    <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
  {#if showWarn && warnText}
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
</div>
