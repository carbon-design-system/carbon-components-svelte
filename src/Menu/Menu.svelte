<script>
  /**
   * @event {HTMLElement} open
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * Required. Specify the anchor element to position the menu relative to.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Set the preferred direction of the menu.
   * The menu flips to the opposite direction if there is not enough space.
   * @type {"bottom" | "top" | "left" | "right"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Obtain a reference to the unordered list HTML element.
   * @bindable readonly
   * @type {null | HTMLUListElement}
   */
  export let ref = null;

  /**
   * Accessible name for the menu.
   * Prefer setting this (or `aria-label`) when there is no visible trigger
   * text for `aria-labelledby`.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /** Vertical gap in pixels when direction is top. */
  export let gapTop = 0;

  /** Vertical gap in pixels when direction is bottom. */
  export let gapBottom = 0;

  /** Horizontal gap in pixels when direction is left. */
  export let horizontalGapLeft = 0;

  /** Horizontal gap in pixels when direction is right. */
  export let horizontalGapRight = 0;

  /** Vertical offset in pixels when direction is left. */
  export let verticalAlignOffsetLeft = 0;

  /** Vertical offset in pixels when direction is right. */
  export let verticalAlignOffsetRight = 0;

  /** Specify the z-index of the menu. */
  export let zIndex = FLOATING_PORTAL_Z_INDEX;

  /**
   * Specify the size of the menu, which controls each item's row height.
   * `"xs"` has no Carbon v10 equivalent and is hand-authored (see `css/_menu-xs.scss`).
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "sm";

  /**
   * Set to `true` to use the menu's intrinsic width instead of matching the anchor width.
   * @type {boolean}
   */
  export let intrinsicWidth = false;

  /**
   * When `intrinsicWidth` is true, align the menu to the anchor.
   * With `direction` set to `"top"` or `"bottom"`, `start` and `end` are the
   * anchor's inline start and end, which swap under `dir="rtl"`.
   * A menu that would run past a side of the window takes another
   * alignment for that open.
   * @type {"start" | "center" | "end"}
   */
  export let intrinsicAlign = "center";

  /**
   * Specify the maximum height of the menu.
   * A number is treated as pixels; a string is used as a CSS length.
   * The menu scrolls once its items exceed the height.
   * @type {number | string | undefined}
   */
  export let maxHeight = undefined;

  /**
   * DOM node to mount the menu into.
   * When unset, uses the anchor's nearest `<dialog>` or `[popover]`, else `document.body`.
   * @type {HTMLElement | null}
   */
  export let target = null;

  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { derived, readable, writable } from "svelte/store";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { MENU_PLACEMENT_CONTEXT_KEY } from "../constants/context-keys.js";
  import { FLOATING_PORTAL_Z_INDEX } from "../constants/layout.js";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { toCssLength } from "../utils/css-length.js";
  import { dismiss } from "../utils/dismiss.js";
  import { focusQuietly, returnFocus } from "../utils/focus.js";
  import { createFrameJob } from "../utils/frame-batch.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { menuOptionLabel } from "../utils/menu-option-label.js";
  import { fitIntrinsicAlign, physicalAlign } from "../utils/menu-placement.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";

  // Selectable and radio items carry their own roles, so navigation and
  // initial focus must match all three. Arrow keys, Home, End and typeahead
  // reach disabled items, which stay focusable as in the WAI-ARIA APG menu
  // pattern; opening the menu still focuses the first enabled item.
  const MENUITEM_ROLES = ["menuitem", "menuitemcheckbox", "menuitemradio"];
  const MENUITEM_SELECTOR = MENUITEM_ROLES.map(
    (role) => `[role='${role}']`,
  ).join(",");
  const NON_DISABLED_MENUITEM_SELECTOR = MENUITEM_ROLES.map(
    (role) => `[role='${role}']:not([aria-disabled='true'])`,
  ).join(",");

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  let focusIndex = -1;
  let rtl = false;
  let prevOpen = false;

  // The physical alignment that keeps this open's menu inside the window,
  // when `portalAlign` would run past a side.
  /** @type {null | "start" | "center" | "end"} */
  let fittedAlign = null;

  // Reads layout only, so it runs with the other frame jobs' reads.
  const fitJob = createFrameJob([
    () => {
      if (!(open && ref && placementAnchor)) return;
      const { left, right } = placementAnchor.getBoundingClientRect();
      const fitted = fitIntrinsicAlign({
        before: left,
        after: right,
        size: ref.getBoundingClientRect().width,
        max: document.documentElement.clientWidth,
        align: portalAlign,
      });
      fittedAlign = fitted === portalAlign ? null : fitted;
    },
  ]);

  const typeahead = createTypeaheadBuffer();

  onMount(() => {
    return () => {
      typeahead.clear();
      fitJob.cancel();
    };
  });

  /**
   * @type {(trigger: "escape-key" | "outside-click" | "select") => void}
   */
  function close(trigger) {
    if (!open) return;
    open = false;
    if (trigger === "escape-key" && anchor) {
      focusQuietly(anchor, { preventScroll: true });
    }
    // The menu unmounts on close, so focus would fall to <body>. Return it to
    // the anchor unless the item's click handler already moved it elsewhere.
    if (trigger === "select") returnFocus(anchor, ref);
    dispatch("close", { trigger });
  }

  /**
   * A menu-wide "does any item need this column" registry: a selectable/
   * radio sibling reserves the checkmark column for every item, and an
   * icon-bearing sibling reserves the icon column for every item, so the
   * whole menu keeps both columns aligned instead of just the row that
   * needs them shifting its own label over. Items register by an internal
   * id (not the consumer-facing `id` prop), since a plain item never
   * registers and multiple items may share no `id` at all.
   * @returns {{ hasAny: import("svelte/store").Readable<boolean>, register: (id: string) => void, unregister: (id: string) => void }}
   */
  function createColumnRegistry() {
    const ids = writable(/** @type {Set<string>} */ (new Set()));
    const hasAny = derived(ids, (_) => _.size > 0);
    const batchedUpdate = batchStoreUpdates(ids);

    return {
      hasAny,
      register(id) {
        batchedUpdate((_) => (_.has(id) ? _ : new Set(_).add(id)));
      },
      unregister(id) {
        batchedUpdate((_) => {
          if (!_.has(id)) return _;
          const next = new Set(_);
          next.delete(id);
          return next;
        });
      },
    };
  }

  const indentedColumn = createColumnRegistry();
  const iconColumn = createColumnRegistry();

  // A submenu leaves Escape/Tab to the root menu, which closes the whole tree
  // and focuses its anchor. Handling it here too would focus the parent item
  // just as the root unmounts it, dropping focus to <body>.
  const parentCtx = getContext("carbon:Menu");
  const isSubmenu = !!parentCtx;

  // A ComboButton's menu lines up with the whole button group, as in Carbon
  // React, while `anchor` (the chevron) keeps focus. Submenus place against
  // their parent item.
  /** @type {import("svelte/store").Readable<null | HTMLElement>} */
  const placementGroup =
    (!isSubmenu && getContext(MENU_PLACEMENT_CONTEXT_KEY)) || readable(null);
  $: placementAnchor = $placementGroup ?? anchor;

  // Ids of `selected` items a `MenuItemGroup` has already seeded. Items and
  // submenus remount on every open, so this lives on the root menu.
  /** @type {Set<string>} */
  const seededIds = parentCtx?.seededIds ?? new Set();

  setContext("carbon:Menu", {
    close,
    seededIds,
    registerIndented: indentedColumn.register,
    unregisterIndented: indentedColumn.unregister,
    hasIndentedItems: indentedColumn.hasAny,
    registerIcon: iconColumn.register,
    unregisterIcon: iconColumn.unregister,
    hasIconItems: iconColumn.hasAny,
  });

  $: {
    if (open && !prevOpen) {
      focusIndex = -1;
      tick().then(() => {
        // `ref` stays unset during server rendering, which has no DOM.
        if (!open || !ref) return;
        const firstItem = ref.querySelector(NON_DISABLED_MENUITEM_SELECTOR);
        if (firstItem instanceof HTMLElement) {
          focusIndex = getItems().indexOf(firstItem);
          focusMenuItem(firstItem);
        } else {
          ref.focus({ preventScroll: true });
        }
        dispatch("open", anchor);
      });
    }
    prevOpen = open;
  }

  // Read when the menu opens: nothing reports a `dir` change.
  $: if (open) rtl = resolveLayoutDirection($layoutDirection, anchor) === "rtl";
  // `start` and `end` along a top or bottom edge are inline sides. Along a
  // left or right edge they are the top and bottom, which RTL leaves alone.
  $: portalAlign =
    direction === "top" || direction === "bottom"
      ? physicalAlign(intrinsicAlign, rtl)
      : intrinsicAlign;
  $: fitsAlign =
    open && intrinsicWidth && (direction === "top" || direction === "bottom");
  $: if (!fitsAlign) {
    fittedAlign = null;
    fitJob.cancel();
  }
  // Fit once the menu has its width, and again when the alignment changes.
  $: if (fitsAlign) {
    void portalAlign;
    tick().then(fitJob.schedule);
  }
  $: placementAlign = fittedAlign ?? portalAlign;
  $: menuAriaLabel = ($$props["aria-label"] ?? labelText) || undefined;
  $: maxHeightStyle = toCssLength(maxHeight);

  /**
   * @param {HTMLElement} item
   */
  function focusMenuItem(item) {
    // `preventScroll` keeps a portaled menu from scrolling the document;
    // scroll the item into view within the menu's own scroll container.
    item.focus({ preventScroll: true });
    scrollIntoViewWithin(item, '[role="menu"]');
  }

  /** @returns {HTMLElement[]} */
  function getItems() {
    return Array.from(ref?.querySelectorAll(MENUITEM_SELECTOR) ?? []).filter(
      (item) => item instanceof HTMLElement,
    );
  }

  /**
   * WAI-ARIA APG menu first-character navigation: move focus to the next
   * item (in this menu's own level; a submenu is a separate,
   * portaled `<ul>` so it is never among `items` here) whose label starts
   * with the buffered characters typed so far.
   * @param {string} character
   */
  function typeaheadSearch(character) {
    const items = getItems();
    if (items.length === 0) return;

    const query = typeahead.push(character);

    const index = typeaheadIndex({
      items,
      query,
      itemToString: menuOptionLabel,
      index: focusIndex,
    });
    focusIndex = index;
    const item = items[index];
    if (item) focusMenuItem(item);
  }

  function handleOutsideClick(event) {
    if (!open) return;
    // Clicks inside any menu (this one or a portalled submenu) are not outside
    // clicks. A submenu's <ul> isn't a DOM descendant of this menu even though
    // it's logically nested, so isOutsideClick alone misses it.
    const target = event.target;
    if (target instanceof Element && target.closest("[role='menu']")) return;
    if (isOutsideClick(event, [anchor, ref])) close("outside-click");
  }

  function handleEscape(event) {
    if (!open || isSubmenu) return;
    // Tab is treated like Escape: without this, focus would leave the
    // (possibly portaled) menu for whatever happens to be next in the DOM.
    if (event.key === "Escape" || event.key === "Tab") {
      // Escape that cancels an IME composition is not a close.
      if (event.key === "Escape" && isImeComposition(event)) return;
      event.preventDefault();
      close("escape-key");
    }
  }
