---
components: ["NaturalDateInput"]
description: Natural date inputs take a date, and optionally a time, as people say it, such as "next Fri 3pm" or "in 2 weeks", read it back as a full date, and open a calendar as a fallback.
keywords: ["quick add", "date parser", "due date", "relative date"]
---

<script>
  import { Box, NaturalDateInput, Stack } from "carbon-components-svelte";
</script>

## Basic

Type a date as you would say it. The line under the field reads it back in full, so a wrong reading shows before you commit it. <DocKbd label="Enter" /> or leaving the field commits the date, and the field then shows the date itself, since "next Fri" means another day tomorrow. Press <DocKbd label="Alt" />+<DocKbd label="↓" /> in the field, or use the calendar button, to pick from a calendar.

<FileSource src="/framed/NaturalDateInput/TaskDueDate" />

## What it reads

The parser is small and has no dependencies. It reads these, in English, and anything else is "Couldn't read that as a date".

| Type | Examples |
| --- | --- |
| Days | `today`, `tomorrow`, `yesterday`, `tmrw` |
| Weekdays | `friday`, `this friday`, `next friday`, `last friday` |
| Amounts | `in 2 weeks`, `in an hour`, `3 days ago`, `2 weeks from now`, `in 90 minutes` |
| Weeks, months and years | `next week`, `this month`, `last year`, `end of week`, `end of next month`, `eow`, `eom`, `eoy` |
| Months | `Dec 3`, `3 Dec`, `3rd of December`, `Dec 3, 2027` |
| Numbers | `3/12`, `3/12/27`, `2026-12-03`, `12.3.2026` |
| Days of the month | `15th`, `the 1st` |
| Times | `3pm`, `3:30 pm`, `15:00`, `noon`, `midnight`, `at 3`, `eod`, `end of day` |

A date and a time go together in either order: `next Fri 3pm`, `3pm tomorrow`, `eod friday`. Month and weekday names come from the browser, so `3 déc` and `Mittwoch` work when `locale` is `"fr"` or `"de"`.

