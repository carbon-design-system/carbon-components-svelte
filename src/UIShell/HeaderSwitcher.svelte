<script>
  /**
   * @template {HeaderSwitcherItem} [Item=HeaderSwitcherItem]
   */

  /**
   * @typedef {object} HeaderSwitcherItem
   * @property {string | number} id - Unique within `items`.
   * @property {string} text - The account or workspace name.
   * @property {string} [description] - Secondary text, such as the organization.
   * @property {string} [group] - Group label. Items sharing a label render together under a heading, ungrouped items first and groups in order of first appearance.
   * @property {string} [href] - Render the item as a link.
   * @property {string} [image] - URL of the avatar image. Without it the avatar shows the initials of `text`.
   */

  /**
   * @event open
   * @type {object}
   * @property {"toggle"} trigger
   */

  /**
   * @event close
   * @type {object}
   * @property {"outside-click" | "toggle" | "escape-key" | "select"} trigger
   */

  /**
   * @event select
   * @type {object}
   * @property {Item["id"]} selectedId
   * @property {Item} selectedItem
   */

  /**
   * Dispatched as the filter field changes, for a list that is filtered on a
   * server. Set `filterItems` to `() => true` to leave the filtering to it.
   * @event filter
   * @type {object}
   * @property {string} query
   */

  /**
   * @slot {{}} avatar - Optional leading avatar. With `items`, falls back to the avatar of the selected item; otherwise renders nothing.
   */

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let isOpen = false;

  /**
   * Specify the accounts or workspaces to list. Omit it to compose the
   * menu from `ProfileMenuItem`s in the default slot instead. With both, the
   * default slot renders after the items, for actions such as "Create
   * workspace".
   * @type {ReadonlyArray<Item> | undefined}
   */
  export let items = undefined;

  /**
   * Specify the `id` of the current account. It gets `aria-current="true"` and
   * a checkmark, and fills the trigger when `text` is not set.
   * @type {Item["id"] | undefined}
   * @bindable writable
   */
  export let selectedId = undefined;

  /**
   * Specify the ids of the accounts used most recently, newest first, to list
   * under a "Recent" heading ahead of the rest. An account moves out of the
   * list while it is current. Switching adds the account that was left.
   * Omit it to turn the section off.
   *
   * Nothing is stored for you: bind it to persist it, for example with
   * `LocalStorage`, or keep it on a server and update it from `select`.
   * @type {ReadonlyArray<Item["id"]> | undefined}
   * @bindable writable
   */
  export let recentIds = undefined;

  /** Specify how many recent accounts to list. */
  export let recentLimit = 3;

  /** Specify the heading of the recent accounts. */
  export let recentText = "Recent";

  /**
   * Set to `true` to show the current account's avatar, name and
   * `description` at the top of the menu.
   */
  export let showDetail = false;

  /**
   * Specify how many `items` it takes for the menu to show a filter field.
   * Set to `0` to always show it, or to `Infinity` to never show it.
   */
  export let searchThreshold = 8;

  /**
   * Customize how the filter field matches an item. By default every word
   * typed must appear in the item's `text` or `description`, ignoring case
   * and accents.
   * @type {((item: Item, query: string) => boolean) | undefined}
   */
  export let filterItems = undefined;

  /** Specify the label of the filter field. */
  export let searchLabelText = "Search accounts";

  /** Specify the message shown when no item matches. */
  export let emptyText = "No accounts found";

  /**
   * Build the message announced to screen readers when the filter settles.
   * @type {(count: number) => string}
   */
  export let resultsText = (count) =>
    count === 0
      ? "No accounts found"
      : `${count} account${count === 1 ? "" : "s"} found`;

  /**
   * Specify the workspace or account name shown next to the avatar.
   * Defaults to the name of the selected item.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify the maximum width of `text` before it truncates with an ellipsis.
   * A number is treated as pixels; a string is used as a CSS length.
   * Set to `"none"` to let the trigger grow with the text.
   * @type {number | string}
   */
  export let maxWidth = "10rem";

  /**
   * Specify the accessible label for the trigger button.
   * Only used when `text` is not set.
   * @type {string}
   */
  export let iconDescription = "Switch account";

  /**
   * Obtain a reference to the trigger button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Customize the menu slide transition (for example, `{ duration: 200 }`).
   * By default, the menu does not animate.
   * @type {false | import("svelte/transition").SlideParams}
   */
  export let transition = false;

  /** Set to `true` to prevent the menu from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  /**
   * Set an id for the trigger button. The menu id derives from it as
   * `{id}-menu`, so the server and the browser render the same id.
   * @type {string | undefined}
   */
  export let id = undefined;

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { get } from "svelte/store";
  import { slide } from "svelte/transition";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import { PROFILE_MENU_CONTEXT_KEY } from "../constants/context-keys.js";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createDomNodeRegistry } from "../utils/dom-node-registry.js";
  import { returnFocusOnClose } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { pickEdgeMenuItem } from "../utils/pick-edge-menu-item.js";
  import { pushRecentId } from "../utils/switcher-items.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { verticalListFocus } from "../utils/vertical-list-focus.js";
  import HeaderSwitcherMenu from "./HeaderSwitcherMenu.svelte";

  const dispatch = createEventDispatcher();

  const fallbackId = uniqueId();
  $: menuId = `${id ?? fallbackId}-menu`;

  /** @type {null | HTMLDivElement} */
  let refMenu = null;

  const menuItemRegistry = createDomNodeRegistry();
  /** @type {import("svelte/store").Writable<ReadonlyArray<HTMLElement>>} */
  const menuItems = menuItemRegistry.items;
  /** @type {(node: HTMLElement) => void} */
  const registerMenuItem = menuItemRegistry.register;
  /** @type {(node: HTMLElement) => void} */
  const unregisterMenuItem = menuItemRegistry.unregister;

  setContext(PROFILE_MENU_CONTEXT_KEY, {
    menuItems,
    registerMenuItem,
    unregisterMenuItem,
    select,
  });

  $: maxWidthStyle = toCssLength(maxWidth);
  $: selectedItem = items?.find((item) => item.id === selectedId);
  $: triggerText = text ?? selectedItem?.text;
  // One object for both menu branches below, so they cannot drift apart.
  $: menuProps = {
    items: items ?? [],
    selectedId,
    recentIds,
    recentLimit,
    recentText,
    menuId,
    showDetail,
    searchThreshold,
    filterItems,
    searchLabelText,
    emptyText,
    resultsText,
  };

  /** @param {"outside-click" | "escape-key" | "select"} trigger */
  function close(trigger) {
    isOpen = false;
    dispatch("close", { trigger });
  }

  // Called by `ProfileMenuItem` once its click handlers have run.
  /** @type {() => void} */
  function select() {
    if (!isOpen) return;
    close("select");
  }

  /** @param {Event} event */
  function handleOutsideClick(event) {
    if (
      isOpen &&
      !preventCloseOnClickOutside &&
      isOutsideClick(event, [ref, refMenu])
    ) {
      close("outside-click");
    }
  }

  /** @param {Item} item */
  function handlePick(item) {
    if (Array.isArray(recentIds)) {
      recentIds = pushRecentId(recentIds, selectedId, item.id, recentLimit);
    }
    selectedId = item.id;
    dispatch("select", { selectedId: item.id, selectedItem: item });
  }

  const ITEM_SELECTOR = ".bx--profile-menu__item";
  const typeahead = createTypeaheadBuffer();

  // Runs in the capture phase, before `verticalListFocus` sees the key, for
  // the keys that cross between the filter field and the items.
  /** @param {KeyboardEvent} event */
  function handleMenuKeydown(event) {
    const target = event.target;
    if (!refMenu || !(target instanceof HTMLElement)) return;
    const search = /** @type {HTMLInputElement | null} */ (
      refMenu.querySelector("input[type='search']")
    );
    const rows = /** @type {HTMLElement[]} */ (
      Array.from(refMenu.querySelectorAll(ITEM_SELECTOR))
    );
    if (target === search) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const edge = pickEdgeMenuItem(event.key, rows);
        if (!edge) return;
        event.preventDefault();
        event.stopPropagation();
        edge.focus();
      }
      return;
    }
    const index = rows.indexOf(target);
    if (index < 0) return;
    if (search) {
      if (event.key === "ArrowUp" && index === 0) {
        event.preventDefault();
        event.stopPropagation();
        search.focus();
      } else if (isTypeaheadKey(event)) {
        // The character is typed into the field once it has focus.
        search.focus();
      }
      return;
    }
    if (!isTypeaheadKey(event)) return;
    const query = typeahead.push(event.key);
    const next = typeaheadIndex({
      items: rows,
      query,
      itemToString: (row) =>
        (
          row.querySelector(".bx--header-switcher__item-text") ?? row
        ).textContent?.trim() ?? "",
      // `typeaheadIndex` starts after `index` for every query, so a second
      // letter skips the item that still matches (see #5578).
      index: query.length > 1 ? index - 1 : index,
    });
    if (next !== index && rows[next]) rows[next].focus();
  }

  /** @param {Event} event */
  function handleKeydown(event) {
    if (isOpen && /** @type {KeyboardEvent} */ (event).key === "Escape") {
      // The filter field clears first; a second Escape closes.
      if (event.defaultPrevented) return;
      // Escape that cancels an IME composition is not a close.
      if (isImeComposition(/** @type {KeyboardEvent} */ (event))) return;
      close("escape-key");
      ref?.focus();
    }
  }

  /** @param {KeyboardEvent} event */
  async function handleTriggerKeydown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        isOpen = true;
        dispatch("open", { trigger: "toggle" });
      }
      await tick();
      menuItemRegistry.flush();
      pickEdgeMenuItem(event.key, get(menuItems))?.focus();
    }
  }

  // Closing unmounts the panel, so focus inside it (e.g. on an item whose
  // handler set `isOpen` to false) would fall to <body>.
  const syncFocusReturn = returnFocusOnClose(
    () => ref,
    () => refMenu,
  );
  $: syncFocusReturn(isOpen);
