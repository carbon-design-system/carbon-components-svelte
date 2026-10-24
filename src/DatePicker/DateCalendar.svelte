<script>
  /**
   * @event {{ value: Date }} change
   * @slot {{ date: Date; selected: boolean; today: boolean; disabled: boolean; outside: boolean }} day
   */

  import { createEventDispatcher, tick } from "svelte";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import {
    compareDays,
    formatMonthYear,
    getCalendarLocale,
    isoWeek,
  } from "./calendar-dates.js";

  /**
   * The picked date.
   * @type {Date | null}
   */
  export let value = null;

  /**
   * The date the calendar treats as today. Set it when rendering on the
   * server, so the server and the browser agree.
   * @type {Date}
   */
  export let today = new Date();

  /**
   * Any day of the month on show. Defaults to the month of `value`, or
   * of `today`.
   * @type {Date}
   */
  export let month = value ?? today;

  /** @type {Date | null} */
  export let minDate = null;

  /** @type {Date | null} */
  export let maxDate = null;

  /**
   * Days that can't be picked, besides those outside `minDate` and
   * `maxDate`.
   * @type {(date: Date) => boolean}
   */
  export let isDateDisabled = () => false;

  /**
   * A language tag such as `"de"`, or a partial locale object.
   * @type {string | Partial<import("./calendar-dates.js").CalendarLocale>}
   */
  export let locale = "en";

  /**
   * First day of the week, 0 (Sunday) to 6 (Saturday). Defaults to the
   * locale's.
   * @type {number | undefined}
   */
  export let firstDayOfWeek = undefined;

  /** Set to `true` to show ISO week numbers. */
  export let weekNumbers = false;

  /** Accessible name of the calendar. */
  export let labelText = "Choose a date";

  /** Label of the previous month button. */
  export let previousLabelText = "Previous month";

  /** Label of the next month button. */
  export let nextLabelText = "Next month";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {HTMLElement | null} */
  let grid = null;

  /** The day that takes Tab focus in the grid. */
  let focusTarget = value ?? today;

  $: l10n = getCalendarLocale(locale);
  $: firstDay = firstDayOfWeek ?? l10n.firstDayOfWeek;
  $: year = month.getFullYear();
  $: monthIndex = month.getMonth();
  $: heading = formatMonthYear(month, locale, l10n.months.longhand);
  $: weekdayLabels = [
    ...l10n.weekdays.shorthand.slice(firstDay),
    ...l10n.weekdays.shorthand.slice(0, firstDay),
  ];
  $: weeks = buildWeeks(year, monthIndex, firstDay);
  // Everything a cell shows, worked out once per change so each cell
  // updates a handful of attributes.
  $: rows = weeks.map((week) =>
    week.map((date) => {
      const outside = date.getMonth() !== monthIndex;
      const selected = sameDay(date, value);
      const isToday = sameDay(date, today);
      const disabled = isDisabled(date);
      let className = "bx--date-picker__day";
      if (outside) className += " bx--date-picker__day--outside-month";
      if (selected) className += " bx--date-picker__day--selected";
      if (isToday) className += " bx--date-picker__day--today";
      if (disabled) className += " bx--date-picker__day--disabled";
      return {
        date,
        outside,
        selected,
        isToday,
        disabled,
        className,
        key: date.toDateString(),
        tabindex: sameDay(date, focusTarget) ? 0 : -1,
        label: `${l10n.weekdays.longhand[date.getDay()]}, ${l10n.months.longhand[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
      };
    }),
  );
  $: canGoBack = !minDate || compareMonth(year, monthIndex, minDate) > 0;
  $: canGoForward = !maxDate || compareMonth(year, monthIndex, maxDate) < 0;
  // Keep the Tab stop in the month on show.
  $: if (
    focusTarget.getFullYear() !== year ||
    focusTarget.getMonth() !== monthIndex
  ) {
    focusTarget = new Date(year, monthIndex, 1);
  }

  /**
   * Six rows of seven days, starting on `firstDay`.
   * @param {number} y
   * @param {number} m
   * @param {number} first
   */
  function buildWeeks(y, m, first) {
    const offset = (new Date(y, m, 1).getDay() - first + 7) % 7;
    return Array.from({ length: 6 }, (_, w) =>
      Array.from(
        { length: 7 },
        (_, d) => new Date(y, m, 1 - offset + w * 7 + d),
      ),
    );
  }

  /**
   * @param {number} y
   * @param {number} m
   * @param {Date} date
   */
  function compareMonth(y, m, date) {
    return y * 12 + m - (date.getFullYear() * 12 + date.getMonth());
  }

  /** @param {Date} date */
  function isDisabled(date) {
    return (
      (minDate != null && compareDays(date, minDate) < 0) ||
      (maxDate != null && compareDays(date, maxDate) > 0) ||
      isDateDisabled(date)
    );
  }

  /** @param {Date} a @param {Date | null} b */
  function sameDay(a, b) {
    return b != null && compareDays(a, b) === 0;
  }

  /** @param {number} delta */
  function showMonth(delta) {
    month = new Date(year, monthIndex + delta, 1);
  }

  /** @param {Date} date */
  function select(date) {
    if (isDisabled(date)) return;
    value = date;
    focusTarget = date;
    if (date.getMonth() !== monthIndex) month = date;
    dispatch("change", { value: date });
  }

  /** @param {Date} date */
  async function moveFocus(date) {
    focusTarget = date;
    if (date.getMonth() !== monthIndex || date.getFullYear() !== year) {
      month = date;
    }
    await tick();
    grid?.querySelector(`[data-date="${date.toDateString()}"]`)?.focus?.();
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const date = focusTarget;
    const day = (/** @type {number} */ n) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
    const weekday = (date.getDay() - firstDay + 7) % 7;
    // In RTL the next day sits to the left. Read when the key arrives.
    const next = () =>
      resolveLayoutDirection($layoutDirection, grid) === "rtl" ? -1 : 1;
    /** @type {Record<string, () => Date>} */
    const moves = {
      ArrowLeft: () => day(-next()),
      ArrowRight: () => day(next()),
      ArrowUp: () => day(-7),
      ArrowDown: () => day(7),
      Home: () => day(-weekday),
      End: () => day(6 - weekday),
      PageUp: () =>
        new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()),
      PageDown: () =>
        new Date(date.getFullYear(), date.getMonth() + 1, date.getDate()),
    };
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(date);
    } else if (moves[event.key]) {
      event.preventDefault();
      moveFocus(moves[event.key]());
    }
  }
</script>

<div
  class:bx--date-picker__calendar={true}
  class:bx--date-picker__calendar--inline={true}
  class:bx--date-picker__calendar--week-numbers={weekNumbers}
  role="group"
  aria-label={labelText}
  {...$$restProps}
>
  <div class:bx--date-picker__month-nav={true}>
    <button
      type="button"
      class:bx--date-picker__nav-button={true}
      class:bx--date-picker__nav-button--previous={true}
      class:bx--date-picker__nav-button--disabled={!canGoBack}
      aria-label={previousLabelText}
      aria-disabled={canGoBack ? undefined : "true"}
      on:click={() => canGoBack && showMonth(-1)}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <polygon points="5,8 10,3 10.7,3.7 6.4,8 10.7,12.3 10,13" />
      </svg>
    </button>
    <div class:bx--date-picker__month={true}>
      <div class:bx--date-picker__heading={true}>
        <span class:bx--date-picker__month-label={true}>{heading}</span>
      </div>
    </div>
    <button
      type="button"
      class:bx--date-picker__nav-button={true}
      class:bx--date-picker__nav-button--next={true}
      class:bx--date-picker__nav-button--disabled={!canGoForward}
      aria-label={nextLabelText}
      aria-disabled={canGoForward ? undefined : "true"}
      on:click={() => canGoForward && showMonth(1)}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <polygon points="11,8 6,13 5.3,12.3 9.6,8 5.3,3.7 6,3" />
      </svg>
    </button>
  </div>
  <div class:bx--date-picker__body={true}>
    {#if weekNumbers}
      <div class:bx--date-picker__week-numbers={true} aria-hidden="true">
        <span class:bx--date-picker__weekday={true}>
          {l10n.weekAbbreviation ?? "Wk"}
        </span>
        <div class:bx--date-picker__week-number-list={true}>
          {#each weeks as week, w (w)}
            <span class:bx--date-picker__week-number={true}>
              {isoWeek(week[6])}
            </span>
          {/each}
        </div>
      </div>
    {/if}
    <div class:bx--date-picker__main={true}>
      <div class:bx--date-picker__weekdays={true} aria-hidden="true">
        <div class:bx--date-picker__weekday-row={true}>
          {#each weekdayLabels as label, i (i)}
            <span class:bx--date-picker__weekday={true}>{label}</span>
          {/each}
        </div>
      </div>
      <div class:bx--date-picker__days={true}>
        <!-- Rows and cells are keyed by position, so a month change
             updates the same 42 nodes instead of replacing them. Focus is
             on the cells, which the grid's keydown moves between. -->
        <!-- svelte-ignore a11y-interactive-supports-focus -->
        <div
          bind:this={grid}
          class:bx--date-picker__month-days={true}
          role="grid"
          aria-label={heading}
          on:keydown={onKeydown}
        >
          {#each rows as row, w (w)}
            <div class:bx--date-picker__week={true} role="row">
              {#each row as cell, d (d)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <span
                  role="gridcell"
                  class={cell.className}
                  data-date={cell.key}
                  tabindex={cell.tabindex}
                  aria-selected={cell.selected ? "true" : undefined}
                  aria-disabled={cell.disabled ? "true" : undefined}
                  aria-current={cell.isToday ? "date" : undefined}
                  aria-label={cell.label}
                  on:click={() => select(cell.date)}
                >
                  <slot
                    name="day"
                    date={cell.date}
                    selected={cell.selected}
                    today={cell.isToday}
                    disabled={cell.disabled}
                    outside={cell.outside}
                    >{cell.date.getDate()}</slot
                  >
                </span>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
  <span class:bx--assistive-text={true} aria-live="polite">{heading}</span>
</div>
