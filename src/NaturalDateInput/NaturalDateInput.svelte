<script>
  /**
   * @typedef {"unreadable" | "required" | "time-required" | "time-not-allowed" | "before-min" | "after-max" | "calendar" | "calendar-label" | "previous-month" | "next-month" | "placeholder"} NaturalDateTextId
   */

  /**
   * Fires when the text is committed: on Enter, on blur, when a date is
   * picked in the calendar, and when the text is changed from outside, as
   * a form reset does. Not on every key.
   * @event change
   * @type {object}
   * @property {Date | string | null} value - The new `value`.
   * @property {Date | null} date - The instant, or `null` when the text is empty or not a date.
   * @property {string | null} iso - `"2026-11-14"` for a date, or the instant as an ISO string when it has a time.
   * @property {string} text
   * @property {boolean} hasTime
   * @property {boolean} valid - `false` when the text was not accepted, or is empty and required.
   * @property {"enter" | "blur" | "calendar" | "programmatic"} trigger
   */

  /**
   * @restProps {input}
   * @event {null} open
   * @event close
   * @type {object}
   * @property {"calendar" | "escape-key" | "outside-click" | "blur"} trigger
   * @slot {{}} labelChildren - Replace the label text.
   */

  /**
   * The date, as a `Date` or an ISO string (`"2026-11-14"`, or an instant
   * with a time). Set when the text is committed. Setting it from outside
   * rewrites the text. A date alone is the start of that day in `timeZone`.
   * @type {Date | string | number | null}
   * @bindable writable
   */
  export let value = null;

  /**
   * Set the type `value` is written as: a `Date`, or an ISO string. A date
   * with no time is `"2026-11-14"`, and a date with a time is the instant,
   * `"2026-11-14T20:00:00.000Z"`.
   * @type {"date" | "iso"}
   */
  export let valueType = "date";

  /**
   * The text in the field. Setting it commits it, as typing and leaving
   * the field does.
   * @bindable writable
   */
  export let text = "";

  /**
   * `true` when the committed date has a time. Written by the component.
   * @bindable readonly
   */
  export let hasTime = false;

  /**
   * The instant "today" and "in 2 hours" count from. Set it when rendering
   * on the server, so the server and the browser agree. Unset, it reads the
   * clock each time the text is read.
   * @type {Date | number | string | undefined}
   */
  export let now = undefined;

  /**
   * Set the language tag that sets the order of "3/12" (day first in
   * `"en-GB"` and `"de"`, month first in `"en-US"`), the names of months and
   * days, the first day of the week, the clock and the interpretation.
   * Defaults to `"en"`, not the browser's, so the server and the browser
   * agree.
   */
  export let locale = "en";

  /**
   * Set the IANA time zone the date is read and written in. Unset, it is
   * `"UTC"` until the component mounts and then the browser's. Set it on
   * the server as well as the browser.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /**
   * Set the first day of the week, 0 (Sunday) to 6, which "next Friday"
   * counts from. Defaults to the locale's.
   * @type {number | undefined}
   */
  export let weekStart = undefined;

  /**
   * Set which way a date with no year ("Dec 3"), a bare weekday ("Friday")
   * and a bare time ("9am") roll when they have passed: `"future"` for the
   * next one, `"past"` for the latest, `"nearest"` for the closest date.
   * @type {"future" | "past" | "nearest"}
   */
  export let prefer = "future";

  /**
   * Set whether a time can be typed. `"optional"` accepts a date or a date
   * and time, `"none"` rejects a time, and `"required"` rejects a date alone.
   * @type {"optional" | "none" | "required"}
   */
  export let time = "optional";

  /**
   * Set the time "eod" and "end of day" mean, as `"17:00"`.
   * @type {string | [number, number]}
   */
  export let eod = "17:00";

  /**
   * Set the first and last working day, 0 (Sunday) to 6, for "next week"
   * and "end of week".
   * @type {[first: number, last: number] | undefined}
   */
  export let workWeek = undefined;

  /**
   * Set the words of another language. The `NATURAL_DATE_EN` pack is the
   * model.
   * @type {import("./natural-date.js").NaturalDatePack | undefined}
   */
  export let pack = undefined;

  /**
   * Set the earliest date that is accepted.
   * @type {Date | string | number | null}
   */
  export let min = null;

  /**
   * Set the latest date that is accepted.
   * @type {Date | string | number | null}
   */
  export let max = null;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Specify the helper text. It shows while the field is empty or does not
   * read as a date; the interpretation takes its place.
   */
  export let helperText = "";

  /**
   * Specify the placeholder text. Defaults to examples of what to type.
   * @type {string | undefined}
   */
  export let placeholder = undefined;

  /**
   * Set the size of the field and the calendar button.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to disable the field and the calendar button */
  export let disabled = false;

  /** Set to `true` to make the field read-only */
  export let readonly = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /**
   * Set to `true` to indicate an invalid state, besides the text not being
   * a date.
   */
  export let invalid = false;

  /** Specify the invalid state text, shown while `invalid` is set */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute. A form submits the date under it, in the
   * form `value` has with `valueType="iso"`, as soon as the text reads as a
   * date; not the text.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /** Set to `false` to hide the calendar button */
  export let calendar = true;

  /**
   * Set to `true` to open the calendar. Closes when a date is picked.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set to `true` to keep what was typed after the date is accepted. By
   * default the field then shows the date ("Nov 14, 2026, 3:00 PM"), since
   * "next Fri" means another day tomorrow.
   */
  export let keepText = false;

  /**
   * Override the text of the messages and the calendar.
   * @type {(id: NaturalDateTextId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return TEXT[id];
  };

  /**
   * Write the other reading of a date such as "3/12", shown after the
   * interpretation.
   * @type {(alternative: string) => string}
   */
  export let ambiguousText = function ambiguousText(alternative) {
    return `or ${alternative}`;
  };

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import DateCalendar from "../DatePicker/DateCalendar.svelte";
  import InputGroup from "../InputGroup/InputGroup.svelte";
  import Popover from "../Popover/Popover.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import Calendar from "../icons/Calendar.svelte";
  import { debounce } from "../utils/debounce.js";
  import {
    joinDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    formatNaturalDate,
    naturalDateFromWall,
    naturalDateWall,
    parseNaturalDate,
  } from "./natural-date.js";

  /** @type {Record<NaturalDateTextId, string>} */
  const TEXT = {
    unreadable: "Couldn't read that as a date",
    required: "Enter a date",
    "time-required": "Add a time, such as 3pm",
    "time-not-allowed": "Use a date without a time",
    "before-min": "Choose a later date",
    "after-max": "Choose an earlier date",
    calendar: "Choose a date",
    "calendar-label": "Calendar",
    "previous-month": "Previous month",
    "next-month": "Next month",
    placeholder: "tomorrow, next Fri 3pm, Dec 3",
  };

  /** Quiet time (ms) before the interpretation is read out, so typing is not. */
  const ANNOUNCE_DELAY_MS = 800;

  /**
   * Isolates the interpretation from the page's direction, so a Latin date
   * keeps its order on an RTL page and an Arabic one on an LTR page.
   */
  const ISOLATE = [String.fromCodePoint(0x2068), String.fromCodePoint(0x2069)];

  const dispatch = createEventDispatcher();
  // Derived from the input's id, so an explicit id gives every id on the page.
  $: groupId = `${id}-group`;
  $: calendarId = `${id}-calendar`;

  /** @type {null | HTMLElement} */
  let wrapper = null;
  /** @type {null | HTMLButtonElement | HTMLAnchorElement} */
  let buttonRef = null;
  let mounted = false;

  // The user has typed since the text was last committed.
  let dirty = false;
  // The user is in the middle of typing: the text is not a date yet.
  let editing = false;
  // The user has left the field since they last typed.
  let touched = false;
  // The text last typed or written here, so a change to it is known to
  // come from somewhere else.
  let settled = text;
  // The time of the date last committed or given as `value`.
  let lastTime = Number.NaN;
  let status = "";

  /** @type {Date | null} */
  let calendarSelected = null;
  /** @type {Date} */
  let calendarToday = new Date();

  $: zone = timeZone ?? (mounted ? browserZone() : "UTC");
  $: parseOptions = {
    now,
    timeZone: zone,
    locale,
    weekStart,
    prefer,
    eod,
    workWeek,
    pack,
  };
  // Everything that decides what the text means.
  $: rules = { parseOptions, time, min, max, required, zone };

  // Declared after `parseOptions`, which both read.
  $: syncValue(value);
  $: readText(text);
  $: ({ result, problem } = evaluate(text, rules));
  $: accepted = result && result.ok && problem === null ? result : null;

  $: readback = accepted
    ? interpret(accepted, locale, zone, ambiguousText)
    : "";
  $: shownProblem = touched && problem !== null ? problem : null;
  $: invalidMessage = invalid
    ? invalidText
    : shownProblem
      ? translateWithId(shownProblem)
      : "";
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || shownProblem !== null,
    warn,
    disabled,
    readonly,
  }));
  // The interpretation sits where the helper text does, so it is the
  // description the field is read with. Until there is one, the helper text.
  $: shownHelper = readback || helperText;
  $: if (editing) announce(readback);
  $: formValue = accepted ? isoOf(accepted.date, accepted.hasTime, zone) : "";
  // Native validation holds back a form submit on text that is no date.
  $: ref?.setCustomValidity?.(
    problem !== null && problem !== "required" ? translateWithId(problem) : "",
  );

  // Read when the calendar opens, whoever opens it.
  $: if (open) syncCalendar();

  const announce = debounce((/** @type {string} */ message) => {
    status = message;
  }, ANNOUNCE_DELAY_MS);

  onMount(() => {
    mounted = true;
    // The browser's zone is known now: write a date that was given as
    // `value` in it.
    tick().then(() => {
      if (timeZone == null && !editing && !Number.isNaN(lastTime)) {
        write(fieldText(new Date(lastTime), hasTime));
      }
    });
    return announce.cancel;
  });

  function browserZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }

  /** @param {number} n */
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /**
   * @param {Date | string | number | null | undefined} source
   * @returns {number}
   */
  function toTime(source) {
    if (source == null || source === "") return Number.NaN;
    if (source instanceof Date) return source.getTime();
    if (typeof source === "number") return source;
    if (typeof source !== "string") return Number.NaN;
    // "2026-11-14" is a day in the zone, not UTC midnight.
    const read = parseNaturalDate(source, { ...parseOptions, now: undefined });
    return read.ok ? read.date.getTime() : Date.parse(source);
  }

  /** @param {number} at */
  function startOfDay(at) {
    const w = naturalDateWall(at, zone);
    return naturalDateFromWall({ ...w, hour: 0, minute: 0 }, zone).getTime();
  }

  /**
   * What the text means, and what is wrong with it.
   * @param {string} source
   * @param {typeof rules} r
   * @returns {{ result: import("./natural-date.js").NaturalDateParsed | import("./natural-date.js").NaturalDateFailed | null, problem: NaturalDateTextId | null }}
   */
  function evaluate(source, r) {
    if (source.trim() === "") {
      return { result: null, problem: r.required ? "required" : null };
    }
    const parsed = parseNaturalDate(source, r.parseOptions);
    if (!parsed.ok) return { result: parsed, problem: "unreadable" };
    if (r.time === "none" && parsed.hasTime) {
      return { result: parsed, problem: "time-not-allowed" };
    }
    if (r.time === "required" && !parsed.hasTime) {
      return { result: parsed, problem: "time-required" };
    }
    const at = parsed.date.getTime();
    const earliest = toTime(r.min);
    const latest = toTime(r.max);
    if (
      !Number.isNaN(earliest) &&
      at < (parsed.hasTime ? earliest : startOfDay(earliest))
    ) {
      return { result: parsed, problem: "before-min" };
    }
    if (!Number.isNaN(latest) && at > latest) {
      return { result: parsed, problem: "after-max" };
    }
    return { result: parsed, problem: null };
  }

  /**
   * @param {Date} date
   * @param {boolean} withTime
   * @param {string} timeZoneName
   */
  function isoOf(date, withTime, timeZoneName) {
    if (withTime) return date.toISOString();
    const w = naturalDateWall(date, timeZoneName);
    return `${w.year}-${pad(w.month)}-${pad(w.day)}`;
  }

  /**
   * The text a field shows for a date: the locale's own writing, when this
   * parser reads it back to the same date, and ISO text when not.
   * @param {Date} date
   * @param {boolean} withTime
   */
  function fieldText(date, withTime) {
    const short = formatNaturalDate(date, {
      locale,
      timeZone: zone,
      hasTime: withTime,
      style: "short",
    });
    const w = naturalDateWall(date, zone);
    const back = parseNaturalDate(short, { ...parseOptions, now: date });
    if (
      back.ok &&
      back.year === w.year &&
      back.month === w.month &&
      back.day === w.day &&
      (!withTime || (back.hour === w.hour && back.minute === w.minute))
    ) {
      return short;
    }
    const day = `${w.year}-${pad(w.month)}-${pad(w.day)}`;
    return withTime ? `${day} ${pad(w.hour)}:${pad(w.minute)}` : day;
  }

  /**
   * @param {import("./natural-date.js").NaturalDateParsed} parsed
   * @param {string} tag
   * @param {string} timeZoneName
   * @param {(alternative: string) => string} describeAlternative
   */
  function interpret(parsed, tag, timeZoneName, describeAlternative) {
    let line = formatNaturalDate(parsed.date, {
      locale: tag,
      timeZone: timeZoneName,
      hasTime: parsed.hasTime,
    });
    if (parsed.alternative) {
      const other = formatNaturalDate(parsed.alternative, {
        locale: tag,
        timeZone: timeZoneName,
        hasTime: parsed.hasTime,
        style: "short",
      });
      line = `${line} (${describeAlternative(other)})`;
    }
    return `${ISOLATE[0]}${line}${ISOLATE[1]}`;
  }

  /** @param {string} next */
  function write(next) {
    settled = next;
    text = next;
  }

  /**
   * A date came in as `value`.
   * @param {Date | string | number | null} source
   */
  function syncValue(source) {
    const at = toTime(source);
    if (Object.is(at, lastTime)) return;
    lastTime = at;
    if (Number.isNaN(at)) {
      hasTime = false;
      if (!editing) write("");
      return;
    }
    const date = new Date(at);
    const w = naturalDateWall(date, zone);
    hasTime =
      time !== "none" &&
      (typeof source === "string"
        ? source.includes(":")
        : w.hour !== 0 || w.minute !== 0);
    if (!editing) write(fieldText(date, hasTime));
  }

  /**
   * The text changed. Typing is known; any other change, a form reset or
   * the app setting `text`, is committed as typed text is on leaving.
   * @param {string} next
   */
  function readText(next) {
    if (next === settled) return;
    settled = next;
    if (editing) return;
    dirty = true;
    commit("programmatic");
  }

  /**
   * @param {"enter" | "blur" | "calendar" | "programmatic"} trigger
   */
  function commit(trigger) {
    if (trigger === "enter" || trigger === "blur") touched = true;
    if (!dirty) return;
    dirty = false;
    editing = false;
    announce.cancel();
    const evaluated = evaluate(text, rules);
    if (evaluated.problem === null && evaluated.result?.ok) {
      accept(
        evaluated.result.date,
        evaluated.result.hasTime,
        trigger,
        !keepText,
      );
    } else {
      lastTime = Number.NaN;
      hasTime = false;
      value = null;
      emit(trigger, null, false, evaluated.problem === null);
    }
  }

  /**
   * @param {Date} date
   * @param {boolean} withTime
   * @param {"enter" | "blur" | "calendar" | "programmatic"} trigger
   * @param {boolean} rewrite
   */
  function accept(date, withTime, trigger, rewrite) {
    lastTime = date.getTime();
    hasTime = withTime;
    value =
      valueType === "iso" ? isoOf(date, withTime, zone) : new Date(lastTime);
    if (rewrite) write(fieldText(date, withTime));
    emit(trigger, date, withTime, true);
  }

  /**
   * @param {"enter" | "blur" | "calendar" | "programmatic"} trigger
   * @param {Date | null} date
   * @param {boolean} withTime
   * @param {boolean} valid
   */
  function emit(trigger, date, withTime, valid) {
    dispatch("change", {
      value,
      date,
      iso: date ? isoOf(date, withTime, zone) : null,
      text,
      hasTime: withTime,
      valid,
      trigger,
    });
  }

  function handleInput() {
    dirty = true;
    editing = true;
    touched = false;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (isImeComposition(event)) return;
    if (event.key === "Enter") {
      commit("enter");
    } else if (event.key === "ArrowDown" && event.altKey && calendar) {
      event.preventDefault();
      openCalendar();
    }
  }

  // The calendar

  /** @param {Date | string | number | null} bound */
  function localDay(bound) {
    const at = toTime(bound);
    if (Number.isNaN(at)) return null;
    const w = naturalDateWall(at, zone);
    return new Date(w.year, w.month - 1, w.day);
  }

  // The calendar opens on the date in the field, or on today.
  function syncCalendar() {
    const current = result && result.ok ? result.date.getTime() : lastTime;
    calendarSelected = localDay(current);
    calendarToday = localDay(now ?? Date.now()) ?? new Date();
  }

  async function openCalendar() {
    if (disabled || readonly) return;
    open = true;
    dispatch("open", null);
    await tick();
    /** @type {HTMLElement | null | undefined} */ (
      wrapper?.querySelector('[role="gridcell"][tabindex="0"]')
    )?.focus();
  }

  /**
   * @param {"calendar" | "escape-key" | "outside-click" | "blur"} trigger
   * @param {boolean} [focusButton]
   */
  function closeCalendar(trigger, focusButton = false) {
    if (!open) return;
    open = false;
    dispatch("close", { trigger });
    if (focusButton) buttonRef?.focus();
  }

  function toggleCalendar() {
    if (open) closeCalendar("calendar");
    else openCalendar();
  }

  /** @param {CustomEvent<{ value: Date }>} event */
  function pick(event) {
    const day = event.detail.value;
    const live = evaluate(text, rules).result;
    const clock = live && live.ok && live.hasTime ? live : null;
    const date = naturalDateFromWall(
      {
        year: day.getFullYear(),
        month: day.getMonth() + 1,
        day: day.getDate(),
        hour: clock?.hour ?? 0,
        minute: clock?.minute ?? 0,
      },
      zone,
    );
    dirty = false;
    editing = false;
    touched = false;
    announce.cancel();
    accept(date, clock !== null, "calendar", true);
    closeCalendar("calendar", true);
  }

  /** @param {KeyboardEvent} event */
  function handleCalendarKeydown(event) {
    if (event.key === "Escape" && open && !isImeComposition(event)) {
      // The calendar closes; a Modal around the field stays open.
      event.stopPropagation();
      closeCalendar("escape-key", true);
    }
  }

  /** @param {FocusEvent} event */
  function handleCalendarFocusout(event) {
    const next = event.relatedTarget;
    if (open && next instanceof Node && !wrapper?.contains(next)) {
      closeCalendar("blur");
    }
  }
