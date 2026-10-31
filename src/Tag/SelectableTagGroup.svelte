<script>
  /**
   * @restProps {div}
   * @template {string | number} [Value=string | number]
   * @event {ReadonlyArray<Value>} change
   * @slot {{}}
   */

  /**
   * Set the values of the selected tags, matched against each tag's
   * `value` (or `id`). Always an array, even in `single` mode (0 or 1 entries).
   * @type {ReadonlyArray<Value>}
   * @bindable writable
   */
  export let selected = [];

  /**
   * Specify the selection behavior. `single` allows at most one selected
   * tag; selecting it again clears it unless `required` is set.
   * @type {"multiple" | "single"}
   */
  export let selectionMode = "multiple";

  /** Set to `true` so the last selected tag can't be unselected */
  export let required = false;

  /**
   * Specify the size of the tags. A tag's own `size` wins.
   * @type {"xs" | "sm" | "default" | "lg" | "md" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to disable all tags in the group */
  export let disabled = false;

  /**
   * Specify the legend text. It names the group.
   * Alternatively, set `aria-label` or `aria-labelledby`.
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

  /**
   * Specify a name to submit the selection with a form: one hidden input
   * per selected value. A form reset restores the selection the group
   * rendered with.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the gap between tags.
   * Alternatively, specify a custom value (e.g., "0.25rem").
   * @type {import("../Stack/Stack.svelte").StackScale | string}
   */
  export let gap = 3;

  /**
   * Set an id for the top-level element. The legend id derives from it as
   * `{id}-legend`, so the server and the browser render the same ids.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @type {HTMLDivElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { get, readonly, writable } from "svelte/store";
  import Stack from "../Stack/Stack.svelte";
  import { formReset } from "../utils/form-reset.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { normalizeSize, TAG_SIZE_ALIASES } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  const TAG_SELECTOR = "button.bx--tag--selectable";
  const fallbackId = uniqueId();
  $: legendId = `${id ?? fallbackId}-legend`;

  /**
   * `single` mode only ever treats the first entry as selected; the rest of
   * a longer `selected` passed in from a consumer is left untouched until
   * the next user interaction (see `toggle`). Takes its inputs as arguments
   * so a `$:` block that calls it still depends on them.
   * @type {(selected: ReadonlyArray<Value>, mode: "multiple" | "single") => ReadonlyArray<Value>}
   */
  const effectiveSelected = (selected, mode) =>
    mode === "single" ? selected.slice(0, 1) : selected;

  // Seeded here so the first render, on the server too, already shows the
  // selection before any `$:` block runs.
  /** @type {import("svelte/store").Writable<Set<Value>>} */
  const selectedValues = writable(
    new Set(effectiveSelected(selected, selectionMode)),
  );
  const groupDisabled = writable(disabled);
  /** @type {import("svelte/store").Writable<"xs" | "sm" | "default" | "lg" | undefined>} */
  const groupSize = writable(
    /** @type {"xs" | "sm" | "default" | "lg" | undefined} */ (
      normalizeSize(size, TAG_SIZE_ALIASES)
    ),
  );

  // A form reset restores this, the selection the group rendered with.
  // Hidden inputs keep their value through a reset, so the browser cannot.
  const defaultSelected = selected;

  function handleFormReset() {
    selected = defaultSelected;
  }

  $: selectedValues.set(new Set(effectiveSelected(selected, selectionMode)));
  $: groupDisabled.set(disabled);
  $: groupSize.set(
    /** @type {"xs" | "sm" | "default" | "lg" | undefined} */ (
      normalizeSize(size, TAG_SIZE_ALIASES)
    ),
  );

  /**
   * Called by a tag when it is clicked. Updates `selected` and dispatches
   * `change` before returning, so the dispatch stays inside the click.
   * Returns whether the tag is now selected, or `null` if nothing changed.
   * @type {(value: Value) => boolean | null}
   */
  function toggle(value) {
    if (disabled) return null;

    const current = effectiveSelected(selected, selectionMode);
    const isSelected = current.includes(value);

    if (isSelected && required) {
      if (selectionMode === "single") return null;
      if (current.length <= 1) return null;
    }

    /** @type {Value[]} */
    let next;
    if (selectionMode === "single") {
      next = isSelected ? [] : [value];
    } else if (isSelected) {
      next = current.filter((v) => v !== value);
    } else {
      next = [...current, value];
    }

    selected = Array.from(new Set(next));
    dispatch("change", selected);
    return !isSelected;
  }

  /**
   * The group's one tab stop. `null` until mount, while each tag uses the
   * choice from `claimInitialTabStop`.
   * @type {import("svelte/store").Writable<HTMLButtonElement | null>}
   */
  const tabStop = writable(null);

  /**
   * Tags that can take focus, in DOM order. A tag that is only
   * `aria-disabled` counts; a disabled group's tags do not.
   * @type {() => HTMLButtonElement[]}
   */
  const getTags = () =>
    /** @type {HTMLButtonElement[]} */ (
      Array.from(ref?.querySelectorAll(TAG_SELECTOR) ?? [])
    ).filter((tag) => !tag.disabled);

  /**
   * The default tab stop: the first selected, available tag, then the first
   * available tag, then the first tag that is only `aria-disabled`.
   * @type {() => HTMLButtonElement | null}
   */
  function findDefaultTabStop() {
    const tags = getTags();
    const available = tags.filter(
      (tag) => tag.getAttribute("aria-disabled") !== "true",
    );
    return (
      available.find((tag) => tag.getAttribute("aria-pressed") === "true") ??
      available[0] ??
      tags[0] ??
      null
    );
  }

  let initialTabStopClaimed = false;

  /**
   * Tags call this while initializing, in markup order, so the first render
   * (server or browser) has one `tabindex="0"` without reading the DOM.
   * @type {(value: Value, isDisabled: boolean) => boolean}
   */
  function claimInitialTabStop(value, isDisabled) {
    if (initialTabStopClaimed || isDisabled) return false;
    const current = effectiveSelected(selected, selectionMode);
    if (current.length > 0 && !current.includes(value)) return false;
    initialTabStopClaimed = true;
    return true;
  }

  /**
   * Moves the tab stop off a tag that left the DOM or became disabled. Runs
   * after the DOM update, so it reads the new `disabled` attributes. The
   * argument is ignored; a caller passes its state so its `$:` block reruns
   * when that state changes.
   * @type {(_state?: unknown) => void}
   */
  function refreshTabStop(_state) {
    tick().then(() => {
      if (!ref) return;
      const current = get(tabStop);
      if (current && ref.contains(current) && !current.disabled) return;
      tabStop.set(findDefaultTabStop());
    });
  }

  $: refreshTabStop(disabled);

  onMount(() => {
    refreshTabStop();
  });

  /** @param {FocusEvent} event */
  function handleFocusIn(event) {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.matches(TAG_SELECTOR)) {
      tabStop.set(target);
    }
  }

  setContext("carbon:SelectableTagGroup", {
    selectedValues: readonly(selectedValues),
    disabled: readonly(groupDisabled),
    size: readonly(groupSize),
    tabStop: readonly(tabStop),
    toggle,
    claimInitialTabStop,
    refreshTabStop,
  });
