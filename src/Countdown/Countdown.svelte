<script>
  /**
   * @restProps {span}
   * @event {null} end
   * @slot {{ remaining: number; formatted: string; fraction: number }} - Custom rendering, such as a ProgressBar. `fraction` is the share of `seconds` left, from 1 to 0.
   */

  /** Specify the length of the countdown in seconds */
  export let seconds = 60;

  /**
   * The seconds left. Starts at `seconds`; add to it to extend the time.
   * @bindable writable
   */
  export let remaining = seconds;

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
   * Specify the text announced to screen readers when one minute is left,
   * and when the time runs out. The countdown is not announced every
   * second.
   */
  export let oneMinuteText = "One minute left";

  /** Specify the text announced when the time runs out */
  export let expiredText = "Time is up";

  import { createEventDispatcher, onMount } from "svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";

  const dispatch = createEventDispatcher();

  /** When the countdown reaches zero, in `Date.now()` milliseconds. */
  let endsAt = 0;
  let announcement = "";
  let mounted = false;
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let interval = undefined;

  /** @param {number} value */
  function pad(value) {
    return String(value).padStart(2, "0");
  }

  /** @param {number} total */
  function formatTime(total) {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (format === "h:mm:ss" || (format === "auto" && hours > 0)) {
      return `${hours}:${pad(minutes)}:${pad(secs)}`;
    }
    const totalMinutes = Math.floor(total / 60);
    return `${format === "mm:ss" ? pad(totalMinutes) : totalMinutes}:${pad(secs)}`;
  }

  function stop() {
    clearInterval(interval);
    interval = undefined;
  }

  // The values this component last set, so a change from outside (such as
  // extending the time, or pausing) restarts the clock from there.
  let ownRemaining = remaining;
  let ownRunning = running;

  function step() {
    const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (next === remaining) return;
    if (remaining > 60 && next <= 60 && next > 0) announcement = oneMinuteText;
    remaining = ownRemaining = next;
    if (remaining === 0) {
      stop();
      running = ownRunning = false;
      announcement = expiredText;
      dispatch("end");
    }
  }

  function start() {
    stop();
    if (!running || remaining <= 0) return;
    endsAt = Date.now() + remaining * 1000;
    interval = setInterval(step, 250);
  }

  /**
   * @param {number} nextRemaining
   * @param {boolean} nextRunning
   */
  function sync(nextRemaining, nextRunning) {
    if (nextRemaining === ownRemaining && nextRunning === ownRunning) return;
    ownRemaining = nextRemaining;
    ownRunning = nextRunning;
    if (nextRemaining > 60) announcement = "";
    start();
  }

  $: if (mounted) sync(remaining, running);

  // Naming goes on the timer, not the wrapper.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: formatted = formatTime(Math.max(0, remaining));
  $: fraction = seconds > 0 ? Math.min(1, Math.max(0, remaining / seconds)) : 0;

  onMount(() => {
    mounted = true;
    start();
    return stop;
  });
</script>

<span class:bx--countdown={true} {...rest}>
  {#if $$slots.default}
    <slot {remaining} {formatted} {fraction} />
  {:else}
    <span
      role="timer"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      class:bx--countdown__time={true}
    >
      {formatted}
    </span>
  {/if}
  <span class:bx--visually-hidden={true} aria-live="polite"
    >{announcement}</span
  >
</span>
