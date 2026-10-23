<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The combination type is written inline: a typedef cannot carry the
   * generic into the generated declarations.
   * @event {{ key: string; ids: string[]; size: number; share: number; rows: T[] } | null} hover Fires when the pointer or focus enters a combination, and with `null` when it leaves.
   * @event {{ combination: { key: string; ids: string[]; size: number; share: number; rows: T[] }; originalEvent: Event }} select Fires when a combination is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {figure} */

  /**
   * Specify the sets, in the order their columns appear.
   * @type {ReadonlyArray<{ id: string | number; label?: string }>}
   */
  export let sets = [];

  /**
   * Specify the rows, one per thing that belongs to sets.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the ids of the sets a row belongs to: a key of an
   * array field, or a function returning one.
   * @type {import("../utils/accessor.js").Accessor<T, ReadonlyArray<string | number>>}
   */
  export let membership;

  /** Specify the title, shown as the caption */
  export let title = "";

  /**
   * Specify the order of combinations: largest first, or fewest sets first.
   * @type {"size" | "degree"}
   */
  export let sort = "size";

  /** Set to `true` to list combinations no row falls in */
  export let showEmpty = false;

  /**
   * Specify the most combinations to list, after sorting.
   * @type {number}
   */
  export let maxCombinations = 12;

  /**
   * Specify what is written next to each bar.
   * @type {"value" | "percent"}
   */
  export let valueType = "value";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the bar color: a semantic name, a categorical index, a viz
   * token name, or any CSS color.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = "interactive";

  /** Set to `false` to hide the set totals under the matrix */
  export let totals = true;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make combinations selectable */
  export let selectable = false;

  /**
   * Specify the selected combination, as its key: the set ids joined
   * with `+`, in set order.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ combination?: string; size?: string; inSet?: string; notInSet?: string; only?: string; and?: string; total?: string }}
   */
  export let words = {};

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { toAccessor } from "../utils/accessor.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";
  import { upset } from "../utils/upset.js";

  const dispatch = createEventDispatcher();

  let focusedIndex = 0;

  $: membershipOf = toAccessor(membership);
  // Depends on the data and the options only, so hover never counts again.
  $: plot = upset(data, {
    sets,
    membership: membershipOf,
    sort,
    showEmpty,
    maxCombinations,
  });
  $: formatValue = resolveFormat(format, locale);
  $: text = {
    combination: "Combination",
    size: "Size",
    inSet: "in",
    notInSet: "not in",
    only: "only",
    and: "and",
    total: "Total",
    ...words,
  };
  $: write = (
    /** @type {import("../utils/upset.js").UpSetCombination<T>} */ entry,
  ) =>
    valueType === "percent"
      ? formatPercent(entry.share, { locale, digits: 0 })
      : formatValue(entry.size);
  $: name = (
    /** @type {import("../utils/upset.js").UpSetCombination<T>} */ entry,
  ) => {
    const labels = entry.ids.map(
      (id) => plot.sets.find((set) => set.id === id)?.label ?? id,
    );
    return labels.length === 1
      ? `${labels[0]} ${text.only}`
      : labels.join(` ${text.and} `);
  };
  $: inlineColor =
    color === "interactive"
      ? undefined
      : VIZ_SEMANTIC_COLORS.includes(color)
        ? `var(--cds-viz-${color})`
        : vizColor(color);
  $: tabStopIndex = Math.min(
    focusedIndex,
    Math.max(plot.combinations.length - 1, 0),
  );

  /** @param {import("../utils/upset.js").UpSetCombination<T>} entry */
  function detail(entry) {
    return {
      key: entry.key,
      ids: entry.ids,
      size: entry.size,
      share: entry.share,
      rows: entry.rows,
    };
  }

  /** @param {import("../utils/upset.js").UpSetCombination<T> | null} entry */
  function emit(entry) {
    dispatch("hover", entry ? detail(entry) : null);
  }

  /**
   * @param {import("../utils/upset.js").UpSetCombination<T>} entry
   * @param {Event} originalEvent
   */
  function select(entry, originalEvent) {
    selected = selected === entry.key ? null : entry.key;
    focusedIndex = plot.combinations.indexOf(entry);
    dispatch("select", { combination: detail(entry), originalEvent });
  }

  /**
   * Whether a dot sits between the first and last member of its row, so
   * the dots read as one connected combination.
   * @param {import("../utils/upset.js").UpSetCombination<T>} entry
   * @param {string} id
   */
  function linked(entry, id) {
    const order = plot.sets.map((set) => set.id);
    const at = order.indexOf(id);
    const first = order.indexOf(entry.ids[0]);
    const last = order.indexOf(entry.ids[entry.ids.length - 1]);
    return at > first && at < last;
  }

  /**
   * Roving focus across the row buttons, attached only while `selectable`,
   * so a static plot adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingRows(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-upset__button",
          orientation: "vertical",
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
</script>

<figure
  bind:this={ref}
  class:bx--viz-upset={true}
  class:bx--viz-upset--sm={size === "sm"}
  class:bx--viz-upset--lg={size === "lg"}
  class:bx--viz-upset--selectable={selectable}
  style:--bx-viz-color={inlineColor}
  {...$$restProps}
>
  <table class:bx--viz-upset__table={true} use:rovingRows={selectable}>
    {#if title}
      <caption class:bx--viz-chart__title={true}>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col" class:bx--visually-hidden={true}>{text.combination}</th>
        <th scope="col" class:bx--viz-upset__size-head={true}>{text.size}</th>
        {#each plot.sets as set (set.id)}
          <th scope="col" class:bx--viz-upset__set-head={true}>
            <span class:bx--viz-upset__set-label={true}>{set.label}</span>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each plot.combinations as entry, i (entry.key)}
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <tr
          class:bx--viz-upset__row={true}
          class:bx--viz-upset__row--selected={selectable &&
            entry.key === selected}
          on:mouseenter={() => emit(entry)}
          on:mouseleave={() => emit(null)}
        >
          <th scope="row" class:bx--viz-upset__label={true}>
            {#if selectable}
              <button
                type="button"
                class:bx--viz-upset__button={true}
                tabindex={i === tabStopIndex ? 0 : -1}
                aria-pressed={entry.key === selected}
                on:click={(event) => select(entry, event)}
                on:focus={() => {
                  focusedIndex = i;
                  emit(entry);
                }}
                on:blur={() => emit(null)}
              >
                {name(entry)}
              </button>
            {:else}
              {name(entry)}
            {/if}
          </th>
          <td class:bx--viz-upset__size={true}>
            <span class:bx--viz-upset__group={true}>
              <span class:bx--viz-upset__track={true} aria-hidden="true">
                <span
                  class:bx--viz-upset__bar={true}
                  style:--bx-viz-pct={entry.pct}
                ></span>
              </span>
              <span class:bx--viz-upset__value={true}>{write(entry)}</span>
            </span>
          </td>
          {#each plot.sets as set (set.id)}
            {@const member = entry.ids.includes(set.id)}
            <td
              class:bx--viz-upset__cell={true}
              class:bx--viz-upset__cell--member={member}
              class:bx--viz-upset__cell--linked={linked(entry, set.id)}
            >
              <span class:bx--viz-upset__dot={true} aria-hidden="true"></span>
              <span class:bx--visually-hidden={true}>
                {member ? text.inSet : text.notInSet}
                {set.label}
              </span>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
    {#if totals}
      <tfoot>
        <tr class:bx--viz-upset__totals={true}>
          <th scope="row" class:bx--viz-upset__label={true}>{text.total}</th>
          <td></td>
          {#each plot.sets as set (set.id)}
            <td class:bx--viz-upset__total={true}>
              <span class:bx--viz-upset__total-track={true} aria-hidden="true">
                <span
                  class:bx--viz-upset__total-bar={true}
                  style:--bx-viz-pct={set.pct}
                ></span>
              </span>
              <span class:bx--viz-upset__total-value={true}>
                {formatValue(set.total)}
              </span>
            </td>
          {/each}
        </tr>
      </tfoot>
    {/if}
  </table>
</figure>
