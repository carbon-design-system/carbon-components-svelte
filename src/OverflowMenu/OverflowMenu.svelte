<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "toggle" | "item-select"} trigger
   * @property {number} [index] only present when an item is selected
   * @property {string} [text] only present when an item is selected
   */

  /**
   * Specify the size of the overflow menu.
   * Also accepts Carbon v11's `"md"` (the 40px default) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the direction of the overflow menu relative to the button.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to disable the trigger button */
  export let disabled = false;

  /**
   * Set to `true` to align the menu with the button's inline end instead of
   * its start. Under `dir="rtl"` the default menu aligns with the button's
   * right edge, and a flipped one with its left.
   */
  export let flipped = false;

  /**
   * Specify the maximum height of the menu.
   * A number is treated as pixels; a string is used as a CSS length.
   * The menu scrolls once its items exceed the height.
   * @type {number | string | undefined}
   */
  export let maxHeight = undefined;

  /**
   * Specify the menu options class.
   * @type {string | undefined}
   */
  export let menuOptionsClass = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   * @bindable writable
   */
  export let icon = /** @type {Icon} */ (OverflowMenuVertical);

  /**
   * Specify the icon class.
   * @type {string | undefined}
   */
  export let iconClass = undefined;

  /**
   * Specify the trigger's accessible name and tooltip text.
   * An `aria-label` on the component overrides the name, not the tooltip.
   * A custom trigger in the `menu` slot is named by its content and has no
   * tooltip.
   */
  export let iconDescription = "Options";

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the position of the trigger's tooltip.
   * The tooltip flips to the opposite side when there is not enough space.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "top";

  /**
   * Set the alignment of the trigger's tooltip.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /** Set an id for the button element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the trigger button element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let buttonRef = null;

  /**
   * Obtain a reference to the overflow menu element.
   * @bindable readonly
   * @type {null | HTMLUListElement}
   */
  export let menuRef = null;

  /**
   * Set to `true` to always render the menu in a portal, or `false` to
   * keep it in place. Left unset, the menu moves to a portal inside a
   * Modal, or when a box around it (`overflow` other than `visible`)
   * would cut it off.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { derived, writable } from "svelte/store";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { iconTooltipPortalGaps } from "../Portal/icon-tooltip-portal-gaps.js";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import OverflowMenuHorizontal from "../icons/OverflowMenuHorizontal.svelte";
  import OverflowMenuVertical from "../icons/OverflowMenuVertical.svelte";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { toCssLength } from "../utils/css-length.js";
  import { dismiss } from "../utils/dismiss.js";
  import { clippedBy } from "../utils/fit-align.js";
  import { focusQuietly, returnFocus } from "../utils/focus.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { keyBy } from "../utils/key-by.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { menuSide } from "../utils/menu-placement.js";
  import { nextEnabledIndex } from "../utils/move-index.js";
  import { noop } from "../utils/noop.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { insertByDomOrder } from "../utils/sort-by-dom-order.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";

  const ctxBreadcrumbItem = getContext("carbon:BreadcrumbItem");
  const insideModal = getContext(MODAL_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();

  $: effectiveSize = normalizeSize(size, FIELD_SIZE_ALIASES);

  // Arrow keys the menu owns while open, so the page doesn't also scroll.
  const ARROW_KEYS = ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"];

  // Set for one open when the in-place menu turns out to be cut off by a
  // box around it (a scrolling panel, an `overflow: hidden` card): the menu
  // moves to a portal instead. Only when `portalMenu` is left unset.
  let portalWhenClipped = false;
  $: if (!open) portalWhenClipped = false;

  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal || portalWhenClipped : portalMenu;

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; text: string; primaryFocus: boolean; disabled: boolean; shortcut: string; node: HTMLElement }>>}
   */
  const items = writable([]);
  /**
   * @type {import("svelte/store").Readable<Record<string, { id: string; text: string; primaryFocus: boolean; disabled: boolean; shortcut: string; node: HTMLElement }>>}
   */
  const itemsById = derived(items, (_) => keyBy(_));
  // A menu whose items show shortcuts sizes to its content, so the keys
  // don't squeeze the labels.
  $: hasShortcuts = $items.some((item) => item.shortcut);
  const currentId = writable(undefined);
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const focusedId = writable(undefined);
  const focusedIndex = writable(-1);

  let buttonWidth;
  let mounted = false;

  // Whether opening moves focus into the menu: only when it opens after
  // mounting, or once focus enters it. A menu rendered open leaves focus
  // where it is.
  const moveFocus = writable(false);
  /** @param {boolean} isOpen */
  function trackOpen(isOpen) {
    moveFocus.set(isOpen && mounted);
  }
  $: trackOpen(open);

  const typeahead = createTypeaheadBuffer();

  onMount(() => {
    mounted = true;
    return () => {
      typeahead.clear();
      tooltipHandoff.cancel();
      disconnectModalObserver();
      tooltipHandoff.release();
    };
  });

  // Read when the menu opens: nothing reports a `dir` change. A breadcrumb
  // menu keeps its LTR place, as its caret has no RTL rule yet.
  let rtl = false;
  $: if (open) {
    rtl =
      !ctxBreadcrumbItem &&
      resolveLayoutDirection($layoutDirection, buttonRef) === "rtl";
  }
  // `flipped` aligns the menu with the button's inline end. The class and
  // the position below are physical: aligned with the button's right edge.
  $: alignRight = flipped !== rtl;
  // Opens down from the button's left edge: until it is placed (the
  // server's markup), such a menu takes its place in the flow instead.
  $: belowLeft = !alignRight && direction !== "top" && !ctxBreadcrumbItem;

  /**
   * Everything the menu's position depends on. `afterUpdate` re-measures only
   * when this changes; it used to re-read offset dimensions on every update
   * while open (each arrow key, hover).
   */
  $: positionKey = open
    ? `${direction}|${alignRight}|${effectiveSize}|${effectivePortalMenu}|${menuRef ? 1 : 0}`
    : null;

  /**
   * Key last measured against. Read and written only in `afterUpdate`.
   * The menu's `style` uses directives rather than a `style="..."` string so
   * a re-render (e.g. `buttonWidth` settling) never wipes the `top`/`left`
   * written here.
   */
  let measuredPositionKey = null;

  // The side an in-place menu opens on: `direction`, unless it doesn't fit
  // there and the other side has more room. A portalled menu flips itself.
  /** @type {"top" | "bottom"} */
  let menuPlacement = direction;

  $: if (ctxBreadcrumbItem) {
    icon = /** @type {Icon} */ (OverflowMenuHorizontal);
  }

  // Items mount only while open, so they re-register on every open. The
  // registry stays in DOM order: an item rendered while the menu is open
  // mounts after its siblings but may sit above them.
  const batchedItemsUpdate = batchStoreUpdates(items);

  /**
   * @type {(item: { id: string; text: string; primaryFocus: boolean; disabled: boolean; shortcut: string; node: HTMLElement }) => void}
   */
  function add(item) {
    batchedItemsUpdate((_) => {
      const next = insertByDomOrder(_, item);
      const index = next.lastIndexOf(item);

      // The first enabled item takes focus on open, unless one sets
      // `primaryFocus`.
      if (item.primaryFocus || (!item.disabled && $focusedIndex < 0)) {
        focusedIndex.set(index);
      } else if (index < _.length && index <= $focusedIndex) {
        // Inserted above the focused item; keep focus on it.
        focusedIndex.update((i) => i + 1);
      }

      return next;
    });
  }

  /** @type {(id: string) => void} */
  function remove(id) {
    batchedItemsUpdate((_) => {
      const index = _.findIndex((item) => item.id === id);
      // Removed above the focused item; keep focus on it.
      if (index > -1 && index < $focusedIndex) {
        focusedIndex.update((i) => i - 1);
      }

      return _.filter((item) => item.id !== id);
    });
  }

  /** @type {(id: string, data: { text: string; disabled: boolean }) => void} */
  function patch(id, data) {
    batchedItemsUpdate((_) =>
      _.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );
  }

  /**
   * @type {(id: string, item: { id: string; text: string; primaryFocus: boolean; disabled: boolean; node: HTMLElement }) => void}
   */
  function update(id, item) {
    currentId.set(id);

    const shouldContinue = dispatch(
      "close",
      {
        trigger: "item-select",
        index: $items.findIndex((_) => _.id === id),
        text: item.text,
      },
      { cancelable: true },
    );
    if (shouldContinue) {
      // The menu unmounts on close, so focus would fall to <body>. Return it
      // to the trigger unless the item's handler already moved it elsewhere.
      open = false;
      returnFocus(buttonRef, menuRef);
      dismissTooltip();
    }
  }

  function first() {
    const index = nextEnabledIndex({
      items: $items,
      index: -1,
      step: 1,
      isDisabled: (item) => item.disabled,
      wrap: false,
    });
    if (index >= 0) focusedIndex.set(index);
  }

  function last() {
    const index = nextEnabledIndex({
      items: $items,
      index: -1,
      step: -1,
      isDisabled: (item) => item.disabled,
      wrap: false,
    });
    if (index >= 0) focusedIndex.set(index);
  }

  /**
   * WAI-ARIA APG menu first-character navigation: move focus to the next
   * enabled item whose text starts with the buffered characters typed so far.
   * @param {string} character
   */
  function typeaheadSearch(character) {
    if ($items.length === 0) return;

    const query = typeahead.push(character);

    focusedIndex.set(
      typeaheadIndex({
        items: $items,
        query,
        itemToString: (item) => item.text,
        index: $focusedIndex,
        isDisabled: (item) => item.disabled,
      }),
    );
  }

  setContext("carbon:OverflowMenu", {
    focusedId,
    moveFocus,
    items,
    itemsById,
    add,
    remove,
    patch,
    update,
    first,
    last,
  });

  // Roving focus over the registry (`$items`), not the DOM: the focused item
  // is the one whose id matches `focusedId`, set reactively from `focusedIndex`.
  const menuRovingFocus = {
    selector: "[role='menuitem']",
    orientation: /** @type {const} */ ("vertical"),
    skipDisabled: true,
    getItems: () => $items,
    isDisabled: (item) => item.disabled,
    getActiveIndex: () => $focusedIndex,
    onMove: (index, event) => {
      if (!hasModifierKey(event)) focusedIndex.set(index);
    },
  };

  afterUpdate(() => {
    if (open && $moveFocus && $focusedIndex < 0) {
      menuRef?.focus({ preventScroll: true });
    }

    if (open && positionKey !== measuredPositionKey && buttonRef) {
      measuredPositionKey = positionKey;
      const width = buttonRef.offsetWidth;
      const height = buttonRef.offsetHeight;

      buttonWidth = width;

      if (!effectivePortalMenu) {
        // Menu is a button sibling; position from offsetTop/offsetLeft.
        const { offsetTop, offsetLeft } = buttonRef;
        // Read menu geometry up front, before any writes below: reading
        // offsetHeight/offsetWidth after menuRef.style has already been
        // written forces a second synchronous layout recalc on top of the
        // one triggered by the reads above.
        const menuHeight = menuRef.offsetHeight;
        const menuWidth = menuRef.offsetWidth;
        menuPlacement = ctxBreadcrumbItem
          ? direction
          : menuSide(buttonRef, menuRef, direction);

        if (menuPlacement === "top") {
          menuRef.style.top = `${offsetTop - menuHeight}px`;
        } else {
          menuRef.style.top = `${offsetTop + height}px`;
        }

        if (alignRight) {
          menuRef.style.left = `${offsetLeft + width - menuWidth}px`;
        } else {
          menuRef.style.left = `${offsetLeft}px`;
        }

        if (ctxBreadcrumbItem) {
          menuRef.style.top = `${offsetTop + height + 10}px`;
          // The caret sits 21px in from the menu's inline start, so the
          // menu mirrors around the trigger in RTL.
          menuRef.style.left =
            resolveLayoutDirection($layoutDirection, buttonRef) === "rtl"
              ? `${offsetLeft + width + 11 - menuWidth}px`
              : `${offsetLeft - 11}px`;
        }

        if (portalMenu === undefined && clippedBy(menuRef)) {
          portalWhenClipped = true;
        }
      }
    }

    if (!open) {
      measuredPositionKey = null;
      currentId.set(undefined);
      focusedIndex.set(-1);
    }
  });

  $: menuId = `menu-${id}`;
  // The trigger is named like any icon-only button, by `iconDescription`,
  // and a `menu` slot names it with its own content. The menu takes the
  // trigger's name. An `aria-label` still names both, as documented before
  // v11 moved it to the menu alone.
  $: ariaLabel = $$props["aria-label"];
  $: triggerLabel = ariaLabel ?? ($$slots.menu ? undefined : iconDescription);

  // Always portalled: the inline icon tooltip's CSS restyles its trigger
  // (display, icon fill, a focus ring on the icon), which would change how
  // the overflow menu trigger looks.
  $: hasTooltip = !$$slots.menu && Boolean(iconDescription);

  const tooltipHandoff = createTooltipHandoff({ group: getTooltipGroup() });
  const tooltipActive = tooltipHandoff.active;

  let hovered = false;
  let focused = false;
  // Set by Escape or a click on the trigger. The tooltip stays hidden while
  // the trigger keeps hover or focus, until the next pointer enter or focus.
  let dismissed = false;
  // The tooltip mounts on first hover or focus, so a table with a menu per
  // row doesn't mount a portal per row up front.
  let tooltipMounted = false;

  $: tooltipOpen =
    hasTooltip &&
    !open &&
    !disabled &&
    !dismissed &&
    (hovered || focused) &&
    $tooltipActive;
  $: tooltipGaps = iconTooltipPortalGaps(
    effectiveTooltipPosition,
    effectiveTooltipAlignment,
  );

  function handleTooltipMouseenter() {
    if (!hasTooltip || disabled) return;
    tooltipMounted = true;
    dismissed = false;
    tooltipHandoff.scheduleEnter(() => {
      hovered = true;
    });
  }

  function handleTooltipMouseleave() {
    if (!hasTooltip) return;
    tooltipHandoff.scheduleLeave(() => {
      hovered = false;
      if (!focused) tooltipHandoff.release();
    });
  }

  // Focus the menu returns here as it closes didn't ask for the tooltip,
  // so it counts as dismissed (see `dismissTooltip`).
  function handleTooltipFocus() {
    if (!hasTooltip || disabled) return;
    tooltipMounted = true;
    focused = true;
    dismissed = !tooltipHandoff.claimFocus(buttonRef);
  }

  function handleTooltipBlur() {
    if (!hasTooltip) return;
    focused = false;
    if (!hovered) tooltipHandoff.release();
  }

  // Also called after the menu closes, so the next Escape reaches an
  // ancestor such as a Modal instead of hiding a tooltip that focus alone
  // brought up, even when focus was already on the trigger.
  function dismissTooltip() {
    dismissed = true;
    tooltipHandoff.dismiss();
  }

  // Listens on `window` in the capture phase, as Button does, so a hovered
  // tooltip also hides while focus is elsewhere, and an ancestor such as a
  // Modal doesn't also see the Escape that hid it.
  function handleTooltipKeydown(event) {
    if (event.key !== "Escape" || !tooltipOpen) return;
    // Escape that cancels an IME composition is not a dismissal.
    if (isImeComposition(event)) return;
    event.stopPropagation();
    dismissTooltip();
  }

  // The pointer moved onto a part of the tooltip that covers another
  // control: close at once, so the pointer and the next click reach that
  // control. Hidden until the next pointer enter or focus.
  function handleTooltipCover() {
    tooltipHandoff.cancel();
    dismissed = true;
    hovered = false;
    tooltipHandoff.release();
  }

  function closeTooltip() {
    tooltipHandoff.cancel();
    hovered = false;
    focused = false;
    tooltipHandoff.release();
  }

  // Hide the tooltip when an ancestor modal closes, as Button does.
  let disconnectModalObserver = noop;

  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      tooltipMounted && buttonRef
        ? observeModalClose(buttonRef, closeTooltip)
        : noop;
  }

  $: if ($items[$focusedIndex]) {
    focusedId.set($items[$focusedIndex].id);
  }
  // Use CSS custom properties instead of dynamic style injection for better
  // performance. The previous approach created individual `style` tags per
  // instance, causing overhead when many OverflowMenu components are rendered.
  // The button's width per size until it's measured, so a menu open in the
  // server's markup joins its button as it does once mounted.
  const BUTTON_WIDTHS = { xs: "1.5rem", sm: "2rem", xl: "3rem" };
  $: overflowMenuOptionsAfterWidth = buttonWidth
    ? `${buttonWidth}px`
    : (BUTTON_WIDTHS[effectiveSize] ?? "2.5rem");
  $: maxHeightStyle = toCssLength(maxHeight);

  function handleOutsideClick(event) {
    if (menuRef && isOutsideClick(event, [buttonRef, menuRef])) {
      const shouldContinue = dispatch(
        "close",
        { trigger: "outside-click" },
        { cancelable: true },
      );
      if (shouldContinue) {
        open = false;
      }
    }
  }

  /** @param {KeyboardEvent} event */
  function handleMenuKeydown(event) {
    if (ARROW_KEYS.includes(event.key) && !hasModifierKey(event)) {
      event.preventDefault();
    } else if (isTypeaheadKey(event)) {
      event.preventDefault();
      typeaheadSearch(event.key);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      closeFromKeyboard();
    } else if (event.key === "Tab") {
      // Close like Escape, then let Tab move on from the trigger. Tabbing
      // from the menu itself would leave it open, and from a portalled menu
      // at the end of <body> focus would fall to <body>.
      closeFromKeyboard();
    }
  }

  function closeFromKeyboard() {
    const shouldContinue = dispatch(
      "close",
      { trigger: "escape-key" },
      { cancelable: true },
    );
    if (shouldContinue) {
      open = false;
      focusQuietly(buttonRef, { preventScroll: true });
      dismissTooltip();
    }
  }

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<button
  bind:this={buttonRef}
  use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
  use:dismiss={{
    enabled: tooltipOpen,
    type: "keydown",
    handler: handleTooltipKeydown,
    options: { capture: true },
  }}
  type="button"
  {disabled}
  aria-haspopup="menu"
  aria-expanded={open ? "true" : "false"}
  aria-controls={open ? menuId : undefined}
  {id}
  class:bx--overflow-menu={true}
  class:bx--overflow-menu--open={open}
  class:bx--overflow-menu--xs={effectiveSize === "xs"}
  class:bx--overflow-menu--sm={effectiveSize === "sm"}
  class:bx--overflow-menu--xl={effectiveSize === "xl"}
  class:bx--overflow-menu--custom-trigger={$$slots.menu}
  {...$$restProps}
  aria-label={triggerLabel}
  on:click
  on:click={({ target }) => {
    if (!menuRef?.contains(target)) {
      dismissTooltip();
      if (open) {
        const shouldContinue = dispatch(
          "close",
          { trigger: "toggle" },
          { cancelable: true },
        );
        if (shouldContinue) {
          open = false;
        }
      } else {
        open = true;
      }
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseenter={handleTooltipMouseenter}
  on:mouseleave
  on:mouseleave={handleTooltipMouseleave}
  on:focus={handleTooltipFocus}
  on:blur={handleTooltipBlur}
  on:keydown
  on:keydown={(event) => {
    if (open) {
      if (hasModifierKey(event) && event.key !== "Escape") return;
      if (ARROW_KEYS.includes(event.key)) {
        event.preventDefault();
      } else if (event.key === "Home") {
        event.preventDefault();
        first();
      } else if (event.key === "End") {
        event.preventDefault();
        last();
      } else if (event.key === "Escape") {
        event.stopPropagation();
        closeFromKeyboard();
      }
    }
  }}
>
  <slot name="menu">
    <svelte:component this={icon} class="bx--overflow-menu__icon {iconClass}" />
  </slot>
</button>

{#if open && !effectivePortalMenu}
  <ul
    bind:this={menuRef}
    use:rovingFocus={menuRovingFocus}
    role="menu"
    tabindex="-1"
    id={menuId}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabel === undefined ? id : undefined}
    data-floating-menu-direction={menuPlacement}
    class:bx--overflow-menu-options={true}
    class:bx--overflow-menu--flip={alignRight}
    class:bx--overflow-menu-options--open={open}
    class:bx--overflow-menu-options--xs={effectiveSize === "xs"}
    class:bx--overflow-menu-options--sm={effectiveSize === "sm"}
    class:bx--overflow-menu-options--xl={effectiveSize === "xl"}
    class:bx--overflow-menu-options--scrollable={!!maxHeight}
    class:bx--overflow-menu-options--shortcuts={hasShortcuts}
    class:bx--breadcrumb-menu-options={!!ctxBreadcrumbItem}
    class:bx--overflow-menu-options--below-left={belowLeft}
    class={menuOptionsClass}
    style:--overflow-menu-options-after-width={overflowMenuOptionsAfterWidth}
    style:max-height={maxHeightStyle}
    on:keydown={handleMenuKeydown}
    on:focusin={() => moveFocus.set(true)}
  >
    <slot />
  </ul>
{/if}

{#if effectivePortalMenu}
  <!-- The portal takes the menu's width, so its place doesn't depend on the
  portal's own direction. -->
  <FloatingPortal
    anchor={buttonRef}
    {direction}
    {open}
    intrinsicWidth
    intrinsicAlign={alignRight ? "end" : "start"}
    let:direction={portalDirection}
  >
    <ul
      bind:this={menuRef}
      use:rovingFocus={menuRovingFocus}
      role="menu"
      tabindex="-1"
      id={menuId}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel === undefined ? id : undefined}
      data-floating-menu-direction={portalDirection}
      class:bx--overflow-menu-options={true}
      class:bx--overflow-menu--flip={alignRight}
      class:bx--overflow-menu-options--open={open}
      class:bx--overflow-menu-options--xs={effectiveSize === "xs"}
      class:bx--overflow-menu-options--sm={effectiveSize === "sm"}
      class:bx--overflow-menu-options--xl={effectiveSize === "xl"}
      class:bx--overflow-menu-options--scrollable={!!maxHeight}
      class:bx--overflow-menu-options--shortcuts={hasShortcuts}
      class:bx--breadcrumb-menu-options={!!ctxBreadcrumbItem}
      class={menuOptionsClass}
      style:position="relative"
      style:top="auto"
      style:left="auto"
      style:--overflow-menu-options-after-width={overflowMenuOptionsAfterWidth}
      style:max-height={maxHeightStyle}
      on:keydown={handleMenuKeydown}
      on:focusin={() => moveFocus.set(true)}
    >
      <slot />
    </ul>
  </FloatingPortal>
{/if}

{#if tooltipMounted}
  <PortalTooltip
    anchor={buttonRef}
    direction={effectiveTooltipPosition}
    open={tooltipOpen}
    text={iconDescription}
    tooltipType="icon"
    intrinsicAlign={effectiveTooltipAlignment}
    horizontalGapLeft={tooltipGaps.horizontalGapLeft}
    horizontalGapRight={tooltipGaps.horizontalGapRight}
    gapTop={tooltipGaps.gapTop}
    gapBottom={tooltipGaps.gapBottom}
    verticalAlignOffsetLeft={tooltipGaps.verticalAlignOffsetLeft}
    verticalAlignOffsetRight={tooltipGaps.verticalAlignOffsetRight}
    on:mouseenter={() => {
      // The pointer moved onto the tooltip: keep it open.
      if (tooltipOpen) tooltipHandoff.cancel();
    }}
    on:mouseleave={handleTooltipMouseleave}
    on:cover={handleTooltipCover}
  />
{/if}

<style>
  .bx--overflow-menu-options:after {
    width: var(--overflow-menu-options-after-width, 2rem);
  }
</style>
