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
   * Set the smallest unit shown. `"minute"` shows the locale's word for
   * the present, such as "now", for any time under a minute, then counts
   * minutes. `"second"` counts seconds.
   * @type {"second" | "minute"}
   */
  export let minUnit = "second";

  /**
   * Show the absolute time once `date` is at least this many milliseconds
   * in the past, such as `3_600_000` for one hour. The timer then stops.
   * Leave unset to always show relative time.
   * @type {number | undefined}
   */
  export let absoluteAfter = undefined;

  /**
   * Format for the absolute time shown after `absoluteAfter`. Honors
   * `timeZone` the same way `titleFormatOptions` does.
   * @type {Intl.DateTimeFormatOptions}
   */
  export let absoluteFormatOptions = { timeStyle: "short" };

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
  /** @type {(() => void) | undefined} */
  let unsubscribe;
  /** @type {number | undefined} */
  let prevRefreshMs;

  // Called with the inputs it should re-run on, which it ignores.
  /** @type {(...deps: unknown[]) => void} */
  function handleTick() {
    tickNow = Date.now();
  }

  // Re-read the clock whenever the inputs change. Otherwise `tickNow` is stale
  // (the timer is off, or its cadence is slow) and the new text is wrong.
  $: handleTick(date, live, now, absoluteAfter);
  $: timestamp = toTimestamp(date);
  $: valid = !Number.isNaN(timestamp);
  $: referenceNow = now == null ? tickNow : toTimestamp(now);
  $: absolute =
    valid && absoluteAfter != null && referenceNow - timestamp >= absoluteAfter;
  $: formatted = valid
    ? absolute
      ? getDateTimeFormatter(
          locale,
          timeZone
            ? { ...absoluteFormatOptions, timeZone }
            : absoluteFormatOptions,
        ).format(timestamp)
      : formatRelativeTime(timestamp, {
          now: referenceNow,
          locale,
          numeric,
          style,
          minUnit,
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
  // Absolute text never changes, so it needs no timer.
  $: ticking =
    live && now == null && valid && !absolute && typeof window !== "undefined";
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
