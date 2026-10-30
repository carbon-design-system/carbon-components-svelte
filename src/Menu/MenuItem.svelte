<script>
  /**
   * Dispatched on selection. Cancelable: call `preventDefault()` to keep
   * the menu open. A selectable or radio item's selection still updates.
   * @event {MouseEvent} click
   */

  /**
   * @slot {{}} shortcutChildren - Custom shortcut content. Replaces `shortcutText` and `shortcut`.
   * @deprecated use the `shortcutChildren` slot
   * @slot {{}} shortcutText
   */

  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * Specify the kind of item.
   * @type {"default" | "danger"}
   */
  export let kind = "default";

  /** Set to `true` to disable the item */
  export let disabled = false;

  /**
   * Specify the icon to render.
   * Icon is rendered to the left of the label text.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify the label text.
   * Required to nest `MenuItem` children and create a submenu: once set,
   * the default slot holds the nested items instead of the label.
   * Alternatively, use the "labelChildren" slot for custom label content;
   * `labelText` is still used as the accessible name and title in that case.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /**
   * Specify the shortcut text.
   * Alternatively, use the "shortcutChildren" slot.
   * Display only; does not register a keybinding.
   * @example
   * ```svelte
   * <MenuItem>
   *   <span slot="shortcutChildren">⌘S</span>
   * </MenuItem>
   * ```
   */
  export let shortcutText = "";

  /**
   * Specify a keyboard shortcut to show, such as `"mod+s"`. `mod` is
   * Command on Apple platforms and Ctrl elsewhere. The keys show where
   * `shortcutText` goes, and the item gets `aria-keyshortcuts`. Display only:
   * bind the command itself with `onShortcut`, since the menu is usually
   * closed. `shortcutText` and its slot take precedence. A value that isn't
   * a shortcut, such as `"⌘C"`, shows as written.
   */
  export let shortcut = "";

  /**
   * Set to `true` to select the item.
   * Only applies to a selectable item or one inside
   * `MenuItemGroup` or `MenuItemRadioGroup`.
   * @bindable writable
   */
  export let selected = false;

  /**
   * Set to `true` to make the item a standalone checkbox.
   * Automatically enabled when `selected` is `true` or when the item
   * is inside `MenuItemGroup`.
   * @bindable writable
   */
  export let selectable = false;

  /**
   * Specify the id.
   * It's recommended to provide an id as a value to bind to
   * within a selectable or radio menu group.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the list item HTML element.
   * @bindable readonly
   * @type {null | HTMLLIElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import {
    SUBMENU_AIM_PAUSE_MS,
    SUBMENU_HOVER_DELAY_MS,
  } from "../constants/timing.js";
  import CaretRight from "../icons/CaretRight.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    applePlatform,
    ariaKeyShortcuts,
    parseShortcut,
  } from "../utils/keyboard-shortcut.js";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { createSubmenuHoverIntent } from "../utils/submenu-hover-intent.js";
  import { uniqueId } from "../utils/unique-id.js";
  import Menu from "./Menu.svelte";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const ctx = getContext("carbon:Menu");
  const ctxGroup = getContext("carbon:MenuItemGroup");
  const ctxRadioGroup = getContext("carbon:MenuItemRadioGroup");

  let submenuOpen = false;
  /** @type {"left" | "right"} */
  let submenuDirection = "right";
  /** @type {HTMLUListElement | null} */
  let submenuRef = null;
  const hoverIntent = createSubmenuHoverIntent(
    (value) => {
      submenuOpen = value;
    },
    {
      openDelay: SUBMENU_HOVER_DELAY_MS,
      closeDelay: SUBMENU_HOVER_DELAY_MS,
      aimPause: SUBMENU_AIM_PAUSE_MS,
      getSubmenu: () => (submenuOpen ? submenuRef : null),
    },
  );
  // `selected` implies the checkbox variant. Latch it instead of writing back
  // to `selectable` so deselecting the item keeps its role and indentation.
  let selectedOnce = false;

  $: hasSubmenu = labelText !== undefined && $$slots.default;
  // A shortcut that doesn't parse, such as Carbon React's free-text "⌘C",
  // shows as written, as `shortcutText` would.
  $: parsable = parseShortcut(shortcut) !== null;
  // A submenu opens toward the inline end: the left in RTL. Read when it
  // opens, since nothing reports a `dir` change.
  $: if (submenuOpen) {
    submenuDirection =
      resolveLayoutDirection($layoutDirection, ref) === "rtl"
        ? "left"
        : "right";
  }
  $: if (selected) selectedOnce = true;
  $: isSelectable = !!ctxGroup || selectable || selectedOnce;
  $: isRadio = !!ctxRadioGroup;
  $: isIndented = isSelectable || isRadio;
  $: role = isRadio
    ? "menuitemradio"
    : isSelectable
      ? "menuitemcheckbox"
      : "menuitem";
  // A selectable/radio sibling reserves the checkmark column for every
  // item, and an icon-bearing sibling reserves the icon column for every
  // item, so both stay aligned across the whole menu instead of just the
  // row that needs them shifting its own label over.
  const indentRegId = uniqueId();
  const iconRegId = uniqueId();
  const hasIndentedSiblings = ctx.hasIndentedItems;
  const hasIconSiblings = ctx.hasIconItems;
  $: if (isIndented) {
    ctx.registerIndented(indentRegId);
  } else {
    ctx.unregisterIndented(indentRegId);
  }
  $: if (icon) {
    ctx.registerIcon(iconRegId);
  } else {
    ctx.unregisterIcon(iconRegId);
  }

  function handleClick(event) {
    if (disabled) return;

    // Selection runs first so preventDefault only skips the close.
    if (ctxGroup) {
      ctxGroup.toggleOption({ id });
    } else if (ctxRadioGroup) {
      ctxRadioGroup.setOption({ id });
    } else if (isSelectable) {
      selected = !selected;
    }

    const shouldClose = dispatch("click", event, { cancelable: true });

    if (shouldClose) {
      ctx.close("select");
    }
  }

  function openSubmenu() {
    if (disabled) return;
    hoverIntent.open();
  }

  function scheduleOpenSubmenu() {
    if (disabled) return;
    hoverIntent.scheduleOpen();
  }

  function scheduleCloseSubmenu() {
    hoverIntent.scheduleClose();
  }

  function cancelCloseSubmenu() {
    hoverIntent.cancelClose();
  }

  onMount(() => {
    let unsubscribe;

    if (ctxGroup) {
      if (selected) ctxGroup.addOption({ id });
      unsubscribe = ctxGroup.currentIds.subscribe((currentIds) => {
        selected = currentIds.includes(id);
      });
    } else if (ctxRadioGroup) {
      if (selected) ctxRadioGroup.addOption({ id });
      unsubscribe = ctxRadioGroup.currentId.subscribe((currentId) => {
        selected = id === currentId;
      });
    }

    return () => {
      hoverIntent.cancel();
      unsubscribe?.();
      ctx.unregisterIndented(indentRegId);
      ctx.unregisterIcon(iconRegId);
    };
  });
