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
   * @type {"sm" | "default" | "lg" | "md" | undefined}
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

  import { createEventDispatcher, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";
  import Stack from "../Stack/Stack.svelte";
  import { normalizeSize, TAG_SIZE_ALIASES } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
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
  /** @type {import("svelte/store").Writable<"sm" | "default" | "lg" | undefined>} */
  const groupSize = writable(
    /** @type {"sm" | "default" | "lg" | undefined} */ (
      normalizeSize(size, TAG_SIZE_ALIASES)
    ),
  );

  $: selectedValues.set(new Set(effectiveSelected(selected, selectionMode)));
  $: groupDisabled.set(disabled);
  $: groupSize.set(
    /** @type {"sm" | "default" | "lg" | undefined} */ (
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

  setContext("carbon:SelectableTagGroup", {
    selectedValues: readonly(selectedValues),
    disabled: readonly(groupDisabled),
    size: readonly(groupSize),
    toggle,
  });
</script>

<div
  bind:this={ref}
  role="group"
  {id}
  aria-labelledby={legendText ? legendId : undefined}
  {...$$restProps}
>
  {#if legendText}
    <span
      id={legendId}
      class:bx--label={true}
      class:bx--visually-hidden={hideLegend}
    >
      {legendText}
    </span>
  {/if}
  <Stack orientation="horizontal" align="center" wrap="wrap" {gap}>
    <slot />
  </Stack>
</div>
