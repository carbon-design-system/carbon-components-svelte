<script>
  /**
   * @template [Icon=any]
   */

  /** Set the feedback text shown after clicking the button */
  export let feedback = "Copied!";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = 2000;

  /**
   * Specify an icon to render during the feedback window (for example, after copying).
   * When unset, the copy icon is always shown.
   * @type {Icon}
   */
  export let feedbackIcon = /** @type {Icon} */ (undefined);

  /** Set the title and ARIA label for the copy button */
  export let iconDescription = "Copy to clipboard";

  /**
   * Specify the kind of copy button.
   * Use `"ghost"` to match a `Button` with `kind="ghost"`.
   * @type {"primary" | "ghost"}
   */
  export let kind = "primary";

  /**
   * Specify the size of the copy button.
   * `"md"` keeps Carbon's native 2.5rem square; the other sizes match `Button`.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = "md";

  /**
   * Specify the text to copy.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Override the default copy behavior (navigator.clipboard.writeText).
   * @type {(text: string) => void | Promise<void>}
   */
  async function defaultCopy(text) {
    await navigator.clipboard.writeText(text);
  }

  export let copy = defaultCopy;

  /**
   * Set how the "Copied!" feedback tooltip is rendered.
   * By default, it is rendered in a portal so it shares the same surface as the
   * hover tooltip (the text swaps in place) and is never clipped by an
   * `overflow: hidden` container. Set to `false` to use Carbon's inline feedback
   * caret instead; a non-default `tooltipPosition`/`tooltipAlignment` still
   * portals because the inline caret only supports the default placement.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /**
   * Set the position of the tooltip relative to the button.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set the alignment of the tooltip relative to the button.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /** Obtain a reference to the underlying button element. */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import { get } from "svelte/store";
  import { activeButtonTooltip } from "../Button/button-tooltip-store.js";
  import Copy from "../icons/Copy.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { createCopyFeedbackState } from "../utils/copyFeedback.js";

  const dispatch = createEventDispatcher();

  // Feedback is portalled by default; only an explicit `portalTooltip={false}`
  // opts back into Carbon's inline caret.
  $: effectivePortalTooltip =
    portalTooltip === undefined ? true : portalTooltip;

  const copyFeedback = createCopyFeedbackState(syncCopyFeedback);

  /** @type {"fade-in" | "fade-out"} */
  let animation = undefined;
  let feedbackOpen = false;
  let copyPending = false;

  function syncCopyFeedback() {
    animation = copyFeedback.animation;
    feedbackOpen = copyFeedback.feedbackOpen;
    copyPending = copyFeedback.copyPending;
  }

  // Proactive hover/focus tooltip. Reuses the floating-portal `PortalTooltip`
  // and the shared `activeButtonTooltip` store, so a CopyButton coordinates
  // with adjacent icon-only Buttons (warm handoff, no overlapping tooltips).
  // Mirrors Button's portal-tooltip timing.
  const tooltipId = {};
  const ENTER_DELAY_MS = 100;
  const LEAVE_DELAY_MS = 300;
  let hovered = false;
  let focused = false;
  let tooltipTimeout;

  // Feedback shares the proactive tooltip's portal surface whenever the tooltip
  // is portalled OR a non-default position/alignment is set, so the "Copied!"
  // state appears in the same place as the hover description (text swaps in
  // place, no flash). Only the plain default (bottom/center, non-portalled)
  // keeps Carbon's inline feedback caret.
  $: tooltipCustomized =
    tooltipPosition !== "bottom" || tooltipAlignment !== "center";
  $: feedbackPortalled = effectivePortalTooltip || tooltipCustomized;

  $: showingInlineFeedback =
    !feedbackPortalled && (feedbackOpen || copyPending);
  $: tooltipHoverActive =
    !showingInlineFeedback &&
    (hovered || focused) &&
    $activeButtonTooltip === tooltipId;
  $: feedbackInPortal = feedbackPortalled && feedbackOpen;
  $: tooltipOpen = tooltipHoverActive || feedbackInPortal;
  $: tooltipText = feedbackOpen ? feedback : iconDescription;

  function claimTooltip() {
    activeButtonTooltip.set(tooltipId);
  }

  function releaseTooltip() {
    if (get(activeButtonTooltip) === tooltipId) {
      activeButtonTooltip.set(null);
    }
  }

  function handleTooltipMouseEnter() {
    clearTimeout(tooltipTimeout);
    // Skip the enter delay when another icon tooltip is already open so moving
    // between adjacent buttons feels instant.
    const warmHandoff =
      get(activeButtonTooltip) !== null &&
      get(activeButtonTooltip) !== tooltipId;
    tooltipTimeout = setTimeout(
      () => {
        hovered = true;
        claimTooltip();
      },
      warmHandoff ? 0 : ENTER_DELAY_MS,
    );
  }

  function handleTooltipMouseLeave() {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      hovered = false;
      if (!focused) releaseTooltip();
    }, LEAVE_DELAY_MS);
  }

  function handleTooltipFocus() {
    focused = true;
    claimTooltip();
  }

  function handleTooltipBlur() {
    focused = false;
    if (!hovered) releaseTooltip();
  }

  function dismissTooltip() {
    clearTimeout(tooltipTimeout);
    hovered = false;
    focused = false;
    releaseTooltip();
  }

  // Caret spacing + alignment nudges, mirroring Button's icon tooltip.
  const PORTAL_HORIZONTAL_GAP_PX = 2;
  const PORTAL_VERTICAL_GAP_PX = 1;
  const PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX = -3;
  const PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX = 1;

  $: tooltipHorizontal =
    tooltipPosition === "left" || tooltipPosition === "right";
  $: tooltipVertical =
    tooltipPosition === "top" || tooltipPosition === "bottom";
  $: portalHorizontalGapLeft = tooltipHorizontal ? PORTAL_HORIZONTAL_GAP_PX : 0;
  $: portalHorizontalGapRight = tooltipHorizontal
    ? PORTAL_HORIZONTAL_GAP_PX
    : 0;
  $: portalGapTop = tooltipVertical ? PORTAL_VERTICAL_GAP_PX : 0;
  $: portalGapBottom = tooltipVertical ? PORTAL_VERTICAL_GAP_PX : 0;
  $: portalVerticalAlignOffsetLeft =
    tooltipPosition === "left" && tooltipAlignment === "start"
      ? PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX
      : 0;
  $: portalVerticalAlignOffsetRight =
    tooltipPosition === "right" && tooltipAlignment === "end"
      ? PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX
      : 0;

  function dismissFeedback() {
    copyFeedback.dismiss();
    dismissTooltip();
  }

  let disconnectModalObserver = () => {};

  $: {
    disconnectModalObserver();
    disconnectModalObserver = ref
      ? observeModalClose(ref, dismissFeedback)
      : () => {};
  }

  onMount(() => {
    return () => {
      copyFeedback.cleanup();
      disconnectModalObserver();
      clearTimeout(tooltipTimeout);
      releaseTooltip();
    };
  });
