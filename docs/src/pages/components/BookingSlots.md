---
components: ["BookingSlots"]
description: Booking slots let people pick a day from a calendar of availability, then a time from that day's slots, shown in their own time zone.
keywords: ["appointment", "scheduling", "booking", "time slot", "calendly"]
---

## Basic

Pass the free times as `slots`, each a UTC instant: a `Date`, a timestamp or an ISO string, with an optional `end`. Days without a slot are disabled in the calendar. Choosing a day shows its times as a grid of buttons, and choosing a time sets `value` to the start as an ISO 8601 string in UTC.

`BookingSlots` only picks. Confirming is left to your app, so listen for `change` or read `value` and show the summary and the confirm button where your flow needs them.

<FileSource src="/framed/BookingSlots/BookingSlotsDemo" />

Build `slots` from windows of free time with `slotsFromWindows(windows, { duration, step })`. To turn a wall time in the host's zone into an instant, use `wallTimeToInstant(day, minutes, timeZone)`. It reads a time that does not exist (the hour clocks go forward) as the time after the gap, and a time that happens twice as the first.

## Time zones

Times show in `timeZone`, an IANA name such as `"America/Toronto"`. Left empty, it becomes the viewer's zone once the page loads, and `"UTC"` until then. Set `timeZone` yourself when rendering on the server, together with `now`, so the server and the browser write the same text.

Pass `timeZones` to offer a selector. The current zone is added to the list if it is missing. Switching zones keeps the chosen instant and moves the day with it: a slot at 11:30 PM on Wednesday in New York is 5:30 AM on Thursday in Berlin, and the calendar follows it to Thursday. Bind `timeZone` to keep the zone in your own state.

<FileSource src="/framed/BookingSlots/BookingSlotsCallback" />

### Daylight saving time

Slots are instants, so they never name a wall time that does not exist and never repeat. What changes with the zone is the calendar day a slot falls on and the text of its time.

| Case | What `BookingSlots` does |
| --- | --- |
| A 23 hour day, when clocks go forward | The hour that was skipped has no slots. The day's other slots appear as usual. |
| A 25 hour day, when clocks go back | The hour that happens twice has two slots. Both would read the same, so each adds the zone's short name, such as 1:30 AM EDT and 1:30 AM EST. |
| A slot near midnight | It belongs to the day it starts on in the display zone, which can differ from the host's day. |

## Loading by month

Pass `loadSlots` instead of `slots` to fetch availability a month at a time. It receives the month as `from` and `to` (the first instant of the month and of the next, in the display zone), the `month` as `YYYY-MM`, the `timeZone` and an `AbortSignal` that fires when the component is destroyed or `loadSlots` changes. Return the slots that start in that window.

Months load as they come into view, and the next month loads ahead of time, so paging forward rarely waits. Set `prefetch` to `false` to turn that off. A month is kept once loaded, and a zone change asks only for the windows it has not seen. While a month loads, the calendar disables its days and the times area shows a loading message. A failure shows a message with a button that tries again, and dispatches `error`.

Pass a function that does not change between renders. A new `loadSlots` clears what has loaded.

<FileSource src="/framed/BookingSlots/BookingSlotsAsync" />

### Next available

When no day is chosen, or the chosen day has no times, a button names the next day that has some, such as "Next available: Thu, Nov 13", and jumps to it. With `loadSlots`, the search goes on into the following months, up to `lookahead` of them (3 by default).

## Slot length

Set `duration` to the length of a slot in minutes. It shows beside the time zone, and a slot with no `end` ends this long after it starts. Set `minNotice` to the minutes ahead that a slot must be, such as `120` to stop bookings within two hours. Times that have passed are never offered.

## Week view

Set `view="week"` to show the seven days of the chosen day's week side by side. The week opens when the component is wide enough, and below that it shows the chosen day alone, as the day view does. It follows the width of the component, not the window.

<FileSource src="/framed/BookingSlots/BookingSlotsWeek" />

## Accessibility

Each day's times are a `radiogroup` named "Available times on Wednesday, Nov 11", and each time is a `radio` button. Only one time can be chosen, and the group has one tab stop. Changes are announced from a polite status region: the number of times on a chosen day, "No times available", loading and failure.

| Key | Action |
| --- | --- |
| <DocKbd label="Tab" /> | Moves between the calendar, the time zone selector and the times |
| <DocKbd label="ArrowLeft" /> <DocKbd label="ArrowRight" /> | Moves to the previous or next time, and chooses it. In RTL the keys swap. In the week view, they move to the same time on the previous or next day. |
| <DocKbd label="ArrowUp" /> <DocKbd label="ArrowDown" /> | Moves a row up or down in the grid, and chooses the time |
| <DocKbd label="Home" /> <DocKbd label="End" /> | Moves to the first or last time of the day, and chooses it |

Set `timesLabelText`, `emptyText`, `nextAvailableText` and the other text props to translate the messages. The calendar's month and day names follow `locale`.

## Usage

| Do | Why |
| --- | --- |
| Return slots as UTC instants. | The same slot reads correctly in any zone, and daylight saving time is handled when it is shown. |
| Show a confirm step after the choice. | Choosing a time does not book it, and the grid changes the choice with the arrow keys. |
| Set `timeZone` and `now` when rendering on the server. | The server does not know the viewer's zone or clock. |
| Return only the slots that start in the requested window. | A month is kept by its window. A slot from another month is shown, but it does not refresh when its own month loads again. |
