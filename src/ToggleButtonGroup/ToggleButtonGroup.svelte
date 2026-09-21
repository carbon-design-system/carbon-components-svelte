<script>
  /**
   * @restProps {div}
   * @event {ReadonlyArray<string | number>} change
   */

  /**
   * Set the values of the pressed buttons.
   * Always an array, even in `single` mode (0 or 1 entries).
   * @type {ReadonlyArray<string | number>}
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
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify the orientation of the group.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

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

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import { get, readonly, writable } from "svelte/store";
  import { rovingFocus } from "../utils/roving-focus.js";

  const dispatch = createEventDispatcher();

  const TOGGLE_BUTTON_SELECTOR = "button.bx--toggle-button";

  /**
   * @type {import("svelte/store").Writable<Set<string | number>>}
   */
  const selectedValues = writable(new Set());
  const groupDisabled = writable(disabled);
  const groupOrientation = writable(orientation);
  /**
   * @type {import("svelte/store").Writable<HTMLButtonElement | null>}
   */
  const tabStopElement = writable(null);
  // Tracks which icon-only button's CSS tooltip is shown, so moving the
  // pointer between adjacent segments shows one at a time instead of both
  // briefly overlapping mid-transition. Scoped per group, like
  // ContentSwitcher's own `activeTooltip`.
  /**
   * @type {import("svelte/store").Writable<string | number | null>}
   */
  const activeTooltip = writable(null);

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
   * @type {(value: string | number) => void}
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

  setContext("carbon:ToggleButtonGroup", {
    selectedValues: readonly(selectedValues),
    disabled: readonly(groupDisabled),
    orientation: readonly(groupOrientation),
    tabStopElement: readonly(tabStopElement),
    activeTooltip,
    toggle,
    // A slotted `ToggleButton` unmounting doesn't re-run this component's
    // own `afterUpdate` (slot content changes belong to the parent's update
    // cycle, not this one's), so the tab stop would otherwise keep pointing
    // at a detached node. The child reports its own teardown instead of a
    // full registry.
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
</script>

<div
  bind:this={ref}
  role="toolbar"
  aria-orientation={orientation === "vertical" ? "vertical" : undefined}
  use:rovingFocus={{
    selector: TOGGLE_BUTTON_SELECTOR,
    orientation,
    wrap: true,
    skipDisabled: true,
    focusOnMove: true,
    getActiveIndex: () => {
      const items = Array.from(
        ref?.querySelectorAll(TOGGLE_BUTTON_SELECTOR) ?? [],
      );
      const current = get(tabStopElement);
      const index = current ? items.indexOf(current) : -1;
      return index === -1 ? 0 : index;
    },
    onMove: (index) => {
      const items = /** @type {HTMLButtonElement[]} */ (
        Array.from(ref?.querySelectorAll(TOGGLE_BUTTON_SELECTOR) ?? [])
      );
      const item = items[index];
      if (item) tabStopElement.set(item);
    },
  }}
  on:focusin={handleFocusIn}
  class:bx--toggle-button-group={true}
  class:bx--toggle-button-group--sm={size === "sm"}
  class:bx--toggle-button-group--lg={size === "lg"}
  class:bx--toggle-button-group--vertical={orientation === "vertical"}
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
