<script>
  /**
   * @event {{ value: string; rule: import("../utils/recurrence.js").RecurrenceRule | null }} change
   * @restProps {div}
   */

  /**
   * Specify the repeat rule as an RFC 5545 `RRULE` value, such as
   * `FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH`, without the `RRULE:` prefix.
   * An empty string is an event that does not repeat. A rule outside what
   * `parseRRule` supports is kept as given, and shown as read-only text
   * until the user chooses another frequency.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * The rule as an object, or `null` when the event does not repeat or the
   * rule is not supported.
   * @type {import("../utils/recurrence.js").RecurrenceRule | null}
   * @bindable readonly
   */
  export let rule = null;

  /**
   * Specify the start of the event. Its weekday is the default weekly day,
   * its date offers the monthly patterns and the yearly date, and it is the
   * first possible occurrence. Pass it from your data: without one the
   * picker anchors at 1 January 2000 and never reads the clock, so a server
   * and a browser render the same markup.
   * @type {Date | undefined}
   */
  export let startDate = undefined;

  /**
   * Specify the BCP 47 locale of weekday, month and date names, the number
   * format and the lists in the summary. The sentence shapes are English;
   * see `text` and `summaryText`.
   */
  export let locale = "en";

  /**
   * Specify the first day of the week, from `0` (Sunday) to `6`. Defaults to
   * the locale's own.
   * @type {0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let firstDayOfWeek = undefined;

  /**
   * Specify the frequencies to offer.
   * @type {ReadonlyArray<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">}
   */
  export let frequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

  /**
   * Specify how many upcoming dates to list under the summary. `0` hides
   * the list.
   */
  export let previewCount = 0;

  /**
   * Specify the date format of the end date field.
   * @type {string}
   */
  export let dateFormat = "m/d/Y";

  /**
   * Override any of the picker's strings, such as the labels and the monthly
   * pattern sentences. Unset keys keep their English default.
   * @type {Partial<import("./recurrence-text.js").RecurrencePickerText>}
   */
  export let text = {};

  /**
   * Override the sentence under the controls. Defaults to English, such as
   * "Every 2 weeks on Tuesday and Thursday, until Dec 31, 2026". `context`
   * carries `locale`, `startDate` and `format`, whose helpers write names,
   * dates and lists in the locale.
   * @type {(rule: import("../utils/recurrence.js").RecurrenceRule, context: import("./recurrence-text.js").RecurrenceSummaryContext) => string}
   */
  export let summaryText = defaultSummary;

  /** Specify the label of the group */
  export let labelText = "Repeat";

  /**
   * Set to `false` to show the group label. The frequency select has its own
   * label, so the group label is hidden visually by default and still names
   * the group for screen readers.
   */
  export let hideLabel = true;

  /** Set to `true` to disable the controls */
  export let disabled = false;

  /** Set an id for the picker */
  export let id = uniqueId();

  /**
   * Obtain a reference to the outer element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import DatePicker from "../DatePicker/DatePicker.svelte";
  import DatePickerInput from "../DatePicker/DatePickerInput.svelte";
  import { resolveWeekInfo } from "../DatePicker/week-info.js";
  import NumberInput from "../NumberInput/NumberInput.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import ToggleButton from "../ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "../ToggleButtonGroup/ToggleButtonGroup.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    calendarDayOf,
    formatRRule,
    monthlyChoices,
    occurrenceDays,
    parseRRule,
    WEEKDAYS,
  } from "../utils/recurrence.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    createFormat,
    DEFAULT_TEXT,
    defaultSummary,
  } from "./recurrence-text.js";

  /**
   * @typedef {import("../utils/recurrence.js").RecurrenceRule} RecurrenceRule
   * @typedef {import("../utils/recurrence.js").RecurrenceFrequency} RecurrenceFrequency
   */

  const FALLBACK_START = new Date(2000, 0, 1);
  const UNITS = /** @type {const} */ ({
    DAILY: "day",
    WEEKLY: "week",
    MONTHLY: "month",
    YEARLY: "year",
  });

  const dispatch = createEventDispatcher();

  /** @type {"" | RecurrenceFrequency} */
  let freq = "";
  let interval = /** @type {number | null} */ (1);
  /** @type {number[]} */
  let weekdays = [];
  let monthly = "day";
  /** The monthly pattern of a rule none of the start date's patterns match. */
  let monthlyOther = /** @type {Partial<RecurrenceRule> | null} */ (null);
  let ends = "never";
  let count = /** @type {number | null} */ (10);
  let until = /** @type {Date | null} */ (null);
  let unsupported = false;
  let lastValue = /** @type {string | undefined} */ (undefined);

  $: anchor = startDate ?? FALLBACK_START;
  $: day = calendarDayOf(anchor);
  $: strings = { ...DEFAULT_TEXT, ...text };
  $: format = createFormat(locale);
  /**
   * @param {0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined} first
   * @param {string} tag
   * @returns {0 | 1 | 2 | 3 | 4 | 5 | 6}
   */
  function resolveWeekStart(first, tag) {
    return (
      first ??
      /** @type {0 | 1 | 2 | 3 | 4 | 5 | 6} */ (resolveWeekInfo(tag).firstDay)
    );
  }
  $: weekStart = resolveWeekStart(firstDayOfWeek, locale);
  $: weekOrder = Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
  $: choices = monthlyChoices(day);

  // `syncFromValue` writes state from inside a function, so it runs before
  // every statement that reads that state.
  $: syncFromValue(value);

  /**
   * @param {Partial<RecurrenceRule>} pattern
   * @param {import("./recurrence-text.js").RecurrencePickerText} words
   * @param {import("./recurrence-text.js").RecurrenceFormat} names
   * @param {number} startDay
   */
  function monthlyLabel(pattern, words, names, startDay) {
    const first = pattern.byDay?.[0];
    if (first?.nth !== undefined) {
      return words.monthNth(first.nth, names.weekday(first.day));
    }
    const monthDay = pattern.byMonthDay?.[0];
    if (monthDay === -1) return words.monthLastDay;
    return words.monthDay(monthDay ?? startDay);
  }

  /** @type {Array<{ id: string; label: string }>} */
  $: monthlyOptions = [
    ...(monthlyOther
      ? [
          {
            id: "other",
            label: monthlyLabel(monthlyOther, strings, format, day.day),
          },
        ]
      : []),
    ...choices.map((choice) => ({
      id: choice.id,
      label: monthlyLabel(choice, strings, format, day.day),
    })),
  ];

  /** @param {Partial<RecurrenceRule>} pattern */
  function sameChoice(pattern) {
    return choices.find(
      (choice) =>
        JSON.stringify(choice.byMonthDay) ===
          JSON.stringify(pattern.byMonthDay) &&
        JSON.stringify(choice.byDay) === JSON.stringify(pattern.byDay),
    );
  }

  /**
   * Segments follow `value` when it changes from outside.
   * @param {string} next
   */
  function syncFromValue(next) {
    if (next === lastValue) return;
    lastValue = next;
    unsupported = false;
    monthlyOther = null;
    if (!next.trim()) {
      freq = "";
      rule = null;
      return;
    }
    const parsed = parseRRule(next);
    rule = parsed;
    if (!parsed) {
      unsupported = true;
      freq = "";
      return;
    }
    freq = parsed.freq;
    interval = parsed.interval;
    weekdays =
      parsed.freq === "WEEKLY"
        ? (parsed.byDay ?? []).map(({ day }) => WEEKDAYS.indexOf(day))
        : weekdays;
    if (parsed.freq === "WEEKLY" && weekdays.length === 0) {
      weekdays = [anchor.getDay()];
    }
    if (parsed.freq === "MONTHLY") {
      const match = sameChoice(parsed);
      if (match) monthly = match.id;
      else {
        monthly = "other";
        monthlyOther = { byDay: parsed.byDay, byMonthDay: parsed.byMonthDay };
      }
    }
    if (parsed.count !== undefined) ends = "count";
    else if (parsed.until) ends = "until";
    else ends = "never";
    count = parsed.count ?? count;
    until = parsed.until ?? until;
  }

  /** @returns {RecurrenceRule | null} */
  function buildRule() {
    if (!freq) return null;
    /** @type {RecurrenceRule} */
    const next = { freq, interval: Math.max(1, Math.floor(interval ?? 1)) };
    if (freq === "WEEKLY") {
      const days = weekdays.length ? weekdays : [anchor.getDay()];
      next.byDay = weekOrder
        .filter((weekday) => days.includes(weekday))
        .map((weekday) => ({ day: WEEKDAYS[weekday] }));
      // Which week a day falls in decides every second week, so say where
      // the week starts when it is not Monday, the RFC default.
      if (next.interval > 1 && weekStart !== 1) {
        next.weekStart = WEEKDAYS[weekStart];
      }
    }
    if (freq === "MONTHLY") {
      const pattern =
        monthly === "other" && monthlyOther
          ? monthlyOther
          : (choices.find((choice) => choice.id === monthly) ?? choices[0]);
      if (pattern.byDay) next.byDay = pattern.byDay;
      if (pattern.byMonthDay) next.byMonthDay = pattern.byMonthDay;
    }
    if (ends === "count" && count) next.count = Math.max(1, Math.floor(count));
    else if (ends === "until" && until) next.until = until;
    return next;
  }

  function commit() {
    const next = buildRule();
    rule = next;
    const formatted = next ? formatRRule(next) : "";
    lastValue = formatted;
    unsupported = false;
    if (formatted !== value) {
      value = formatted;
      dispatch("change", { value, rule });
    }
  }

  /** @param {string} next */
  function chooseFrequency(next) {
    const nextFreq = /** @type {"" | RecurrenceFrequency} */ (next);
    if (nextFreq === freq) return;
    freq = nextFreq;
    if (nextFreq === "WEEKLY") weekdays = [anchor.getDay()];
    if (nextFreq === "MONTHLY") {
      monthly = "day";
      monthlyOther = null;
    }
    commit();
  }

  /** @param {string} next */
  function chooseEnds(next) {
    ends = next;
    if (next === "until" && !until) {
      // A week of repeats gives the date field something to show.
      const last = occurrenceDays({ freq: freq || "DAILY", interval: 1 }, day, {
        limit: 1,
      })[0];
      until = new Date(last.year, last.month, last.day + 7);
    }
    commit();
  }

  /** @param {CustomEvent} event */
  function handleUntil(event) {
    const picked = event.detail?.selectedDates?.[0];
    if (picked instanceof Date) {
      until = new Date(
        picked.getFullYear(),
        picked.getMonth(),
        picked.getDate(),
      );
      commit();
    }
  }

  $: summary = rule
    ? summaryText(rule, { locale, startDate: anchor, format })
    : "";
  $: previewDays =
    rule && previewCount > 0
      ? occurrenceDays(rule, day, { limit: previewCount })
      : [];
  $: untilDates = until ? [until] : [];
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: unit = freq ? UNITS[freq] : "day";
  $: frequencyLabels = {
    DAILY: strings.daily,
    WEEKLY: strings.weekly,
    MONTHLY: strings.monthly,
    YEARLY: strings.yearly,
  };
  $: intervalId = `${id}-interval`;
