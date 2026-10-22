<svelte:options immutable />

<script>
  /**
   * @restProps {svg}
   * @event {{ values: ReadonlyArray<number | null> }} update Fires once per animation frame in which samples were appended after mount, with the values now shown.
   */

  /**
   * Specify the latest sample. Every change appends it. Call `push` instead
   * to append a sample that may equal the last one, or many at once.
   * @type {number | null}
   */
  export let value = undefined;

  /**
   * Specify the samples to start from. Only the last `capacity` are kept.
   * @type {ReadonlyArray<number | null | undefined>}
   */
  export let seed = [];

  /** Specify how many samples to keep. Older ones fall off the left. */
  export let capacity = 60;

  /**
   * Set to `true` to hold new samples without drawing them. They are
   * drawn, all at once, when set back to `false`.
   */
  export let paused = false;

  /**
   * Accessible name for the chart. Leave empty to mark it as decorative.
   */
  export let label = "";

  import { createEventDispatcher, onMount } from "svelte";
  import Sparkline from "../Sparkline/Sparkline.svelte";
  import { normalizeSparklineValues } from "../utils/sparkline.js";

  const dispatch = createEventDispatcher();

  /** @type {Array<number | null>} */
  let values = normalizeSparklineValues(seed).slice(-capacity);
  /** @type {Array<number | null>} */
  let queue = [];
  let frame = 0;
  let mounted = false;

  /**
   * Append a sample, or an array of them. Many in one frame draw once: the
   * queue is flushed on the next animation frame, which the browser stops
   * running in a hidden tab, so a background dashboard costs nothing until
   * it is looked at.
   *
   * @param {number | null | undefined | ReadonlyArray<number | null | undefined>} samples
   * @returns {void}
   */
  export function push(samples) {
    for (const sample of Array.isArray(samples) ? samples : [samples]) {
      queue.push(
        typeof sample === "number" && Number.isFinite(sample) ? sample : null,
      );
    }
    // The queue never needs more than the window.
    if (queue.length > capacity) queue.splice(0, queue.length - capacity);
    schedule();
  }

  function schedule() {
    if (frame || paused || queue.length === 0) return;
    // Before mount, and on the server, the sample is part of the first
    // render and nobody is listening yet.
    if (!mounted || typeof requestAnimationFrame !== "function") {
      flush(false);
      return;
    }
    if (typeof document !== "undefined" && document.hidden) return;
    frame = requestAnimationFrame(flush);
  }

  function flush() {
    frame = 0;
    if (queue.length === 0) return;
    const next = values.concat(queue);
    queue = [];
    values = next.length > capacity ? next.slice(next.length - capacity) : next;
    dispatch("update", { values });
  }

  function onVisibility() {
    if (!document.hidden) schedule();
  }

  $: if (value !== undefined) push(value);
  $: if (!paused) schedule();
  $: if (values.length > capacity) values = values.slice(-capacity);

  onMount(() => {
    mounted = true;
    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) cancelAnimationFrame(frame);
    };
  });
</script>

<Sparkline {values} {label} {...$$restProps} />
