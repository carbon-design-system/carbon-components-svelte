---
components: ["Timeline", "TimelineItem"]
description: Timelines list dated events down a rail, such as the steps of an order, a deploy history, an audit trail or a changelog. Each event has a status marker, a time and a description.
keywords: ["history", "activity", "audit", "changelog", "tracking"]
---

<script>
  import { Timeline } from "carbon-components-svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  const now = Date.UTC(2026, 10, 6, 15, 0);
  const at = (days, hour, minute = 0) =>
    Date.UTC(2026, 10, 6 - days, hour, minute);

  const events = [
    { id: "created", time: at(2, 9, 12), title: "Account created" },
    { id: "verified", time: at(2, 9, 40), title: "Email verified" },
    { id: "plan", time: at(1, 15, 5), title: "Moved to the Team plan" },
  ];

  const statuses = [
    { id: "success", time: at(0, 9), title: "Backup completed", status: "success" },
    { id: "warning", time: at(0, 10), title: "Disk 85% full", status: "warning" },
    { id: "error", time: at(0, 11), title: "Replica failed", status: "error" },
    { id: "info", time: at(0, 12), title: "Maintenance window announced", status: "info" },
    { id: "pending", time: at(0, 13), title: "Failing over", status: "pending" },
    { id: "custom", time: at(0, 14), title: "Note from Grace Lee", icon: Edit },
  ];

  const audit = [
    { id: "a1", time: at(0, 14, 20), title: "Ada Okafor changed the billing email" },
    { id: "a2", time: at(0, 9, 5), title: "Grace Lee invited 3 members" },
    { id: "a3", time: at(1, 16, 40), title: "Ada Okafor enabled single sign-on" },
    { id: "a4", time: at(5, 11, 15), title: "Grace Lee created the workspace" },
  ];

  const order = [
    { id: "ordered", time: at(2, 9, 12), title: "Ordered", status: "success" },
    { id: "packed", time: at(1, 16, 40), title: "Packed", description: "Packed at the Reno warehouse.", status: "success" },
    { id: "shipped", time: at(1, 21, 5), title: "Shipped", description: "Handed to the carrier.", status: "success" },
    { id: "out", time: at(0, 14, 30), title: "Out for delivery", description: "The driver is 4 stops away.", status: "pending" },
    { id: "delivered", title: "Delivered", description: "Expected today by 8 PM." },
  ];
</script>

## Basic

Pass `items`, each with an `id` and a `title`. Set `time` to show when an event happened. A time under a week old also says how long ago it was, and the older ones show the time alone. Name the list with `aria-label`.

<Timeline aria-label="Account history" items={events} {now} timeZone="UTC" />

## Patterns

### Order tracking

Events run oldest first. The step in progress has `status="pending"`, and a step with no `time` yet stays at the end.

<FileSource src="/framed/Timeline/OrderTracking" />

### Deploy history

Events run newest first under a heading for each day. A failure has the `"error"` status, and the `content` slot adds a button to the events that need one.

<FileSource src="/framed/Timeline/DeployHistory" />

### Changelog

A long history shows its latest events and collapses the rest behind a button. Bind `expanded` to read or set it.

<FileSource src="/framed/Timeline/Changelog" />

## Markers

### Statuses

Set `status` on an event to pick its marker. Each status has its own shape, so the markers read without color, and its name is read to screen readers before the title. An event with no status gets a plain dot.

| Status | Marker | Name read aloud |
| --- | --- | --- |
| `success` | Check in a circle | Success |
| `warning` | Exclamation in a triangle | Warning |
| `error` | Slashed circle | Error |
| `info` | Exclamation in a square | Information |
| `pending` | Half-filled circle | In progress |

<Timeline aria-label="Database events" items={statuses.slice(0, 5)} {now} timeZone="UTC" />

### Custom icon

Set `icon` on an event to a Carbon icon, such as for a comment from a person. A `status` on the same event still adds its name for screen readers.

<Timeline aria-label="Notes" items={statuses.slice(4)} {now} timeZone="UTC" />

Use `statusText` to translate the names, or to say something other than the status:

```svelte
<Timeline
  items={events}
  statusText={(status) => (status === "error" ? "Failed" : "")}
/>
```

## Order

Events sort by `time`, so the array can arrive in any order. Set `order` to `"desc"` for the newest first, as in an audit trail. Events with the same time keep their order in `items`.

<Timeline aria-label="Audit trail" items={audit} order="desc" {now} timeZone="UTC" />

An event with no `time` counts as the latest: it ends the list under `"asc"` and starts it under `"desc"`.

## Times

Each time is written as an absolute time with how long ago it was, which updates as the page stays open. All the times share one timer for each cadence, so a long history does not add timers.

### Relative time

