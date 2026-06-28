<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @event {null} open
   * @event {null} close
   * @slot {{}} labelText - Set the toggletip label, rendered beside the button.
   * @slot {{}} icon - Override the button icon.
   */

  /**
   * Set the alignment of the content relative to the button.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the content relative to the button.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the toggletip.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the icon to render for the toggletip button.
   * Defaults to `<Information />`.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (Information);

  /** Specify the icon name attribute */
  export let iconName = "";

  /** Specify the ARIA label for the toggletip button */
  export let iconDescription = "Show information";

  /**
   * Set the toggletip label text.
   * Alternatively, use the "labelText" slot.
   */
  export let labelText = "";

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set to `true` to render the content in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the content is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Information from "../icons/Information.svelte";
  import Popover from "../Popover/Popover.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();
  const contentId = `ccs-${Math.random().toString(36)}`;
  const insideModal = getContext("carbon:Modal");

  // Space (px) reserved for the caret between the anchor and the content.
  const PORTAL_GAP = 10;
  // Caret offset from the popover corner. 0.5rem keeps the caret clear of the
  // rounded corner (the popover's default 1rem assumes a wider trigger). The
  // popover is then nudged outward so this caret still points at the button
  // center for start/end alignment.
  const CARET_OFFSET_STYLE = "--cds-popover-caret-offset: 0.5rem;";
  // Nudge the popover past the trigger so the caret lands on the button center:
  // caretCenterFromCorner (0.5rem + caretHalfWidth = 12px) - buttonHalfWidth (8px) = 4px.
  const CARET_NUDGE_PX = 4;
  // Neutralizes the popover alignment transforms so the portal places it. The
  // popover is rendered `relative` (in-flow) so the portal sizes to it.
  const PORTAL_NEUTRALIZE_STYLE = "inset: auto; transform: none;";

  /**
   * Margin that nudges the popover outward so its caret points at the button
   * center for start/end alignment. Center alignment needs no nudge.
   */
  function caretNudgeStyle(pAlign) {
    if (pAlign.endsWith("-left")) return `margin-left: -${CARET_NUDGE_PX}px;`;
    if (pAlign.endsWith("-right")) return `margin-right: -${CARET_NUDGE_PX}px;`;
    if (pAlign.endsWith("-top")) return `margin-top: -${CARET_NUDGE_PX}px;`;
    if (pAlign.endsWith("-bottom"))
      return `margin-bottom: -${CARET_NUDGE_PX}px;`;
    return "";
  }

  /** Inline style for the underlying popover (caret offset + nudge). */
  function popoverStyleFor(pAlign) {
    return `${CARET_OFFSET_STYLE} ${caretNudgeStyle(pAlign)}`.trim();
  }

  let toggletipRef = null;
  let portalRef = null;
  let prevOpen = undefined;
  let disconnectModalObserver = () => {};

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  // Translate the Carbon `direction` + `align` pair into the underlying
  // popover's combined alignment modifier (e.g. "bottom" + "start" -> "bottom-left").
  function toPopoverAlign(dir, intrinsic) {
    if (intrinsic === "center") return dir;
    if (dir === "top" || dir === "bottom") {
      return `${dir}-${intrinsic === "start" ? "left" : "right"}`;
    }
    return `${dir}-${intrinsic === "start" ? "top" : "bottom"}`;
  }

  $: popoverAlign = toPopoverAlign(direction, align);
  $: popoverStyle = popoverStyleFor(popoverAlign);
  // Window listeners are enabled on the animation frame after opening. Svelte
  // flushes the open state synchronously while the triggering click is still
  // propagating, so enabling them immediately would let the click that opened
  // the toggletip (e.g. from an external trigger) bubble to the window handler
  // and close it again. Deferring past the current event mirrors the
  // post-render effect in the upstream component.
  let listenersEnabled = false;
  let enableFrame;

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  function onKeydown(event) {
    if (open && event.key === "Escape") {
      event.stopPropagation();
      close();
      ref?.focus();
    }
  }

  // The portalled content lives outside `toggletipRef`, so treat it as "inside"
  // for focus and outside-click handling.
  $: insideElements = [toggletipRef, portalRef];

  function containsTarget(target) {
    return insideElements.some((el) => el?.contains(target));
  }

  function onFocusOut(event) {
    // Keep open when focus moves to the toggletip content itself (relatedTarget
    // is null on some browsers when clicking non-focusable content).
    if (open && event.relatedTarget === null) return;
    if (!containsTarget(event.relatedTarget)) close();
  }

  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, insideElements)) close();
  }

  function handleWindowBlur() {
    if (open) close();
  }

  // Close when an ancestor modal closes so the portalled content does not linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortalTooltip && ref ? observeModalClose(ref, close) : () => {};
  }

  $: if (typeof requestAnimationFrame !== "undefined") {
    if (open) {
      cancelAnimationFrame(enableFrame);
      enableFrame = requestAnimationFrame(() => {
        if (open) listenersEnabled = true;
      });
    } else {
      cancelAnimationFrame(enableFrame);
      listenersEnabled = false;
    }
  }
  $: {
    if (prevOpen !== undefined) dispatch(open ? "open" : "close");
    prevOpen = open;
  }

  onMount(() => {
    return () => {
      cancelAnimationFrame(enableFrame);
      disconnectModalObserver();
    };
  });
</script>

<!-- Flex wrapper so the label and button align without an inter-element
whitespace gap; the label's `margin-right` is then the only spacing. -->
<span class:bx--toggletip-container={true}>
  {#if labelText || $$slots.labelText}
    <span class:bx--toggletip-label={true}>
      <slot name="labelText">{labelText}</slot>
    </span>
  {/if}

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    bind:this={toggletipRef}
    class:bx--toggletip={true}
    class:bx--toggletip--open={open}
    use:dismiss={{
      enabled: listenersEnabled,
      listeners: [
        { type: "click", handler: handleOutsideClick },
        { type: "blur", handler: handleWindowBlur },
      ],
    }}
    on:keydown={onKeydown}
    on:focusout={onFocusOut}
    {...$$restProps}
  >
    <button
      bind:this={ref}
      type="button"
      class:bx--toggletip-button={true}
      aria-label={iconDescription}
      aria-expanded={open}
      aria-controls={contentId}
      aria-describedby={open ? contentId : undefined}
      on:click={toggle}
    >
      <slot name="icon">
        <svelte:component this={icon} name={iconName} />
      </slot>
    </button>
    {#if !effectivePortalTooltip}
      <Popover
        {open}
        align={popoverAlign}
        id={contentId}
        caret
        highContrast
        style={popoverStyle}
      >
        <div class:bx--toggletip-content={true}>
          <slot />
        </div>
      </Popover>
    {/if}
  </span>
</span>

{#if effectivePortalTooltip}
  <FloatingPortal
    anchor={ref}
    {direction}
    {open}
    intrinsicWidth
    intrinsicAlign={align}
    gapTop={PORTAL_GAP}
    gapBottom={PORTAL_GAP}
    horizontalGapLeft={PORTAL_GAP}
    horizontalGapRight={PORTAL_GAP}
    bind:ref={portalRef}
    let:direction={actualDirection}
  >
    <Popover
      open
      relative
      align={toPopoverAlign(actualDirection ?? direction, align)}
      id={contentId}
      caret
      highContrast
      style="{PORTAL_NEUTRALIZE_STYLE} {popoverStyleFor(
        toPopoverAlign(actualDirection ?? direction, align),
      )}"
    >
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class:bx--toggletip-content={true} on:keydown={onKeydown}>
        <slot />
      </div>
    </Popover>
  </FloatingPortal>
{/if}