</script>

<div
  bind:this={ref}
  role="toolbar"
  {id}
  aria-labelledby={legendText ? legendId : undefined}
  aria-disabled={disabled ? "true" : undefined}
  use:rovingFocus={{
    selector: TAG_SELECTOR,
    getItems: getTags,
    rtl: () => resolveLayoutDirection($layoutDirection, ref) === "rtl",
    getActiveIndex: () => {
      const current = get(tabStop);
      const index = current ? getTags().indexOf(current) : -1;
      return index === -1 ? 0 : index;
    },
    onMove: (index, event) => {
      // Leave Alt/Ctrl/Meta+Arrow (Back, scroll) to the browser.
      if (hasModifierKey(event)) return;
      event.preventDefault();
      const tag = getTags()[index];
      if (!tag) return;
      tabStop.set(tag);
      tag.focus();
    },
  }}
  use:formReset={handleFormReset}
  on:focusin={handleFocusIn}
  {...$$restProps}
>
  {#if legendText}
    <span
      id={legendId}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLegend}
    >
      {legendText}
    </span>
  {/if}
  <Stack orientation="horizontal" align="center" wrap="wrap" {gap}>
    <slot />
  </Stack>
  {#if name}
    {#each effectiveSelected(selected, selectionMode) as value (value)}
      <input type="hidden" {name} value={String(value)} {disabled} />
    {/each}
  {/if}
</div>