Set `relativeWithin` to the age in milliseconds after which an event shows its time alone. It defaults to a week. Set it to `0` to never show how long ago, or to `Infinity` to always show it.

```svelte
<Timeline items={events} relativeWithin={0} />
```

### Time format

Set `timeFormat` to `Intl.DateTimeFormat` options. Under day headings the time is the time of day alone, and otherwise the date and time. Set `locale` and `timeZone` to write times for a reader other than the browser's.

```svelte
<Timeline items={events} locale="de" timeZone="Europe/Berlin" timeFormat={{ dateStyle: "full" }} />
```

## Group by day

Set `groupBy` to `"day"` to put each day under a heading, such as "Today", "Yesterday" or "Nov 5". The headings are in a list of days, each holding its own list of events, and the rail breaks at each heading. A day begins at midnight in `timeZone`.

<Timeline aria-label="Audit trail by day" items={audit} order="desc" groupBy="day" {now} timeZone="UTC" />

Set `headingLevel` so the headings fit the page's outline: the default `3` suits a page with a section heading above the timeline. Set `groupLabel` to write the headings yourself.

The headings stay at the top of the scrolling ancestor until their day has passed. Set `stickyHeaders` to `false` to let them scroll away, or set `--ccs-timeline-sticky-offset` to clear a fixed header:

```svelte
<div style="--ccs-timeline-sticky-offset: 3rem">
  <Timeline items={events} groupBy="day" />
</div>
```

## Layout

### Alternate

Set `layout` to `"alternate"` to put the events on both sides of a rail down the middle, with the time opposite each. It needs room: below a timeline width of 40rem, it falls back to one side, and it reads the timeline's own width, not the window's.

<Timeline aria-label="Order, alternating" items={order} layout="alternate" {now} timeZone="UTC" />

### Density

Set `size` to `"sm"` to tighten the space between events, such as in a side panel.

<Timeline aria-label="Account history, small" items={events} size="sm" {now} timeZone="UTC" />

## Long histories

Set `limit` to the most events to show. The earlier ones collapse behind a button at the early end of the list, and a collapsed event is not rendered, so a history of hundreds mounts only what it shows. Set `showMoreText` and `showLessText` to write the button, with the number of collapsed events.

```svelte
<Timeline items={events} limit={20} bind:expanded />
```

## Content

The `content` slot receives each `item` and its `index` in `items`, and renders under the description.

```svelte
<Timeline items={deploys}>
  <svelte:fragment slot="content" let:item>
    {#if item.logUrl}
      <Link href={item.logUrl}>View log</Link>
    {/if}
  </svelte:fragment>
</Timeline>
```

### Composing

`TimelineItem` is the row `Timeline` draws. Put it in the default slot for an event that needs markup in its title or description. These rows come after the ones `items` draws, and `order`, `groupBy` and `limit` leave them alone, so use them with `groupBy="none"`.

<FileSource src="/framed/Timeline/ComposedTimeline" />

## Live updates

A static history is silent. Set `live` for a timeline that gets events while the page is open: a new event is announced politely, as "New event: Smoke test failed", or "3 new events" for several. Set `liveText` to write it. The first render is never announced.

<FileSource src="/framed/Timeline/LiveTimeline" />

## Server rendering

Set `locale` and `timeZone` so the server and the browser print the same headings and times, and set `now` to a fixed instant for a page that is rendered once, such as a static report. A fixed `now` stops the relative times from updating. For a server-rendered page that stays open, leave `now` unset: the browser replaces the relative text with its own after hydration.

## Accessibility

The timeline is an ordered list of events, and under `groupBy="day"` an ordered list of days, each with a heading and its own list. Each event's time is in a `time` element. A status is said in text before the title and never only by color or shape. The step in progress has `aria-current="step"`. The timeline is not a live region unless `live` is set.

Under forced colors the rail and the markers are drawn in the system text color. The shapes tell the statuses apart.

| Do | Why |
| --- | --- |
| Name the timeline with `aria-label`, such as "Order 1042". | The list is the only landmark a screen reader reads for it. |
| Give every event a short `title` and keep the detail in `description`. | The title is what a reader scans down the rail. |
| Set `status` only where it means something. | A marker on every event hides the ones that matter. |
| Use `live` only for events that arrive while the page is open. | A static history announced event by event is noise. |
| Set `limit` for a history over a few dozen events. | The collapsed events cost nothing to render. |

## Choosing a component

| Use | When |
| --- | --- |
| Timeline | A read-only, structured history of events with a time and a status: an order, a deploy, an audit trail, a changelog. |
| ProgressIndicator | The user moves through steps, and each step is a place to go to. |
| StructuredList | Rows of the same fields to compare, with no order in time. |
| DescriptionList | A set of labeled values for one thing. |
