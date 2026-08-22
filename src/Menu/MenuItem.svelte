<script>
  /**
   * Dispatched on selection. Cancelable: call `preventDefault()` to keep
   * the menu open. A selectable or radio item's selection still updates.
   * @event {MouseEvent} click
   */

  /**
   * @template [Icon=any]
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
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

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
   * Alternatively, use the "shortcutText" slot.
   * Display only; does not register a keybinding.
   * @example
   * ```svelte
   * <MenuItem>
   *   <span slot="shortcutText">⌘S</span>
   * </MenuItem>
   * ```
   */
  export let shortcutText = "";

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
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import { createSubmenuHoverIntent } from "../utils/submenuHoverIntent.js";
  import { uniqueId } from "../utils/uniqueId.js";
  import Menu from "./Menu.svelte";

  // "moderate-01" duration (ms) from Carbon motion recommended for small
  // expansion, short distance movements - matches the delay used for
  // ContextMenuOption's own submenu hover.
  const HOVER_DELAY_MS = 150;

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:Menu");
  const ctxGroup = getContext("carbon:MenuItemGroup");
  const ctxRadioGroup = getContext("carbon:MenuItemRadioGroup");

  let submenuOpen = false;
  const hoverIntent = createSubmenuHoverIntent(
    (value) => {
      submenuOpen = value;
    },
    { openDelay: HOVER_DELAY_MS, closeDelay: HOVER_DELAY_MS },
  );
  // `selected` implies the checkbox variant. Latch it instead of writing back
  // to `selectable` so deselecting the item keeps its role and indentation.
  let hasBeenSelected = false;

  $: hasSubmenu = labelText !== undefined && $$slots.default;
  $: if (selected) hasBeenSelected = true;
  $: isSelectable = !!ctxGroup || selectable || hasBeenSelected;
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
  aria-disabled={disabled}
  aria-checked={isIndented ? selected : undefined}
  aria-haspopup={hasSubmenu ? true : undefined}
  aria-expanded={hasSubmenu ? submenuOpen : undefined}
  title={labelText}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  class:bx--menu-option--active={hasSubmenu && submenuOpen}
  class:bx--menu-option--danger={!hasSubmenu && kind === "danger"}
  {...$$restProps}
  on:keydown
  on:keydown={(event) => {
    if (disabled) return;

    if (hasSubmenu) {
      if (
        event.key === "ArrowRight" ||
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
  on:mouseleave={() => {
    if (hasSubmenu) scheduleCloseSubmenu();
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
    <span class:bx--menu-option__label={true}>
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
    {:else if shortcutText || $$slots.shortcutText}
      <div class:bx--menu-option__info={true}>
        <slot name="shortcutText">{shortcutText}</slot>
      </div>
    {/if}
  </div>

  {#if hasSubmenu}
    <Menu
      anchor={ref}
      direction="right"
      intrinsicWidth
      intrinsicAlign="start"
      bind:open={submenuOpen}
      {labelText}
      on:keydown={(event) => {
        if (event.key === "ArrowLeft") {
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
