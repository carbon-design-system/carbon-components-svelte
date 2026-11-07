<script context="module">
  /**
   * Where the sheet rests: `"peek"` (120px), `"half"` (half the window),
   * `"full"` (the window less a gap), `"content"` (fit the content), a
   * number of px, or a share of the window such as `"75%"`.
   * @typedef {"peek" | "half" | "full" | "content" | number | `${number}%`} BottomSheetSnapPoint
   */

  /**
   * The context for a `resizeValueText` function.
   * @typedef {object} BottomSheetValueTextInfo
   * @property {BottomSheetSnapPoint} snapPoint
   * @property {number} index - The position among the sorted snap points.
   * @property {number} count
   * @property {number} height - The visible height in px.
   * @property {number} available - The height of the window in px.
   */

  /** @param {BottomSheetValueTextInfo} info */
  function defaultValueText({ snapPoint, height, available }) {
    if (snapPoint === "peek") return "Peek";
    if (snapPoint === "half") return "Half height";
    if (snapPoint === "full") return "Full height";
    if (snapPoint === "content") return "Fit to content";
    return `${Math.round((height / (available || height)) * 100)}% height`;
  }

  /** @type {Record<string, number>} */
  const BREAKPOINTS = { sm: 320, md: 672, lg: 1056, xlg: 1312, max: 1584 };
</script>

