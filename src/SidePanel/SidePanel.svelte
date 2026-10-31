<script context="module">
  /** Panel widths, as in Carbon React's `SIDE_PANEL_SIZES`. */
  const SIZE_REM = { xs: 16, sm: 20, md: 30, lg: 40, xl: 65, "2xl": 80 };

  // The narrowest a resized panel gets: the `xs` width.
  const MIN_WIDTH = SIZE_REM.xs * 16;
  // The widest, as a share of the window: the panel's CSS cap.
  const MAX_WIDTH_RATIO = 0.75;
  const RESIZE_KEYBOARD_STEP = 16;
  const RESIZE_KEYBOARD_LARGE_STEP = 64;
</script>

<script>
  /**
   * @event close
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   * @event {null} open
   * @event {null} back - Fires when the back button is clicked. It shows while `currentStep` is greater than `0`.
   * @event {{ width: number | undefined }} resize - Fires once the user finishes resizing (drag release, key press or double click) and the width changed. `width` is `undefined` after a double click restores the `size` width.
   * @restProps {div | aside}
   * @slot {{}}
   * @slot {{}} actions - Footer buttons. The panel lays them out in an `ActionSet` sized to the panel.
   * @slot {{}} toolbar - Buttons in the header's action toolbar, below the title.
   * @slot {{}} decorator - An `AILabel`, beside the close button.
   * @slot {{}} subtitleChildren - Rich subtitle content. Overrides `subtitle`.
   */

  /**
   * Set to `true` to open the panel. Opening it moves focus into it; a
   * panel already open when it mounts leaves focus where it is, unless it
   * is modal.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the panel width.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | "2xl"}
   */
  export let size = "md";

  /**
   * Set the edge the panel docks to. `"end"` is the right edge in a
   * left-to-right layout and the left edge in a right-to-left one.
   * Also accepts Carbon React's `"right"` and `"left"`, which map to
   * `"end"` and `"start"`.
   * @type {"start" | "end" | "left" | "right"}
   */
  export let placement = "end";

  /**
   * Set to `true` to push the page content aside instead of covering it.
   * Set `selectorPageContent` to the element to push. A slide-in panel
   * does not move focus, trap it, or close on Escape.
   */
  export let slideIn = false;

  /**
   * Specify a CSS selector for the page content that a `slideIn` panel
   * pushes aside. Without a match, the panel covers the content.
   * @type {string | undefined}
   */
  export let selectorPageContent = undefined;

  /**
   * Set to `true` to dim the page behind the panel. The panel is then
   * modal: it traps focus and locks page scroll. Has no effect when
   * `slideIn` is `true`.
   */
  export let includeOverlay = false;

  /**
   * Control whether clicking the overlay closes the panel.
   * By default, a panel without `actions` closes and a panel with
   * `actions` stays open, as modals do in Carbon v11.
   * Set to `true` to always keep the panel open, or `false` to always
   * close it.
   * @type {boolean | undefined}
   */
  export let preventCloseOnClickOutside = undefined;

  /**
   * Specify the title. It names the panel.
   * @type {string | undefined}
   */
  export let title = undefined;

  /**
   * Specify the subtitle. It describes the panel.
   * @type {string | undefined}
   */
  export let subtitle = undefined;

  /**
   * Specify a label above the title. Renders only with a `title`.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /** Set to `true` to hide the close button */
  export let hideCloseButton = false;

  /** Specify the close button's accessible name */
  export let closeIconDescription = "Close";

  /**
   * Specify the step of a multi-step panel. A step greater than `0`
   * shows a back button, which fires `back`.
   */
  export let currentStep = 0;

  /** Specify the back button's accessible name */
  export let navigationBackIconDescription = "Back";

  /** Set to `true` for 48px footer buttons instead of 64px */
  export let condensedActions = false;

  /**
   * Set to `true` to let the user resize the panel by dragging its free
   * edge, or with the arrow keys once the edge has focus. The handle
   * hides below the `md` breakpoint.
   */
  export let resizable = false;

  /**
   * The width in pixels the user resized the panel to, or `undefined` to
   * follow `size`. Rendered clamped between the `xs` width and 75% of the
   * window. Has no effect unless `resizable` is `true`.
   * @type {number | undefined}
   * @bindable writable
   */
  export let width = undefined;

  /** Specify the ARIA label for the resize handle */
  export let resizeHandleLabel = "Resize side panel";

  /**
   * Specify the delay in milliseconds before hovering the resize handle
   * highlights it and shows the resize cursor.
   */
  export let resizeEnterDelayMs = SEPARATOR_HOVER_DELAY_MS;

  /**
   * Specify a selector for the element to focus when the panel opens.
   * Without a match, focus goes to the first form field, then the close
   * button. Set to `null` to leave focus where it is. A `slideIn` panel
   * focuses only a match.
   * @type {null | string}
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /**
   * Set an id for the panel.
   * The title and subtitle ids derive from it as `{id}-title` and
   * `{id}-subtitle`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the panel element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { readable, writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import ActionSet from "../ActionSet/ActionSet.svelte";
  import Button from "../Button/Button.svelte";
  import Heading from "../Heading/Heading.svelte";
  import { isHeaderRendered } from "../UIShell/nav-store.js";
  import {
    LAYER_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import { SEPARATOR_HOVER_DELAY_MS } from "../constants/timing.js";
  import ArrowLeft from "../icons/ArrowLeft.svelte";
  import Close from "../icons/Close.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    acquireBodyScrollLock,
    releaseBodyScrollLock,
  } from "../utils/body-scroll-lock.js";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { createDialogLifecycle } from "../utils/dialog-lifecycle.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { focusQuietly, initialFocus, restoreFocus } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { noop } from "../utils/noop.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();
  const layoutDirection = getLayoutDirection();

  let closeButtonRef = null;
  /** @type {null | HTMLDivElement} */
  let innerContentRef = null;
  let mounted = false;
  // Stays `true` through the exit animation, so the panel can play it.
  let rendered = open;
  let closing = false;

  const lifecycle = createDialogLifecycle({
    dispatch,
    setOpen: (value) => {
      open = value;
    },
    preventCloseOnClickOutside: () => preventCloseOnClickOutside,
    passive: () => !$$slots.actions,
    saveFocusReturn: focusReturn.save,
    // The closing panel is inert, so focus goes back at once rather than
    // after the exit animation.
    restoreFocusReturn: () => focusReturn.restore(ref),
    getContainer: () => null,
    focus: () => focusPanel(),
    getOpen: () => open,
  });
  const { close, outsideDismiss } = lifecycle;

  // Inside the panel, menus and tooltips portal out of its scrolling body,
  // as they do in a modal.
  setContext(MODAL_CONTEXT_KEY, {});

  // As modals do in v11, the panel starts a layer at level 0 wherever it
  // renders. Its body is a layer at level 1, so a `Layer` inside sits at 2.
  setContext(LAYER_CONTEXT_KEY, readable(2));

  // The title is one level below the enclosing `Section`, or an `h2`.
  const parentSection = getContext("carbon:Section") ?? readable(1);
  /** @type {import("svelte/store").Writable<number>} */
  const sectionLevel = writable(Math.min($parentSection + 1, 6));
  $: sectionLevel.set(Math.min($parentSection + 1, 6));
  setContext("carbon:Section", sectionLevel);

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);

  /** @param {FocusOptions} [options] */
  function focusPanel(options) {
    if (!ref) return;
    let target;
    if (slideIn) {
      // A slide-in panel sits beside the page, so only an element the
      // consumer asked for takes focus.
      target = selectorPrimaryFocus
        ? /** @type {HTMLElement | null} */ (
            ref.querySelector(selectorPrimaryFocus)
          )
        : null;
    } else {
      target = initialFocus({
        container: ref,
        selectorPrimaryFocus,
        fallbacks: [closeButtonRef, ref],
      });
    }
    // The user didn't ask for a tooltip on the first focus target, so one
    // Escape still closes the panel.
    if (target) focusQuietly(target, options);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open || slideIn) return;
    if (event.key === "Escape") {
      // Escape that cancels an IME composition is not a close, and a
      // control inside the panel may already have used this one.
      if (isImeComposition(event) || event.defaultPrevented) return;
      // A panel nested in this one closes on its own.
      event.stopPropagation();
      close("escape-key");
    } else if (event.key === "Tab" && modal && !event.defaultPrevented) {
      trapFocus({ container: ref, event });
    }
  }

  // Svelte reruns this only when `open` changes. The exit animation ends
  // the render; without one, so does the next tick.
  function syncRendered(nextOpen) {
    if (nextOpen) {
      rendered = true;
      closing = false;
    } else if (rendered) {
      closing = true;
      tick().then(() => {
        if (closing && !hasAnimation(ref)) finishClosing();
      });
    }
  }

  function hasAnimation(element) {
    if (!element) return false;
    const { animationName, animationDuration } = getComputedStyle(element);
    return (
      Boolean(animationName) &&
      animationName !== "none" &&
      animationDuration
        .split(",")
        .some((duration) => Number.parseFloat(duration) > 0)
    );
  }

  function finishClosing() {
    closing = false;
    rendered = false;
  }

  /** @param {AnimationEvent} event */
  function handleAnimationend(event) {
    if (event.target === ref && closing) finishClosing();
  }

  // Resizing, as SideNav's handle does it: `pointerDrag` captures the
  // pointer, the handle takes the arrow keys, and a double click restores
  // the `size` width.
  let resizing = false;
  let resizeStartX = 0;
  let resizeStartWidth = 0;
  // The physical side the panel docks to, read when a gesture starts.
  let dockSide = "right";
  let resizeHovered = false;
  const scheduleResizeHover = createDelayedSetter();

  function maxWidth() {
    return typeof window === "undefined"
      ? Number.POSITIVE_INFINITY
      : Math.round(window.innerWidth * MAX_WIDTH_RATIO);
  }

  function clampWidth(value) {
    return Math.round(Math.max(MIN_WIDTH, Math.min(maxWidth(), value)));
  }

  // `end` docks to the right edge in LTR and the left edge in RTL. Read
  // the direction when a gesture starts: nothing reports a change to an
  // ancestor's `dir`.
  function resolveDockSide() {
    const rtl = resolveLayoutDirection($layoutDirection, ref) === "rtl";
    return (dock === "end") === rtl ? "left" : "right";
  }

  function currentWidth() {
    return renderedWidth ?? Math.round(ref?.getBoundingClientRect().width ?? 0);
  }

  function handleResizeStart(event) {
    resizing = true;
    resizeStartX = event.clientX;
    resizeStartWidth = currentWidth();
    dockSide = resolveDockSide();
    scheduleResizeHover.cancel();
    resizeHovered = true;
    // Dragging over page text would otherwise select it.
    document.body.classList.add("bx--side-panel-resizing");
  }

  function handleResizeMove(event) {
    const delta = event.clientX - resizeStartX;
    // The free edge faces the page, so moving it toward the page widens
    // the panel.
    width = clampWidth(
      resizeStartWidth + (dockSide === "right" ? -delta : delta),
    );
  }

  function stopResizing() {
    if (!resizing) return false;
    resizing = false;
    resizeHovered = false;
    document.body.classList.remove("bx--side-panel-resizing");
    return true;
  }

  function endResizing() {
    if (stopResizing()) dispatchResize(resizeStartWidth);
  }

  // `bind:width` updates on every step of a drag; `resize` fires once per
  // gesture, for example to persist the width.
  function dispatchResize(prevWidth) {
    if (width !== prevWidth) dispatch("resize", { width });
  }

  /** @param {KeyboardEvent} event */
  function handleResizeKeydown(event) {
    const step = event.shiftKey
      ? RESIZE_KEYBOARD_LARGE_STEP
      : RESIZE_KEYBOARD_STEP;
    const start = currentWidth();
    // Arrow keys move the edge the way they point, so they swap with the
    // side the panel docks to.
    const widen = resolveDockSide() === "right" ? "ArrowLeft" : "ArrowRight";
    const narrow = widen === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
    let next;
    if (event.key === widen) next = start + step;
    else if (event.key === narrow) next = start - step;
    else if (event.key === "Home") next = MIN_WIDTH;
    else if (event.key === "End") next = maxWidth();
    else return;
    event.preventDefault();
    const prevWidth = width;
    width = clampWidth(next);
    dispatchResize(prevWidth);
  }

  function handleResizeDblclick() {
    const prevWidth = width;
    width = undefined;
    dispatchResize(prevWidth);
  }

  // Touch has no hover, and a pen or mouse passing over the handle
  // shouldn't flash it.
  /** @param {PointerEvent} event */
  function handleResizePointerenter(event) {
    if (event.pointerType === "touch") return;
    scheduleResizeHover(resizeEnterDelayMs, () => {
      resizeHovered = true;
    });
  }

  function handleResizePointerleave() {
    scheduleResizeHover.cancel();
    if (!resizing) resizeHovered = false;
  }

  // The rendered width, for the handle's value and a slide-in panel's
  // page offset. It follows `size`, the user's width and the CSS caps.
  let measuredWidth;
  let stopMeasuring = noop;

  function measure(node, enabled) {
    stopMeasuring();
    stopMeasuring =
      node && enabled
        ? observeResize(node, () => {
            // Zero means no layout yet (or none at all, as in jsdom).
            measuredWidth =
              Math.round(node.getBoundingClientRect().width) || undefined;
          })
        : noop;
  }

  // A slide-in panel moves the page content's inline margin on the side
  // it docks to, and puts back the consumer's own value on close. The
  // page keeps the transition class while the panel is mounted, so the
  // content slides back too.
  let pageContent = null;
  let pageMarginProperty;
  let pagePushed = false;
  let prevPageMargin = "";

  function setPagePushed(pushed, offset) {
    if (pushed && !pagePushed) {
      prevPageMargin = pageContent.style.getPropertyValue(pageMarginProperty);
    }
    if (pushed || pagePushed) {
      pageContent.style.setProperty(
        pageMarginProperty,
        pushed ? offset : prevPageMargin,
      );
    }
    pagePushed = pushed;
  }

  function releasePage() {
    if (!pageContent) return;
    setPagePushed(false);
    pageContent.classList.remove(
      "bx--side-panel-page",
      "bx--side-panel-page--resizing",
    );
    pageContent = null;
  }

  function syncPage(selector, property, pushed, offset, dragging) {
    const next = selector ? document.querySelector(selector) : null;
    if (next !== pageContent || property !== pageMarginProperty) {
      releasePage();
      if (next instanceof HTMLElement) {
        pageContent = next;
        pageMarginProperty = property;
        next.classList.add("bx--side-panel-page");
      }
    }
    if (!pageContent) return;
    pageContent.classList.toggle("bx--side-panel-page--resizing", dragging);
    setPagePushed(pushed, offset);
  }

  onMount(() => {
    mounted = true;
    lifecycle.setMounted();
    // Open from the first render, the panel is part of the page rather
    // than something the reader opened, so only a modal one takes focus,
    // and without scrolling to it (or scrolling a page that frames this
    // one).
    if (open) {
      tick().then(() => {
        if (open && modal) focusPanel({ preventScroll: true });
      });
    }
    return () => {
      scheduleResizeHover.cancel();
      stopMeasuring();
      stopResizing();
      releasePage();
      if (holdsBodyLock) releaseBodyScrollLock();
    };
  });

  $: dock = placement === "start" || placement === "left" ? "start" : "end";
  $: sizeName = size in SIZE_REM ? size : "md";
  $: modal = includeOverlay && !slideIn;
  // The panel docks under a UI Shell `Header`, as a sticky `Toolbar` does,
  // and spans the full height without one. The server can't tell, so it
  // renders the panel under the header.
  $: noHeader = mounted && !$isHeaderRendered;
  $: lifecycle.syncOpen(open);
  $: syncRendered(open);
  $: resizeEnabled = resizable && rendered;
  $: renderedWidth = resizable && width != null ? clampWidth(width) : undefined;
  // The handle unmounts with the panel, taking its pointer capture (and
  // any `pointerup`) with it; end the drag instead of leaving it on.
  $: if (!resizeEnabled) stopResizing();
  $: measure(ref, rendered && (resizable || slideIn));
  $: if (mounted) {
    syncPage(
      slideIn ? selectorPageContent : undefined,
      dock === "end" ? "margin-inline-end" : "margin-inline-start",
      open,
      measuredWidth === undefined
        ? `${SIZE_REM[sizeName]}rem`
        : `${measuredWidth}px`,
      resizing,
    );
  }

  // Shared and ref-counted with Modal and SideNav.
  let holdsBodyLock = false;
  $: {
    const shouldLock = open && modal;
    if (shouldLock && !holdsBodyLock) {
      holdsBodyLock = true;
      acquireBodyScrollLock();
    } else if (!shouldLock && holdsBodyLock) {
      holdsBodyLock = false;
      releaseBodyScrollLock();
    }
  }

  // A new step starts at the top of the body.
  let prevStep = currentStep;
  $: if (currentStep !== prevStep) {
    prevStep = currentStep;
    if (innerContentRef) innerContentRef.scrollTop = 0;
  }

  $: titleId = `${id}-title`;
  $: subtitleId = `${id}-subtitle`;
  $: hasSubtitle = Boolean(subtitle) || $$slots.subtitleChildren;
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: panelProps,
  } = splitAriaNaming($$restProps));
  // Footer buttons are 64px in large panels, so the header's buttons grow
  // to 40px to match, as in Carbon React.
  /** @type {"field" | "small"} */
  $: headerButtonSize =
    $$slots.actions && /l/.test(sizeName) ? "field" : "small";
  $: resizeMax =
    mounted && measuredWidth !== undefined ? maxWidth() : undefined;
