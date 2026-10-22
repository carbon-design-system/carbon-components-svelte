<script context="module">
  // Space (px) reserved for the caret between the anchor and the content.
  const PORTAL_GAP = 10;
  // Neutralizes the popover alignment transforms so the portal places it. The
  // popover is rendered `relative` (in-flow) so the portal sizes to it.
  const PORTAL_NEUTRALIZE_STYLE = "inset: auto; transform: none;";

  const ALIGN_EDGE = /-(left|right|top|bottom)$/;

  /**
   * A portalled popover sits at the button's edge. For start and end
   * alignment, move it so the caret, `--ccs-toggletip-caret` in from its
   * corner, lands on the button's center.
   * @param {string} pAlign
   * @param {number} anchorHalf Half the button's width, in px
   */
  function portalNudgeStyle(pAlign, anchorHalf) {
    const edge = pAlign.match(ALIGN_EDGE)?.[1];
    return edge
      ? `margin-${edge}: calc(${anchorHalf}px - var(--ccs-toggletip-caret));`
      : "";
  }

  /**
   * An in-place popover's start or end edge sits `--ccs-toggletip-caret`
   * before the button's center, so the caret lands there at any button size.
   * @param {string} pAlign
   */
  function edgeStyle(pAlign) {
    const edge = pAlign.match(ALIGN_EDGE)?.[1];
    return edge
      ? `${edge}: calc(50% - var(--ccs-toggletip-caret));`
      : undefined;
  }

  // Translate the Carbon `direction` + `align` pair into the underlying
  // popover's combined alignment modifier (e.g. "bottom" + "start" -> "bottom-left").
  function toPopoverAlign(dir, intrinsic) {
    if (intrinsic === "center") return dir;
    if (dir === "top" || dir === "bottom") {
      return `${dir}-${intrinsic === "start" ? "left" : "right"}`;
    }
    return `${dir}-${intrinsic === "start" ? "top" : "bottom"}`;
  }
</script>

<script>
  /**
   * @template [Icon=any]
   * @restProps {span}
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

  /**
   * Specify the ARIA label for the toggletip button.
   * Set to `""` to name the button by its content instead.
   */
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

  /**
   * Specify a class for the popover.
   * The class is also applied when the popover is portalled.
   * @type {string | undefined}
   */
  export let popoverClass = undefined;

  /**
   * Set an id for the toggletip element.
   * The content id derives from it as `{id}-content`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Information from "../icons/Information.svelte";
  import Popover from "../Popover/Popover.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { horizontalBounds, shouldFlipAlign } from "../utils/fit-align.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);
  const insideModal = getContext("carbon:Modal");

  let toggletipRef = null;
  let portalRef = null;
  let disconnectModalObserver = noop;

  $: contentId = `${id}-content`;

  // Naming and description belong on the trigger button, not the wrapper.
  // A consumer `aria-label` wins over `iconDescription`.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  // A start- or end-aligned popover that would overflow its container, such
  // as a table's scroll area, opens on the other side when it fits better
  // there. It starts from `align` again each time it opens.
  let flippedAlign = undefined;
  $: if (!open) flippedAlign = undefined;
  $: effectiveAlign = flippedAlign ?? align;
  // `toggletipRef` binds only in the browser, so this never runs during SSR.
  $: if (
    open &&
    toggletipRef &&
    align !== "center" &&
    (direction === "top" || direction === "bottom")
  )
    fitAlign();

  async function fitAlign() {
    await tick();
    // The portal places its content on the next frame.
    await new Promise((resolve) =>
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(resolve)
        : setTimeout(resolve),
    );
    const popover = (portalRef ?? toggletipRef)?.querySelector(".bx--popover");
    if (!open || flippedAlign || !popover || !ref) return;
    const button = ref.getBoundingClientRect();
    const rect = popover.getBoundingClientRect();
    if (
      shouldFlipAlign(
        rect,
        button.left + button.width / 2,
        horizontalBounds(popover),
      )
    ) {
      flippedAlign = align === "start" ? "end" : "start";
    }
  }

  $: popoverAlign = toPopoverAlign(direction, effectiveAlign);
  // Start and end alignment point the caret at the button's center (see
  // _toggletip.scss). A portalled popover can't measure the button in CSS.
  $: anchorHalf = open && ref ? ref.offsetWidth / 2 : 8;
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

  function handleKeydown(event) {
    if (open && event.key === "Escape") {
      // Escape that cancels an IME composition is not a close.
      if (event.isComposing || event.keyCode === 229) return;
      event.stopPropagation();
      close();
      ref?.focus();
    }
  }

  // The portalled content lives outside `toggletipRef`, so treat it as "inside"
  // for focus and outside-click handling.
  $: insideElements = [toggletipRef, portalRef];

  function containsTarget(target) {
    return insideElements.some((node) => node?.contains(target));
  }

  function handleFocusout(event) {
    // Keep open when focus moves to the toggletip content itself (relatedTarget
    // is null on some browsers when clicking non-focusable content).
    if (open && event.relatedTarget === null) return;
    if (!containsTarget(event.relatedTarget)) close();
  }

  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, insideElements)) close();
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
  $: notifyOpenChange(open);

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
    {id}
    class:bx--toggletip={true}
    class:bx--toggletip--open={open}
    use:dismiss={{
      enabled: listenersEnabled,
      listeners: [{ type: "click", handler: handleOutsideClick }],
    }}
    on:keydown={handleKeydown}
    on:focusout={handleFocusout}
    {...wrapperProps}
  >
    <button
      bind:this={ref}
      type="button"
      class:bx--toggletip-button={true}
      aria-label={ariaLabel ?? (iconDescription || undefined)}
      aria-labelledby={ariaLabelledBy}
      aria-expanded={open}
      aria-controls={contentId}
      aria-describedby={joinDescribedBy(
        open ? contentId : undefined,
        ariaDescribedBy,
      )}
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
        class={["bx--toggletip-popover", popoverClass]
          .filter(Boolean)
          .join(" ")}
        style={edgeStyle(popoverAlign)}
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
    intrinsicAlign={effectiveAlign}
    gapTop={PORTAL_GAP}
    gapBottom={PORTAL_GAP}
    horizontalGapLeft={PORTAL_GAP}
    horizontalGapRight={PORTAL_GAP}
    bind:ref={portalRef}
    let:direction={actualDirection}
  >
    {@const popoverAlign = toPopoverAlign(
      actualDirection ?? direction,
      effectiveAlign,
    )}
    <Popover
      open
      relative
      align={popoverAlign}
      id={contentId}
      caret
      highContrast
      class={["bx--toggletip-popover", popoverClass].filter(Boolean).join(" ")}
      style="{PORTAL_NEUTRALIZE_STYLE} {portalNudgeStyle(
        popoverAlign,
        anchorHalf,
      )}"
    >
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class:bx--toggletip-content={true}
        on:keydown={handleKeydown}
        on:focusout={handleFocusout}
      >
        <slot />
      </div>
    </Popover>
  </FloatingPortal>
{/if}