<script>
  /**
   * @event close
   * @property {"escape-key" | "outside-click" | "close-button" | "drag" | "programmatic"} trigger
   * @event {null} open
   * @event snap - Fires when the user moves the sheet to another snap point, by dragging, keyboard or by focusing a field the sheet hides.
   * @property {BottomSheetSnapPoint} snapPoint
   * @property {number} index - The position among the sorted snap points.
   * @property {"drag" | "keyboard" | "focus"} trigger
   * @restProps {div | aside}
   * @slot {{}}
   * @slot {{}} actions - Footer buttons. The sheet lays them out in an `ActionSet`.
   */

  /**
   * Set to `true` to open the sheet. A modal sheet moves focus into
   * itself and returns it on close. A sheet already open when it mounts
   * leaves focus where it is, unless it is modal.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the heights the sheet rests at. The sheet opens at the
   * shortest and the user moves it between them. Heights are limited to
   * the window less a gap, and ones that land on the same height merge.
   * @type {BottomSheetSnapPoint[]}
   */
  export let snapPoints = ["half", "full"];

  /**
   * The snap point the sheet rests at, one of `snapPoints`. `undefined`
   * opens at the shortest. Dragging or keys update it.
   * @type {BottomSheetSnapPoint | undefined}
   * @bindable writable
   */
  export let snapPoint = undefined;

  /**
   * Set to `false` for a sheet that sits beside the page, like the
   * results sheet of a map: no scrim, no focus trap, no scroll lock, and
   * the page stays usable. A modal sheet is a dialog. A non-modal one is a
   * `complementary` landmark.
   */
  export let modal = true;

  /**
   * Set to `false` to keep the sheet from closing: dragging it below the
   * shortest snap point stretches instead of dismissing, Escape
   * does nothing and the close button hides.
   */
  export let dismissible = true;

  /**
   * Specify the window width at which the sheet stops being a sheet. At
   * and above it, a modal sheet is a centered dialog and a non-modal one
   * docks to the inline-end edge, with no grabber and no snap points. Set a
   * width in px, one of Carbon's breakpoint names, or `false` to stay a
   * sheet at every width. Until the page loads, the server renders a sheet.
   * @type {"sm" | "md" | "lg" | "xlg" | "max" | number | false}
   */
  export let breakpoint = "md";

  /**
   * Specify the title. It names the sheet.
   * @type {string | undefined}
   */
  export let title = undefined;

  /**
   * Control whether clicking the scrim closes the sheet.
   * By default, a sheet without `actions` closes and a sheet with
   * `actions` stays open, as modals do in Carbon v11.
   * @type {boolean | undefined}
   */
  export let preventCloseOnClickOutside = undefined;

  /** Set to `true` to hide the close button. */
  export let hideCloseButton = false;

  /** Specify the close button's accessible name. */
  export let closeIconDescription = "Close";

  /**
   * Specify the grabber's accessible name. The grabber is a slider over
   * the snap points when there are two or more.
   */
  export let resizeLabel = "Resize sheet";

  /**
   * Specify the grabber's `aria-valuetext` for a snap point, for example
   * to translate it.
   * @type {(info: BottomSheetValueTextInfo) => string}
   */
  export let resizeValueText = defaultValueText;

  /**
   * Specify a selector for the element to focus when a modal sheet opens.
   * Without a match, focus goes to the first form field, then the close
   * button. Set to `null` to leave focus where it is. A non-modal sheet
   * focuses only a match.
   * @type {null | string}
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /**
   * Set an id for the sheet.
   * The title id derives from it as `{id}-title`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the sheet element.
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
  import ActionSet from "../ActionSet/ActionSet.svelte";
  import Button from "../Button/Button.svelte";
  import Heading from "../Heading/Heading.svelte";
  import {
    LAYER_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import Close from "../icons/Close.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    acquireBodyScrollLock,
    releaseBodyScrollLock,
  } from "../utils/body-scroll-lock.js";
  import { sheetTouch } from "../utils/bottom-sheet-touch.js";
  import {
    createVelocityTracker,
    dragHeight,
    resolveSnapPoints,
    settle,
  } from "../utils/bottom-sheet.js";
  import { createDialogLifecycle } from "../utils/dialog-lifecycle.js";
  import { focusQuietly, initialFocus, restoreFocus } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { noop } from "../utils/noop.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();
  const tracker = createVelocityTracker();

  /** @type {null | HTMLDivElement} */
  let headerRef = null;
  /** @type {null | HTMLDivElement} */
  let contentRef = null;
  /** @type {null | HTMLDivElement} */
  let footerRef = null;
  /** @type {null | HTMLButtonElement | HTMLAnchorElement} */
  let closeButtonRef = null;
  let mounted = false;
  // Stays `true` through the exit animation, so the sheet can play it.
  let rendered = open;
  let closing = false;

  // The visible height of the window, less the on-screen keyboard, and
  // how far the keyboard covers the bottom of the layout viewport.
  let available = 0;
  let keyboardInset = 0;
  // The natural height of the header, content and footer.
  let contentHeight = 0;
  let wide = false;
  let reducedMotion = false;
  let dragging = false;
  let dragStart = 0;
  let dragVisible = 0;
  let startY = 0;
  // A sheet dismissed by a drag closes from where the finger left it.
  let dismissedByDrag = false;

  const lifecycle = createDialogLifecycle({
    dispatch,
    setOpen: (value) => {
      open = value;
    },
    preventCloseOnClickOutside: () => preventCloseOnClickOutside,
    passive: () => !$$slots.actions,
    saveFocusReturn: focusReturn.save,
    // The closing sheet is inert, so focus goes back at once rather than
    // after the exit animation.
    restoreFocusReturn: () => focusReturn.restore(ref),
    getContainer: () => null,
    focus: () => focusSheet(),
    getOpen: () => open,
  });
  const { close, outsideDismiss } = lifecycle;

  // Inside the sheet, menus and tooltips portal out of its scrolling body,
  // as they do in a modal.
  setContext(MODAL_CONTEXT_KEY, {});

  // As modals do in v11, the sheet starts a layer at level 0 wherever it
  // renders. Its body is a layer at level 1, so a `Layer` inside sits at 2.
  setContext(LAYER_CONTEXT_KEY, readable(2));

  // The title is one level below the enclosing `Section`, or an `h2`.
  const parentSection = getContext("carbon:Section") ?? readable(1);
  /** @type {import("svelte/store").Writable<number>} */
  const sectionLevel = writable(Math.min($parentSection + 1, 6));
  $: sectionLevel.set(Math.min($parentSection + 1, 6));
  setContext("carbon:Section", sectionLevel);

  /** @param {FocusOptions} [options] */
  function focusSheet(options) {
    if (!ref) return;
    const target = modal
      ? initialFocus({
          container: ref,
          selectorPrimaryFocus,
          fallbacks: [closeButtonRef, ref],
        })
      : // A sheet beside the page takes focus only when asked to.
        selectorPrimaryFocus
        ? /** @type {HTMLElement | null} */ (
            ref.querySelector(selectorPrimaryFocus)
          )
        : null;
    if (target) focusQuietly(target, options);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open) return;
    if (event.key === "Escape") {
      if (!dismissible || isImeComposition(event) || event.defaultPrevented)
        return;
      event.stopPropagation();
      close("escape-key");
    } else if (event.key === "Tab" && modal && !event.defaultPrevented) {
      trapFocus({ container: /** @type {HTMLElement} */ (ref), event });
    }
  }

  // Svelte reruns this only when `open` changes. The exit animation ends
  // the render; without one, so does the next tick.
  /** @param {boolean} nextOpen */
  function syncRendered(nextOpen) {
    if (nextOpen) {
      rendered = true;
      closing = false;
      dismissedByDrag = false;
    } else if (rendered) {
      closing = true;
      tick().then(() => {
        if (closing && !hasAnimation(ref)) finishClosing();
      });
    }
  }

  /** @param {null | HTMLElement} element */
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
    dismissedByDrag = false;
  }

  /** @param {AnimationEvent} event */
  function handleAnimationend(event) {
    if (event.target === ref && closing) finishClosing();
  }

  // Measuring. The window shrinks by the on-screen keyboard in
  // `visualViewport` before it does in the layout viewport, if it does at
  // all, so the sheet sizes itself and sits against the visual viewport.
  function measureViewport() {
    const viewport = window.visualViewport;
    // A pinch-zoomed page reports a smaller viewport that is not a keyboard.
    if (viewport && viewport.scale === 1) {
      available = Math.round(viewport.height);
      keyboardInset = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
      );
    } else {
      available = window.innerHeight;
      keyboardInset = 0;
    }
  }

  function measureContent() {
    contentHeight =
      (headerRef?.offsetHeight ?? 0) +
      (contentRef?.offsetHeight ?? 0) +
      (footerRef?.offsetHeight ?? 0);
  }

  /** @type {() => void} */
  let stopObserving = noop;

  /**
   * @param {boolean} observed
   * @param {null | HTMLElement} header
   * @param {null | HTMLElement} content
   * @param {null | HTMLElement} footer
   */
  function observe(observed, header, content, footer) {
    stopObserving();
    const stops = observed
      ? [header, content, footer]
          .filter((node) => node !== null)
          .map((node) => observeResize(node, measureContent))
      : [];
    stopObserving = () => {
      for (const stop of stops) stop();
    };
  }

  /** @type {() => void} */
  let stopWatchingWidth = noop;

  /** @param {"sm" | "md" | "lg" | "xlg" | "max" | number | false} value */
  function watchWidth(value) {
    stopWatchingWidth();
    if (value === false) {
      wide = false;
      stopWatchingWidth = noop;
      return;
    }
    const px = typeof value === "number" ? value : (BREAKPOINTS[value] ?? 672);
    const query = window.matchMedia(`(min-width: ${px}px)`);
    const update = () => {
      wide = query.matches;
    };
    update();
    query.addEventListener("change", update);
    stopWatchingWidth = () => query.removeEventListener("change", update);
  }

  onMount(() => {
    mounted = true;
    lifecycle.setMounted();
    measureViewport();
    measureContent();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      reducedMotion = motion.matches;
    };
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const viewport = window.visualViewport;
    window.addEventListener("resize", measureViewport);
    viewport?.addEventListener("resize", handleViewport);
    viewport?.addEventListener("scroll", measureViewport);
    // Open from the first render, the sheet is part of the page rather
    // than something the reader opened, so only a modal one takes focus,
    // and without scrolling to it.
    if (open) {
      tick().then(() => {
        if (open && modal) focusSheet({ preventScroll: true });
      });
    }
    return () => {
      motion.removeEventListener("change", updateMotion);
      window.removeEventListener("resize", measureViewport);
      viewport?.removeEventListener("resize", handleViewport);
      viewport?.removeEventListener("scroll", measureViewport);
      stopObserving();
      stopWatchingWidth();
      if (holdsBodyLock) releaseBodyScrollLock();
    };
  });

  function handleViewport() {
    measureViewport();
    // The keyboard opened over a field the sheet now hides.
    const active = document.activeElement;
    if (active && ref?.contains(active)) reveal(active);
  }

  /**
   * The sheet is a tall box moved down by its snap offset, so a field in
   * its lower part can sit below the screen at a short snap point, where
   * the browser has nothing to scroll. Move to the shortest snap point
   * that shows it. The check is in the sheet's own coordinates, so the
   * entrance slide and a lifted keyboard do not fool it.
   * @param {Element} target
   */
  function reveal(target) {
    if (wide || dragging || !ref || !snaps.length) return;
    // The footer rides the visible bottom, so its fields are in view.
    if (footerRef?.contains(target)) return;
    const missing =
      target.getBoundingClientRect().bottom -
      ref.getBoundingClientRect().top -
      restHeight;
    if (missing <= 0) return;
    let next = snaps.length - 1;
    for (let i = index + 1; i < snaps.length; i++) {
      if (snaps[i].height - restHeight >= missing) {
        next = i;
        break;
      }
    }
    if (next > index) go(next, "focus");
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    if (event.target instanceof Element) reveal(event.target);
  }

  // First, so that what `wide` becomes reaches the statements below it.
  $: if (mounted) watchWidth(breakpoint);

  // Snap points, in px, sorted. The sheet shows at `index` unless a drag
  // holds it. All of this follows `snapPoint`, which stays the single
  // source of truth for where the sheet rests.
  $: measured = mounted && available > 0;
  $: snaps = measured
    ? resolveSnapPoints(snapPoints, { available, contentHeight })
    : [];
  $: index = Math.max(
    0,
    snaps.findIndex((snap) => snap.point === snapPoint),
  );
  $: restHeight = snaps[index]?.height ?? 0;
  $: maxHeight = snaps.length ? snaps[snaps.length - 1].height : 0;
  $: minHeight = snaps.length ? snaps[0].height : 0;
  $: visible = dragging || dismissedByDrag ? dragVisible : restHeight;
  $: atMax = visible >= maxHeight - 1;
  $: sheetMode = measured && !wide;

  /**
   * @param {number} next
   * @param {"drag" | "keyboard" | "focus"} trigger
   */
  function go(next, trigger) {
    const snap = snaps[Math.max(0, Math.min(snaps.length - 1, next))];
    if (!snap) return;
    const moved = snap.point !== (snaps[index]?.point ?? snapPoint);
    snapPoint = snap.point;
    if (moved)
      dispatch("snap", { snapPoint: snap.point, index: next, trigger });
  }

  function beginDrag() {
    dragging = true;
    dragStart = restHeight;
    dragVisible = restHeight;
    tracker.reset();
  }

  /**
   * @param {number} travel - Pointer travel in px; positive is down.
   * @param {number} time
   */
  function moveDrag(travel, time) {
    if (!dragging) return;
    tracker.add(travel, time);
    dragVisible = dragHeight({
      start: dragStart,
      delta: -travel,
      min: minHeight,
      max: maxHeight,
      dismissible: dismissible,
      reducedMotion,
    });
  }

  /** @param {number} [time] - When the pointer lifted. */
  function endDrag(time = performance.now()) {
    if (!dragging) return;
    const result = settle({
      height: dragVisible,
      velocity: tracker.velocity(time),
      heights: snaps.map((snap) => snap.height),
      dismissible: dismissible,
    });
    // Release the drag first, so the sheet animates from where it is.
    dragging = false;
    if (result.dismiss) {
      dismissedByDrag = true;
      close("drag");
      // A close that a listener cancels leaves the sheet where it was.
      if (open) dismissedByDrag = false;
    } else {
      go(result.index, "drag");
    }
  }

  /** @param {PointerEvent} event */
  function handlePointerStart(event) {
    if (!sheetMode) return false;
    // A button in the header is a press, not a drag.
    if (
      event.target instanceof Element &&
      event.target.closest("button, a, input, select, textarea")
    ) {
      return false;
    }
    startY = event.clientY;
    beginDrag();
    return true;
  }

  /** @param {PointerEvent} event */
  function handlePointerMove(event) {
    moveDrag(event.clientY - startY, event.timeStamp);
  }

  /** @param {KeyboardEvent} event */
  function handleGrabberKeydown(event) {
    let next;
    if (event.key === "ArrowUp" || event.key === "PageUp") next = index + 1;
    else if (event.key === "ArrowDown" || event.key === "PageDown")
      next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = snaps.length - 1;
    else return;
    event.preventDefault();
    go(next, "keyboard");
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

  $: lifecycle.syncOpen(open);
  $: syncRendered(open);
  $: if (mounted) observe(rendered, headerRef, contentRef, footerRef);
  // A dragged sheet that closes or turns wide lets go of the pointer.
  $: if (!sheetMode && dragging) dragging = false;

  $: titleId = `${id}-title`;
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: sheetProps,
  } = splitAriaNaming($$restProps));
  $: resizable = snaps.length > 1 && sheetMode;
  $: grabberText = snaps[index]
    ? resizeValueText({
        snapPoint: snaps[index].point,
        index,
        count: snaps.length,
        height: snaps[index].height,
        available,
      })
    : undefined;
  $: sheetStyle = sheetMode
    ? `--ccs-bottom-sheet-height: ${maxHeight}px; --ccs-bottom-sheet-offset: ${maxHeight - visible}px;${keyboardInset ? ` --ccs-bottom-sheet-keyboard-inset: ${keyboardInset}px;` : ""}`
    : undefined;
