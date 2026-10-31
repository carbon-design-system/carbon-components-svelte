<script>
  /**
   * A grid of color swatches, used for the presets and the recent colors of
   * `ColorPicker`.
   * @typedef {string | { value: string; label?: string }} ColorSwatch
   * @event {{ value: string; color: import("../utils/color.js").Rgba }} select
   */

  /**
   * Specify the swatches: a CSS color, or an object with a `label` that
   * names it. A swatch that is not a color is skipped.
   * @type {ReadonlyArray<ColorSwatch>}
   */
  export let swatches = [];

  /**
   * Specify the color that is chosen. The swatch with the same color is
   * marked as selected.
   * @type {import("../utils/color.js").Rgba | null}
   */
  export let selected = null;

  /** Specify the number of swatches in a row */
  export let columns = 8;

  /** Specify the accessible name of the list */
  export let label = "";

  /**
   * Name a swatch that has no `label`.
   * @type {(color: import("../utils/color.js").Hsva) => string}
   */
  export let describe = describeColor;

  /** Set to `true` to disable the swatches */
  export let disabled = false;

  /**
   * Set to `true` to keep the swatches focusable while a click or Enter
   * chooses nothing.
   */
  export let readonly = false;

  import { createEventDispatcher } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import {
    describeColor,
    formatRgb,
    parseColor,
    readableOn,
    rgbaToHsva,
    sameColor,
  } from "../utils/color.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLDivElement} */
  let listRef = null;
  let focusIndex = -1;

  $: items = swatches.flatMap((swatch) => {
    const value = typeof swatch === "string" ? swatch : swatch.value;
    const color = parseColor(value);
    if (!color) return [];
    return [
      {
        value,
        color,
        css: formatRgb(color),
        mark: readableOn(color),
        name:
          (typeof swatch === "string" ? undefined : swatch.label) ||
          describe(rgbaToHsva(color)),
      },
    ];
  });
  $: selectedIndex = selected
    ? items.findIndex((item) => sameColor(item.color, selected))
    : -1;
  // One tab stop: the swatch focus last left, else the chosen one.
  $: stop =
    focusIndex >= 0
      ? Math.min(focusIndex, items.length - 1)
      : Math.max(selectedIndex, 0);

  /** @param {number} index */
  function focusItem(index) {
    const next = Math.min(items.length - 1, Math.max(0, index));
    focusIndex = next;
    /** @type {HTMLElement | undefined} */ (
      listRef?.querySelectorAll('[role="option"]')[next]
    )?.focus();
  }

  /**
   * @param {KeyboardEvent} event
   * @param {number} index
   */
  function handleKeydown(event, index) {
    if (hasModifierKey(event)) return;
    const key = inlineKey(event.key, $layoutDirection, listRef);
    const row = Math.max(1, columns);
    /** @type {Record<string, number>} */
    const targets = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + row <= items.length - 1 ? index + row : index,
      ArrowUp: index - row >= 0 ? index - row : index,
      Home: 0,
      End: items.length - 1,
    };
    if (!(key in targets)) return;
    event.preventDefault();
    focusItem(targets[key]);
  }

  /** @param {number} index */
  function choose(index) {
    focusIndex = index;
    if (readonly) return;
    dispatch("select", {
      value: items[index].value,
      color: items[index].color,
    });
  }
</script>

<!-- A listbox, not a radio group: a radio group checks the swatch the arrow
  keys reach, which would change the color once per swatch passed. -->
<div
  bind:this={listRef}
  role="listbox"
  aria-label={label}
  aria-disabled={disabled || undefined}
  aria-readonly={readonly || undefined}
  class:bx--color-picker__swatches={true}
  style:--ccs-color-picker-columns={columns}
>
  {#each items as item, index (index)}
    <button
      type="button"
      role="option"
      class:bx--color-picker__swatch={true}
      class:bx--color-picker__swatch--selected={index === selectedIndex}
      class:bx--color-picker__swatch--interactive={!disabled && !readonly}
      aria-selected={index === selectedIndex}
      aria-label={item.name}
      title={item.name}
      tabindex={index === stop ? 0 : -1}
      {disabled}
      on:click={() => choose(index)}
      on:focus={() => (focusIndex = index)}
      on:keydown={(event) => handleKeydown(event, index)}
    >
      <span
        class:bx--color-picker__swatch-face={true}
        style:background-color={item.css}
        style:color={item.mark}
      >
        {#if index === selectedIndex}
          <Checkmark size={16} />
        {/if}
      </span>
    </button>
  {/each}
</div>
