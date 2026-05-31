<script>
  /**
   * @event {{ value: string; item: { text?: string; value?: string; href?: string; description?: string; keywords?: string[]; shortcut?: string[]; shortcutKeys?: string | string[]; selectionMode?: string; selected?: boolean }; event: Event }} select The "select" event is cancelable. Call `event.preventDefault()` to keep the palette open and skip the default close behavior.
   * @event {null} open
   * @event {{ trigger: "escape-key" | "outside-click" | "select" | "trigger-key" | "shortcut-key" }} close The "close" event is cancelable. Call `event.preventDefault()` to prevent the palette from closing.
   * @slot {{ value: string; }} empty
   * @slot {{ value: string; }} loading
   */

  /**
   * Set to `true` to open the command palette.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the value of the search input.
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the keyboard shortcut(s) that toggle the palette open and closed.
   * @type {ReadonlyArray<`${string}+${string}`>}
   */
  export let triggerKeys = ["mod+k"];

  /**
   * Id of the highlighted command. DOM-driven; bind to sync highlight state.
   * @bindable readonly
   */
  export let activeId = null;

  /**
   * Set the size of the command palette.
   * @type {"sm" | "lg" | "xl"}
   */
  export let size = "lg";

  /**
   * Set the max width of the command palette dialog.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let maxWidth = "md";

  /** Specify the `placeholder` attribute of the search input */
  export let placeholder = "Search for commands, routes, and settings...";

  /** Specify the ARIA label for the command palette dialog */
  export let label = "Command palette";

  /** Specify the label text rendered for the search input */
  export let labelText = "Search for a command";

  /** Specify the text rendered when no commands match the query */
  export let noResultsText = "No results found";

  /** Specify the close button label text */
  export let closeButtonLabelText = "Clear search input";

  /** Set to `false` to disable client-side filtering */
  export let shouldFilter = true;

  /**
   * Override how the search value is matched against each item's `text`.
   * @type {(text: string, query: string) => { matched: boolean; indices?: number[] }}
   */
  export let match = fuzzyMatch;

  /** Set to `true` while asynchronous results are loading */
  export let loading = false;

  /** Set to `true` to emphasize query matches in command labels */
  export let highlightMatches = true;

  /**
   * Navigate when an item with `href` is selected.
   * @type {(href: string) => void}
   */
  export let navigate = (href) => {
    if (typeof window !== "undefined") window.location.assign(href);
  };

  /** Set to `true` to run item shortcuts while the palette is open */
  export let executeShortcuts = true;

  /** Set to `true` to keep the palette open after a command is selected */
  export let preventCloseOnSelect = false;

  /** Set to `true` to prevent the palette from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  /** Specify a class for the dialog element */
  export let dialogClass = "";

  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the search input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Close from "../icons/Close.svelte";
  import IconSearch from "../icons/IconSearch.svelte";
  import {
    buildCommandShortcutMap,
    getCommandCombos,
  } from "../utils/commandShortcuts.js";
  import { fuzzyMatch } from "../utils/fuzzyMatch.js";
  import { matchesKeyboardCombo } from "../utils/matchesKeyboardCombo.js";

  const dispatch = createEventDispatcher();

  let menuRef = null;
  let previouslyFocusedElement = null;
  let opened = false;

  const menuId = `${id}-menu`;
  const labelId = `${id}-label`;

  const queryStore = writable("");
  const shouldFilterStore = writable(shouldFilter);
  const matchStore = writable(match);
  const activeIdStore = writable(/** @type {string | null} */ (null));
  const highlightMatchesStore = writable(highlightMatches);
  const hasPrimaryItemsStore = writable(false);

  /** @type {Set<string>} */
  let itemIds = new Set();
  /** @type {Set<string>} */
  let filterableIds = new Set();
  /** @type {Set<string>} */
  let primaryItemIds = new Set();
  /** @type {Set<string>} */
  let multiselectItemIds = new Set();
  /**
   * @type {Map<string, {
   *   filterable: boolean;
   *   inDividerGroup: boolean;
   *   disabled: boolean;
   *   shortcut?: string[];
   *   shortcutKeys?: string | string[];
   *   selectionMode?: string;
   *   select: (event?: Event) => void;
   *   selectShortcut: (event?: Event) => void;
   * }>}
   */
  let registeredItems = new Map();

  $: queryStore.set(value);
  $: shouldFilterStore.set(shouldFilter);
  $: matchStore.set(match);
  $: highlightMatchesStore.set(highlightMatches);
  $: activeIdStore.set(activeId);

  $: itemCount = itemIds.size;
  $: hasPrimaryItemsStore.set(primaryItemIds.size > 0);
  $: hasQuery = String(value ?? "").trim().length > 0;
  $: showEmpty =
    !loading &&
    hasQuery &&
    filterableIds.size === 0 &&
    itemCount === 0 &&
    ($$slots.empty || noResultsText);
  $: multiselectable = multiselectItemIds.size > 0;
  $: menuClass = [
    "bx--cmd-palette__menu",
    `bx--cmd-palette__menu--${size}`,
  ].join(" ");

  $: shortcutMap = (() => {
    if (!open || !executeShortcuts) return new Map();
    const visible = [...registeredItems.entries()].filter(
      ([itemId, meta]) => itemIds.has(itemId) && !meta.disabled,
    );
    return buildCommandShortcutMap(
      visible.map(([itemId, meta]) => ({
        id: itemId,
        shortcut: meta.shortcut,
        shortcutKeys: meta.shortcutKeys,
        selectShortcut: meta.selectShortcut,
      })),
      {
        getCombos: (item) => getCommandCombos(item),
      },
    );
  })();

  setContext("carbon:CommandPalette", {
    query: queryStore,
    shouldFilter: shouldFilterStore,
    match: matchStore,
    activeId: activeIdStore,
    highlightMatches: highlightMatchesStore,
    hasPrimaryItems: hasPrimaryItemsStore,
    setActiveId(next) {
      activeId = next;
      activeIdStore.set(next);
    },
    selectItem(detail, closeTrigger, run) {
      if (closeTrigger === undefined) closeTrigger = "select";
      const shouldContinue = dispatch("select", detail, { cancelable: true });
      if (!shouldContinue) return;
      run?.();
      if (detail.item.href) navigate(detail.item.href);
      if (!preventCloseOnSelect) close(closeTrigger);
    },
    registerItem(itemId, meta) {
      itemIds.add(itemId);
      registeredItems.set(itemId, meta);
      if (meta.filterable) filterableIds.add(itemId);
      else filterableIds.delete(itemId);
      if (meta.inDividerGroup) primaryItemIds.delete(itemId);
      else primaryItemIds.add(itemId);
      if (meta.selectionMode === "multiple") multiselectItemIds.add(itemId);
      else multiselectItemIds.delete(itemId);
      itemIds = itemIds;
      filterableIds = filterableIds;
      primaryItemIds = primaryItemIds;
      multiselectItemIds = multiselectItemIds;
      registeredItems = registeredItems;
    },
    unregisterItem(itemId) {
      itemIds.delete(itemId);
      filterableIds.delete(itemId);
      primaryItemIds.delete(itemId);
      multiselectItemIds.delete(itemId);
      registeredItems.delete(itemId);
      itemIds = itemIds;
      filterableIds = filterableIds;
      primaryItemIds = primaryItemIds;
      multiselectItemIds = multiselectItemIds;
      registeredItems = registeredItems;
      if (activeId === itemId) {
        activeId = null;
        activeIdStore.set(null);
      }
    },
  });

  function focusInput() {
    tick().then(() => ref?.focus());
  }

  function getOptionElements() {
    if (!menuRef) return [];
    return Array.from(menuRef.querySelectorAll('[role="option"]')).filter(
      (el) => el.getAttribute("aria-disabled") !== "true",
    );
  }

  function moveActive(step) {
    const els = getOptionElements();
    if (els.length === 0) {
      activeId = null;
      return;
    }
    const current = els.findIndex((el) => el.id === activeId);
    let next = current + step;
    if (next < 0) next = els.length - 1;
    else if (next >= els.length) next = 0;
    activeId = els[next].id;
  }

  function setActiveEdge(edge) {
    const els = getOptionElements();
    if (els.length === 0) return;
    activeId = els[edge === "first" ? 0 : els.length - 1].id;
  }

  function pageStep() {
    if (!menuRef) return 5;
    const option = menuRef.querySelector(".bx--cmd-palette__option");
    if (!(option instanceof HTMLElement)) return 5;
    return Math.max(1, Math.floor(menuRef.clientHeight / option.offsetHeight));
  }

  function close(trigger) {
    if (!open) return;
    const shouldContinue = dispatch("close", { trigger }, { cancelable: true });
    if (shouldContinue) open = false;
  }

  function resetOnDismiss() {
    value = "";
    activeId = null;
  }

  function onWindowKeydown(event) {
    if (
      triggerKeys.length > 0 &&
      triggerKeys.some((combo) => matchesKeyboardCombo(event, combo))
    ) {
      event.preventDefault();
      if (open) close("trigger-key");
      else open = true;
      return;
    }

    if (open && event.key === "Escape") {
      event.preventDefault();
      close("escape-key");
      return;
    }

    if (open && executeShortcuts && shortcutMap.size > 0) {
      for (const [combo, item] of shortcutMap) {
        if (!matchesKeyboardCombo(event, combo)) continue;
        event.preventDefault();
        activeId = item.id;
        item.selectShortcut?.(event);
        return;
      }
    }
  }

  function onInputKeydown(event) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "PageDown":
        event.preventDefault();
        for (let i = 0; i < pageStep(); i++) moveActive(1);
        break;
      case "PageUp":
        event.preventDefault();
        for (let i = 0; i < pageStep(); i++) moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveEdge("first");
        break;
      case "End":
        event.preventDefault();
        setActiveEdge("last");
        break;
      case "Enter": {
        const active = activeId
          ? getOptionElements().find((el) => el.id === activeId)
          : null;
        if (active) {
          event.preventDefault();
          active.click();
        }
        break;
      }
    }
  }

  let previousValue = value;
  $: if (value !== previousValue) {
    previousValue = value;
    activeId = null;
  }

  $: if (open && !opened) {
    opened = true;
    previouslyFocusedElement =
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    focusInput();
    dispatch("open");
  } else if (!open && opened) {
    opened = false;
    resetOnDismiss();
    if (previouslyFocusedElement?.isConnected) {
      previouslyFocusedElement.focus();
    }
    previouslyFocusedElement = null;
  }

  $: activeDescendant = activeId ?? undefined;
