<script>
  /**
   * One event of a `Scheduler`: a block in the time grid, a bar in the
   * all-day row, or a chip in a month cell. The `Scheduler` handles the
   * pointer and the keys on its grid, and finds this element by the
   * `data-event-id` attribute.
   *
   * @restProps {div}
   */

  /**
   * Specify the shape: a `"block"` fills a time span, a `"bar"` fills whole
   * days, and a `"chip"` is a timed event in a month cell.
   * @type {"block" | "bar" | "chip"}
   */
  export let variant = "block";

  /** Specify the event id. */
  export let eventId = "";

  /** Specify the key of this day's slice of the event, to find it again. */
  export let sliceKey = "";

  /** Specify the title. */
  export let title = "";

  /** Specify the start time text, such as `"10:00 AM"`. */
  export let timeText = "";

  /** Specify the end time text. A block shows it after the start time. */
  export let endText = "";

  /**
   * Specify the direction of the locale that formatted the times.
   * @type {"ltr" | "rtl"}
   */
  export let timeDir = "ltr";

  /** Specify the accessible name. */
  export let label = "";

  /**
   * Specify the color name.
   * @type {string | undefined}
   */
  export let color = undefined;

  /** Set to `true` when the event began before this slice. */
  export let continuesBefore = false;

  /** Set to `true` when the event ends after this slice. */
  export let continuesAfter = false;

  /** Set to `true` to mark an event the user cannot move or resize. */
  export let readonly = false;

  /** Set to `true` to show the bottom resize handle. */
  export let resizable = false;

  /** Set to `true` when the block is too short for a second line. */
  export let compact = false;

  /** Set to `true` while the event is being moved or resized. */
  export let dragging = false;

  /** Specify the tab index. */
  export let tabindex = -1;

  import EditOff from "../icons/EditOff.svelte";
</script>

<div
  {...$$restProps}
  role="button"
  class:bx--scheduler__event={true}
  class:bx--scheduler__event--block={variant === "block"}
  class:bx--scheduler__event--bar={variant === "bar"}
  class:bx--scheduler__event--chip={variant === "chip"}
  class:bx--scheduler__event--compact={compact}
  class:bx--scheduler__event--dragging={dragging}
  class:bx--scheduler__event--before={continuesBefore}
  class:bx--scheduler__event--after={continuesAfter}
  data-color={color || "blue"}
  data-event-id={eventId}
  data-slice-key={sliceKey}
  aria-label={label}
  title={label}
  {tabindex}
>
  <span class="bx--scheduler__event-line">
    {#if readonly}
      <EditOff class="bx--scheduler__event-icon" />
    {/if}
    <span class="bx--scheduler__event-title" dir="auto">{title}</span>
    {#if timeText && variant !== "block"}
      <span class="bx--scheduler__event-time" dir={timeDir}>{timeText}</span>
    {/if}
  </span>
  {#if timeText && variant === "block"}
    <span
      class="bx--scheduler__event-line bx--scheduler__event-line--time"
      dir={timeDir}
    >
      <span class="bx--scheduler__event-time">{timeText}</span>
      {#if endText}
        <span class="bx--scheduler__event-time">– {endText}</span>
      {/if}
    </span>
  {/if}
  {#if resizable}
    <span class="bx--scheduler__event-resize" data-resize aria-hidden="true"
    ></span>
  {/if}
</div>