</script>

<!-- Capture phase: the text must be known as typed before the input's own
     listeners update it, since the browser can run Svelte's updates between two
     listeners of one event. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class:bx--natural-date={true} on:input|capture={handleInput}>
  <InputGroup
    {size}
    {disabled}
    id={groupId}
    helperText={shownHelper}
    invalid={showInvalid}
    invalidText={invalidMessage}
    warn={showWarn}
    {warnText}
    let:describedBy
    let:invalid={groupInvalid}
    let:warn={groupWarn}
  >
    <TextInput
      bind:ref
      bind:value={text}
      {id}
      placeholder={placeholder ?? translateWithId("placeholder")}
      {required}
      {readonly}
      {disabled}
      {hideLabel}
      {labelText}
      invalid={groupInvalid}
      warn={groupWarn}
      autocomplete="off"
      dir="auto"
      {...$$restProps}
      aria-describedby={joinDescribedBy(
        describedBy,
        $$restProps["aria-describedby"],
      )}
      on:input
      on:keydown={handleKeydown}
      on:keydown
      on:blur={() => commit("blur")}
      on:blur
      on:focus
      on:paste
    >
      <svelte:fragment slot="labelChildren"
        ><slot name="labelChildren">{labelText}</slot></svelte:fragment
      >
    </TextInput>
    {#if calendar}
      <!-- The popover opens from this wrapper, which Escape and focus
           leaving are read on. -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={wrapper}
        class:bx--natural-date__calendar={true}
        on:keydown={handleCalendarKeydown}
        on:focusout={handleCalendarFocusout}
      >
        <Button
          bind:ref={buttonRef}
          kind="tertiary"
          icon={Calendar}
          iconDescription={translateWithId("calendar")}
          disabled={disabled || readonly}
          aria-haspopup="dialog"
          aria-expanded={open ? "true" : "false"}
          aria-controls={open ? calendarId : undefined}
          on:click={toggleCalendar}
        />
        <Popover
          bind:open
          align="bottom-end"
          closeOnOutsideClick
          on:close={(event) => dispatch("close", event.detail)}
        >
          {#if open}
            <div
              id={calendarId}
              class:bx--natural-date__popover={true}
              role="dialog"
              aria-label={translateWithId("calendar")}
            >
              <DateCalendar
                value={calendarSelected}
                today={calendarToday}
                {locale}
                firstDayOfWeek={weekStart}
                minDate={localDay(min)}
                maxDate={localDay(max)}
                labelText={translateWithId("calendar-label")}
                previousLabelText={translateWithId("previous-month")}
                nextLabelText={translateWithId("next-month")}
                on:change={pick}
              />
            </div>
          {/if}
        </Popover>
      </div>
    {/if}
  </InputGroup>
  {#if name}
    <input type="hidden" {name} value={formValue} {disabled} />
  {/if}
  <div class:bx--visually-hidden={true} role="status">{status}</div>
</div>
