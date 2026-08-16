<script>
  /**
   * @template [Icon=any]
   * @event {null} open
   * @event {null} close
   */

  /**
   * Set the alignment of the tooltip relative to the icon.
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

  /** Set the tooltip button text */
  export let triggerText = "";

  /**
   * Specify the duration in milliseconds to delay before displaying the tooltip.
   * @type {number}
   */
  export let enterDelayMs = 100;

  /**
   * Specify the duration in milliseconds to delay before hiding the tooltip.
   * @type {number}
   */
  export let leaveDelayMs = 300;

  /**
   * Obtain a reference to the trigger text HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Obtain a reference to the tooltip HTML element.
   * @bindable readonly
   */
  export let refTooltip = null;

  /**
   * Obtain a reference to the icon HTML element.
   * @bindable readonly
   */
  export let refIcon = null;

  /**
   * Set to `true` to render the tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
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
  import { writable } from "svelte/store";
  import Information from "../icons/Information.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { createDelayedSetter } from "../utils/delayedSetter.js";
  import { uniqueId } from "../utils/uniqueId.js";

  const insideModal = getContext("carbon:Modal");

  const dispatch = createEventDispatcher();
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

  let prevOpen = undefined;
  let focusByMouse = false;

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  setContext("carbon:Tooltip", { tooltipOpen, openedByHover });

  const scheduleOpen = createDelayedSetter();

  function onMouseEnter() {
    openedByHover.set(true);
    scheduleOpen(enterDelayMs, () => {
      open = true;
    });
  }

  function onMouseLeave() {
    scheduleOpen(leaveDelayMs, () => {
      open = false;
    });
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      refIcon?.focus();
      open = false;
    }
  }

  // Bound to both the trigger and the tooltip content (which can hold
  // interactive elements, e.g. a `Link` or `TooltipFooter` button). Using
  // `focusout` instead of `blur` lets a single listener on the content
  // wrapper catch focus leaving any of its descendants, since `blur` doesn't
  // bubble. Without this, tabbing out of content past the trigger's own
  // blur never closes the tooltip, leaving it open indefinitely.
  function onFocusOut(event) {
    const next = event.relatedTarget;
    const stillInside = ref?.contains(next) || refTooltip?.contains(next);
    if (!stillInside) {
      open = false;
    }
    focusByMouse = false;
  }

  function onFocus() {
    if (!focusByMouse) {
      openedByHover.set(false);
      open = true;
    }
  }

  function onMouseDown() {
    focusByMouse = true;
  }

  onMount(() => {
    return () => {
      scheduleOpen.cancel();
    };
  });

  function position() {
    if (!(open && !effectivePortalTooltip && ref && refTooltip)) return;

    const button = ref.getBoundingClientRect();
    const tooltip = refTooltip.getBoundingClientRect();

    let iconWidth = 16;
    let iconHeight = 16;

    if (refIcon) {
      const icon = refIcon.getBoundingClientRect();
      iconWidth = icon.width;
      iconHeight = icon.height;
    }

    let offsetX = 0;
    let offsetY = 0;

    switch (direction) {
      case "bottom":
        if (hideIcon) {
          offsetX = -1 * (tooltip.width / 2 - button.width / 2);
        } else {
          offsetX = -1 * (tooltip.width / 2 - button.width + iconWidth / 2);
        }
        offsetY = iconHeight / 2;
        break;
      case "right":
        offsetX = button.width + 6;
        offsetY = -1 * (tooltip.height / 2 + iconWidth / 2 - 3);
        break;
      case "left":
        if (hideIcon) {
          offsetX = -1 * (tooltip.width + 6 + 1);
        } else {
          offsetX = -1 * (tooltip.width - button.width + iconWidth + 8);
        }
        offsetY = -1 * (tooltip.height / 2 + button.height) - 2;
        break;
      case "top":
        if (hideIcon) {
          offsetX = -1 * (tooltip.width / 2 - button.width / 2);
        } else {
          offsetX = -1 * (tooltip.width / 2 - button.width + iconWidth / 2 + 1);
        }
        offsetY = -1 * (tooltip.height + button.height + iconWidth / 2 - 1);
        break;
    }

    refTooltip.style.left = `${offsetX}px`;
    refTooltip.style.marginTop = `${offsetY}px`;
  }

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
    void direction;
    void hideIcon;
    tick().then(position);
  }

  $: tooltipOpen.set(open);
  $: if (!open) openedByHover.set(false);
  $: {
    const shouldDispatch = prevOpen !== undefined;
    const nextOpen = open;
    prevOpen = open;
    if (shouldDispatch) {
      dispatch(nextOpen ? "open" : "close");
    }
  }
  $: buttonProps = {
    role: "button",
    "aria-haspopup": "true",
    id: hideIcon ? triggerId : undefined,
    class: hideIcon ? "bx--tooltip__label" : "bx--tooltip__trigger",
    "aria-expanded": open,
    "aria-describedby": open ? tooltipId : undefined,
    "aria-labelledby": triggerText ? triggerId : undefined,
    "aria-label": triggerText ? undefined : iconDescription,
    tabindex,
    style: hideIcon ? $$restProps.style : undefined,
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  style:position="relative"
  style:z-index={open ? 1 : undefined}
  {...$$restProps}
  on:mouseleave={onMouseLeave}
>
  {#if !hideIcon}
    <div bind:this={ref} id={triggerId} class:bx--tooltip__label={true}>
      <slot name="triggerText">{triggerText}</slot>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={refIcon}
        {...buttonProps}
        aria-describedby={tooltipId}
        on:mouseenter={onMouseEnter}
        on:mousedown={onMouseDown}
        on:focus={onFocus}
        on:focusout={onFocusOut}
        on:keydown={onKeydown}
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
      aria-describedby={tooltipId}
      on:mouseenter={onMouseEnter}
      on:mousedown={onMouseDown}
      on:focus={onFocus}
      on:focusout={onFocusOut}
      on:keydown={onKeydown}
    >
      <slot name="triggerText">{triggerText}</slot>
    </div>
  {/if}
  {#if open && !effectivePortalTooltip}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      bind:this={refTooltip}
      id={tooltipId}
      data-floating-menu-direction={direction}
      class:bx--tooltip={true}
      class:bx--tooltip--shown={open}
      class:bx--tooltip--top={direction === "top"}
      class:bx--tooltip--right={direction === "right"}
      class:bx--tooltip--bottom={direction === "bottom"}
      class:bx--tooltip--left={direction === "left"}
      class:bx--tooltip--align-center={align === "center"}
      class:bx--tooltip--align-start={align === "start"}
      class:bx--tooltip--align-end={align === "end"}
      style:width="max-content"
      on:mouseenter={onMouseEnter}
      on:focusout={onFocusOut}
      on:keydown={onKeydown}
    >
      <span class:bx--tooltip__caret={true}></span>
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
    <div style="display: flex; justify-content: center; align-items: center;">
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        id={tooltipId}
        data-floating-menu-direction={actualDirection}
        class:bx--tooltip={true}
        class:bx--tooltip--shown={open}
        class:bx--tooltip--top={actualDirection === "top"}
        class:bx--tooltip--right={actualDirection === "right"}
        class:bx--tooltip--bottom={actualDirection === "bottom"}
        class:bx--tooltip--left={actualDirection === "left"}
        class:bx--tooltip--align-center={align === "center"}
        class:bx--tooltip--align-start={align === "start"}
        class:bx--tooltip--align-end={align === "end"}
        style="position: relative; transform: none; display: block; left: auto; margin-top: 0;"
        on:mouseenter={onMouseEnter}
        on:focusout={onFocusOut}
        on:keydown={onKeydown}
      >
        <span class:bx--tooltip__caret={true}></span>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <div
          on:click|stopPropagation
          on:mousedown|stopPropagation
          class:bx--tooltip__content={true}
          tabindex="-1"
          role="dialog"
        >
          <slot />
        </div>
      </div>
    </div>
  </FloatingPortal>
{/if}
