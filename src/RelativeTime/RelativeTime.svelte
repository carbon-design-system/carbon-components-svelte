<script>
  /**
   * @restProps {time}
   * @slot {{ formatted: string }}
   */

  /**
   * Target instant. Invalid or missing renders an empty `<time>` with no `datetime`.
   * @type {Date | number | string}
   */
  export let date = undefined;

  /**
   * Fixed reference instant. When set, live updates are off (deterministic docs and tests).
   * @type {Date | number}
   */
  export let now = undefined;

  /**
   * Runtime locale when unset.
   * @type {string}
   */
  export let locale = undefined;

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
  import {
    formatRelativeTime,
    getRelativeTimeRefreshMs,
    toTimestamp,
  } from "../utils/relative-time.js";
  import { subscribeRelativeTimeTick } from "../utils/relative-time-timer-pool.js";

  let tickNow = Date.now();
  let unsubscribe;
  let prevRefreshMs;

  function handleTick() {
    tickNow = Date.now();
  }

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
  $: isoString = valid ? new Date(timestamp).toISOString() : undefined;
  $: absoluteTitle = valid
    ? getDateTimeFormatter(locale, titleFormatOptions).format(timestamp)
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

<time datetime={isoString} title={absoluteTitle} {...$$restProps}>
  <slot {formatted}>{formatted}</slot>
</time>
