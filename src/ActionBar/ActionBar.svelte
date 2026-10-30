<script context="module">
  /**
   * @typedef {Object} ActionBarEntry
   * @property {string} id
   * @property {"item" | "divider"} kind
   * @property {HTMLElement | undefined} node
   * @property {string | undefined} groupId
   * @property {number} priority
   * @property {boolean} pinned
   * @property {boolean} focusable - Takes a roving tab stop.
   * @property {boolean} managed - Holds controls of its own, whose tab stops the bar sets.
   * @property {string} label - The name in the "More" menu.
   * @property {import("../utils/icon-component.js").IconComponent | undefined} icon
   * @property {boolean} disabled
   * @property {boolean | undefined} checked - Set for a toggle or a radio.
   * @property {string} shortcut
   * @property {boolean} danger
   * @property {() => void} activate - Click the button the entry stands for.
   */

  /**
   * Controls inside an `ActionBarItem` that Tab reaches, and those the bar
   * took out of the tab order, which it marks.
   */
  const TABBABLE = [
    "a[href]",
    "button:not(:disabled)",
    'input:not([type="hidden"]):not(:disabled)',
    "select:not(:disabled)",
    "textarea:not(:disabled)",
    '[contenteditable]:not([contenteditable="false"])',
    "[tabindex]",
  ]
    .map((selector) => `${selector}:not([tabindex="-1"])`)
    .concat("[data-ccs-bar-tab]")
    .join(", ");
</script>

