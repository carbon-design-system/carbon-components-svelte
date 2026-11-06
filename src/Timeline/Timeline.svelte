<script>
  /**
   * @typedef {import("../utils/timeline.js").TimelineStatus} TimelineStatus
   * @typedef {object} TimelineEvent
   * @property {string | number} id - Unique in the list. Keys the row.
   * @property {Date | number | string} [time] - When it happened. Leave it out for a step with no time yet.
   * @property {string} [title]
   * @property {string} [description]
   * @property {TimelineStatus} [status] - `"pending"` marks the step in progress.
   * @property {import("../utils/icon-component.js").IconComponent} [icon] - Replaces the status icon.
   * @typedef {object} TimelineGroupContext
   * @property {number} now - The reference instant, in milliseconds.
   * @property {string} [locale]
   * @property {string} [timeZone]
   * @restProps {div}
   * @slot {{ item: TimelineEvent; index: number }} content - Under each event's description. `index` is the position in `items`.
   * @slot {{}} - `TimelineItem`s after the ones `items` draws. They keep their place: `order`, `groupBy` and `limit` do not touch them, so use them with `groupBy="none"`.
   */

  /**
   * Specify the events. They are sorted by `time` (see `order`), so the
   * array can arrive in any order. Each `id` must be unique.
   * @type {ReadonlyArray<TimelineEvent>}
   */
  export let items = [];

  /**
   * Specify the direction: `"asc"` puts the oldest first, as for the steps
   * of an order, and `"desc"` the newest first, as for a changelog or an
   * audit trail. Events with the same time, and events with no time, keep
   * their order in `items`; an event with no time counts as the latest, so
   * an in-progress step ends the list under `"asc"`.
   * @type {"asc" | "desc"}
   */
  export let order = "asc";

  /**
   * Set to `"day"` to put each day under a heading, such as "Today" or
   * "Nov 5". The headings are in a list of days, each holding its own list
   * of events.
   * @type {"none" | "day"}
   */
  export let groupBy = "none";

  /**
   * Specify the heading text of a day.
   * @type {(time: number, context: TimelineGroupContext) => string}
   */
  export let groupLabel = defaultGroupLabel;

  /**
   * Specify the level of the day headings, so they fit the page's outline.
   * @type {2 | 3 | 4 | 5 | 6}
   */
  export let headingLevel = 3;

  /**
   * Set to `false` to let the day headings scroll away. They otherwise stay
   * at the top of the scrolling ancestor until their day has passed. Set
   * `--ccs-timeline-sticky-offset` to clear a fixed header.
   */
  export let stickyHeaders = true;

  /**
   * Specify the layout. `"alternate"` puts the events on both sides of a
   * rail down the middle, with the time opposite, when the timeline is wider
   * than 40rem, and on one side below that.
   * @type {"start" | "alternate"}
   */
  export let layout = "start";

  /**
   * Specify the density. `"sm"` tightens the space between events.
   * @type {"md" | "sm"}
   */
  export let size = "md";

  /**
   * Specify the most events to show. The earlier ones collapse behind a
   * button, so a long history mounts only what it shows. The default shows
   * them all.
   * @type {number}
   */
  export let limit = Infinity;

  /**
   * Set to `true` to show the events past `limit`.
   * @bindable writable
   */
  export let expanded = false;

  /**
   * Specify how old an event can be, in milliseconds, and still show how
   * long ago it was beside its time. Older events show the time alone, which
   * also keeps their times from updating. `0` never shows it and `Infinity`
   * always does.
   */
  export let relativeWithin = 604_800_000;

  /**
   * Specify how each time is written. Under day headings it is the time of
   * day alone, and otherwise the date and time.
   * @type {Intl.DateTimeFormatOptions | undefined}
   */
  export let timeFormat = undefined;

  /**
   * Fix the reference instant for "Today", the relative times and
   * `relativeWithin`. This stops the live update, so the server and the
   * browser print the same text.
   * @type {Date | number | undefined}
   */
  export let now = undefined;

  /**
   * Specify the locale of the times and headings. The runtime locale when
   * unset, which prints differently on a server; set it with `timeZone` for
   * server rendering.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify the IANA time zone of the times, and of where each day begins.
   * The runtime zone when unset.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /**
   * Set to `true` to announce events added after the first render, such as
   * a deploy that finishes while the page is open. A static history stays
   * silent.
   */
  export let live = false;

  /**
   * Specify the words for a status, which screen readers hear before the
   * title. Return `""` for none.
   * @type {(status: TimelineStatus | undefined) => string}
   */
  export let statusText = defaultStatusText;

  /**
   * Specify the announcement for events added while `live`.
   * @type {(added: ReadonlyArray<TimelineEvent>) => string}
   */
  export let liveText = defaultLiveText;

  /**
   * Specify the text of the button that shows the collapsed events.
   * @type {(count: number) => string}
   */
  export let showMoreText = defaultShowMoreText;

  /**
   * Specify the text of the button that collapses them again.
   * @type {(count: number) => string}
   */
  export let showLessText = defaultShowLessText;

  import { onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { toTimestamp } from "../utils/relative-time.js";
  import {
    buildTimeline,
    defaultGroupLabel,
    defaultStatusText,
  } from "../utils/timeline.js";
  import TimelineItem from "./TimelineItem.svelte";

  /** @type {Intl.DateTimeFormatOptions} */
  const TIME_OF_DAY = { timeStyle: "short" };
  /** @type {Intl.DateTimeFormatOptions} */
  const DATE_AND_TIME = { dateStyle: "medium", timeStyle: "short" };

  /** @param {number} count */
  function defaultShowMoreText(count) {
    return `Show ${count} earlier ${count === 1 ? "event" : "events"}`;
  }

  function defaultShowLessText() {
    return "Show fewer events";
  }

  /** @param {ReadonlyArray<TimelineEvent>} added */
  function defaultLiveText(added) {
    if (added.length === 1) {
      return added[0].title ? `New event: ${added[0].title}` : "New event";
    }
    return `${added.length} new events`;
  }

  /** @type {Set<TimelineEvent["id"]> | undefined} */
  let seen;
  let announcement = "";
  let mounted = false;

  /** @param {ReadonlyArray<TimelineEvent>} events */
  function announceAdded(events) {
    const known = seen;
    seen = new Set(events.map((event) => event.id));
    if (!known) return;
    const added = events.filter((event) => !known.has(event.id));
    if (added.length > 0) announcement = liveText(added);
  }

  function toggle() {
    expanded = !expanded;
  }

  $: referenceNow = now == null ? Date.now() : toTimestamp(now);
  $: timeline = buildTimeline(items, {
    order,
    groupBy,
    limit,
    expanded,
    now: referenceNow,
    locale,
    timeZone,
    groupLabel,
  });
  $: grouped = groupBy === "day";
  $: itemTimeFormat = timeFormat ?? (grouped ? TIME_OF_DAY : DATE_AND_TIME);
  $: headingTag = `h${headingLevel}`;
  // The button sits at the earlier end of the list, where the hidden events
  // are: above it for oldest first, below for newest first.
  $: collapsible = timeline.earlier > 0;
  $: toggleText = expanded
    ? showLessText(timeline.earlier)
    : showMoreText(timeline.earlier);
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: if (mounted && live) announceAdded(items);

  onMount(() => {
    seen = new Set(items.map((event) => event.id));
    mounted = true;
  });
</script>

<div
  class:bx--timeline={true}
  class:bx--timeline--sm={size === "sm"}
  class:bx--timeline--alternate={layout === "alternate"}
  class:bx--timeline--sticky={stickyHeaders}
  {...rest}
>
  {#if collapsible && order === "asc"}
    <div class:bx--timeline__more={true}>
      <Button kind="ghost" size="sm" on:click={toggle}>{toggleText}</Button>
    </div>
  {/if}
  <ol
    class:bx--timeline__list={true}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
  >
    {#each timeline.groups as group (group.key)}
      {#if grouped}
        <li class:bx--timeline__group={true}>
          {#if group.label !== null}
            <svelte:element
              this={headingTag}
              class:bx--timeline__heading={true}
            >
              {group.label}
            </svelte:element>
          {/if}
          <ol class:bx--timeline__list={true}>
            {#each group.rows as row (row.key)}
              {@const event = row.item}
              <TimelineItem
                time={event.time}
                title={event.title}
                description={event.description}
                status={event.status}
                icon={event.icon}
                timeFormat={itemTimeFormat}
                {relativeWithin}
                {now}
                {locale}
                {timeZone}
                {statusText}
              >
                <slot name="content" item={event} index={row.index} />
              </TimelineItem>
            {/each}
          </ol>
        </li>
      {:else}
        {#each group.rows as row (row.key)}
          {@const event = row.item}
          <TimelineItem
            time={event.time}
            title={event.title}
            description={event.description}
            status={event.status}
            icon={event.icon}
            timeFormat={itemTimeFormat}
            {relativeWithin}
            {now}
            {locale}
            {timeZone}
            {statusText}
          >
            <slot name="content" item={event} index={row.index} />
          </TimelineItem>
        {/each}
      {/if}
    {/each}
    <slot />
  </ol>
  {#if collapsible && order === "desc"}
    <div class:bx--timeline__more={true}>
      <Button kind="ghost" size="sm" on:click={toggle}>{toggleText}</Button>
    </div>
  {/if}
  {#if live}
    <div
      class:bx--visually-hidden={true}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </div>
  {/if}
</div>