</script>

<button
  bind:this={ref}
  type="button"
  aria-live="polite"
  aria-busy={copyPending || undefined}
  class:bx--copy-btn={true}
  class:bx--copy={true}
  class:bx--copy-btn--animating={animation}
  class:bx--copy-btn--fade-in={animation === "fade-in"}
  class:bx--copy-btn--fade-out={animation === "fade-out"}
  class:bx--copy-btn--portal-active={feedbackPortalled}
  class:bx--copy-btn--ghost={kind === "ghost"}
  class:bx--copy-btn--sm={size === "sm"}
  class:bx--copy-btn--lg={size === "lg"}
  class:bx--copy-btn--xl={size === "xl"}
  aria-label={iconDescription}
  {...$$restProps}
  on:click
  on:click={async () => {
    try {
      await copyFeedback.onClick(async () => {
        if (copy === defaultCopy ? text !== undefined : true) {
          await copy(text ?? "");
          dispatch("copy");
        }
      }, feedbackTimeout, feedbackPortalled);
    } catch (error) {
      dispatch("copy:error", { error });
    }
  }}
  on:animationend
  on:animationend={(event) => {
    copyFeedback.onAnimationEnd(event);
  }}
  on:mouseenter
  on:mouseenter={handleTooltipMouseEnter}
  on:mouseleave
  on:mouseleave={handleTooltipMouseLeave}
  on:focus
  on:focus={handleTooltipFocus}
  on:blur
  on:blur={handleTooltipBlur}
>
  {#if feedbackIcon && feedbackOpen}
    <svelte:component this={feedbackIcon} class="bx--snippet__icon" />
  {:else}
    <Copy class="bx--snippet__icon" />
  {/if}
  {#if !feedbackPortalled}
    <span
      aria-hidden="true"
      class:bx--assistive-text={true}
      class:bx--copy-btn__feedback={true}
    >
      {feedback}
    </span>
  {/if}
</button>

{#if ref}
  <PortalTooltip
    anchor={ref}
    open={tooltipOpen}
    text={tooltipText}
    tooltipType="icon"
    direction={tooltipPosition}
    intrinsicAlign={tooltipAlignment}
    horizontalGapLeft={portalHorizontalGapLeft}
    horizontalGapRight={portalHorizontalGapRight}
    gapTop={portalGapTop}
    gapBottom={portalGapBottom}
    verticalAlignOffsetLeft={portalVerticalAlignOffsetLeft}
    verticalAlignOffsetRight={portalVerticalAlignOffsetRight}
  />
{/if}