<script>
  /**
   * A toolbar of `ActionBarButton`, `ActionBarGroup`, `ActionBarDivider` and
   * `ActionBarItem` children. It is one tab stop: the arrow keys, Home and
   * End move between the controls. When the bar is too narrow, the buttons
   * that no longer fit collapse into a "More" menu.
   *
   * @event {{ count: number; ids: string[] }} overflow:change - Dispatched when the set of collapsed buttons changes: after a resize, or when a button is added or removed.
   * @event exit - Dispatched when Escape is pressed on a control and nothing else, such as an open menu, took the key. Return focus to what the bar controls.
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the accessible name of the toolbar. Required when a page has
   * more than one. An `aria-label` or `aria-labelledby` overrides it.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /**
   * Specify the size of the buttons. The sizes are 24, 32, 40 and 48px.
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify the axis of the bar. A vertical bar moves focus with Up and Down
   * and collapses what does not fit its height, which the page must set.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /** Specify the name and tooltip of the "More" trigger. */
  export let moreText = "More";

  /**
   * Set to `true` so pressing a button with the pointer does not take focus
   * from what it acts on, such as the text field of an editor.
   */
  export let preserveFocus = false;

  /**
   * Obtain a reference to the toolbar element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import Menu from "../Menu/Menu.svelte";
  import MenuDivider from "../Menu/MenuDivider.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import OverflowMenuHorizontal from "../icons/OverflowMenuHorizontal.svelte";
  import OverflowMenuVertical from "../icons/OverflowMenuVertical.svelte";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { returnFocus } from "../utils/focus.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import { moveIndex } from "../utils/move-index.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { insertByDomOrder } from "../utils/sort-by-dom-order.js";
  import { provideTooltipGroup } from "../utils/tooltip-group.js";
  import { fitActionBar, sameIds } from "./action-bar-fit.js";
  import { caretAtEdge, controlOwnsKey } from "./action-bar-keys.js";
  import {
    ACTION_BAR_EXPAND_SLACK_PX,
    ACTION_BAR_SIZE_PX,
    BUTTON_SIZE_BY_ACTION_BAR_SIZE,
  } from "./action-bar-sizes.js";

  const MORE = "more";
  // `Button` marks an icon-only ghost button pressed or not. A trigger is not
  // a toggle.
  const NOT_A_TOGGLE = { "aria-pressed": undefined };

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  // Buttons hand their tooltips off to each other.
  provideTooltipGroup();

  /** @type {import("svelte/store").Writable<ActionBarEntry[]>} */
  const entries = writable([]);
  const batchedEntries = batchStoreUpdates(entries);
  /** @type {import("svelte/store").Writable<Set<string>>} */
  const hidden = writable(new Set());
  /** @type {import("svelte/store").Writable<Set<string>>} */
  const hiddenGroups = writable(new Set());
  /** @type {import("svelte/store").Writable<string | null>} */
  const tabStopId = writable(null);
  /** @type {import("svelte/store").Writable<"xs" | "sm" | "md" | "lg">} */
  const sharedSize = writable(size);
  /** @type {import("svelte/store").Writable<"horizontal" | "vertical">} */
  const sharedOrientation = writable(orientation);
  $: sharedSize.set(size);
  $: sharedOrientation.set(orientation);

  /** Sizes read from the observer, by entry id. Hidden entries keep theirs. */
  /** @type {Map<string, number>} */
  const sizes = new Map();
  /** @type {Map<string, () => void>} */
  const observers = new Map();
  /** @type {number | null} */
  let available = null;
  let fitQueued = false;
  let mounted = false;

  /** @type {null | HTMLButtonElement | HTMLAnchorElement} */
  let moreRef = null;
  /** @type {null | HTMLUListElement} */
  let menuRef = null;
  let moreOpen = false;

  $: vertical = orientation === "vertical";
  $: hiddenItems = $entries.filter(
    (entry) => entry.kind === "item" && $hidden.has(entry.id),
  );
  $: showMore = hiddenItems.length > 0;
  $: menuModel = buildMenu($entries, $hidden);
  $: if (!showMore) moreOpen = false;
  $: if (mounted && ($entries || $tabStopId !== undefined)) {
    tick().then(applyTabStops);
  }

  /**
   * The "More" menu: the collapsed items in order, with a divider where one
   * sat between two of them.
   * @param {ActionBarEntry[]} list
   * @param {Set<string>} collapsed
   * @returns {Array<{ type: "divider"; id: string } | { type: "item"; entry: ActionBarEntry }>}
   */
  function buildMenu(list, collapsed) {
    /** @type {Array<{ type: "divider"; id: string } | { type: "item"; entry: ActionBarEntry }>} */
    const model = [];
    let divider = "";
    for (const entry of list) {
      if (entry.kind === "divider") {
        if (!divider) divider = entry.id;
      } else if (collapsed.has(entry.id)) {
        if (divider && model.length > 0)
          model.push({ type: "divider", id: divider });
        divider = "";
        model.push({ type: "item", entry });
      }
    }
    return model;
  }

  /** @returns {Array<{ id: string; node: HTMLElement; focus?: () => void }>} */
  function stops() {
    /** @type {Array<{ id: string; node: HTMLElement }>} */
    const list = [];
    for (const entry of $entries) {
      if (!entry.focusable || !entry.node || $hidden.has(entry.id)) continue;
      list.push({ id: entry.id, node: entry.node });
    }
    if (showMore && moreRef) list.push({ id: MORE, node: moreRef });
    return list;
  }

  /**
   * The control a stop hands focus to: an item that holds controls of its
   * own, such as a field, gives its first.
   * @param {{ id: string; node: HTMLElement }} stop
   * @returns {HTMLElement}
   */
  function focusTarget(stop) {
    const entry = $entries.find((candidate) => candidate.id === stop.id);
    if (!entry?.managed) return stop.node;
    return (
      /** @type {HTMLElement | null} */ (stop.node.querySelector(TABBABLE)) ??
      stop.node
    );
  }

  // The tab stop sits on an entry that shows; else on "More", where the
  // user's place went, else on the first.
  function syncTabStop() {
    const list = stops();
    if (list.some((stop) => stop.id === $tabStopId)) return;
    const wasHidden = $entries.some(
      (entry) => entry.id === $tabStopId && $hidden.has(entry.id),
    );
    tabStopId.set(wasHidden && showMore ? MORE : (list[0]?.id ?? null));
  }

  /**
   * Give the controls inside an `ActionBarItem` a tab stop only while its
   * item is the bar's, so the bar stays one tab stop.
   */
  function applyTabStops() {
    for (const entry of $entries) {
      if (!entry.managed || !entry.node) continue;
      const active = $tabStopId === null || $tabStopId === entry.id;
      for (const control of /** @type {NodeListOf<HTMLElement>} */ (
        entry.node.querySelectorAll(TABBABLE)
      )) {
        if (active) {
          if (!control.hasAttribute("data-ccs-bar-tab")) continue;
          const saved = control.getAttribute("data-ccs-bar-tab");
          if (saved) control.setAttribute("tabindex", saved);
          else control.removeAttribute("tabindex");
          control.removeAttribute("data-ccs-bar-tab");
        } else if (!control.hasAttribute("data-ccs-bar-tab")) {
          control.setAttribute(
            "data-ccs-bar-tab",
            control.getAttribute("tabindex") ?? "",
          );
          control.setAttribute("tabindex", "-1");
        }
      }
    }
  }

  /**
   * The size of an observed entry along the bar's axis, without reading
   * layout when the entry carries it.
   * @param {ResizeObserverEntry} entry
   * @param {boolean} block
   * @returns {number}
   */
  function axisSize(entry, block) {
    const box = entry.borderBoxSize?.[0];
    if (box) return block ? box.blockSize : box.inlineSize;
    const target = /** @type {HTMLElement} */ (entry.target);
    return block ? target.offsetHeight : target.offsetWidth;
  }

  function queueFit() {
    if (fitQueued) return;
    fitQueued = true;
    // One pass for every entry of an observer batch.
    queueMicrotask(() => {
      fitQueued = false;
      refit();
    });
  }

  function refit() {
    if (available === null) return;
    const list = $entries;
    const next = fitActionBar({
      available,
      moreWidth: ACTION_BAR_SIZE_PX[size],
      previous: $hidden,
      slack: ACTION_BAR_EXPAND_SLACK_PX,
      entries: list.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        width: sizes.get(entry.id) ?? 0,
        priority: entry.priority,
        pinned: entry.pinned,
      })),
    });
    const changed = !sameIds(next, $hidden);

    // Focus on a button that is about to collapse goes to "More" once the
    // button is gone; and from "More" to the first control, once it is.
    const active = document.activeElement;
    const focused = active
      ? list.find((entry) => entry.node?.contains(active))
      : undefined;
    const losing = focused && next.has(focused.id) ? focused : undefined;
    const inMore = !!active && !!moreRef && moreRef.contains(active);
    const losingMore =
      inMore &&
      !list.some((entry) => entry.kind === "item" && next.has(entry.id));

    if (changed) {
      hidden.set(next);
      const groupIds = new Set(list.map((entry) => entry.groupId));
      groupIds.delete(undefined);
      /** @type {Set<string>} */
      const emptied = new Set();
      for (const group of /** @type {Set<string>} */ (groupIds)) {
        const members = list.filter((entry) => entry.groupId === group);
        if (members.every((entry) => next.has(entry.id))) emptied.add(group);
      }
      if (!sameIds(emptied, $hiddenGroups)) hiddenGroups.set(emptied);

      const ids = list
        .filter((entry) => entry.kind === "item" && next.has(entry.id))
        .map((entry) => entry.id);
      dispatch("overflow:change", { count: ids.length, ids });
    }

    if (changed || $tabStopId === null) {
      tick().then(() => {
        syncTabStop();
        if (losing && moreRef) {
          tabStopId.set(MORE);
          returnFocus(moreRef, losing.node);
        } else if (losingMore) {
          const first = stops()[0];
          if (first) focusTarget(first).focus({ preventScroll: true });
        }
      });
    }
  }

  setContext("carbon:ActionBar", {
    size: sharedSize,
    orientation: sharedOrientation,
    hidden,
    hiddenGroups,
    tabStopId,
    /**
     * Add an entry. Returns the function that removes it.
     * @param {ActionBarEntry} entry
     * @returns {() => void}
     */
    register(entry) {
      batchedEntries((current) =>
        current.some((existing) => existing.id === entry.id)
          ? current
          : insertByDomOrder(current, entry),
      );
      const node = entry.node;
      if (node) {
        observers.set(
          entry.id,
          observeResize(node, (observed) => {
            const value = axisSize(observed, orientation === "vertical");
            // A collapsed entry measures 0: keep the size it had.
            if (value > 0) sizes.set(entry.id, value);
            queueFit();
          }),
        );
      }
      return () => {
        observers.get(entry.id)?.();
        observers.delete(entry.id);
        sizes.delete(entry.id);
        batchedEntries((current) =>
          current.filter((existing) => existing.id !== entry.id),
        );
        queueFit();
      };
    },
    /**
     * Change what the "More" menu knows of an entry.
     * @param {string} id
     * @param {Partial<ActionBarEntry>} patch
     */
    update(id, patch) {
      batchedEntries((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      );
      queueFit();
    },
  });

  /** @type {() => void} */
  let stopRoot = () => {};

  function observeRoot() {
    if (!ref) return () => {};
    return observeResize(ref, (observed) => {
      const box = observed.contentBoxSize?.[0];
      available = box
        ? orientation === "vertical"
          ? box.blockSize
          : box.inlineSize
        : axisSize(observed, orientation === "vertical");
      queueFit();
    });
  }

  onMount(() => {
    mounted = true;
    stopRoot = observeRoot();
    return () => {
      mounted = false;
      stopRoot();
    };
  });

  // The axis changed, so every size read along the old one is stale: read
  // them once more, and observe the bar again for the room.
  let previousOrientation = orientation;
  $: if (orientation !== previousOrientation) {
    previousOrientation = orientation;
    const block = orientation === "vertical";
    for (const entry of $entries) {
      const value = block ? entry.node?.offsetHeight : entry.node?.offsetWidth;
      if (value) sizes.set(entry.id, value);
    }
    stopRoot();
    stopRoot = observeRoot();
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const stop = stops().find((candidate) =>
      candidate.node.contains(/** @type {Node} */ (event.target)),
    );
    if (stop && stop.id !== $tabStopId) tabStopId.set(stop.id);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.defaultPrevented || isImeComposition(event)) return;
    const target = /** @type {HTMLElement} */ (event.target);

    if (event.key === "Escape") {
      // A tooltip that is open takes the first Escape, as does a control that
      // closes something of its own, so only a key left over leaves the bar.
      if (
        !hasModifierKey(event) &&
        target.getAttribute("aria-expanded") !== "true" &&
        stops().some((stop) => stop.node.contains(target))
      ) {
        dispatch("exit");
      }
      return;
    }

    if (hasModifierKey(event)) return;
    const key = vertical
      ? event.key
      : inlineKey(event.key, $layoutDirection, ref);
    const forward = vertical ? "ArrowDown" : "ArrowRight";
    const backward = vertical ? "ArrowUp" : "ArrowLeft";
    if (
      key !== forward &&
      key !== backward &&
      key !== "Home" &&
      key !== "End"
    ) {
      return;
    }

    if (controlOwnsKey(target, event.key)) {
      // A field lets go of Left and Right at the edge of its text.
      const handoff =
        !vertical &&
        (key === forward || key === backward) &&
        caretAtEdge(target, key === forward ? "next" : "previous");
      if (!handoff) return;
    }

    const list = stops();
    const index = list.findIndex((stop) => stop.node.contains(target));
    if (index < 0) return;
    event.preventDefault();
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? list.length - 1
          : moveIndex(index, key === forward ? 1 : -1, list.length);
    const stop = list[next];
    if (!stop) return;
    tabStopId.set(stop.id);
    focusTarget(stop).focus();
  }

  /** @param {MouseEvent} event */
  function handleClickCapture(event) {
    const target = /** @type {Element} */ (event.target);
    // A disabled button stays focusable, so it blocks its own click.
    if (target.closest?.('.bx--action-bar__button[aria-disabled="true"]')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /** @param {MouseEvent} event */
  function handleMousedown(event) {
    if (
      preserveFocus &&
      /** @type {Element} */ (event.target).closest?.(
        ".bx--action-bar__button, .bx--action-bar__more",
      )
    ) {
      event.preventDefault();
    }
  }

  // The item that took focus goes with the menu: give it back to the
  // trigger once it has, unless the item's action moved focus elsewhere.
  function handleMenuClose() {
    const region = menuRef;
    tick().then(() => returnFocus(moreRef, region));
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  bind:this={ref}
  role="toolbar"
  aria-label={labelText}
  aria-orientation={orientation}
  {...$$restProps}
  class:bx--action-bar={true}
  class:bx--action-bar--xs={size === "xs"}
  class:bx--action-bar--sm={size === "sm"}
  class:bx--action-bar--md={size === "md"}
  class:bx--action-bar--lg={size === "lg"}
  class:bx--action-bar--vertical={vertical}
  on:click|capture={handleClickCapture}
  on:mousedown={handleMousedown}
  on:focusin={handleFocusin}
  on:keydown={handleKeydown}
>
  <div class:bx--action-bar__items={true}>
    <slot />
  </div>
  {#if showMore}
    <Button
      bind:ref={moreRef}
      kind="ghost"
      size={BUTTON_SIZE_BY_ACTION_BAR_SIZE[size]}
      icon={vertical ? OverflowMenuVertical : OverflowMenuHorizontal}
      iconDescription={moreText}
      hideTooltip={moreOpen}
      tooltipPosition={vertical ? "right" : "bottom"}
      class="bx--action-bar__more"
      tabindex={$tabStopId === null ? undefined : $tabStopId === MORE ? 0 : -1}
      aria-haspopup="menu"
      aria-expanded={moreOpen ? "true" : "false"}
      {...NOT_A_TOGGLE}
      on:mousedown={(event) => event.preventDefault()}
      on:click={() => (moreOpen = !moreOpen)}
    />
  {/if}
</div>

{#if showMore}
  <Menu
    anchor={moreRef}
    direction={vertical ? "right" : "bottom"}
    intrinsicWidth
    intrinsicAlign="end"
    {size}
    labelText={moreText}
    bind:ref={menuRef}
    bind:open={moreOpen}
    on:close={handleMenuClose}
  >
    {#each menuModel as row (row.type === "divider" ? `d-${row.id}` : row.entry.id)}
      {#if row.type === "divider"}
        <MenuDivider />
      {:else}
        <MenuItem
          labelText={row.entry.label}
          icon={row.entry.icon}
          disabled={row.entry.disabled}
          kind={row.entry.danger ? "danger" : "default"}
          shortcut={row.entry.shortcut}
          selectable={row.entry.checked !== undefined}
          selected={row.entry.checked ?? false}
          on:click={() => row.entry.activate()}
        />
      {/if}
    {/each}
  </Menu>
{/if}
