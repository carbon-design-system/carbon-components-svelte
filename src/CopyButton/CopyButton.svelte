<script>
  import { copyText } from "../utils/copy-text.js";

  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @event {null} copy
   * @event {{ error: unknown }} copy:error
   */

  /** Set the feedback text shown after clicking the button */
  export let feedback = "Copied!";

  /** Set the feedback text shown when copying fails */
  export let errorFeedback = "Failed to copy";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = COPY_FEEDBACK_TIMEOUT_MS;

  /**
   * Specify an icon to render during the feedback window (for example, after copying).
   * When unset, the copy icon is always shown.
   * @type {Icon | undefined}
   */
  export let feedbackIcon = /** @type {Icon | undefined} */ (undefined);

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
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Override the default copy behavior (`navigator.clipboard.writeText` with
   * a `document.execCommand("copy")` fallback). Failures reject so the button
   * can show `errorFeedback` and dispatch `copy:error`.
   * @type {(text: string) => void | Promise<void>}
   */
  export let copy = copyText;

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
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the position of the tooltip relative to the button.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set the alignment of the tooltip relative to the button.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Obtain a reference to the underlying button element.
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { iconTooltipPortalGaps } from "../Portal/icon-tooltip-portal-gaps.js";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import Copy from "../icons/Copy.svelte";
  import {
    COPY_FEEDBACK_TIMEOUT_MS,
    createCopyFeedbackState,
  } from "../utils/copy-feedback.js";
  import { dismiss } from "../utils/dismiss.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { noop } from "../utils/noop.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";

  const dispatch = createEventDispatcher();

  // Feedback is portalled by default; only an explicit `portalTooltip={false}`
  // opts back into Carbon's inline caret.
  $: effectivePortalTooltip =
    portalTooltip === undefined ? true : portalTooltip;

  const copyFeedback = createCopyFeedbackState(syncCopyFeedback);

  /** @type {"fade-in" | "fade-out"} */
  let animation;
  let feedbackOpen = false;
  let copyPending = false;
  let copyFailed = false;

  function syncCopyFeedback() {
    animation = copyFeedback.animation;
    feedbackOpen = copyFeedback.feedbackOpen;
    copyPending = copyFeedback.copyPending;
    copyFailed = copyFeedback.isError;
  }

  $: feedbackText = copyFailed ? errorFeedback : feedback;
  // Both feedback surfaces are visual-only (the portal has no role, the inline
  // caret is aria-hidden), so mirror the text into a status region.
  $: statusText = feedbackOpen ? feedbackText : "";

  // Proactive hover/focus tooltip. Reuses the floating-portal `PortalTooltip`
  // and the tooltip group's handoff, so a CopyButton coordinates with
  // adjacent icon-only Buttons (warm handoff, no overlapping tooltips).
  // Mirrors Button's portal-tooltip timing.
  const tooltipHandoff = createTooltipHandoff({ group: getTooltipGroup() });
  const tooltipActive = tooltipHandoff.active;
  let hovered = false;
  let focused = false;
  // Set by Escape. The tooltip stays hidden while the button keeps hover
  // or focus, until the next pointer enter or focus (WCAG 1.4.13).
  let dismissed = false;

  // Feedback shares the proactive tooltip's portal surface whenever the tooltip
  // is portalled OR a non-default position/alignment is set, so the "Copied!"
  // state appears in the same place as the hover description (text swaps in
  // place, no flash). Only the plain default (bottom/center, non-portalled)
  // keeps Carbon's inline feedback caret.
  $: tooltipCustomized =
    effectiveTooltipPosition !== "bottom" ||
    effectiveTooltipAlignment !== "center";
  $: feedbackPortalled = effectivePortalTooltip || tooltipCustomized;

  $: showingInlineFeedback =
    !feedbackPortalled && (feedbackOpen || copyPending);
  $: tooltipHoverActive =
    !showingInlineFeedback &&
    !dismissed &&
    (hovered || focused) &&
    $tooltipActive;
  $: feedbackInPortal = feedbackPortalled && feedbackOpen;
  $: tooltipOpen = tooltipHoverActive || feedbackInPortal;
  $: tooltipText = feedbackOpen ? feedbackText : iconDescription;

  function handleTooltipMouseEnter() {
    // Skip the enter delay when another icon tooltip is already open so moving
    // between adjacent buttons feels instant.
    dismissed = false;
    tooltipHandoff.scheduleEnter(() => {
      hovered = true;
    });
  }

  function handleTooltipMouseLeave() {
    tooltipHandoff.scheduleLeave(() => {
      hovered = false;
      if (!focused) tooltipHandoff.release();
    });
  }

  // Focus the library moved here itself, such as a modal's first focus,
  // didn't ask for the tooltip: treat it as dismissed until the next
  // pointer enter or focus.
  function handleTooltipFocus() {
    focused = true;
    dismissed = !tooltipHandoff.claimFocus(ref);
  }

  // Escape hides whatever the tooltip surface shows: the description, or
  // the feedback after a copy. Listens on `window` in the capture phase,
  // as TooltipIcon does, so a hovered tooltip also hides while focus is
  // elsewhere, and an ancestor such as a Modal doesn't also see the
  // Escape that hid it.
  function handleKeydown(event) {
    if (event.key !== "Escape" || !(tooltipOpen || feedbackOpen)) return;
    // Escape that cancels an IME composition is not a dismissal.
    if (isImeComposition(event)) return;
    event.stopPropagation();
    dismissed = true;
    if (feedbackOpen) copyFeedback.dismiss();
    tooltipHandoff.dismiss();
  }

  function handleTooltipBlur() {
    focused = false;
    if (!hovered) tooltipHandoff.release();
  }

  // The pointer moved onto a part of the tooltip, or of the feedback that
  // took its place, that covers another control: close at once, so the
  // pointer and the next click reach that control. Hidden until the next
  // pointer enter or focus.
  function handleTooltipCover() {
    tooltipHandoff.cancel();
    dismissed = true;
    hovered = false;
    if (feedbackOpen) copyFeedback.dismiss();
    tooltipHandoff.release();
  }

  function dismissTooltip() {
    tooltipHandoff.cancel();
    hovered = false;
    focused = false;
    tooltipHandoff.release();
  }

  // Caret spacing + alignment nudges, mirroring Button's icon tooltip.
  $: portalGaps = iconTooltipPortalGaps(
    effectiveTooltipPosition,
    effectiveTooltipAlignment,
  );

  function dismissFeedback() {
    copyFeedback.dismiss();
    dismissTooltip();
  }

  let disconnectModalObserver = noop;

  $: {
    disconnectModalObserver();
    disconnectModalObserver = ref
      ? observeModalClose(ref, dismissFeedback)
      : noop;
  }

  onMount(() => {
    return () => {
      copyFeedback.cleanup();
      disconnectModalObserver();
      tooltipHandoff.cancel();
      tooltipHandoff.release();
    };
  });

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