</script>

<li
  bind:this={ref}
  {role}
  tabindex="-1"
  aria-disabled={disabled ? "true" : "false"}
  aria-checked={isIndented ? (selected ? "true" : "false") : undefined}
  aria-haspopup={hasSubmenu ? true : undefined}
  aria-expanded={hasSubmenu ? (submenuOpen ? "true" : "false") : undefined}
  title={labelText}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  class:bx--menu-option--active={hasSubmenu && submenuOpen}
  class:bx--menu-option--danger={!hasSubmenu && kind === "danger"}
  aria-keyshortcuts={shortcut
    ? ariaKeyShortcuts(shortcut, { apple: $applePlatform }) || undefined
    : undefined}
  {...$$restProps}
  on:keydown
  on:keydown={(event) => {
    if (disabled) return;

    if (hasSubmenu) {
      if (
        (inlineKey(event.key, $layoutDirection, ref) === "ArrowRight" &&
          !hasModifierKey(event)) ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();
        openSubmenu();
      }
      return;
    }

    if (event.key === " " || event.key === "Enter") {
      // Space's default action scrolls the page on a non-native focusable
      // element like this <li>; Enter has no such default here, but
      // preventing both keeps the two keys consistent.
      event.preventDefault();
      handleClick(event);
    }
  }}
  on:click={(event) => {
    if (hasSubmenu) {
      event.stopPropagation();
      if (disabled) return;
      openSubmenu();
      return;
    }
    handleClick(event);
  }}
  on:mousedown={(event) => {
    // A `tabindex="-1"` element still receives focus by default on click.
    // Disabled items should not, since handleClick returns early and
    // never moves focus elsewhere itself.
    if (disabled) event.preventDefault();
  }}
  on:mouseenter={() => {
    if (hasSubmenu) scheduleOpenSubmenu();
  }}
  on:mouseleave={(event) => {
    // The event's position lets the close wait while the pointer aims at
    // the submenu across the items below.
    if (hasSubmenu) hoverIntent.scheduleClose(event);
  }}
>
  <div
    class:bx--menu-option__content={true}
    class:bx--menu-option__content--disabled={disabled}
  >
    {#if isIndented || $hasIndentedSiblings}
      <div class:bx--menu-option__selection-icon={true}>
        {#if isIndented && selected}
          <Checkmark />
        {/if}
      </div>
    {/if}
    {#if icon || $hasIconSiblings}
      <div class:bx--menu-option__icon={true}>
        <svelte:component this={icon} />
      </div>
    {/if}
    <span
      class:bx--menu-option__label={true}
      class:bx--menu-option__label--slotted={!!$$slots.labelChildren}
    >
      {#if labelText !== undefined}
        <slot name="labelChildren">{labelText}</slot>
      {:else}
        <slot />
      {/if}
    </span>
    {#if hasSubmenu}
      <div class:bx--menu-option__info={true}>
        <CaretRight />
      </div>
    {:else if shortcutText || $$slots.shortcutChildren || $$slots.shortcutText}
      <div class:bx--menu-option__info={true}>
        <slot name="shortcutChildren"
          ><slot name="shortcutText">{shortcutText}</slot></slot
        >
      </div>
    {:else if shortcut}
      <div class:bx--menu-option__info={true}>
        {#if parsable}
          <Kbd {shortcut} variant="muted" aria-hidden="true" />
        {:else}
          {shortcut}
        {/if}
      </div>
    {/if}
  </div>

  {#if hasSubmenu}
    <Menu
      bind:ref={submenuRef}
      anchor={ref}
      direction={submenuDirection}
      intrinsicWidth
      intrinsicAlign="start"
      bind:open={submenuOpen}
      {labelText}
      on:keydown={(event) => {
        if (
          inlineKey(event.key, $layoutDirection, ref) === "ArrowLeft" &&
          !hasModifierKey(event)
        ) {
          event.preventDefault();
          event.stopPropagation();
          submenuOpen = false;
          ref?.focus({ preventScroll: true });
        }
      }}
      on:mouseenter={cancelCloseSubmenu}
      on:mouseleave={scheduleCloseSubmenu}
      on:close={(event) => {
        if (event.detail.trigger === "select") ctx.close("select");
      }}
    >
      <slot />
    </Menu>
  {/if}
</li>
