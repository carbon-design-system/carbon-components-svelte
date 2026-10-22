<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /** @typedef {Date | number | string} TimeLike */

  /**
   * The segment type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ id: string; row: string; state: string; from: number; to: number; duration: number; datum: T; index: number } | null} hover Fires when the pointer or focus enters a span, and with `null` when it leaves.
   * @event {{ segment: { id: string; row: string; state: string; from: number; to: number; duration: number; datum: T; index: number }; originalEvent: Event }} select Fires when a span is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {figure} */

  /**
   * Specify the spans: one row for each stretch of time in one state.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the row a span belongs to: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let row;

  /**
   * Specify how to read a span's state: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let state;

  /**
   * Specify how to read when a span starts: a `Date`, a timestamp, or a
   * date string.
   * @type {import("../utils/accessor.js").Accessor<T, TimeLike>}
   */
  export let start;

  /**
   * Specify how to read when a span ends.
   * @type {import("../utils/accessor.js").Accessor<T, TimeLike>}
   */
  export let end;

  /** Specify the title, shown as the table caption */
  export let title = "";

  /**
   * Specify the time range shown. Defaults to the earliest start and the
   * latest end.
   * @type {readonly [TimeLike, TimeLike]}
   */
  export let domain = undefined;

  /**
   * Specify a color per state: a semantic name such as `"success"`, a
   * categorical index, a viz token name, or any CSS color. States not named
   * take the categorical colors in first-seen order.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let states = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify the size of a row.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Set to `true` to make spans selectable */
  export let selectable = false;

  /**
   * Specify the selected span, as its `id`.
   * @type {string | null}
   */
  export let selected = null;

  /** Set to `true` to place ticks on UTC boundaries */
  export let utc = false;

  /** Specify the header of the row column for assistive technology */
  export let rowHeader = "Row";

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
  import { getDateTimeFormatter } from "../../utils/intl-formatter-cache.js";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { toAccessor } from "../utils/accessor.js";
  import { formatDuration } from "../utils/format-compact.js";
  import { buildTimeline } from "./timeline-geometry.js";

  const dispatch = createEventDispatcher();

  let focusedIndex = 0;

  $: rowOf = toAccessor(row);
  $: stateOf = toAccessor(state);
  $: startOf = toAccessor(start);
  $: endOf = toAccessor(end);
  // Depends on the data and the options only, so hover never rebuilds it.
  $: timeline = buildTimeline(data, {
    row: rowOf,
    state: stateOf,
    start: startOf,
    end: endOf,
    domain,
    states,
    palette,
    locale,
    utc,
  });
  $: writeTime = getDateTimeFormatter(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(utc ? { timeZone: "UTC" } : {}),
  });
  $: describe = (
    /** @type {import("./timeline-geometry.js").TimelineSegment<T>} */ segment,
  ) =>
    `${segment.state}, ${writeTime.format(segment.from)} to ${writeTime.format(segment.to)}, ${formatDuration(segment.duration, { locale })}`;
  $: all = timeline.rows.flatMap((entry) => entry.segments);
  $: tabStopIndex = Math.min(focusedIndex, Math.max(all.length - 1, 0));

  /** @param {import("./timeline-geometry.js").TimelineSegment<T> | null} segment */
  function emit(segment) {
    dispatch(
      "hover",
      segment
        ? {
            id: segment.id,
            row: segment.row,
            state: segment.state,
            from: segment.from,
            to: segment.to,
            duration: segment.duration,
            datum: segment.datum,
            index: segment.index,
          }
        : null,
    );
  }

  /**
   * @param {import("./timeline-geometry.js").TimelineSegment<T>} segment
   * @param {Event} originalEvent
   */
  function select(segment, originalEvent) {
    selected = selected === segment.id ? null : segment.id;
    focusedIndex = all.indexOf(segment);
    dispatch("select", {
      segment: {
        id: segment.id,
        row: segment.row,
        state: segment.state,
        from: segment.from,
        to: segment.to,
        duration: segment.duration,
        datum: segment.datum,
        index: segment.index,
      },
      originalEvent,
    });
  }

  /**
   * Roving focus across the span buttons, attached only while `selectable`,
   * so a static timeline adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingSpans(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-timeline__button",
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
</script>

<figure
  bind:this={ref}
  class:bx--viz-timeline={true}
  class:bx--viz-timeline--sm={size === "sm"}
  class:bx--viz-timeline--lg={size === "lg"}
  class:bx--viz-timeline--selectable={selectable}
  {...$$restProps}
>
  <table class:bx--viz-timeline__table={true} use:rovingSpans={selectable}>
    {#if title}
      <caption class:bx--viz-chart__title={true}>
        {title}
      </caption>
    {/if}
    <thead class:bx--visually-hidden={true}>
      <tr>
        <th scope="col">{rowHeader}</th>
        <th scope="col">{writeTime.format(timeline.domain[0])}</th>
      </tr>
    </thead>
    <tbody>
      {#each timeline.rows as entry (entry.key)}
        <tr>
          <th scope="row" class:bx--viz-timeline__label={true}>{entry.key}</th>
          <td class:bx--viz-timeline__track-cell={true}>
            <div class:bx--viz-timeline__track={true}>
              {#each entry.segments as segment (segment.id)}
                {#if selectable}
                  <button
                    type="button"
                    class:bx--viz-timeline__segment={true}
                    class:bx--viz-timeline__button={true}
                    class:bx--viz-timeline__segment--selected={segment.id ===
                      selected}
                    tabindex={all.indexOf(segment) === tabStopIndex ? 0 : -1}
                    aria-pressed={segment.id === selected}
                    aria-label={describe(segment)}
                    title={describe(segment)}
                    style:--bx-viz-color={segment.color}
                    style:--bx-viz-start={segment.startPct}
                    style:--bx-viz-pct={segment.widthPct}
                    on:click={(event) => select(segment, event)}
                    on:mouseenter={() => emit(segment)}
                    on:mouseleave={() => emit(null)}
                    on:focus={() => {
                      focusedIndex = all.indexOf(segment);
                      emit(segment);
                    }}
                    on:blur={() => emit(null)}
                  ></button>
                {:else}
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                  <span
                    class:bx--viz-timeline__segment={true}
                    title={describe(segment)}
                    style:--bx-viz-color={segment.color}
                    style:--bx-viz-start={segment.startPct}
                    style:--bx-viz-pct={segment.widthPct}
                    on:mouseenter={() => emit(segment)}
                    on:mouseleave={() => emit(null)}
                  >
                    <span class:bx--visually-hidden={true}>
                      {describe(segment)}
                    </span>
                  </span>
                {/if}
              {/each}
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
    <tfoot aria-hidden="true">
      <tr>
        <td></td>
        <td class:bx--viz-timeline__axis-cell={true}>
          <div class:bx--viz-timeline__axis={true}>
            {#each timeline.ticks as tick (tick.value)}
              <span
                class:bx--viz-timeline__tick={true}
                style:--bx-viz-start={tick.pct}
              >
                {tick.label}
              </span>
            {/each}
          </div>
        </td>
      </tr>
    </tfoot>
  </table>
  {#if legend && timeline.states.length > 0}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each timeline.states as entry (entry.key)}
        <li
          class:bx--viz-treemap__legend-item={true}
          style:--bx-viz-color={entry.color}
        >
          <span class:bx--viz-treemap__swatch={true}></span>
          {entry.key}
        </li>
      {/each}
    </ul>
  {/if}
</figure>
