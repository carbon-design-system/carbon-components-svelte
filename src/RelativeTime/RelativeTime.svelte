<script>
  /**
   * @restProps {time}
   * @slot {{ formatted: string }}
   */

  /**
   * Target instant. Invalid or missing renders an empty `<time>` with no `datetime`.
   * @type {Date | number | string | undefined}
   */
  export let date = undefined;

  /**
   * Fixed reference instant. When set, live updates are off (deterministic docs and tests).
   * @type {Date | number | undefined}
   */
  export let now = undefined;

  /**
   * Runtime locale when unset.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * IANA time zone for the absolute time in `title`. Runtime time zone when
   * unset. Set a fixed value so the server and the client print the same
   * `title`. Equivalent to `titleFormatOptions={{ timeZone }}`, and overrides
   * `titleFormatOptions.timeZone` when both are set.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /**
   * @type {"always" | "auto"}
   */
  export let numeric = "auto";

  /**
   * @type {"long" | "short" | "narrow"}
   */
  export let style = "long";

  /**
   * Set to `false` to disable the adaptive refresh timer.
   * @type {boolean}
   */
  export let live = true;

  /**
   * Absolute time shown in `title`.
   * @type {Intl.DateTimeFormatOptions}
   */
  export let titleFormatOptions = { dateStyle: "medium", timeStyle: "short" };

  import { onMount } from "svelte";
  import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import { subscribeRelativeTimeTick } from "../utils/relative-time-timer-pool.js";
  import {
    formatRelativeTime,
    getRelativeTimeRefreshMs,
    toTimestamp,
  } from "../utils/relative-time.js";

  let tickNow = Date.now();
  let unsubscribe;
  let prevRefreshMs;

  function handleTick() {
    tickNow = Date.now();
  }

  // Re-read the clock whenever the inputs change. Otherwise `tickNow` is stale
  // (the timer is off, or its cadence is slow) and the new text is wrong.
  $: handleTick(date, live, now);
  $: timestamp = toTimestamp(date);
  $: valid = !Number.isNaN(timestamp);
  $: referenceNow = now == null ? tickNow : toTimestamp(now);
  $: formatted = valid
    ? formatRelativeTime(timestamp, {
        now: referenceNow,
        locale,
        numeric,
        style,
      })
    : "";
  // Intl writes the text for its own locale. Lay it out in that direction,
  // isolated from the page, so "1 hr. ago" does not read "hr. ago 1" on an
  // RTL page. A custom slot has no known locale, so its text picks its own.
  /** @type {"auto" | "ltr" | "rtl"} */
  $: dir = $$slots.default ? "auto" : localeDirection(locale);
  $: isoString = valid ? new Date(timestamp).toISOString() : undefined;
  $: absoluteTitle = valid
    ? getDateTimeFormatter(
        locale,
        timeZone ? { ...titleFormatOptions, timeZone } : titleFormatOptions,
      ).format(timestamp)
    : undefined;
  $: ticking = live && now == null && valid && typeof window !== "undefined";
  $: refreshMs = ticking ? getRelativeTimeRefreshMs(timestamp - tickNow) : 0;

  // Resubscribe only when `ticking` or `refreshMs` change. Reading `tickNow`
  // without this guard would reset the interval on every shared tick.
  $: {
    if (!ticking) {
      unsubscribe?.();
      unsubscribe = undefined;
      prevRefreshMs = undefined;
    } else if (refreshMs !== prevRefreshMs) {
      unsubscribe?.();
      unsubscribe = subscribeRelativeTimeTick(refreshMs, handleTick);
      prevRefreshMs = refreshMs;
    }
  }

  onMount(() => {
    return () => unsubscribe?.();
  });
</script>

<time
  class:bx--relative-time={true}
  datetime={isoString}
  title={absoluteTitle}
  {dir}
  {...$$restProps}
>
  <slot {formatted}>{formatted}</slot>
</time>