</script>

<FloatingPortal
  anchor={placementAnchor}
  {direction}
  {open}
  {gapTop}
  {gapBottom}
  {horizontalGapLeft}
  {horizontalGapRight}
  {verticalAlignOffsetLeft}
  {verticalAlignOffsetRight}
  {zIndex}
  {intrinsicWidth}
  intrinsicAlign={placementAlign}
  {target}
  lockDirection="always"
  let:direction={portalDirection}
>
  <ul
    bind:this={ref}
    use:rovingFocus={{
      selector: MENUITEM_SELECTOR,
      orientation: "vertical",
      wrap: false,
      focusOnMove: false,
      getActiveIndex: () => focusIndex,
      onMove: (index, event) => {
        if (hasModifierKey(event)) return;
        focusIndex = index;
        const item = getItems()[index];
        if (item) focusMenuItem(item);
      },
    }}
    use:dismiss={{
      enabled: open,
      listeners: [
        { type: "click", handler: handleOutsideClick },
        { type: "keydown", handler: handleEscape },
      ],
    }}
    role="menu"
    tabindex="-1"
    data-floating-menu-direction={portalDirection}
    data-carbon-align={intrinsicWidth ? placementAlign : undefined}
    style:position="relative"
    style:top="auto"
    style:left="auto"
    style:max-height={maxHeightStyle}
    class:bx--menu={true}
    class:bx--menu--open={open}
    class:bx--menu--xs={size === "xs"}
    class:bx--menu--md={size === "md"}
    class:bx--menu--lg={size === "lg"}
    class:bx--menu--scrollable={!!maxHeight}
    {...$$restProps}
    aria-label={menuAriaLabel}
    on:keydown
    on:keydown={(event) => {
      if (
        ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) &&
        !hasModifierKey(event)
      ) {
        event.preventDefault();
      } else if (isTypeaheadKey(event)) {
        event.preventDefault();
        typeaheadSearch(event.key);
      }
    }}
    on:focusin={(event) => {
      // A click focuses an item without going through `onMove`, so sync the
      // index; otherwise the next arrow key starts from the stale one.
      const index = getItems().indexOf(
        /** @type {HTMLElement} */ (event.target),
      );
      if (index > -1) focusIndex = index;
    }}
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </ul>
</FloatingPortal>
