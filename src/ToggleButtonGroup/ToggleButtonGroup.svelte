<script>
  /**
   * @restProps {div}
   * @template {string | number} [Value=string | number]
   * @event {ReadonlyArray<Value>} change
   */

  /**
   * Set the values of the pressed buttons.
   * Always an array, even in `single` mode (0 or 1 entries).
   * @type {ReadonlyArray<Value>}
   * @bindable writable
   */
  export let selected = [];

  /**
   * Specify the selection behavior. `single` allows at most one pressed
   * button; pressing the pressed button clears it unless `required` is set.
   * @type {"multiple" | "single"}
   */
  export let selectionMode = "multiple";

  /** Set to `true` so the last pressed button can't be un-pressed */
  export let required = false;

  /**
   * Specify the size of the buttons.
   * Inherits the parent `InputGroup` size when unset, otherwise `"md"`.
   * @type {"xs" | "sm" | "md" | "lg" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the orientation of the group.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /**
   * Set to `true` to lay the buttons out as an even grid that wraps onto
   * as many rows as it needs, such as for time slots. Columns are at
   * least 5rem wide, so the count follows the width of the container.
   * Up and Down move between rows. Has no effect on a vertical group.
   */
  export let grid = false;

  /** Set to `true` to disable all buttons in the group */
  export let disabled = false;

  /**
   * Accessible name for the group.
   * Prefer setting this (or `aria-label`) since the root has no visible
   * label of its own.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @type {HTMLDivElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    setContext,
  } from "svelte";
  import { get, readable, readonly, writable } from "svelte/store";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { provideTooltipGroup } from "../utils/tooltip-group.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  const TOGGLE_BUTTON_SELECTOR = "button.bx--toggle-button";

  /**
   * @type {import("svelte/store").Writable<Set<Value>>}
   */
  const selectedValues = writable(new Set());
  const groupDisabled = writable(disabled);
  const groupOrientation = writable(orientation);
  /**
   * @type {import("svelte/store").Writable<HTMLButtonElement | null>}
   */
  const tabStopElement = writable(null);
  // Icon-only buttons hand their tooltips off to each other, and to the
  // rest of an enclosing `TooltipGroup`.
  provideTooltipGroup();

  // `single` mode only ever treats the first entry as pressed; the rest of
  // a multi-entry `selected` passed in from a consumer is left untouched
  // until the next user interaction (see `toggle`).
  $: selectedValues.set(
    new Set(selectionMode === "single" ? selected.slice(0, 1) : selected),
  );
  $: groupDisabled.set(disabled);
  $: groupOrientation.set(orientation);
  $: groupAriaLabel = ($$props["aria-label"] ?? labelText) || undefined;

  /**
   * @type {(value: Value) => void}
   */
  function toggle(value) {
    if (disabled) return;

    const effectiveSelected =
      selectionMode === "single" ? selected.slice(0, 1) : selected;
    const isPressed = effectiveSelected.includes(value);

    if (isPressed && required) {
      if (selectionMode === "single") return;
      if (effectiveSelected.length <= 1) return;
    }

    /** @type {Value[]} */
    let next;
    if (selectionMode === "single") {
      next = isPressed ? [] : [value];
    } else if (isPressed) {
      next = effectiveSelected.filter((v) => v !== value);
    } else {
      next = [...effectiveSelected, value];
    }

    selected = Array.from(new Set(next));
    dispatch("change", selected);
  }

  /**
   * The default tab stop: the first pressed, non-disabled button, else the
   * first non-disabled button. Read straight from the DOM (like
   * `rovingFocus`'s own item lookup) instead of keeping a child registry in
   * sync.
   * @type {() => HTMLButtonElement | null}
   */
  function findDefaultTabStop() {
    if (!ref) return null;
    const items = /** @type {HTMLButtonElement[]} */ (
      Array.from(ref.querySelectorAll(TOGGLE_BUTTON_SELECTOR))
    ).filter((item) => !item.disabled);
    if (items.length === 0) return null;
    return (
      items.find((item) => item.getAttribute("aria-pressed") === "true") ??
      items[0]
    );
  }

  let initialTabStopClaimed = false;

  /**
   * Buttons call this once while initializing, in DOM order, so the first
   * render (server or client) already has one `tabindex="0"` without
   * reading the DOM: the first enabled button when nothing is pressed,
   * otherwise the first enabled pressed button.
   * @type {(value: Value, isDisabled: boolean) => boolean}
   */
  function claimInitialTabStop(value, isDisabled) {
    if (initialTabStopClaimed || isDisabled) return false;

    const effectiveSelected =
      selectionMode === "single" ? selected.slice(0, 1) : selected;

    if (effectiveSelected.length > 0 && !effectiveSelected.includes(value)) {
      return false;
    }

    initialTabStopClaimed = true;
    return true;
  }

  setContext("carbon:ToggleButtonGroup", {
    selectedValues: readonly(selectedValues),
    disabled: readonly(groupDisabled),
    orientation: readonly(groupOrientation),
    tabStopElement: readonly(tabStopElement),
    toggle,
    claimInitialTabStop,
    // A slotted `ToggleButton` unmounting doesn't re-run this component's
    // own `afterUpdate` (slot content changes belong to the parent's update
    // cycle, not this one's), so the tab stop would otherwise keep pointing
    // at a detached node. The child reports its own teardown instead of a
    // full registry.
    /** @param {HTMLElement} node */
    notifyUnmount(node) {
      if (get(tabStopElement) === node) {
        tabStopElement.set(findDefaultTabStop());
      }
    },
  });

  afterUpdate(() => {
    const current = get(tabStopElement);
    if (current && ref?.contains(current) && !current.disabled) return;
    tabStopElement.set(findDefaultTabStop());
  });

  $: isGrid = grid && orientation !== "vertical";

  /**
   * In a grid, Up and Down move to the button in the same column of the
   * row above or below, skipping disabled ones. Left and Right still move
   * through the buttons in order.
   * @param {KeyboardEvent} event
   */
  function handleGridKeydown(event) {
    if (
      !isGrid ||
      hasModifierKey(event) ||
      (event.key !== "ArrowUp" && event.key !== "ArrowDown")
    ) {
      return;
    }
    const items = /** @type {HTMLButtonElement[]} */ (
      Array.from(ref?.querySelectorAll(TOGGLE_BUTTON_SELECTOR) ?? [])
    );
    let index = items.indexOf(/** @type {HTMLButtonElement} */ (event.target));
    if (index === -1) return;
    const firstTop = items[0].offsetTop;
    const columns = items.filter((item) => item.offsetTop === firstTop).length;
    const step = event.key === "ArrowDown" ? columns : -columns;
    event.preventDefault();
    for (index += step; index >= 0 && index < items.length; index += step) {
      if (!items[index].disabled) {
        tabStopElement.set(items[index]);
        items[index].focus();
        return;
      }
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusIn(event) {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.matches(TOGGLE_BUTTON_SELECTOR)
    ) {
      tabStopElement.set(/** @type {HTMLButtonElement} */ (target));
    }
  }

  // Beside a field in an InputGroup, the buttons take the row's height.
  /** @type {Record<string, "xs" | "sm" | "lg">} */
  const SIZE_BY_GROUP_SIZE = { xs: "xs", sm: "sm", xl: "lg" };
  const groupSize =
    getContext("carbon:InputGroup")?.size ?? readable(undefined);
  $: effectiveSize = size ?? SIZE_BY_GROUP_SIZE[$groupSize] ?? "md";
</script>

<div
  bind:this={ref}
  role="toolbar"
  aria-orientation={orientation === "vertical" ? "vertical" : undefined}
  use:rovingFocus={{
    selector: TOGGLE_BUTTON_SELECTOR,
    rtl: () => resolveLayoutDirection($layoutDirection, ref) === "rtl",
    orientation,
    wrap: true,
    skipDisabled: true,
    focusOnMove: false,
    getActiveIndex: () => {
      const items = Array.from(
        ref?.querySelectorAll(TOGGLE_BUTTON_SELECTOR) ?? [],
      );
      const current = get(tabStopElement);
      const index = current ? items.indexOf(current) : -1;
      return index === -1 ? 0 : index;
    },
    onMove: (index, event) => {
      // Leave Alt/Ctrl/Meta+Arrow (Back, scroll) to the browser.
      if (hasModifierKey(event)) return;
      // Keep the page from scrolling with the arrow key.
      event.preventDefault();
      const items = /** @type {HTMLButtonElement[]} */ (
        Array.from(ref?.querySelectorAll(TOGGLE_BUTTON_SELECTOR) ?? [])
      );
      const item = items[index];
      if (!item) return;
      tabStopElement.set(item);
      item.focus();
    },
  }}
  on:focusin={handleFocusIn}
  on:keydown={handleGridKeydown}
  class:bx--toggle-button-group={true}
  class:bx--toggle-button-group--xs={effectiveSize === "xs"}
  class:bx--toggle-button-group--sm={effectiveSize === "sm"}
  class:bx--toggle-button-group--lg={effectiveSize === "lg"}
  class:bx--toggle-button-group--vertical={orientation === "vertical"}
  class:bx--toggle-button-group--grid={isGrid}
  {...$$restProps}
  aria-label={groupAriaLabel}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
>
  <slot />
</div>