It does not read other languages' words for "tomorrow" or "next", ordinals in words ("the third"), "half past three", a time zone in the text, ranges, or recurring dates ("every Monday"). Another language's words fit in through a [pack](#language-packs).

## Ambiguity

Some text has more than one reading. Each choice is the same everywhere, and the readback shows the result.

| Text | Reading | Why |
| --- | --- | --- |
| `friday`, on a Friday | Next week's | A weekday alone is the next one after today. Type `today`, or `this friday`, for today |
| `this friday` | The next Friday, today if it is one | "This" counts today |
| `next friday` | Friday of next week | The week starts on `weekStart`, the locale's by default. On a Sunday with a Monday start, `next monday` is tomorrow |
| `last friday` | The latest one before today | |
| `next week` | The first working day of next week | `workWeek` sets it, Monday to Friday by default |
| `3/12` | The locale's order | Month first for `"en-US"`, day first for `"en-GB"` and `"de"`. The other reading shows beside it |
| `25/12` in the US | December 25 | The locale's order is not a date, so the other is read |
| `Dec 3` | The next December 3 | Set `prefer` to change it |
| `9am`, at noon | Tomorrow at 9am | A time that has passed is the next time it is that time |
| `at 3`, `2:30` | 3pm, 2:30pm | A 12-hour locale reads 1 to 6 as the afternoon. `02:30` and 24-hour locales read it as written |
| `eod` | Today at `eod`, 17:00 | Even when it is past 17:00 |

### Order of day and month

The text `3/12/2027` below is the same in every field. The locale decides the reading, and the other reading shows in brackets.

<Stack gap={6}>
  <NaturalDateInput labelText="en-US" locale="en-US" text="3/12/2027" now="2026-11-06T12:00:00Z" timeZone="UTC" />
  <NaturalDateInput labelText="en-GB" locale="en-GB" text="3/12/2027" now="2026-11-06T12:00:00Z" timeZone="UTC" />
  <NaturalDateInput labelText="de" locale="de" text="3/12/2027" now="2026-11-06T12:00:00Z" timeZone="UTC" />
</Stack>

### Past and future

Set `prefer` to `"future"` (the default) for a due date. A date with no year, a bare weekday and a bare time then roll to the next one. Set it to `"past"` for a date that has already happened, such as a birthday or an expense, and to `"nearest"` to pick the closest date for a date with no year.

<Stack gap={6}>
  <NaturalDateInput labelText="Due date" prefer="future" text="Dec 3" now="2026-11-06T12:00:00Z" timeZone="UTC" />
  <NaturalDateInput labelText="Date of expense" prefer="past" text="Dec 3" now="2026-11-06T12:00:00Z" timeZone="UTC" />
</Stack>

## Time

Set `time` to say whether a time can be typed. A reading with a time sets `hasTime`.

### Optional

The default is `"optional"`: `tomorrow` is a day, and `tomorrow 3pm` is a moment.

<NaturalDateInput labelText="Due" text="tomorrow 3pm" now="2026-11-06T12:00:00Z" timeZone="UTC" />

### Required

Set `time` to `"required"` for a reminder, where a day alone is not enough.

<FileSource src="/framed/NaturalDateInput/ReminderWithTime" />

### None

Set `time` to `"none"` for a date such as a birthday. Text with a time is then not accepted, and the field says so when it is left.

<NaturalDateInput labelText="Start date" time="none" text="tomorrow 3pm" now="2026-11-06T12:00:00Z" timeZone="UTC" />

### End of day

"eod" and "end of day" are 17:00 by default. Set `eod` to change it.

<NaturalDateInput labelText="Due" eod="18:30" text="eod friday" now="2026-11-06T12:00:00Z" timeZone="UTC" />

## Calendar

The calendar button opens a [DateCalendar](/components/DatePicker#standalone-calendar-experimental) in a dialog. Picking a day sets the date, keeps the time that was typed, closes the calendar and returns focus to the button. <DocKbd label="Escape" /> closes it without closing a [Modal](/components/Modal) around the field. Set `calendar` to `false` to hide the button.

<NaturalDateInput labelText="Due date" value="2026-12-03" timeZone="UTC" />

## Limits

Set `min` and `max` to the earliest and latest date that is accepted. The calendar greys out the days outside them. A date with no time is held to its day.

<NaturalDateInput labelText="Pickup date" helperText="Pickups run in December" min="2026-12-01" max="2026-12-31" />

## Value

`value` is a `Date`, or an ISO string with `valueType="iso"`. A date with no time is `"2026-11-14"`, the day in `timeZone`, and a date with a time is the instant, `"2026-11-14T20:00:00.000Z"`. It is set when the text is committed, not on each key, so a store that you bind it to does not see "tomorrow 3" on the way to "tomorrow 3pm". Set `value` from outside to rewrite the text.

The `change` event says why the value changed (`trigger`), and reports text that is not a date as `valid: false`.

<FileSource src="/framed/NaturalDateInput/ChangeEvent" />

## Language packs

The words the parser knows are a pack, an object of words and what each means. `NATURAL_DATE_EN` is the English pack, and the model for another. Names of months and days are not in a pack, since the browser has them for the `locale`.

```svelte
<script>
  import { NaturalDateInput } from "carbon-components-svelte";

  const de = {
    id: "de",
    locale: "de",
    words: {
      heute: ["day", 0],
      morgen: ["day", 1],
      gestern: ["day", -1],
      in: ["in"],
      vor: ["ago"],
      woche: ["unit", "w"],
      wochen: ["unit", "w"],
      tage: ["unit", "d"],
      tagen: ["unit", "d"],
      zwei: ["num", 2],
    },
  };
</script>

<NaturalDateInput labelText="Fällig am" locale="de" pack={de} />
```

## States

Reflect validation and interaction states.

### Invalid

Text that is not a date is invalid once the field is left, and the state clears when the user edits it. Set `invalid` and `invalidText` for your own rule, such as a date already taken.

<NaturalDateInput labelText="Start date" invalid invalidText="Another release starts on this date" text="dec 3" now="2026-11-06T12:00:00Z" timeZone="UTC" />

### Warning

<NaturalDateInput labelText="Start date" warn warnText="This date is a Saturday" text="dec 5" now="2026-11-06T12:00:00Z" timeZone="UTC" />

### Disabled

<NaturalDateInput labelText="Archived on" disabled value="2026-01-02" />

### Read-only

<NaturalDateInput labelText="Created on" readonly value="2026-01-02" />

## Sizes

Set `size` to control the field and button height. The default is `"md"`.

<Stack gap={6}>
  <NaturalDateInput labelText="Small" size="sm" />
  <NaturalDateInput labelText="Large" size="xl" />
</Stack>

## Form

Set `name` so a form submits the date, in the form `value` has with `valueType="iso"`. The text is not submitted. Text that is not a date holds back the submit, with the browser's own message, and `required` holds back an empty field.

```svelte
<script>
  import { Button, Form, NaturalDateInput } from "carbon-components-svelte";
</script>

<Form method="POST" action="?/schedule">
  <NaturalDateInput name="dueDate" required labelText="Due date" />
  <Button type="submit">Schedule</Button>
</Form>
```

## Server rendering

The component never reads the clock, the browser's locale or its time zone while it renders on the server, so the server and the browser write the same page. Set `now`, `locale` and `timeZone` on both, from the request. `now` fixes "today", and `timeZone` is the zone a date is read and written in. Without a `timeZone` the field uses `"UTC"` until it mounts and then the browser's, and rewrites a `value` it was given.

```svelte
<NaturalDateInput
  labelText="Due date"
  now={data.now}
  timeZone={data.timeZone}
  locale={data.locale}
  value={data.due}
/>
```

## Accessibility

The field is a text input. The reading under it is the field's description, so a screen reader reads it with the field. It is read out once typing has paused for about a second, not on each key. An unreadable date is announced when the user leaves the field.

| Do | Why |
| --- | --- |
| Give the field a visible label | The placeholder is an example, not a name |
| Keep the reading under the field | It is how a person sees that "3/12" was read the way they meant |
| Set `locale` to the person's, not the page's default | It decides what "3/12" means and how the reading is written |
| Name a limit in the helper text, and in `invalidText` for your own rule | `min` and `max` say "Choose a later date" and nothing more |
| Leave the calendar button on | Some people will not type, and the calendar needs no guessing |
