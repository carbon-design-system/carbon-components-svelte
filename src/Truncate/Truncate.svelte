<script>
  /**
   * Specify `"end"` or `"front"`. `"front"` only works when `lines` is `1`.
   * @type {"end" | "front"}
   */
  export let clamp = "end";

  /**
   * Number of visible lines before truncating. Values above `1` use multiline mode (end clamp only).
   * @type {number}
   */
  export let lines = 1;

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "p";

  /**
   * Specify how to reveal clipped text.
   * `"tooltip"` shows the full text in a tooltip on hover and focus, and makes the text focusable while it is clipped.
   * `"expand"` adds a button that removes the clamp.
   * `"none"` only clips.
   * @type {"none" | "tooltip" | "expand"}
   */
  export let reveal = "none";

  /**
   * Set to `true` to show the full text.
   * Only applies when `reveal` is `"expand"`.
   */
  export let expanded = false;

  /**
   * Specify the label of the button that shows the full text.
   * Only applies when `reveal` is `"expand"`.
   */
  export let expandLabel = "View more";

  /**
   * Specify the label of the button that clamps the text again.
   * Only applies when `reveal` is `"expand"`.
   */
  export let collapseLabel = "View less";

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the position of the tooltip relative to the text.
   * Only applies when `reveal` is `"tooltip"`.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "top";

  /**
   * Set the alignment of the tooltip relative to the text.
   * Only applies when `reveal` is `"tooltip"`.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  import { onMount } from "svelte";
  import AnchoredTooltip from "../Portal/AnchoredTooltip.svelte";
  import { noop } from "../utils/noop.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { isTruncated, observeTruncation } from "../utils/truncation.js";
  import { uniqueId } from "../utils/unique-id.js";

  const fallbackId = uniqueId("ccs-truncate");

  /** @type {null | HTMLElement} */
  let textRef = null;
  let truncated = false;
  let fullText = "";
  let stopObserving = noop;

  $: multiline = lines > 1;
  // Kept while expanded, so toggling doesn't remount the slot.
  $: front = !multiline && clamp === "front";
  $: clamped = !(reveal === "expand" && expanded);
  $: style = multiline
    ? `--ccs-truncate-lines: ${lines};${
        $$restProps.style ? ` ${$$restProps.style}` : ""
      }`
    : $$restProps.style;
  $: focusable = reveal === "tooltip" && truncated;
  $: textId = $$restProps.id ?? (reveal === "expand" ? fallbackId : undefined);
  $: showToggle = reveal === "expand" && (truncated || expanded);

  function measure() {
    // The expanded text has no clamp to overflow, so keep the last result
    // until it collapses.
    if (!textRef || !clamped) return;
    truncated = isTruncated(textRef, multiline);
    if (reveal === "tooltip" && truncated) {
      fullText = (textRef.textContent ?? "").replace(/\s+/g, " ").trim();
    }
  }

  /**
   * @param {null | HTMLElement} node
   * @param {boolean} enabled
   */
  function observe(node, enabled) {
    stopObserving();
    stopObserving = noop;
    if (!node || !enabled) {
      truncated = false;
      return;
    }
    stopObserving = observeTruncation(node, measure);
  }

  // A change to `lines` or `expanded` resizes the box, so the observer
  // measures again on its own.
  $: observe(textRef, reveal !== "none");

  function handleToggle() {
    expanded = !expanded;
  }

  onMount(() => {
    return () => stopObserving();
  });

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<svelte:element
  this={tag}
  bind:this={textRef}
  class:bx--text-truncate--end={clamped && !multiline && clamp === "end"}
  class:bx--text-truncate--front={clamped && front}
  class:bx--text-truncate--multiline={clamped && multiline}
  class:bx--text-truncate--focusable={focusable}
  {...$$restProps}
  id={textId}
  tabindex={focusable ? 0 : $$restProps.tabindex}
  {style}
>
  <!-- The front clamp sets `direction: rtl`, which would move a leading
    slash or a trailing period to the other end. -->
  {#if front}
    <bdi><slot /></bdi>
  {:else}
    <slot />
  {/if}
</svelte:element>
{#if showToggle}
  <button
    type="button"
    class:bx--text-truncate__toggle={true}
    aria-controls={textId}
    aria-expanded={expanded}
    on:click={handleToggle}
  >
    {expanded ? collapseLabel : expandLabel}
  </button>
{/if}
{#if reveal === "tooltip"}
  <AnchoredTooltip
    anchor={textRef}
    text={fullText}
    enabled={truncated}
    direction={effectiveTooltipPosition}
    align={effectiveTooltipAlignment}
  />
{/if}
