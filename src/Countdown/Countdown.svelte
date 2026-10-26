<script>
  /**
   * @restProps {span}
   * @event {null} end
   * @slot {{ remaining: number; formatted: string; fraction: number }} - Custom rendering, such as a ProgressBar. `fraction` is the share of `seconds` left, from 1 to 0.
   */

  /**
   * Specify the length of the countdown in seconds. With `until`, set it to
   * the full length so the slot's `fraction` is the share left.
   */
  export let seconds = 60;

  /**
   * Specify when the countdown ends, as a `Date` or a timestamp in
   * milliseconds, such as a session timeout or a hold that the server set.
   * The time left then follows the clock, so it agrees across reloads and
   * tabs. Overrides `seconds` as the starting point. To extend the time,
   * set a later `until`; changing `remaining` does not move the deadline.
   * @type {undefined | Date | number}
   */
  export let until = undefined;

  /**
   * The seconds left. Starts at `seconds`, or the time to `until`; add to
   * it to extend the time, which also restarts a countdown that ended.
   * With `until`, the deadline decides the time left, so set a later
   * `until` instead.
   * @type {number}
   * @bindable writable
   */
  export let remaining = until == null ? seconds : secondsUntil(until);

  /**
   * Set to `false` to pause the countdown.
   * @bindable writable
   */
  export let running = true;

  /**
   * Specify how the time is written: `"auto"` uses h:mm:ss from an hour
   * up and m:ss below it, and `"mm:ss"` pads the minutes, as on a timer.
   * @type {"auto" | "m:ss" | "mm:ss" | "h:mm:ss"}
   */
  export let format = "auto";

  /**
   * Specify how many seconds before the end to warn screen reader users,
   * with `warnDescription`. The countdown is not announced every second.
   */
  export let warnAt = 60;

  /**
   * Specify the text screen readers hear `warnAt` seconds before the end.
   * It is not shown.
   */
  export let warnDescription = "One minute left";

  /** Specify the text screen readers hear when the time runs out */
  export let expiredDescription = "Time is up";

  import { createEventDispatcher, onMount } from "svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";

  const dispatch = createEventDispatcher();

  /** When the countdown reaches zero, in `Date.now()` milliseconds. */
  let endsAt = 0;
  let announcement = "";
  let mounted = false;
  /** Whether the countdown stopped by reaching zero, not by a pause. */
  let ended = false;
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let interval;

  /** @param {Date | number} deadline */
  function secondsUntil(deadline) {
    return Math.max(0, Math.ceil((+deadline - Date.now()) / 1000));
  }

  /** @param {number} value */
  function pad(value) {
    return String(value).padStart(2, "0");
  }

  /**
   * @param {number} total
   * @param {typeof format} style
   */
  function formatTime(total, style) {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (style === "h:mm:ss" || (style === "auto" && hours > 0)) {
      return `${hours}:${pad(minutes)}:${pad(secs)}`;
    }
    const totalMinutes = Math.floor(total / 60);
    return `${style === "mm:ss" ? pad(totalMinutes) : totalMinutes}:${pad(secs)}`;
  }

  function stop() {
    clearInterval(interval);
    interval = undefined;
  }

  // The values this component last set, so a change from outside (such as
  // extending the time, or pausing) restarts the clock from there.
  let ownRemaining = remaining;
  let ownRunning = running;
  let ownUntil = until;

  /** @param {boolean} announce */
  function finish(announce) {
    stop();
    ended = true;
    running = ownRunning = false;
    if (announce) announcement = expiredDescription;
    dispatch("end");
  }

  function step() {
    const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (next === remaining) return;
    if (remaining > warnAt && next <= warnAt && next > 0) {
      announcement = warnDescription;
    }
    remaining = ownRemaining = next;
    if (remaining === 0) finish(true);
  }

  /** @param {boolean} [atMount] Whether an end that is already past is silent. */
  function start(atMount = false) {
    stop();
    if (!running) return;
    // Already at zero (an expired `until`, `seconds={0}`): there is nothing
    // to count down, but the end still happens.
    if (remaining <= 0) {
      if (!ended) finish(!atMount);
      return;
    }
    endsAt = until == null ? Date.now() + remaining * 1000 : +until;
    interval = setInterval(step, 250);
  }

  /**
   * @param {number} nextRemaining
   * @param {boolean} nextRunning
   * @param {typeof until} nextUntil
   */
  function sync(nextRemaining, nextRunning, nextUntil) {
    if (
      nextRemaining === ownRemaining &&
      nextRunning === ownRunning &&
      nextUntil === ownUntil
    ) {
      return;
    }
    let left = nextRemaining;
    if (nextUntil !== ownUntil && nextUntil != null) {
      left = remaining = secondsUntil(nextUntil);
    }
    // Time added after the countdown ran out restarts it; a pause the app
    // set stays paused.
    let go = nextRunning;
    if (ended && left > 0 && !go) go = running = true;
    if (go && left > 0) ended = false;
    ownRemaining = left;
    ownRunning = go;
    ownUntil = nextUntil;
    if (left > warnAt) announcement = "";
    start();
  }

  $: if (mounted) sync(remaining, running, until);

  // Naming goes on the timer, not the wrapper.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: formatted = formatTime(Math.max(0, remaining), format);
  $: fraction = seconds > 0 ? Math.min(1, Math.max(0, remaining / seconds)) : 0;

  onMount(() => {
    mounted = true;
    start(true);
    // A background tab runs timers about once a minute; catch up as soon
    // as it is shown again.
    const catchUp = () => {
      if (document.visibilityState === "visible" && interval) step();
    };
    document.addEventListener("visibilitychange", catchUp);
    return () => {
      document.removeEventListener("visibilitychange", catchUp);
      stop();
    };
  });
</script>

<!-- No whitespace around the time: a countdown inside a sentence, as in
     "held for 9:42.", would otherwise add a space before the punctuation. -->
<!-- Whitespace between these nodes renders as text -->
<!-- prettier-ignore -->
<span class:bx--countdown={true} {...rest}
  >{#if $$slots.default}<slot {remaining} {formatted} {fraction} />{:else}<span
      role="timer"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      class:bx--countdown__time={true}>{formatted}</span
    >{/if}<span class:bx--visually-hidden={true} aria-live="polite"
    >{announcement}</span
  ></span
>