</script>

{#if rendered}
  {#if modal}
    <div
      class:bx--side-panel__overlay={true}
      class:bx--side-panel__overlay--closing={closing}
      class:bx--side-panel__overlay--ai-label={$aiLabelState === "active"}
      aria-hidden="true"
      on:mousedown={(event) => {
        if (event.target === event.currentTarget) outsideDismiss.pressOutside();
      }}
      on:mouseup={outsideDismiss.release}
    ></div>
  {/if}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <svelte:element
    this={slideIn ? "aside" : "div"}
    bind:this={ref}
    {id}
    role={slideIn ? undefined : "dialog"}
    aria-modal={modal ? "true" : undefined}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ??
      (ariaLabel === undefined && title ? titleId : undefined)}
    aria-describedby={joinDescribedBy(
      hasSubtitle ? subtitleId : undefined,
      ariaDescribedBy,
    )}
    tabindex="-1"
    inert={closing || undefined}
    class:bx--side-panel={true}
    class:bx--layer-one={true}
    class:bx--side-panel--xs={sizeName === "xs"}
    class:bx--side-panel--sm={sizeName === "sm"}
    class:bx--side-panel--md={sizeName === "md"}
    class:bx--side-panel--lg={sizeName === "lg"}
    class:bx--side-panel--xl={sizeName === "xl"}
    class:bx--side-panel--2xl={sizeName === "2xl"}
    class:bx--side-panel--start={dock === "start"}
    class:bx--side-panel--end={dock === "end"}
    class:bx--side-panel--slide-in={slideIn}
    class:bx--side-panel--overlay={modal}
    class:bx--side-panel--resizing={resizing}
    class:bx--side-panel--condensed-actions={condensedActions}
    class:bx--side-panel--decorator={$$slots.decorator}
    class:bx--side-panel--ai-label={$aiLabelState === "active"}
    class:bx--side-panel--closing={closing}
    class:bx--side-panel--no-header={noHeader}
    style:width={renderedWidth === undefined ? undefined : `${renderedWidth}px`}
    {...panelProps}
    on:keydown
    on:keydown={handleKeydown}
    on:mousedown={outsideDismiss.pressInside}
    on:animationend={handleAnimationend}
  >
    {#if resizable}
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={renderedWidth ??
          measuredWidth ??
          SIZE_REM[sizeName] * 16}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={resizeMax}
        aria-label={resizeHandleLabel}
        aria-controls={id}
        tabindex="0"
        class:bx--side-panel__resize-handle={true}
        class:bx--side-panel__resize-handle--hover={resizeHovered}
        use:pointerDrag={{
          enabled: resizeEnabled,
          onStart: handleResizeStart,
          onMove: handleResizeMove,
          onEnd: endResizing,
        }}
        on:keydown={handleResizeKeydown}
        on:dblclick={handleResizeDblclick}
        on:pointerenter={handleResizePointerenter}
        on:pointerleave={handleResizePointerleave}
      ></div>
    {/if}
    <div
      class:bx--side-panel__header={true}
      class:bx--side-panel__header--title={Boolean(title)}
      class:bx--side-panel__header--subtitle={hasSubtitle}
      class:bx--side-panel__header--back={currentStep > 0}
      class:bx--side-panel__header--toolbar={$$slots.toolbar}
      class:bx--side-panel__header--lg={headerButtonSize === "field"}
    >
      {#if currentStep > 0}
        <Button
          kind="ghost"
          size={headerButtonSize}
          icon={ArrowLeft}
          iconDescription={navigationBackIconDescription}
          tooltipPosition="bottom"
          tooltipAlignment="start"
          class="bx--side-panel__back"
          on:click={() => dispatch("back")}
        />
      {/if}
      {#if title && labelText}
        <p class:bx--side-panel__label={true}>{labelText}</p>
      {/if}
      {#if title}
        <Heading id={titleId} class="bx--side-panel__title">{title}</Heading>
      {/if}
      {#if hasSubtitle}
        <div id={subtitleId} class:bx--side-panel__subtitle={true}>
          <slot name="subtitleChildren">{subtitle}</slot>
        </div>
      {/if}
      {#if $$slots.toolbar}
        <div class:bx--side-panel__toolbar={true}>
          <slot name="toolbar" />
        </div>
      {/if}
      {#if $$slots.decorator || !hideCloseButton}
        <div class:bx--side-panel__corner={true}>
          {#if $$slots.decorator}
            <Decorator
              class="bx--side-panel__decorator"
              state={aiLabelState}
              labelSize="xs"
            >
              <slot name="decorator" />
            </Decorator>
          {/if}
          {#if !hideCloseButton}
            <Button
              bind:ref={closeButtonRef}
              kind="ghost"
              size={headerButtonSize}
              icon={Close}
              iconDescription={closeIconDescription}
              tooltipPosition="bottom"
              tooltipAlignment="end"
              class="bx--side-panel__close"
              on:click={() => close("close-button")}
            />
          {/if}
        </div>
      {/if}
    </div>
    <div
      bind:this={innerContentRef}
      class:bx--side-panel__body={true}
      class:bx--layer-two={true}
    >
      <slot />
    </div>
    {#if $$slots.actions}
      <ActionSet
        size={sizeName === "xs" ? "sm" : sizeName}
        class="bx--side-panel__actions"
      >
        <slot name="actions" />
      </ActionSet>
    {/if}
  </svelte:element>
{/if}
