<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /**
   * @event {{ item: import("../utils/shares.js").ShareItem<Id>; items: ReadonlyArray<import("../utils/shares.js").ShareItem<Id>> | null; value: number; share: number; pct: number; index: number }} select Fires when a segment is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {div} */

  /**
   * Specify the parts, in drawing order.
   * @type {ReadonlyArray<import("../utils/shares.js").ShareItem<Id>>}
   */
  export let data = [];

  /**
   * Specify the accessible name. Each part and its share is appended to it.
   * Leave empty to mark the bar as decorative.
   */
  export let label = "";

  /**
   * Specify where the part labels go.
   * @type {"none" | "below"}
   */
  export let labels = "none";

  /**
   * Specify what is written next to each label.
   * @type {"percent" | "value"}
   */
  export let valueType = "percent";

  /**
   * Specify how values are written when `valueType` is `"value"`:
   * `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the most segments to draw. Parts past the limit fold into one
   * trailing segment, so sort by value first to fold the smallest.
   * @type {number}
   */
  export let maxSegments = undefined;

  /** Specify the label of the folded segment */
  export let otherLabel = "Other";

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   * Applies to five parts or fewer.
   */
  export let palette = 1;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make segments selectable */
  export let selectable = false;

  /**
   * Specify the selected part id. The folded segment has the id `"other"`.
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

  const dispatch = createEventDispatcher();

  let focusedIndex = 0;

  $: shares = getShares(data, { maxSegments, otherLabel });
  $: formatValue = resolveFormat(format, locale);
  $: parts = describe(shares.segments, palette, valueType, formatValue, locale);
  $: name = [label, ...parts.map((part) => `${part.label} ${part.text}`)]
    .filter(Boolean)
    .join(", ");
  $: hasSelection = selectable && parts.some((part) => part.id === selectedId);
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
   * Roving focus across the segment buttons, attached only while
   * `selectable`, so a static bar adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingSegments(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-stacked-bar__segment",
          orientation: "horizontal",
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
  class:bx--viz-stacked-bar={true}
  class:bx--viz-stacked-bar--sm={size === "sm"}
  class:bx--viz-stacked-bar--lg={size === "lg"}
  class:bx--viz-stacked-bar--selectable={selectable}
  class:bx--viz-stacked-bar--has-selection={hasSelection}
  role={selectable ? "group" : label ? "img" : undefined}
  aria-label={selectable ? label || undefined : label ? name : undefined}
  aria-hidden={selectable || label || labels === "below" ? undefined : "true"}
  {...$$restProps}
>
  <div
    class:bx--viz-stacked-bar__track={true}
    aria-hidden={selectable || label ? undefined : "true"}
    use:rovingSegments={selectable}
  >
    {#each parts as part, i (part.id)}
      {#if selectable}
        <button
          type="button"
          class:bx--viz-stacked-bar__segment={true}
          class:bx--viz-stacked-bar__segment--selected={part.id === selectedId}
          class:bx--viz-stacked-bar__segment--empty={part.segment.value === 0}
          tabindex={i === tabStopIndex ? 0 : -1}
          aria-pressed={part.id === selectedId}
          aria-label="{part.label} {part.text}"
          style:--bx-viz-pct={part.segment.pct}
          style:--bx-viz-color={part.color}
          on:click={() => select(part)}
          on:focus={() => (focusedIndex = i)}
        ></button>
      {:else}
        <span
          class:bx--viz-stacked-bar__segment={true}
          class:bx--viz-stacked-bar__segment--empty={part.segment.value === 0}
          style:--bx-viz-pct={part.segment.pct}
          style:--bx-viz-color={part.color}
        ></span>
      {/if}
    {/each}
  </div>
  {#if labels === "below"}
    <ul
      class:bx--viz-stacked-bar__legend={true}
      aria-hidden={selectable ? "true" : undefined}
    >
      {#each parts as part (part.id)}
        <li
          class:bx--viz-stacked-bar__item={true}
          class:bx--viz-stacked-bar__item--selected={selectable &&
            part.id === selectedId}
          style:--bx-viz-color={part.color}
        >
          <span class:bx--viz-stacked-bar__swatch={true}></span>
          <span class:bx--viz-stacked-bar__label={true}>{part.label}</span>
          <span class:bx--viz-stacked-bar__value={true}>{part.text}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