</script>

{#if rendered}
  {#if modal}
    <div
      class:bx--bottom-sheet__scrim={true}
      class:bx--bottom-sheet__scrim--closing={closing}
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
    this={modal ? "div" : "aside"}
    bind:this={ref}
    {id}
    role={modal ? "dialog" : undefined}
    aria-modal={modal ? "true" : undefined}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ??
      (ariaLabel === undefined && title ? titleId : undefined)}
    aria-describedby={ariaDescribedBy}
    tabindex="-1"
    inert={closing || undefined}
    class:bx--bottom-sheet={true}
    class:bx--layer-one={true}
    class:bx--bottom-sheet--modal={modal}
    class:bx--bottom-sheet--wide={wide}
    class:bx--bottom-sheet--unmeasured={!measured}
    class:bx--bottom-sheet--dragging={dragging}
    class:bx--bottom-sheet--partial={sheetMode && !atMax}
    class:bx--bottom-sheet--closing={closing}
    style={sheetStyle}
    {...sheetProps}
    on:keydown
    on:keydown={handleKeydown}
    on:focusin={handleFocusin}
    on:mousedown={outsideDismiss.pressInside}
    on:animationend={handleAnimationend}
  >
    <div
      bind:this={headerRef}
      class:bx--bottom-sheet__header={true}
      class:bx--bottom-sheet__header--title={Boolean(title)}
      use:pointerDrag={{
        enabled: sheetMode,
        onStart: handlePointerStart,
        onMove: handlePointerMove,
        onEnd: (event) => endDrag(event?.timeStamp),
      }}
    >
      {#if sheetMode && (resizable || dismissible)}
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div
          class:bx--bottom-sheet__grabber={true}
          role={resizable ? "slider" : undefined}
          aria-hidden={resizable ? undefined : "true"}
          aria-orientation={resizable ? "vertical" : undefined}
          aria-label={resizable ? resizeLabel : undefined}
          aria-valuemin={resizable ? 0 : undefined}
          aria-valuemax={resizable ? snaps.length - 1 : undefined}
          aria-valuenow={resizable ? index : undefined}
          aria-valuetext={resizable ? grabberText : undefined}
          aria-controls={resizable ? id : undefined}
          tabindex={resizable ? 0 : undefined}
          on:keydown={resizable ? handleGrabberKeydown : undefined}
        ></div>
      {/if}
      {#if title || (dismissible && !hideCloseButton)}
        <div class:bx--bottom-sheet__heading={true}>
          {#if title}
            <Heading id={titleId} class="bx--bottom-sheet__title"
              >{title}</Heading
            >
          {/if}
          {#if dismissible && !hideCloseButton}
            <Button
              bind:ref={closeButtonRef}
              kind="ghost"
              size="small"
              icon={Close}
              iconDescription={closeIconDescription}
              tooltipPosition="bottom"
              tooltipAlignment="end"
              class="bx--bottom-sheet__close"
              on:click={() => close("close-button")}
            />
          {/if}
        </div>
      {/if}
    </div>
    <div
      class:bx--bottom-sheet__body={true}
      class:bx--layer-two={true}
      use:sheetTouch={{
        enabled: sheetMode,
        atMax: () => atMax,
        onStart: beginDrag,
        onMove: moveDrag,
        onEnd: endDrag,
      }}
    >
      <div bind:this={contentRef} class:bx--bottom-sheet__content={true}>
        <slot />
      </div>
    </div>
    {#if $$slots.actions}
      <div bind:this={footerRef} class:bx--bottom-sheet__footer={true}>
        <ActionSet size="md">
          <slot name="actions" />
        </ActionSet>
      </div>
    {/if}
  </svelte:element>
{/if}
