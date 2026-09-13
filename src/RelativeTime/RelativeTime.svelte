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

  /** Set to `false` to disable the adaptive refresh timer. */
  export let live = true;

  /**
   * Absolute time shown in `title`.
   * @type {Intl.DateTimeFormatOptions}
   */
  export let titleFormatOptions = { dateStyle: "medium", timeStyle: "short" };

  import { onMount } from "svelte";
  import {
    formatRelativeTime,
    getRelativeTimeRefreshMs,
    toTimestamp,
  } from "../utils/relativeTime.js";

  let tickNow = Date.now();
  let timeoutId;

  function scheduleTick() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(
      () => {
        tickNow = Date.now();
        scheduleTick();
      },
      getRelativeTimeRefreshMs(timestamp - Date.now()),
    );
  }

  $: timestamp = toTimestamp(date);
  $: isValid = !Number.isNaN(timestamp);
  $: referenceNow = now == null ? tickNow : toTimestamp(now);
  $: formatted = isValid
    ? formatRelativeTime(timestamp, {
        now: referenceNow,
        locale,
        numeric,
        style,
      })
    : "";
  $: isoString = isValid ? new Date(timestamp).toISOString() : undefined;
  $: absoluteTitle = isValid
    ? new Intl.DateTimeFormat(locale, titleFormatOptions).format(timestamp)
    : undefined;

  // `tickNow` is assigned inside the timeout callback, not read here, so this
  // block only re-runs when `isLive` or `timestamp` change.
  $: {
    clearTimeout(timeoutId);
    if (isLive) scheduleTick();
  }
  $: isLive = live && now == null && isValid && typeof window !== "undefined";

  onMount(() => {
    return () => clearTimeout(timeoutId);
  });
</script>

<time datetime={isoString} title={absoluteTitle} {...$$restProps}>
  <slot {formatted}>{formatted}</slot>
</time>