<button
  bind:this={ref}
  use:dismiss={{
    enabled: tooltipOpen || feedbackOpen,
    type: "keydown",
    handler: handleKeydown,
    options: { capture: true },
  }}
  type="button"
  aria-busy={copyPending ? "true" : undefined}
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
      await copyFeedback.onClick(
        async () => {
          if (copy === copyText ? text !== undefined : true) {
            await copy(text ?? "");
            dispatch("copy");
          }
        },
        feedbackTimeout,
        feedbackPortalled,
      );
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
      {feedbackText}
    </span>
  {/if}
</button>
<!-- Always rendered (even while empty) so assistive tech registers the region
     before its text changes. -->
<span role="status" aria-live="polite" class:bx--visually-hidden={true}
  >{statusText}</span
>

{#if ref}
  <PortalTooltip
    anchor={ref}
    open={tooltipOpen}
    text={tooltipText}
    tooltipType="icon"
    direction={effectiveTooltipPosition}
    intrinsicAlign={effectiveTooltipAlignment}
    horizontalGapLeft={portalGaps.horizontalGapLeft}
    horizontalGapRight={portalGaps.horizontalGapRight}
    gapTop={portalGaps.gapTop}
    gapBottom={portalGaps.gapBottom}
    verticalAlignOffsetLeft={portalGaps.verticalAlignOffsetLeft}
    verticalAlignOffsetRight={portalGaps.verticalAlignOffsetRight}
    on:mouseenter={() => {
      // The pointer moved onto the tooltip: keep it open.
      if (tooltipHoverActive) tooltipHandoff.cancel();
    }}
    on:mouseleave={handleTooltipMouseLeave}
    on:cover={handleTooltipCover}
  />
{/if}
