<script>
  /**
   * @typedef {import("../utils/timeline.js").TimelineStatus} TimelineStatus
   * @restProps {li}
   * @slot {{}} - Content under the description, such as a diff, a log excerpt or a button.
   * @slot {{}} titleChildren - Replaces the title text.
   * @slot {{}} descriptionChildren - Replaces the description text.
   */

  /**
   * Specify when the event happened. A future time reads "in 2 days", which
   * suits an expected step. Leave it unset for a step with no time yet.
   * @type {Date | number | string | undefined}
   */
  export let time = undefined;

  /** Specify the event's title */
  export let title = "";

  /** Specify the text under the title */
  export let description = "";

  /**
   * Specify the marker. A status picks an icon with its own shape, so it
   * reads without color, and adds its name for screen readers. `"pending"`
   * marks the step in progress and sets `aria-current="step"`. Leave it
   * unset for a plain dot.
   * @type {TimelineStatus | undefined}
   */
  export let status = undefined;

  /**
   * Specify an icon for the marker in place of the status icon, such as a
   * person for a comment. A `status` still adds its name for screen readers.
   * @type {import("../utils/icon-component.js").IconComponent | undefined}
   */
  export let icon = undefined;

  /**
   * Specify how the time is written. Use `timeStyle` alone under a day
   * heading, where the day is already said.
   * @type {Intl.DateTimeFormatOptions}
   */
  export let timeFormat = { dateStyle: "medium", timeStyle: "short" };

  /**
   * Specify how old an event can be, in milliseconds, and still show how
   * long ago it was beside its time. Older events show the time alone, so
   * a long history keeps few live times. `0` never shows it and `Infinity`
   * always does.
   */
  export let relativeWithin = 604_800_000;

  /**
   * Fix the reference instant for the relative time and the cutoff. This
   * stops the live update, so the server and the browser print the same
   * text.
   * @type {Date | number | undefined}
   */
  export let now = undefined;

  /**
   * Specify the locale of the times. The runtime locale when unset, which
   * prints differently on a server; set it with `timeZone` for server
   * rendering.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify the IANA time zone of the times. The runtime zone when unset.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /**
   * Specify the words for a status, which screen readers hear before the
   * title. Return `""` for none.
   * @type {(status: TimelineStatus | undefined) => string}
   */
  export let statusText = defaultStatusText;

  import IconIndicator from "../IconIndicator/IconIndicator.svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import { toTimestamp } from "../utils/relative-time.js";
  import { defaultStatusText, isWithinRelative } from "../utils/timeline.js";

  /** @type {Record<TimelineStatus, "succeeded" | "caution-minor" | "failed" | "informative" | "in-progress">} */
  const KINDS = {
    success: "succeeded",
    warning: "caution-minor",
    error: "failed",
    info: "informative",
    pending: "in-progress",
  };

  /**
   * @param {Date | number | string | undefined} value
   * @param {Intl.DateTimeFormatOptions} format
   * @param {string | undefined} zone
   * @param {string | undefined} language
   */
  function formatAbsolute(value, format, zone, language) {
    const stamp = toTimestamp(value);
    if (Number.isNaN(stamp)) return "";
    return getDateTimeFormatter(
      language,
      zone ? { ...format, timeZone: zone } : format,
    ).format(stamp);
  }

  $: timestamp = toTimestamp(time);
  $: valid = !Number.isNaN(timestamp);
  $: iso = valid ? new Date(timestamp).toISOString() : undefined;
  $: absolute = formatAbsolute(time, timeFormat, timeZone, locale);
  $: relative = isWithinRelative(
    timestamp,
    now == null ? Date.now() : toTimestamp(now),
    relativeWithin,
  );
  $: kind = status ? KINDS[status] : undefined;
  $: label = statusText(status);
</script>

<li
  class:bx--timeline__item={true}
  class:bx--timeline__item--success={status === "success"}
  class:bx--timeline__item--warning={status === "warning"}
  class:bx--timeline__item--error={status === "error"}
  class:bx--timeline__item--info={status === "info"}
  class:bx--timeline__item--pending={status === "pending"}
  aria-current={status === "pending" ? "step" : undefined}
  {...$$restProps}
>
  <div class:bx--timeline__marker={true}>
    {#if icon}
      <svelte:component this={icon} size={16} class="bx--timeline__icon" />
      {#if label}<span class:bx--visually-hidden={true}>{label}</span>{/if}
    {:else if kind}
      <IconIndicator {kind} {label} hideLabel />
    {:else}
      <span class:bx--timeline__dot={true}></span>
    {/if}
  </div>
  {#if title || $$slots.titleChildren}
    <div class:bx--timeline__title={true}>
      <slot name="titleChildren">{title}</slot>
    </div>
  {/if}
  {#if valid}
    {#if relative}
      <RelativeTime
        class="bx--timeline__time"
        date={time}
        {now}
        {locale}
        {timeZone}
        let:formatted
      >
        {absolute} · <bdi>{formatted}</bdi>
      </RelativeTime>
    {:else}
      <time
        class:bx--timeline__time={true}
        datetime={iso}
        dir={localeDirection(locale)}>{absolute}</time
      >
    {/if}
  {/if}
  {#if description || $$slots.descriptionChildren}
    <div class:bx--timeline__description={true}>
      <slot name="descriptionChildren">{description}</slot>
    </div>
  {/if}
  {#if $$slots.default}
    <div class:bx--timeline__content={true}>
      <slot />
    </div>
  {/if}
</li>
