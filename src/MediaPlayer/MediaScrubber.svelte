<script>
  /**
   * @restProps {div}
   * @typedef {{ start: number; end: number; title: string }} MediaScrubberChapter
   * @event {{ time: number }} scrubstart
   * @event {{ time: number }} input
   * @event {{ time: number }} change
   */

  /**
   * Specify the time shown, in seconds. While the thumb is dragged it
   * follows the pointer and ignores this, so a `timeupdate` does not pull
   * it back.
   */
  export let currentTime = 0;

  /**
   * Specify the length of the media in seconds. The scrubber is disabled
   * while it is `0`, as for a video that has not loaded or a live stream.
   */
  export let duration = 0;

  /**
   * Specify the buffered ranges as `[start, end]` pairs in seconds, as
   * `media.buffered` reports them.
   * @type {ReadonlyArray<readonly [number, number]>}
   */
  export let buffered = [];

  /**
   * Specify the chapters. Each marks its start on the track, and its title
   * shows in the preview and in `aria-valuetext`.
   * @type {ReadonlyArray<MediaScrubberChapter>}
   */
  export let chapters = [];

  /** Specify how many seconds an arrow key moves. */
  export let seekStep = 5;

  /** Set to `true` to disable the scrubber. */
  export let disabled = false;

  /**
   * Set to `true` while playback waits for data. It marks the slider
   * `aria-busy`.
   */
  export let waiting = false;

  /** Specify the accessible name. */
  export let labelText = "Seek";

  /** Set to `true` to hide the preview time over the track. */
  export let hidePreview = false;

  /**
   * Specify the locale that writes the time in words for `aria-valuetext`.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Write a time as shown in the preview.
   * @type {(seconds: number) => string}
   */
  export let formatTime = formatClock;

  /**
   * Write the `aria-valuetext`: the time in words, of the length, and the
   * chapter's title.
   * @type {(current: string, total: string, chapter: string) => string}
   */
  export let valueDescription = defaultValueDescription;

  /**
   * Obtain a reference to the thumb, the element with the slider role.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    chapterAt,
    describeTime,
    formatClock,
    scrubKeyTarget,
    timeFromPointer,
  } from "../utils/media-time.js";
  import { pointerDrag } from "../utils/pointer-drag.js";

  const dispatch = createEventDispatcher();

  /**
   * @param {string} current
   * @param {string} total
   * @param {string} chapter
   */
  function defaultValueDescription(current, total, chapter) {
    const text = `${current} of ${total}`;
    return chapter ? `${text}, ${chapter}` : text;
  }

  /** @type {null | HTMLDivElement} */
  let trackRef = null;
  let scrubbing = false;
  let scrubTime = 0;
  /** @type {null | number} */
  let hoverTime = null;
  let trackWidth = 0;
  let previewWidth = 0;

  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: enabled = !disabled && duration > 0;
  $: shown = Math.min(scrubbing ? scrubTime : currentTime, duration || 0);
  $: ratio = duration > 0 ? shown / duration : 0;
  $: chapter = chapterAt(chapters, shown);
  $: valueText = valueDescription(
    describeTime(shown, locale),
    describeTime(duration, locale),
    chapter?.title ?? "",
  );
  $: previewTime = scrubbing ? scrubTime : hoverTime;
  $: previewChapter =
    previewTime === null ? undefined : chapterAt(chapters, previewTime);
  $: previewCenter =
    duration > 0 && previewTime !== null
      ? (previewTime / duration) * trackWidth
      : 0;
  $: previewLeft = Math.min(
    Math.max(previewCenter, previewWidth / 2),
    Math.max(trackWidth - previewWidth / 2, previewWidth / 2),
  );

  /** @param {PointerEvent} event */
  function timeAt(event) {
    return timeFromPointer(
      event.clientX,
      /** @type {HTMLElement} */ (trackRef).getBoundingClientRect(),
      duration,
    );
  }

  /** @param {PointerEvent} event */
  function handleStart(event) {
    if (!enabled) return false;
    // The compatibility `mousedown` would move focus to the body.
    event.preventDefault();
    ref?.focus({ preventScroll: true });
    scrubbing = true;
    scrubTime = timeAt(event);
    dispatch("scrubstart", { time: scrubTime });
    dispatch("input", { time: scrubTime });
    return true;
  }

  /** @param {PointerEvent} event */
  function handleMove(event) {
    scrubTime = timeAt(event);
    dispatch("input", { time: scrubTime });
  }

  function handleEnd() {
    if (!scrubbing) return;
    scrubbing = false;
    dispatch("change", { time: scrubTime });
  }

  /** @param {PointerEvent} event */
  function handleHover(event) {
    if (!enabled || scrubbing || event.pointerType === "touch") return;
    hoverTime = timeAt(event);
  }

  function handleLeave() {
    hoverTime = null;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!enabled || hasModifierKey(event)) return;
    const time = scrubKeyTarget(event.key, shown, duration, seekStep);
    if (time === null) return;
    // The scrubber owns its keys; a player shortcut for the same key stands
    // aside for a prevented event.
    event.preventDefault();
    if (time === shown) return;
    dispatch("input", { time });
    dispatch("change", { time });
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  {...wrapperProps}
  dir="ltr"
  class:bx--media-scrubber={true}
  class:bx--media-scrubber--disabled={!enabled}
  class:bx--media-scrubber--scrubbing={scrubbing}
  use:pointerDrag={{
    enabled,
    onStart: handleStart,
    onMove: handleMove,
    onEnd: handleEnd,
  }}
  on:pointermove={handleHover}
  on:pointerleave={handleLeave}
>
  <div
    bind:this={trackRef}
    bind:clientWidth={trackWidth}
    class:bx--media-scrubber__track={true}
  >
    {#each buffered as range, index (index)}
      {#if duration > 0}
        <div
          class:bx--media-scrubber__buffered={true}
          style:left="{(range[0] / duration) * 100}%"
          style:width="{((range[1] - range[0]) / duration) * 100}%"
        ></div>
      {/if}
    {/each}
    <div
      class:bx--media-scrubber__filled={true}
      style:transform="scaleX({ratio})"
    ></div>
    {#if duration > 0}
      {#each chapters as marker, index (index)}
        {#if marker.start > 0}
          <div
            class:bx--media-scrubber__chapter={true}
            style:left="{(marker.start / duration) * 100}%"
          ></div>
        {/if}
      {/each}
    {/if}
  </div>
  <div
    bind:this={ref}
    role="slider"
    tabindex={enabled ? 0 : undefined}
    class:bx--media-scrubber__thumb={true}
    style:left="{ratio * 100}%"
    aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labelText)}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    aria-valuemin={0}
    aria-valuemax={duration}
    aria-valuenow={Math.round(shown * 100) / 100}
    aria-valuetext={valueText}
    aria-disabled={enabled ? undefined : "true"}
    aria-busy={waiting ? "true" : undefined}
    on:keydown={handleKeydown}
    on:focus
    on:blur
  ></div>
  {#if !hidePreview && previewTime !== null && enabled}
    <div
      bind:clientWidth={previewWidth}
      aria-hidden="true"
      class:bx--media-scrubber__preview={true}
      style:left="{previewLeft}px"
    >
      <span class:bx--media-scrubber__preview-time={true}
        >{formatTime(previewTime)}</span
      >
      {#if previewChapter?.title}
        <span class:bx--media-scrubber__preview-chapter={true}
          >{previewChapter.title}</span
        >
      {/if}
    </div>
  {/if}
</div>