</script>

<div
  bind:this={ref}
  {id}
  class:bx--form-item={true}
  class:bx--recurrence-picker={true}
  {...wrapperProps}
>
  <fieldset
    class:bx--recurrence-picker__fieldset={true}
    {disabled}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
  >
    <legend
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}>{labelText}</legend
    >
    <div class:bx--recurrence-picker__stack={true}>
      <Select
        id="{id}-frequency"
        labelText={strings.frequency}
        selected={freq}
        {disabled}
        on:update={(event) => chooseFrequency(String(event.detail))}
      >
        <SelectItem value="" text={strings.doesNotRepeat} />
        {#each frequencies as option (option)}
          <SelectItem value={option} text={frequencyLabels[option]} />
        {/each}
      </Select>

      {#if unsupported}
        <p class:bx--recurrence-picker__note={true}>
          {strings.custom}
        </p>
      {/if}

      {#if freq}
        <div class:bx--recurrence-picker__interval={true}>
          <NumberInput
            id={intervalId}
            labelText={strings.interval}
            min={1}
            max={99}
            {locale}
            {disabled}
            bind:value={interval}
            on:change={() => commit()}
          />
          <span class:bx--recurrence-picker__unit={true}
            >{format.unit(unit, interval ?? 1)}</span
          >
        </div>
      {/if}

      {#if freq === "WEEKLY"}
        <div class:bx--form-item={true}>
          <span class:bx--label={true} id="{id}-weekdays"
            >{strings.weekdays}</span
          >
          <ToggleButtonGroup
            aria-labelledby="{id}-weekdays"
            size="sm"
            required
            {disabled}
            bind:selected={weekdays}
            on:change={() => commit()}
          >
            {#each weekOrder as weekday (weekday)}
              <ToggleButton
                value={weekday}
                aria-label={format.weekday(WEEKDAYS[weekday])}
                >{format.weekday(WEEKDAYS[weekday], "short")}</ToggleButton
              >
            {/each}
          </ToggleButtonGroup>
        </div>
      {/if}

      {#if freq === "MONTHLY"}
        <Select
          id="{id}-monthly"
          labelText={strings.monthlyPattern}
          selected={monthly}
          {disabled}
          on:update={(event) => {
            if (String(event.detail) === monthly) return;
            monthly = String(event.detail);
            commit();
          }}
        >
          {#each monthlyOptions as option (option.id)}
            <SelectItem value={option.id} text={option.label} />
          {/each}
        </Select>
      {/if}

      {#if freq}
        <Select
          id="{id}-ends"
          labelText={strings.ends}
          selected={ends}
          {disabled}
          on:update={(event) => {
            if (String(event.detail) !== ends) chooseEnds(String(event.detail));
          }}
        >
          <SelectItem value="never" text={strings.never} />
          <SelectItem value="count" text={strings.afterCount} />
          <SelectItem value="until" text={strings.onDate} />
        </Select>

        {#if ends === "count"}
          <NumberInput
            id="{id}-count"
            labelText={strings.count}
            min={1}
            max={999}
            {locale}
            {disabled}
            bind:value={count}
            on:change={() => commit()}
          />
        {:else if ends === "until"}
          <DatePicker
            id="{id}-calendar"
            datePickerType="single"
            {dateFormat}
            {locale}
            firstDayOfWeek={weekStart}
            minDate={anchor}
            selectedDates={untilDates}
            on:change={handleUntil}
          >
            <DatePickerInput
              id="{id}-until"
              labelText={strings.until}
              {disabled}
              placeholder={dateFormat}
            />
          </DatePicker>
        {/if}
      {/if}

      {#if summary}
        <p class:bx--recurrence-picker__summary={true}>{summary}</p>
      {/if}

      {#if previewDays.length}
        <div>
          <p class:bx--label={true}>{strings.preview}</p>
          <ol class:bx--recurrence-picker__preview={true}>
            {#each previewDays as date (`${date.year}-${date.month}-${date.day}`)}
              <li>{format.fullDate(date.year, date.month, date.day)}</li>
            {/each}
          </ol>
        </div>
      {/if}
    </div>
  </fieldset>
</div>
