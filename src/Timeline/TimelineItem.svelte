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
  export let titleText = "";

  /** Specify the text under the title */
  export let descriptionText = "";

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
   * stops the live update. Unset, the relative time appears once the page is
   * in the browser, so the server's text does not depend on its clock.
   * @type {Date | number | undefined}
   */
  export let now = undefined;

  /**
   * Specify the locale of the times. Unset, it is `"en"` on the server and
   * until the page mounts, then the browser's locale; set it, with
   * `timeZone`, to print the same text throughout.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify the IANA time zone of the times. Unset, it is `"UTC"` on the
   * server and until the page mounts, then the browser's zone.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /**
   * Specify the words for a status, which screen readers hear before the
   * title. Return `""` for none.
   * @type {(status: TimelineStatus | undefined) => string}
   */
  export let statusDescription = defaultStatusDescription;

  import { onMount } from "svelte";
  import IconIndicator from "../IconIndicator/IconIndicator.svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import { toTimestamp } from "../utils/relative-time.js";
  import {
    defaultStatusDescription,
    isWithinRelative,
  } from "../utils/timeline.js";

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

  // The server and the first client render know no clock, locale or zone of
  // the browser, so they print "en" and UTC with no relative time. Once
  // mounted, the browser's values take over.
  let mounted = false;
  /** @type {number | undefined} */
  let clock;
  onMount(() => {
    clock = Date.now();
    mounted = true;
  });

  $: language = locale ?? (mounted ? undefined : "en");
  $: zone = timeZone ?? (mounted ? undefined : "UTC");
  $: reference = now == null ? clock : toTimestamp(now);
  $: timestamp = toTimestamp(time);
  $: valid = !Number.isNaN(timestamp);
  $: iso = valid ? new Date(timestamp).toISOString() : undefined;
  $: absolute = formatAbsolute(time, timeFormat, zone, language);
  $: relative =
    reference !== undefined &&
    isWithinRelative(timestamp, reference, relativeWithin);
  $: kind = status ? KINDS[status] : undefined;
  $: label = statusDescription(status);
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
  {#if titleText || $$slots.titleChildren}
    <div class:bx--timeline__title={true}>
      <slot name="titleChildren">{titleText}</slot>
    </div>
  {/if}
  {#if valid}
    {#if relative}
      <RelativeTime
        class="bx--timeline__time"
        date={time}
        {now}
        locale={language}
        timeZone={zone}
        let:formatted
      >
        {absolute} · <bdi>{formatted}</bdi>
      </RelativeTime>
    {:else}
      <time
        class:bx--timeline__time={true}
        datetime={iso}
        dir={localeDirection(language)}>{absolute}</time
      >
    {/if}
  {/if}
  {#if descriptionText || $$slots.descriptionChildren}
    <div class:bx--timeline__description={true}>
      <slot name="descriptionChildren">{descriptionText}</slot>
    </div>
  {/if}
  {#if $$slots.default}
    <div class:bx--timeline__content={true}>
      <slot />
    </div>
  {/if}
</li>