</script>

<span class:bx--header-switcher={true}>
  <button
    bind:this={ref}
    use:dismiss={{
      enabled: isOpen,
      listeners: [
        { type: "click", handler: handleOutsideClick },
        { type: "keydown", handler: handleKeydown },
      ],
    }}
    type="button"
    aria-expanded={isOpen ? "true" : "false"}
    aria-controls={isOpen ? menuId : undefined}
    aria-label={triggerText ? undefined : iconDescription}
    {id}
    class:bx--header__action={true}
    class:bx--header__action--active={isOpen}
    class:bx--header__action--text={true}
    class:bx--header-switcher__trigger={true}
    {...$$restProps}
    on:click
    on:click={async (event) => {
      const wasOpen = isOpen;
      isOpen = !isOpen;
      dispatch(isOpen ? "open" : "close", { trigger: "toggle" });
      if (!wasOpen && isOpen && event.detail === 0) {
        await tick();
        menuItemRegistry.flush();
        const search = refMenu?.querySelector("input[type='search']");
        /** @type {HTMLElement | undefined} */ (
          search ?? get(menuItems)[0]
        )?.focus();
      }
    }}
    on:keydown={handleTriggerKeydown}
  >
    {#if $$slots.avatar || selectedItem}
      <span class:bx--header-switcher__avatar={true}>
        <slot name="avatar">
          {#if selectedItem}
            <UserAvatar
              name={selectedItem.text}
              image={selectedItem.image}
              imageDescription=""
              aria-hidden="true"
              backgroundColor="auto"
              size="sm"
            />
          {/if}
        </slot>
      </span>
    {/if}
    {#if triggerText}
      <span
        class:bx--header__action-text={true}
        class:bx--header-switcher__text={true}
        class:bx--header-switcher__text--flush={!$$slots.avatar &&
          !selectedItem}
        style:max-width={maxWidthStyle}>{triggerText}</span
      >
    {/if}
    <span
      class:bx--header-switcher__chevron={true}
      class:bx--header-switcher__chevron--open={isOpen}
    >
      <ChevronDown size={16} />
    </span>
  </button>
  {#if isOpen && transition}
    <!-- The handler only reads keys that bubble up from the items and the
         filter field inside. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      bind:this={refMenu}
      role="group"
      use:verticalListFocus={{ selector: ".bx--profile-menu__item" }}
      on:keydown|capture={handleMenuKeydown}
      id={menuId}
      aria-label={iconDescription}
      class:bx--profile-menu={true}
      class:bx--header-switcher__menu={true}
      transition:slide|local={transition}
    >
      {#if items}
        <HeaderSwitcherMenu
          {...menuProps}
          on:pick={(event) => handlePick(event.detail)}
          on:filter
        />
      {/if}
      <slot />
    </div>
  {:else if isOpen}
    <!-- The handler only reads keys that bubble up from the items and the
         filter field inside. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      bind:this={refMenu}
      role="group"
      use:verticalListFocus={{ selector: ".bx--profile-menu__item" }}
      on:keydown|capture={handleMenuKeydown}
      id={menuId}
      aria-label={iconDescription}
      class:bx--profile-menu={true}
      class:bx--header-switcher__menu={true}
    >
      {#if items}
        <HeaderSwitcherMenu
          {...menuProps}
          on:pick={(event) => handlePick(event.detail)}
          on:filter
        />
      {/if}
      <slot />
    </div>
  {/if}
</span>
