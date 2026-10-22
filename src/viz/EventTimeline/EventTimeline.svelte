<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /** @typedef {Date | number | string} TimeLike */

  /**
   * The event type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ id: string; row: string; kind: string; at: number; label: string; datum: T; index: number } | null} hover Fires when the pointer or focus enters a mark, and with `null` when it leaves.
   * @event {{ event: { id: string; row: string; kind: string; at: number; label: string; datum: T; index: number }; originalEvent: Event }} select Fires when a mark is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {figure} */

  /**
   * Specify the events, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read when an event happened: a `Date`, a timestamp, or
   * a date string.
   * @type {import("../utils/accessor.js").Accessor<T, TimeLike>}
   */
  export let at;

  /**
   * Specify how to read an event's kind, which sets its color and names it
   * in the legend. Every event is an `"Event"` without one.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let kind = undefined;

  /**
   * Specify how to read an event's label, shown when it is hovered.
   * @type {import("../utils/accessor.js").Accessor<T, string>}
   */
  export let label = undefined;

  /**
   * Specify how to read the row an event belongs to, for one lane per
   * service, environment, or the like. Everything shares one lane without it.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let row = undefined;

  /** Specify the title, shown as the table caption */
  export let title = "";

  /**
   * Specify the time range shown. Defaults to the first and last event.
   * @type {readonly [TimeLike, TimeLike]}
   */
  export let domain = undefined;

  /**
   * Specify a color per kind: a semantic name such as `"error"`, a
   * categorical index, a viz token name, or any CSS color. Kinds not named
   * take the categorical colors in first-seen order.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let kinds = {};

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

  /** Set to `true` to make events selectable */
  export let selectable = false;

  /**
   * Specify the selected event, as its `id`.
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
  import { buildTimeline } from "../StateTimeline/timeline-geometry.js";
  import { toAccessor } from "../utils/accessor.js";

  const dispatch = createEventDispatcher();
  const ONE_LANE = () => "Events";
  const ONE_KIND = () => "Event";

  let focusedIndex = 0;

  $: atOf = toAccessor(at);
  $: kindOf = kind === undefined ? ONE_KIND : toAccessor(kind);
  $: rowOf = row === undefined ? ONE_LANE : toAccessor(row);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  // An event is a span with no length. Depends on the data and the options
  // only, so hover never rebuilds it.
  $: timeline = buildTimeline(data, {
    row: rowOf,
    state: kindOf,
    start: atOf,
    end: atOf,
    domain,
    states: kinds,
    palette,
    locale,
    utc,
  });
  $: writeTime = getDateTimeFormatter(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(utc ? { timeZone: "UTC" } : {}),
  });
  $: detail = (
    /** @type {import("../StateTimeline/timeline-geometry.js").TimelineSegment<T>} */ mark,
  ) => ({
    id: mark.id,
    row: mark.row,
    kind: mark.state,
    at: mark.from,
    label: labelOf ? String(labelOf(mark.datum, mark.index) ?? "") : "",
    datum: mark.datum,
    index: mark.index,
  });
  $: describe = (
    /** @type {import("../StateTimeline/timeline-geometry.js").TimelineSegment<T>} */ mark,
  ) => {
    const text = labelOf ? labelOf(mark.datum, mark.index) : "";
    return [mark.state, text, writeTime.format(mark.from)]
      .filter(Boolean)
      .join(", ");
  };
  $: all = timeline.rows.flatMap((entry) => entry.segments);
  $: tabStopIndex = Math.min(focusedIndex, Math.max(all.length - 1, 0));

  /** @param {import("../StateTimeline/timeline-geometry.js").TimelineSegment<T> | null} mark */
  function emit(mark) {
    dispatch("hover", mark ? detail(mark) : null);
  }

  /**
   * @param {import("../StateTimeline/timeline-geometry.js").TimelineSegment<T>} mark
   * @param {Event} originalEvent
   */
  function select(mark, originalEvent) {
    selected = selected === mark.id ? null : mark.id;
    focusedIndex = all.indexOf(mark);
    dispatch("select", { event: detail(mark), originalEvent });
  }

  /**
   * Roving focus across the mark buttons, attached only while `selectable`,
   * so a static timeline adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingMarks(node, enabled) {
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
  class:bx--viz-timeline--events={true}
  class:bx--viz-timeline--sm={size === "sm"}
  class:bx--viz-timeline--lg={size === "lg"}
  class:bx--viz-timeline--selectable={selectable}
  {...$$restProps}
>
  <table class:bx--viz-timeline__table={true} use:rovingMarks={selectable}>
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
          <th scope="row" class:bx--viz-timeline__label={true}>
            {#if row !== undefined}
              {entry.key}
            {:else}
              <span class:bx--visually-hidden={true}>{entry.key}</span>
            {/if}
          </th>
          <td class:bx--viz-timeline__track-cell={true}>
            <div class:bx--viz-timeline__track={true}>
              {#each entry.segments as mark (mark.id)}
                {#if selectable}
                  <button
                    type="button"
                    class:bx--viz-timeline__event={true}
                    class:bx--viz-timeline__button={true}
                    class:bx--viz-timeline__event--selected={mark.id ===
                      selected}
                    tabindex={all.indexOf(mark) === tabStopIndex ? 0 : -1}
                    aria-pressed={mark.id === selected}
                    aria-label={describe(mark)}
                    title={describe(mark)}
                    style:--bx-viz-color={mark.color}
                    style:--bx-viz-start={mark.startPct}
                    on:click={(event) => select(mark, event)}
                    on:mouseenter={() => emit(mark)}
                    on:mouseleave={() => emit(null)}
                    on:focus={() => {
                      focusedIndex = all.indexOf(mark);
                      emit(mark);
                    }}
                    on:blur={() => emit(null)}
                  ></button>
                {:else}
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                  <span
                    class:bx--viz-timeline__event={true}
                    title={describe(mark)}
                    style:--bx-viz-color={mark.color}
                    style:--bx-viz-start={mark.startPct}
                    on:mouseenter={() => emit(mark)}
                    on:mouseleave={() => emit(null)}
                  >
                    <span class:bx--visually-hidden={true}>
                      {describe(mark)}
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
  {#if legend && kind !== undefined && timeline.states.length > 0}
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