</script>

<svelte:window on:keydown={onWindowKeydown} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    {id}
    class:bx--cmd-palette={true}
    class:bx--cmd-palette--sm={size === "sm"}
    class:bx--cmd-palette--lg={size === "lg"}
    class:bx--cmd-palette--xl={size === "xl"}
    on:click={() => {
      if (!preventCloseOnClickOutside) close("outside-click");
    }}
  >
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      class:bx--cmd-palette__dialog={true}
      class:bx--cmd-palette__dialog--width-sm={maxWidth === "sm"}
      class:bx--cmd-palette__dialog--width-md={maxWidth === "md"}
      class:bx--cmd-palette__dialog--width-lg={maxWidth === "lg"}
      class:bx--cmd-palette__dialog--width-xl={maxWidth === "xl"}
      class={dialogClass}
      {...$$restProps}
      on:click|stopPropagation
    >
      <div
        class:bx--search={true}
        class:bx--cmd-palette__search={true}
        class:bx--search--sm={size === "sm"}
        class:bx--search--lg={size === "lg"}
        class:bx--search--xl={size === "xl"}
      >
        <div class:bx--search-magnifier={true}>
          <IconSearch class="bx--search-magnifier-icon" aria-hidden="true" />
        </div>
        <label
          for="{id}-input"
          id={labelId}
          class:bx--label={true}
          class:bx--visually-hidden={true}
        >
          {labelText}
        </label>
        <!-- svelte-ignore a11y-autofocus -->
        <input
          bind:this={ref}
          bind:value
          id="{id}-input"
          type="text"
          role="combobox"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={true}
          aria-controls={menuId}
          aria-labelledby={labelId}
          aria-activedescendant={activeDescendant}
          class:bx--search-input={true}
          {placeholder}
          on:input
          on:keydown={onInputKeydown}
        >
        {#if value}
          <button
            type="button"
            aria-label={closeButtonLabelText}
            class:bx--search-close={true}
            on:click={() => {
              value = "";
              ref?.focus();
            }}
          >
            <Close size={size === "xl" ? 20 : 16} aria-hidden="true" />
          </button>
        {/if}
      </div>

      <ul
        bind:this={menuRef}
        id={menuId}
        role="listbox"
        aria-labelledby={labelId}
        aria-multiselectable={multiselectable || undefined}
        aria-busy={loading || undefined}
        class={menuClass}
      >
        {#if loading}
          <li role="presentation" class:bx--cmd-palette__loading={true}>
            <slot name="loading" {value}>Loading...</slot>
          </li>
        {:else}
          <slot />
          {#if showEmpty}
            <li
              role="status"
              aria-live="polite"
              class:bx--cmd-palette__empty={true}
            >
              <slot name="empty" {value}>{noResultsText}</slot>
            </li>
          {/if}
        {/if}
      </ul>

      {#if $$slots.footer}
        <div class:bx--cmd-palette__footer={true}>
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
