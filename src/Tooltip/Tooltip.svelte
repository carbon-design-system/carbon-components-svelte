<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @event {null} open
   * @event {null} close
   * @restProps {div}
   * @slot {{}} triggerChildren - Custom trigger content. Replaces `triggerText`.
   * @deprecated use the `triggerChildren` slot
   * @slot {{}} triggerText
   */

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Above and below the icon, `start` and `end` name inline sides, so they
   * swap under `dir="rtl"`.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the button.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the tooltip.
   * @type {boolean}
   * @bindable writable
   */
  export let open = false;

  /**
   * Set to `true` to hide the tooltip icon.
   * @type {boolean}
   */
  export let hideIcon = false;

  /**
   * Specify the icon to render for the tooltip button.
   * Defaults to `<Information />`.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (Information);

  /** Specify the ARIA label for the tooltip button */
  export let iconDescription = "Show information";

  /** Specify the icon name attribute */
  export let iconName = "";

  /**
   * Set the button tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /**
   * Set an id for the tooltip.
   * @type {string}
   */
  export let tooltipId = uniqueId();

  /**
   * Set an id for the tooltip button.
   * @type {string}
   */
  export let triggerId = uniqueId();

  /**
   * Set the tooltip button text.
   * Alternatively, use the "triggerChildren" slot.
   */
  export let triggerText = "";

  /**
   * Specify the duration in milliseconds to delay before displaying the tooltip.
   * Defaults to the enclosing `TooltipGroup`'s delay, or `100`.
   * @type {number | undefined}
   */
  export let enterDelayMs = undefined;

  /**
   * Specify the duration in milliseconds to delay before hiding the tooltip.
   * Defaults to the enclosing `TooltipGroup`'s delay, or `300`.
   * @type {number | undefined}
   */
  export let leaveDelayMs = undefined;

  /**
   * Obtain a reference to the trigger text HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * Obtain a reference to the tooltip HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let refTooltip = null;

  /**
   * Obtain a reference to the icon HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let refIcon = null;

  /**
   * Set to `true` to always render the tooltip in a portal, or `false` to
   * keep it in place. Left unset, the tooltip moves to a portal inside a
   * `Modal`, or when a box around it (`overflow` other than `visible`)
   * would cut it off.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { get, writable } from "svelte/store";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import Information from "../icons/Information.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { clippedBy, windowShift } from "../utils/fit-align.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { physicalAlign } from "../utils/inline-align.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import { uniqueId } from "../utils/unique-id.js";

  const insideModal = getContext(MODAL_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const tooltipOpen = writable(open);
  /**
   * Tracks whether the latest open was triggered by mouse hover. TooltipFooter
   * reads this to avoid stealing focus on hover; focus only moves into the
   * footer when the tooltip is opened via keyboard or programmatically.
   * @type {import("svelte/store").Writable<boolean>}
   */
  const openedByHover = writable(false);

  let focusByMouse = false;

  // Set for one open when the in-place tooltip turns out to be cut off by
  // a box around it (a scrolling panel, an `overflow: hidden` card): it
  // moves to a portal instead. Only when `portalTooltip` is left unset.
  let portalWhenClipped = false;
  $: if (!open) portalWhenClipped = false;

  $: effectivePortalTooltip =
    portalTooltip === undefined
      ? !!insideModal || portalWhenClipped
      : portalTooltip;

  // The side the tooltip opens on: `direction`, unless it doesn't fit there
  // and fits on the other side (in place; a portalled tooltip flips itself).
  /** @type {"top" | "bottom" | null} */
  let flip = null;
  $: placement = flip ?? direction;

  // How far an above or below tooltip slides to stay inside the window; the
  // caret slides back by as much, so it still points at the trigger.
  let shift = 0;

  /** @type {null | HTMLElement} */
  let refPortalTooltip = null;

  $: if (!open) {
    flip = null;
    shift = 0;
  }

  setContext("carbon:Tooltip", { tooltipOpen, openedByHover });

  // Hover scheduling shared with the tooltip group: moving here from another
  // group tooltip skips the enter delay.
  const tooltipHandoff = createTooltipHandoff({
    group: getTooltipGroup(),
    enterDelayMs: () => enterDelayMs,
    leaveDelayMs: () => leaveDelayMs,
    rich: true,
  });

  function handleMouseenter() {
    openedByHover.set(true);
    tooltipHandoff.scheduleEnter(() => {
      open = true;
    });
  }

  function handleMouseleave() {
    tooltipHandoff.scheduleLeave(() => {
      open = false;
    });
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key === "Escape") {
      // Escape that cancels an IME composition is not a close.
      if (isImeComposition(event)) return;
      // Let Escape reach a parent (e.g. a Modal) when nothing was dismissed.
      if (open) event.stopPropagation();
      // With `hideIcon`, the trigger is `ref` and `refIcon` is never bound.
      (hideIcon ? ref : refIcon)?.focus();
      open = false;
    }
  }

  // A hover-opened tooltip must close on Escape wherever focus is. Runs in
  // the capture phase so it closes before an ancestor (e.g. a Modal) sees
  // Escape. Focus inside the tooltip is left to `handleKeydown`, so nested
  // widgets still get Escape first.
  function handleWindowKeydown(event) {
    // Escape that cancels an IME composition is not a close.
    if (event.key !== "Escape" || !open || isImeComposition(event)) return;
    const target = event.target;
    if (ref?.contains(target) || refTooltip?.contains(target)) return;
    event.stopPropagation();
    open = false;
  }

  // Bound to both the trigger and the tooltip content (which can hold
  // interactive elements, e.g. a `Link` or `TooltipFooter` button). Using
  // `focusout` instead of `blur` lets a single listener on the content
  // wrapper catch focus leaving any of its descendants, since `blur` doesn't
  // bubble. Without this, tabbing out of content past the trigger's own
  // blur never closes the tooltip, leaving it open indefinitely.
  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = /** @type {Node | null} */ (event.relatedTarget);
    const stillInside = ref?.contains(next) || refTooltip?.contains(next);
    if (!stillInside) {
      open = false;
    }
    focusByMouse = false;
  }

  function handleFocus() {
    if (!focusByMouse) {
      openedByHover.set(false);
      open = true;
    }
  }

  function handleMousedown() {
    focusByMouse = true;
  }

  onMount(() => {
    // A hover-opened tooltip closes when another tooltip takes the active
    // slot. One opened by keyboard stays open so focus inside it isn't
    // lost. Subscribed rather than `$:` so the close can't race this
    // tooltip's own claim when it opens.
    const unsubscribeOthersActive = tooltipHandoff.hidden.subscribe(
      (othersActive) => {
        if (othersActive && open && get(openedByHover)) open = false;
      },
    );

    return () => {
      unsubscribeOthersActive();
      tooltipHandoff.cancel();
      tooltipHandoff.release();
    };
  });

  function position() {
    if (!(open && !effectivePortalTooltip && ref && refTooltip)) return;
    const direction = placement;

    const button = ref.getBoundingClientRect();
    const tooltip = refTooltip.getBoundingClientRect();

    let iconWidth = 16;
    let iconHeight = 16;

    if (refIcon) {
      const icon = refIcon.getBoundingClientRect();
      iconWidth = icon.width;
      iconHeight = icon.height;
    }

    // The icon's right edge, from the label's left. The icon ends the label
    // in LTR and starts it in RTL.
    const iconRight =
      refIcon && !hideIcon
        ? refIcon.getBoundingClientRect().right - button.left
        : button.width;

    let offsetX = 0;
    let offsetY = 0;

    switch (direction) {
      case "bottom":
        if (hideIcon) {
          offsetX = -1 * (tooltip.width / 2 - button.width / 2);
        } else {
          offsetX = -1 * (tooltip.width / 2 - iconRight + iconWidth / 2);
        }
        offsetY = iconHeight / 2;
        break;
      case "right":
        offsetX = iconRight + 6;
        offsetY = -1 * (tooltip.height / 2 + iconWidth / 2 - 3);
        break;
      case "left":
        if (hideIcon) {
          offsetX = -1 * (tooltip.width + 6 + 1);
        } else {
          offsetX = -1 * (tooltip.width - iconRight + iconWidth + 8);
        }
        offsetY = -1 * (tooltip.height / 2 + button.height) - 2;
        break;
      case "top":
        if (hideIcon) {
          offsetX = -1 * (tooltip.width / 2 - button.width / 2);
        } else {
          // The 1px nudge mirrors too.
          offsetX =
            -1 *
            (tooltip.width / 2 - iconRight + iconWidth / 2 + (rtl ? -1 : 1));
        }
        offsetY = -1 * (tooltip.height + button.height + iconWidth / 2 - 1);
        break;
    }

    // `left` is from the containing block, which starts where the label
    // does only in LTR.
    const container = refTooltip.offsetParent;
    if (container) {
      offsetX +=
        button.left -
        container.getBoundingClientRect().left -
        container.clientLeft;
    }

    refTooltip.style.left = `${offsetX}px`;
    refTooltip.style.marginTop = `${offsetY}px`;

    const rect = refTooltip.getBoundingClientRect();
    const height = document.documentElement.clientHeight;
    // A tooltip open while scrolled out of view has no window to fit.
    const inView = button.bottom >= 0 && button.top <= height;
    if (
      inView &&
      flip === null &&
      direction === "bottom" &&
      rect.bottom > height
    ) {
      if (button.top - rect.height - iconHeight > 0) {
        flip = "top";
        return;
      }
    } else if (
      inView &&
      flip === null &&
      direction === "top" &&
      rect.top < 0 &&
      button.bottom + rect.height + iconHeight < height
    ) {
      flip = "bottom";
      return;
    }

    shift =
      direction === "top" || direction === "bottom"
        ? windowShift(refTooltip, 0)
        : 0;
    refTooltip.style.left = `${offsetX + shift}px`;

    if (portalTooltip === undefined && clippedBy(refTooltip)) {
      portalWhenClipped = true;
    }
  }

  // A portalled tooltip is placed by `FloatingPortal`, which rewrites the
  // portal's style on every placement (open, scroll, resize); slide the
  // tooltip within it after each.
  function slidePortalTooltip() {
    if (!refPortalTooltip || !refTooltip) return;
    const side = refTooltip.dataset.floatingDirection;
    const next =
      side === "top" || side === "bottom"
        ? windowShift(refPortalTooltip, shift)
        : 0;
    // Each slide restyles the tooltip, not the portal, so this settles; skip
    // sub-pixel changes so a re-placement doesn't re-render for nothing.
    if (Math.abs(next - shift) >= 0.5) shift = next;
  }

  /** @param {HTMLElement} node */
  function watchPortal(node) {
    const observer = new MutationObserver(slidePortalTooltip);
    const portal = node.closest("[data-floating-portal]");
    if (portal) {
      observer.observe(portal, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
    requestAnimationFrame(slidePortalTooltip);
    return { destroy: () => observer.disconnect() };
  }

  /**
   * Reads `ref` here, not in `$:`: see the repositioning block below.
   * @param {"ltr" | "rtl" | undefined} contextDirection
   */
  function readRtl(contextDirection) {
    return resolveLayoutDirection(contextDirection, ref) === "rtl";
  }

  // Read the direction when the tooltip opens: nothing reports a `dir`
  // change. Above and below the icon, `start` and `end` are inline sides.
  $: rtl = open && readRtl($layoutDirection);
  $: sideAlign =
    direction === "top" || direction === "bottom"
      ? physicalAlign(align, rtl)
      : align;

  // Reposition only when the tooltip opens or an input that affects its
  // geometry changes—not on every unrelated re-render of this component
  // (unlike `afterUpdate`, which would force a synchronous reflow each time).
  // The DOM must be committed before measuring, so defer behind `tick()`.
  //
  // `ref`/`refTooltip`/`refIcon` are intentionally NOT read here: they're
  // `bind:this` targets, and Svelte's compiled output re-invalidates a
  // `bind:this` binding on every component update regardless of whether the
  // element identity actually changed, which would make this block refire
  // on every unrelated re-render. `position()` already null-checks them.
  $: if (open && !effectivePortalTooltip) {
    void placement;
    void hideIcon;
    void rtl;
    void sideAlign;
    tick().then(position);
  }

  $: tooltipOpen.set(open);
  $: if (open) tooltipHandoff.claim();
  else tooltipHandoff.release();
  $: if (!open) openedByHover.set(false);
  $: notifyOpenChange(open);
  // Naming and description belong on the `role="button"` trigger, not the
  // wrapper. A consumer `aria-describedby` joins the open tooltip id; a
  // consumer `aria-label` or `aria-labelledby` replaces the built-in name.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: buttonProps = {
    role: "button",
    "aria-haspopup": "true",
    id: hideIcon ? triggerId : undefined,
    class: hideIcon ? "bx--tooltip__label" : "bx--tooltip__trigger",
    "aria-expanded": open,
    "aria-describedby": joinDescribedBy(
      open ? tooltipId : undefined,
      ariaDescribedBy,
    ),
    "aria-labelledby":
      ariaLabelledBy ??
      (ariaLabel ? undefined : triggerText ? triggerId : undefined),
    "aria-label": ariaLabel ?? (triggerText ? undefined : iconDescription),
    tabindex,
    style: hideIcon ? $$restProps.style : undefined,
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  use:dismiss={{
    enabled: open,
    type: "keydown",
    handler: handleWindowKeydown,
    options: { capture: true },
  }}
  style:position="relative"
  style:z-index={open ? 1 : undefined}
  {...wrapperProps}
  on:mouseleave={handleMouseleave}
>
  {#if !hideIcon}
    <div bind:this={ref} id={triggerId} class:bx--tooltip__label={true}>
      <slot name="triggerChildren"
        ><slot name="triggerText">{triggerText}</slot></slot
      >
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={refIcon}
        {...buttonProps}
        on:mouseenter={handleMouseenter}
        on:mousedown={handleMousedown}
        on:focus={handleFocus}
        on:focusout={handleFocusout}
        on:keydown={handleKeydown}
      >
        <slot name="icon">
          <svelte:component this={icon} name={iconName} />
        </slot>
      </div>
    </div>
  {:else}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      bind:this={ref}
      {...buttonProps}
      on:mouseenter={handleMouseenter}
      on:mousedown={handleMousedown}
      on:focus={handleFocus}
      on:focusout={handleFocusout}
      on:keydown={handleKeydown}
    >
      <slot name="triggerChildren"
        ><slot name="triggerText">{triggerText}</slot></slot
      >
    </div>
  {/if}
  {#if open && !effectivePortalTooltip}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      bind:this={refTooltip}
      id={tooltipId}
      data-floating-menu-direction={placement}
      class:bx--tooltip={true}
      class:bx--tooltip--shown={open}
      class:bx--tooltip--top={placement === "top"}
      class:bx--tooltip--right={placement === "right"}
      class:bx--tooltip--bottom={placement === "bottom"}
      class:bx--tooltip--left={placement === "left"}
      class:bx--tooltip--align-center={sideAlign === "center"}
      class:bx--tooltip--align-start={sideAlign === "start"}
      class:bx--tooltip--align-end={sideAlign === "end"}
      style:width="max-content"
      on:mouseenter={handleMouseenter}
      on:focusout={handleFocusout}
      on:keydown={handleKeydown}
    >
      <span
        class:bx--tooltip__caret={true}
        style:left={shift ? `${-shift}px` : undefined}
        style:right={shift ? `${shift}px` : undefined}
      ></span>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        on:click|stopPropagation
        on:mousedown|stopPropagation
        class:bx--tooltip__content={true}
        tabindex="-1"
        role="dialog"
        aria-labelledby={triggerId}
      >
        <slot />
      </div>
    </div>
  {/if}
</div>

{#if effectivePortalTooltip}
  <FloatingPortal
    anchor={hideIcon ? ref : refIcon}
    {direction}
    {open}
    gapTop={8}
    gapBottom={10}
    horizontalGapLeft={16}
    horizontalGapRight={6}
    verticalAlignOffsetLeft={-10}
    verticalAlignOffsetRight={4}
    bind:ref={refTooltip}
    let:direction={actualDirection}
  >
    <div
      style="display: flex; justify-content: center; align-items: center;"
      use:watchPortal
    >
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={refPortalTooltip}
        id={tooltipId}
        data-floating-menu-direction={actualDirection}
        class:bx--tooltip={true}
        class:bx--tooltip--shown={open}
        class:bx--tooltip--top={actualDirection === "top"}
        class:bx--tooltip--right={actualDirection === "right"}
        class:bx--tooltip--bottom={actualDirection === "bottom"}
        class:bx--tooltip--left={actualDirection === "left"}
        class:bx--tooltip--align-center={sideAlign === "center"}
        class:bx--tooltip--align-start={sideAlign === "start"}
        class:bx--tooltip--align-end={sideAlign === "end"}
        style="position: relative; transform: none; display: block; margin-top: 0;"
        style:left="{shift}px"
        on:mouseenter={handleMouseenter}
        on:mouseleave={handleMouseleave}
        on:focusout={handleFocusout}
        on:keydown={handleKeydown}
      >
        <span
          class:bx--tooltip__caret={true}
          style:left={shift ? `${-shift}px` : undefined}
          style:right={shift ? `${shift}px` : undefined}
        ></span>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <div
          on:click|stopPropagation
          on:mousedown|stopPropagation
          class:bx--tooltip__content={true}
          tabindex="-1"
          role="dialog"
          aria-labelledby={triggerId}
        >
          <slot />
        </div>
      </div>
    </div>
  </FloatingPortal>
{/if}
