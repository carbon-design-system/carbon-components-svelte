<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify an id for the measured text content. Referenced by the expand
   * toggle's `aria-controls` when `type` is `"expand"`.
   * @type {string}
   */
  export let id = uniqueId();

  /** Specify the maximum number of lines to display before truncating. */
  export let lines = 2;

  /**
   * Specify how to reveal the full text once truncated. Set to `"none"` for
   * plain ellipsis truncation with no reveal affordance.
   * @type {"tooltip" | "expand" | "none"}
   */
  export let type = "tooltip";

  /** Specify the expand toggle's label. Only used when `type` is `"expand"`. */
  export let expandLabel = "Read more";

  /** Specify the collapse toggle's label. Only used when `type` is `"expand"`. */
  export let collapseLabel = "Read less";

  /**
   * Set the alignment of the tooltip relative to the content.
   * Only applies when `type` is `"tooltip"`.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the content.
   * Only applies when `type` is `"tooltip"`.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { onMount } from "svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import { uniqueId } from "../utils/uniqueId.js";

  let contentRef = null;
  let truncated = false;
  let expanded = false;
  let resolvedText = "";
  let resizeObserver = null;

  function checkTruncated() {
    if (!contentRef || (type === "expand" && expanded)) return;
    const isTruncated = contentRef.offsetHeight < contentRef.scrollHeight;
    if (isTruncated !== truncated) truncated = isTruncated;
  }

  // Re-attach whenever the measured element changes identity, since the
  // tooltip variant moves the content span in/out of a wrapping <button>
  // (a different DOM subtree) as `truncated` toggles.
  function attachObserver(el) {
    resizeObserver?.disconnect();
    if (!el) return;
    resizeObserver = new ResizeObserver(checkTruncated);
    resizeObserver.observe(el);
  }

  $: attachObserver(contentRef);

  $: if (contentRef) {
    resolvedText = contentRef.textContent ?? "";
  }

  // jsdom's ResizeObserver mock only fires once per `observe()` call, unlike
  // a real one, which re-fires on the height change collapsing produces.
  // Re-checking directly here keeps collapse-then-recheck correct under test
  // without depending on that timing, and is harmless in a real browser
  // since the observer already re-checks there too.
  $: {
    expanded;
    lines;
    if (!expanded) checkTruncated();
  }

  onMount(() => {
    return () => resizeObserver?.disconnect();
  });

  function toggleExpand() {
    expanded = !expanded;
  }

  $: clampValue = type === "expand" && expanded ? "none" : lines;
</script>

<div bind:this={ref} class:bx--truncated-text={true} {...$$restProps}>
  {#if truncated && type === "tooltip"}
    <!--
      Force the portal: TooltipDefinition's default CSS-only positioning is
      built for a compact, single-line trigger (a word or short phrase) and
      uses fixed-percentage offsets that misplace the tooltip once the
      trigger is a wide, multi-line block like a truncated paragraph. The
      portal measures the real anchor rect via JS instead, so it stays
      correct at any trigger size.
    -->
    <TooltipDefinition
      tooltipText={resolvedText}
      {align}
      {direction}
      portalTooltip
    >
      <span
        bind:this={contentRef}
        {id}
        class:bx--truncated-text__text-content={true}
        style:-webkit-line-clamp={clampValue}
      >
        <slot />
      </span>
    </TooltipDefinition>
  {:else}
    <span
      bind:this={contentRef}
      {id}
      class:bx--truncated-text__text-content={true}
      class:bx--truncated-text__text-content--expanded={expanded}
      style:-webkit-line-clamp={clampValue}
    >
      <slot />
    </span>
  {/if}
  {#if truncated && type === "expand"}
    <button
      type="button"
      aria-controls={id}
      aria-expanded={expanded}
      class:bx--truncated-text__expand-toggle={true}
      on:click={toggleExpand}
    >
      {expanded ? collapseLabel : expandLabel}
    </button>
  {/if}
</div>
