<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ day: import("../utils/calendar-grid.js").CalendarDay<T>; originalEvent: Event }} select Fires when a day is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows. Rows that fall on the same day are summed.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the date from a row: a key or a function.
   * A `Date`, a timestamp, or a date string, read in local time.
   * @type {import("../utils/accessor.js").Accessor<T, Date | number | string>}
   */
  export let date;

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value;

  /**
   * Specify the year to show. Defaults to the year of the latest date.
   * @type {number}
   */
  export let year = undefined;

  /** Specify the first day of the week, 0 for Sunday */
  export let weekStart = 0;

  /** Specify the title, shown as the table caption */
  export let title = "";

  /**
   * Specify the hue of the sequential ramp.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let hue = "blue";

  /**
   * Specify the values at the ends of the ramp.
   * Defaults to the extent of the day totals.
   * @type {readonly [number, number]}
   */
  export let domain = undefined;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Set to `true` to make days selectable */
  export let selectable = false;

  /**
   * Specify the selected day, as `YYYY-MM-DD`.
   * @type {string | null}
   */
  export let selected = null;

  /** Specify the text for a day with no data, read by assistive technology */
  export let noDataText = "No data";

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
  import { toAccessor } from "../utils/accessor.js";
  import { buildCalendarGrid } from "../utils/calendar-grid.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { heatColor } from "../utils/heat-grid.js";

  const dispatch = createEventDispatcher();
  const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

  /** Which day holds the tab stop while `selectable`. */
  let focused = "";

  $: dateOf = toAccessor(date);
  $: valueOf = toAccessor(value);
  $: grid = buildCalendarGrid(data, {
    date: dateOf,
    value: valueOf,
    year,
    weekStart,
  });
  $: range = /** @type {[number, number]} */ (
    domain ? [domain[0], domain[1]] : [grid.min, grid.max]
  );
  $: formatValue = resolveFormat(format, locale);
  $: monthName = getDateTimeFormatter(locale, { month: "short" });
  $: weekdayName = getDateTimeFormatter(locale, { weekday: "short" });
  $: dayName = getDateTimeFormatter(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  // 2023-01-01 was a Sunday, so day `1 + n` has weekday `n`.
  $: weekdayLabels = grid.weekdays.map((n) =>
    weekdayName.format(new Date(2023, 0, 1 + n)),
  );
  $: ramp = LEGEND_STEPS.map(
    (t) => heatColor(range[0] + (range[1] - range[0]) * t, range, hue).color,
  );
  $: tabStop = pickTabStop(grid, focused, selected);

  /**
   * @param {typeof grid} current
   * @param {string} at
   * @param {string | null} chosen
   */
  function pickTabStop(current, at, chosen) {
    const days = current.weeks.flatMap((week) => week.days);
    for (const iso of [at, chosen]) {
      if (iso && days.some((day) => day?.iso === iso)) return iso;
    }
    // The latest day with data, or else the first day of the year.
    let latest = "";
    for (const day of days) {
      if (day && day.value !== null) latest = day.iso;
    }
    return latest || (days.find((day) => day !== null)?.iso ?? "");
  }

  /**
   * @param {import("../utils/calendar-grid.js").CalendarDay<T>} day
   * @param {Event} originalEvent
   */
  function select(day, originalEvent) {
    selected = selected === day.iso ? null : day.iso;
    dispatch("select", { day, originalEvent });
  }

  /**
   * Left and Right move a week, Up and Down a day, as the grid is drawn.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const step = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    }[event.key];
    const target = event.target;
    if (!step || !ref || !(target instanceof HTMLElement)) return;
    const [w, d] = (target.dataset.day ?? "").split(":").map(Number);
    const next = grid.weeks[w + step[0]]?.days[d + step[1]];
    if (!next) return;
    event.preventDefault();
    focused = next.iso;
    /** @type {HTMLElement | null} */
    const node = ref.querySelector(`[data-day="${next.week}:${next.weekday}"]`);
    node?.focus();
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-calendar={true}
  class:bx--viz-calendar--selectable={selectable}
  {...$$restProps}
>
  <div class:bx--viz-calendar__scroll={true}>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <table
      class:bx--viz-calendar__table={true}
      on:keydown={selectable ? onKeydown : undefined}
    >
      {#if title}
        <caption class:bx--viz-chart__title={true}>
          {title}
        </caption>
      {/if}
      <thead>
        <tr>
          <td></td>
          {#each grid.months as month (month.month)}
            <th
              scope="colgroup"
              colspan={month.span}
              class:bx--viz-calendar__month={true}
            >
              {monthName.format(new Date(grid.year, month.month, 1))}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each weekdayLabels as weekday, d (d)}
          <tr>
            <th scope="row" class:bx--viz-calendar__weekday={true}>
              <!-- Every other label is drawn, as rows are shorter than text. -->
              <span class:bx--visually-hidden={d % 2 === 0}>{weekday}</span>
            </th>
            {#each grid.weeks as week (week.index)}
              {@const day = week.days[d]}
              {#if day}
                {@const text = `${dayName.format(day.date)}: ${
                  day.value === null ? noDataText : formatValue(day.value)
                }`}
                <td
                  class:bx--viz-calendar__day={true}
                  class:bx--viz-calendar__day--empty={day.value === null}
                  class:bx--viz-calendar__day--selected={selectable &&
                    day.iso === selected}
                  style:--bx-viz-color={day.value === null
                    ? undefined
                    : heatColor(day.value, range, hue).color}
                  title={selectable ? undefined : text}
                >
                  {#if selectable}
                    <button
                      type="button"
                      class:bx--viz-calendar__button={true}
                      data-day="{day.week}:{day.weekday}"
                      tabindex={day.iso === tabStop ? 0 : -1}
                      aria-pressed={day.iso === selected}
                      title={text}
                      on:click={(event) => select(day, event)}
                      on:focus={() => (focused = day.iso)}
                    >
                      <span class:bx--visually-hidden={true}>{text}</span>
                    </button>
                  {:else}
                    <span class:bx--visually-hidden={true}>{text}</span>
                  {/if}
                </td>
              {:else}
                <td class:bx--viz-calendar__pad={true}></td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if legend}
    <div class:bx--viz-heatmap__legend={true} aria-hidden="true">
      <span>{formatValue(range[0])}</span>
      <span class:bx--viz-heatmap__ramp={true}>
        {#each ramp as color, i (i)}
          <span style:--bx-viz-color={color}></span>
        {/each}
      </span>
      <span>{formatValue(range[1])}</span>
    </div>
  {/if}
</figure>
