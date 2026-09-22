<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /**
   * @event {{ item: import("../utils/shares.js").ShareItem<Id>; items: ReadonlyArray<import("../utils/shares.js").ShareItem<Id>> | null; value: number; share: number; pct: number; index: number }} select Fires when a part is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {div} */

  /**
   * Specify the parts, in drawing order.
   * @type {ReadonlyArray<import("../utils/shares.js").ShareItem<Id>>}
   */
  export let data = [];

  /**
   * Specify the accessible name. Each part and its share is appended to it.
   * Leave empty to mark the chart as decorative.
   */
  export let label = "";

  /** Set to `false` to hide the legend under the grid */
  export let legend = true;

  /**
   * Specify what is written next to each legend label.
   * @type {"percent" | "value"}
   */
  export let valueType = "percent";

  /**
   * Specify how values are written when `valueType` is `"value"`:
   * `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Specify the number of rows */
  export let rows = 10;

  /** Specify the number of columns */
  export let columns = 10;

  /**
   * Specify the most parts to draw. Parts past the limit fold into one
   * trailing part, so sort by value first to fold the smallest.
   * @type {number}
   */
  export let maxSegments = undefined;

  /** Specify the label of the folded part */
  export let otherLabel = "Other";

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   * Applies to five parts or fewer.
   */
  export let palette = 1;

  /**
   * Specify the cell size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make each legend entry a toggle that highlights its part */
  export let selectable = false;

  /**
   * Specify the selected part id. The folded part has the id `"other"`.
   * @type {Id | undefined}
   */
  export let selectedId = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { getShares } from "../utils/shares.js";
  import { categoricalColors, vizColor } from "../utils/tokens.js";
  import { allocateCells, layoutCells } from "../utils/waffle.js";

  const dispatch = createEventDispatcher();

  let focusedIndex = 0;

  $: shares = getShares(data, { maxSegments, otherLabel });
  $: formatValue = resolveFormat(format, locale);
  $: parts = describe(shares.segments, palette, valueType, formatValue, locale);
  // Depends on the shares and the grid only, so selection never lays out.
  $: cells = layoutCells(
    allocateCells(
      shares.segments.map((segment) => segment.share),
      rows * columns,
    ),
    rows,
    columns,
  );
  $: name = [label, ...parts.map((part) => `${part.label} ${part.text}`)]
    .filter(Boolean)
    .join(", ");
  $: selectedIndex = selectable
    ? parts.findIndex((part) => part.id === selectedId)
    : -1;
  $: tabStopIndex = Math.min(focusedIndex, Math.max(parts.length - 1, 0));

  /**
   * @param {typeof shares.segments} segments
   * @param {number} option
   * @param {"percent" | "value"} type
   * @param {(value: number) => string} write
   * @param {string | undefined} lang
   */
  function describe(segments, option, type, write, lang) {
    const regular = segments.filter((segment) => segment.items === null);
    const colors = categoricalColors(regular.length, option);
    return segments.map((segment, i) => ({
      segment,
      id: segment.item.id,
      label: segment.item.label,
      text:
        type === "value"
          ? write(segment.value)
          : formatPercent(segment.share, { locale: lang, digits: 0 }),
      color:
        segment.items === null
          ? segment.item.color === undefined
            ? colors[i]
            : vizColor(segment.item.color)
          : "var(--cds-viz-neutral)",
    }));
  }

  /**
   * Roving focus across the legend toggles, attached only while
   * `selectable`, so a static chart adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingKeys(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-waffle__key",
          orientation: "both",
          focusOnMove: true,
          getActiveIndex: () => tabStopIndex,
          onMove: (index, event) => {
            event.preventDefault();
            focusedIndex = index;
          },
        });
      } else if (!on && roving) {
        roving.destroy();
        roving = undefined;
      }
    }
    sync(enabled);
    return { update: sync, destroy: () => sync(false) };
  }

  /** @param {(typeof parts)[number]} part */
  function select(part) {
    selectedId = selectedId === part.id ? undefined : part.id;
    focusedIndex = part.segment.index;
    dispatch("select", part.segment);
  }
</script>

<div
  bind:this={ref}
  class:bx--viz-waffle={true}
  class:bx--viz-waffle--sm={size === "sm"}
  class:bx--viz-waffle--lg={size === "lg"}
  class:bx--viz-waffle--has-selection={selectedIndex !== -1}
  role={selectable ? "group" : label ? "img" : undefined}
  aria-label={selectable ? label || undefined : label ? name : undefined}
  aria-hidden={selectable || label || legend ? undefined : "true"}
  {...$$restProps}
>
  <div
    class:bx--viz-waffle__grid={true}
    style:--bx-viz-columns={columns}
    aria-hidden="true"
  >
    {#each cells as part, i (i)}
      <span
        class:bx--viz-waffle__cell={true}
        class:bx--viz-waffle__cell--empty={part === -1}
        class:bx--viz-waffle__cell--selected={part === selectedIndex}
        style:--bx-viz-color={part === -1 ? undefined : parts[part].color}
      ></span>
    {/each}
  </div>
  {#if legend}
    <ul
      class:bx--viz-waffle__legend={true}
      aria-hidden={label && !selectable ? "true" : undefined}
      use:rovingKeys={selectable}
    >
      {#each parts as part, i (part.id)}
        <li
          class:bx--viz-waffle__item={true}
          class:bx--viz-waffle__item--selected={part.id === selectedId}
          style:--bx-viz-color={part.color}
        >
          {#if selectable}
            <button
              type="button"
              class:bx--viz-waffle__key={true}
              tabindex={i === tabStopIndex ? 0 : -1}
              aria-pressed={part.id === selectedId}
              on:click={() => select(part)}
              on:focus={() => (focusedIndex = i)}
            >
              <span class:bx--viz-waffle__swatch={true}></span>
              <span class:bx--viz-waffle__label={true}>{part.label}</span>
              <span class:bx--viz-waffle__value={true}>{part.text}</span>
            </button>
          {:else}
            <span class:bx--viz-waffle__swatch={true}></span>
            <span class:bx--viz-waffle__label={true}>{part.label}</span>
            <span class:bx--viz-waffle__value={true}>{part.text}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
