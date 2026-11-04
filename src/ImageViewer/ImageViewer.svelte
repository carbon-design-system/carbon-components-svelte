<script>
  /**
   * @event {{ zoom: number; fit: boolean }} change - Dispatched once a zoom settles. `zoom` is the scale (1 is 100%); `fit` is `true` when the whole image is in view.
   * @event {null} load
   * @event {null} error
   * @restProps {div}
   * @slot {{}} loading - Replaces the skeleton shown while the image loads.
   * @slot {{ retry: () => void }} error - Replaces the message shown when the image fails to load.
   */

  /** Specify the image source. */
  export let src = "";

  /**
   * Specify the image alt text. It names the viewer, a `role="img"` region
   * that takes focus. A rest `aria-label` or `aria-labelledby` names it
   * instead, and a rest `aria-describedby` joins the keyboard hint.
   */
  export let alt = "";

  /**
   * Specify the image's width in pixels, when known. With `height`, the
   * viewer lays the image out before it has loaded.
   * @type {number | undefined}
   */
  export let width = undefined;

  /**
   * Specify the image's height in pixels, when known.
   * @type {number | undefined}
   */
  export let height = undefined;

  /**
   * Specify the zoom: `"fit"` shows the whole image, and a number is a scale
   * where 1 is 100% (one image pixel per CSS pixel). Gestures and the
   * controls write the new value back, and a zoom within a hair of fit
   * snaps to `"fit"`. Changing `src` resets it to `"fit"`.
   * @type {"fit" | number}
   * @bindable writable
   */
  export let zoom = "fit";

  /**
   * Specify the largest scale, where 1 is 100%. It is never below the fit
   * scale.
   */
  export let maxZoom = 4;

  /** Specify the factor one zoom step multiplies the scale by. */
  export let zoomStep = 1.5;

  /**
   * Specify the aspect ratio of the frame, as `AspectRatio` takes it. Unset,
   * the frame fills the height of its parent, with a minimum height.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2" | `${number}x${number}` | undefined}
   */
  export let ratio = undefined;

  /**
   * Specify what the mouse wheel does. `"ctrl"` zooms only with `Ctrl` held,
   * which is also how a trackpad pinch arrives, so the page keeps scrolling
   * over an inline viewer; a plain wheel pans a zoomed image. `"always"`
   * zooms on every wheel event, for a viewer that fills the window.
   * @type {"ctrl" | "always"}
   */
  export let wheel = "ctrl";

  /** Set to `false` to hide the zoom buttons. Keyboard and gestures still work. */
  export let controls = true;

  /**
   * Set to `false` to stop a pan from coasting after release. A user who
   * prefers reduced motion gets no inertia and no zoom animation either way.
   */
  export let inertia = true;

  /** Set to `true` to fade the image in once it has loaded. */
  export let fadeIn = false;

  /**
   * Set an id for the top-level element.
   * The keyboard hint's id derives from it as `{id}-hint`.
   */
  export let id = uniqueId();

  /**
   * Set to `true` while the image is zoomed past fit, where arrow keys pan.
   * @bindable readonly
   */
  export let zoomed = false;

  /**
   * Set to `true` when the image is loaded.
   * @bindable readonly
   */
  export let loaded = false;

  /**
   * Set to `true` if the image failed to load.
   * @bindable readonly
   */
  export let error = false;

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /** Specify the label of the zoom-out button. */
  export let zoomOutText = "Zoom out";

  /** Specify the label of the zoom-in button. */
  export let zoomInText = "Zoom in";

  /** Specify the label of the button that returns a zoomed image to fit. */
  export let fitText = "Fit to frame";

  /** Specify the label of the button that zooms a fitted image to 100%. */
  export let actualSizeText = "Actual size";

  /** Specify the label of the group of zoom buttons. */
  export let controlsText = "Image zoom";

  /** Specify the role description of the viewer region. */
  export let roleDescriptionText = "zoomable image";

  /**
   * Specify the hint read when the viewer takes focus. It names the keys.
   */
  export let keyboardHintText =
    "Plus and minus zoom. Zero fits the image. Enter switches between fit and actual size. Arrow keys pan a zoomed image.";

  /**
   * Specify the text announced after a zoom settles.
   * @type {(percent: number) => string}
   */
  export let zoomLevelText = function zoomLevelText(percent) {
    return `Zoom ${percent}%`;
  };

  /** Specify the message shown when the image fails to load. */
  export let errorText = "The image could not be loaded.";

  /** Specify the label of the retry button in that message. */
  export let retryText = "Retry";

  /**
   * Zoom in one step, about the center of the frame or `anchor`.
   * @type {(anchor?: { x: number; y: number }) => void}
   */
  export function zoomIn(anchor) {
    stepBy(1, anchor);
  }

  /**
   * Zoom out one step, about the center of the frame or `anchor`.
   * @type {(anchor?: { x: number; y: number }) => void}
   */
  export function zoomOut(anchor) {
    stepBy(-1, anchor);
  }

  /**
   * Zoom to a scale, where 1 is 100%, about the center of the frame or
   * `anchor`, given in the frame's coordinates.
   * @type {(scale: number, anchor?: { x: number; y: number }) => void}
   */
  export function zoomTo(scale, anchor) {
    if (!natural) return;
    animate();
    commit(
      zoomAt(view, scale, anchor ?? frameCenter(), natural, frameSize, bounds),
    );
  }

  /**
   * Switch between fit and actual size (100%), about the center of the
   * frame or `anchor`.
   * @type {(anchor?: { x: number; y: number }) => void}
   */
  export function toggle(anchor) {
    if (!natural) return;
    zoomTo(toggleScale(view.scale, fit, bounds.max), anchor);
  }

  /** Show the whole image again. */
  export function reset() {
    if (!natural) return;
    animate();
    commit(centeredView(fit, natural, frameSize));
  }

  /**
   * Move the image by a distance in CSS pixels. A positive `dx` moves the
   * image to the right, which shows more of its left side.
   * @type {(dx: number, dy: number) => void}
   */
  export function pan(dx, dy) {
    if (!natural) return;
    stopInertia();
    commit(panBy(view, dx, dy, natural, frameSize));
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";
  import Button from "../Button/Button.svelte";
  import ImageLoader from "../ImageLoader/ImageLoader.svelte";
  import SkeletonPlaceholder from "../SkeletonPlaceholder/SkeletonPlaceholder.svelte";
  import Add from "../icons/Add.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import {
    centeredView,
    clampView,
    createVelocityTracker,
    fitScale,
    INERTIA_MIN_SPEED,
    inertiaStep,
    isDoubleTap,
    isZoomed,
    panBy,
    pinchGeometry,
    stepScale,
    toggleScale,
    wheelFactor,
    zoomAt,
  } from "../utils/image-zoom.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /** How far a keyboard pan moves, as a share of the frame. */
  const KEY_PAN_SHARE = 0.12;

  /** How long `will-change` outlives the last gesture. */
  const SETTLE_MS = 160;

  /** The scale of the view the viewer is at, mirrored for the controls. */
  let scale = 1;
  let percent = 100;

  /** @type {import("../utils/image-zoom.js").View} */
  let view = { scale: 1, x: 0, y: 0 };
  /** @type {null | { width: number; height: number }} */
  let measured = null;
  let frameSize = { width: 0, height: 0 };
  let announcement = "";

  /** @type {null | HTMLDivElement} */
  let frameRef = null;
  /** @type {null | HTMLDivElement} */
  let layerRef = null;
  /** @type {null | { loadImage: (url?: string) => void }} */
  let loader = null;

  /** @type {null | ReturnType<typeof setTimeout>} */
  let settleTimer = null;
  /** @type {null | ReturnType<typeof setTimeout>} */
  let announceTimer = null;
  /** @type {null | ReturnType<typeof setTimeout>} */
  let animateTimer = null;
  /** @type {null | number} */
  let inertiaFrame = null;

  let prevSrc = src;
  let prevZoom = zoom;
  /**
   * The fit scale the view was last placed at; null until the first layout.
   * @type {null | number}
   */
  let laidOutFit = null;
  /** The zoom last announced and dispatched. */
  let settledScale = 1;
  let stopObserving = () => {};

  // Naming belongs on the focusable region, not the wrapper around it.
  $: ({
    ariaLabel: consumerLabel,
    ariaLabelledBy: consumerLabelledby,
    ariaDescribedBy: consumerDescribedby,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: natural =
    measured ??
    (width && height && width > 0 && height > 0 ? { width, height } : null);
  $: fit = natural && frameSize.width > 0 ? fitScale(frameSize, natural) : 1;
  $: bounds = { min: fit, max: Math.max(maxZoom, fit) };
  $: ready = natural !== null && frameSize.width > 0;
  $: resetForSource(src);
  $: layout(natural, frameSize, fit);
  $: applyZoomProp(zoom);

  /** @param {string} next */
  function resetForSource(next) {
    if (next === prevSrc) return;
    prevSrc = next;
    measured = null;
    stopInertia();
    if (layerRef) layerRef.style.transform = "";
    view = { scale: 1, x: 0, y: 0 };
    scale = 1;
    settledScale = 1;
    laidOutFit = null;
    zoom = "fit";
    prevZoom = "fit";
  }

  /**
   * Place the image when its size, the frame's, or the fit scale changes:
   * a fitted view follows the fit scale, a zoomed one keeps its scale.
   * @param {null | { width: number; height: number }} size
   * @param {{ width: number; height: number }} frame
   * @param {number} fitted
   */
  function layout(size, frame, fitted) {
    if (!size || !(frame.width > 0)) return;
    const first = laidOutFit === null;
    const wasFit = first || !isZoomed(view.scale, laidOutFit ?? fitted);
    laidOutFit = fitted;
    if (wasFit) {
      commit(centeredView(fitted, size, frame), false);
      settledScale = view.scale;
      // A `zoom` set before the image loaded applies once it can be placed.
      if (first && typeof zoom === "number") {
        commit(
          zoomAt(view, zoom, frameCenter(), size, frame, {
            min: fitted,
            max: Math.max(maxZoom, fitted),
          }),
        );
      }
    } else {
      commit(
        clampView(
          { ...view, scale: Math.max(view.scale, fitted) },
          size,
          frame,
        ),
        false,
      );
      settledScale = view.scale;
    }
  }

  /** @param {"fit" | number} value */
  function applyZoomProp(value) {
    if (value === prevZoom || !natural || !ready) return;
    prevZoom = value;
    if (value === "fit") {
      if (isZoomed(view.scale, fit)) reset();
    } else if (
      typeof value === "number" &&
      Math.abs(value - view.scale) > 1e-6
    ) {
      zoomTo(value);
    }
  }

  function frameCenter() {
    return { x: frameSize.width / 2, y: frameSize.height / 2 };
  }

  function reducedMotion() {
    return (
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /**
   * Write the view to the layer and mirror it to the component's state. A
   * pan changes only the transform, so a drag costs no Svelte updates.
   * @param {import("../utils/image-zoom.js").View} next
   * @param {boolean} [notify]
   */
  function commit(next, notify = true) {
    view = next;
    if (layerRef) {
      layerRef.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`;
    }
    if (next.scale !== scale) scale = next.scale;
    // Set here, not derived: a `$:` statement above `layout()` would read
    // the previous view in Svelte 3 and 4.
    zoomed = isZoomed(next.scale, fit);
    percent = Math.round(next.scale * 100);
    if (notify) {
      const snapped = isZoomed(next.scale, fit) ? next.scale : "fit";
      prevZoom = snapped;
      if (zoom !== snapped) zoom = snapped;
      scheduleSettle();
    }
  }

  /** Promote the layer for the length of a gesture only. */
  function interact() {
    layerRef?.classList.add("bx--image-viewer__layer--interacting");
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(endInteraction, SETTLE_MS);
  }

  function endInteraction() {
    settleTimer = null;
    layerRef?.classList.remove("bx--image-viewer__layer--interacting");
  }

  /** Animate the next change of view, unless the user prefers less motion. */
  function animate() {
    if (!layerRef || reducedMotion()) return;
    stopInertia();
    layerRef.classList.add("bx--image-viewer__layer--animating");
    interact();
    if (animateTimer) clearTimeout(animateTimer);
    animateTimer = setTimeout(stopAnimating, 300);
  }

  function stopAnimating() {
    animateTimer = null;
    layerRef?.classList.remove("bx--image-viewer__layer--animating");
  }

  /** Announce and dispatch a zoom after it stops changing. */
  function scheduleSettle() {
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announceTimer = null;
      if (view.scale === settledScale) return;
      settledScale = view.scale;
      announcement = zoomLevelText(Math.round(view.scale * 100));
      dispatch("change", { zoom: view.scale, fit: !isZoomed(view.scale, fit) });
    }, 250);
  }

  /**
   * @param {1 | -1} direction
   * @param {{ x: number; y: number }} [anchor]
   */
  function stepBy(direction, anchor) {
    zoomTo(stepScale(view.scale, direction, zoomStep, bounds), anchor);
  }

  /**
   * @param {number} factor
   * @param {{ x: number; y: number }} anchor
   */
  function zoomBy(factor, anchor) {
    if (!natural) return;
    interact();
    commit(
      zoomAt(view, view.scale * factor, anchor, natural, frameSize, bounds),
    );
  }

  /** @param {{ clientX: number; clientY: number }} point */
  function toFramePoint(point) {
    const rect = frameRef?.getBoundingClientRect();
    return {
      x: point.clientX - (rect?.left ?? 0),
      y: point.clientY - (rect?.top ?? 0),
    };
  }

  // Panning: one pointer, through `pointerDrag`.
  const velocity = createVelocityTracker();
  let pinching = false;
  let panning = false;
  let lastX = 0;
  let lastY = 0;

  /** @param {PointerEvent} event */
  function handlePanStart(event) {
    stopInertia();
    stopAnimating();
    // At fit there is nothing to pan, and declining the drag leaves the
    // touch to the browser (vertical page scroll) and the pointer uncaptured.
    if (!natural || pinching || !isZoomed(view.scale, fit)) return false;
    panning = true;
    lastX = event.clientX;
    lastY = event.clientY;
    velocity.reset();
    velocity.add(event.clientX, event.clientY, event.timeStamp);
    interact();
    return true;
  }

  /** @param {PointerEvent} event */
  function handlePanMove(event) {
    if (!natural || pinching) return;
    pan(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
    velocity.add(event.clientX, event.clientY, event.timeStamp);
    interact();
  }

  /** @param {PointerEvent} [event] */
  function handlePanEnd(event) {
    if (!panning) return;
    panning = false;
    if (!event || pinching || !inertia || reducedMotion()) return;
    // A pointer held still before release has no velocity left.
    velocity.add(event.clientX, event.clientY, event.timeStamp);
    const release = velocity.velocity();
    if (Math.hypot(release.x, release.y) > INERTIA_MIN_SPEED * 4) {
      startInertia(release);
    }
  }

  /** @param {{ x: number; y: number }} start */
  function startInertia(start) {
    stopInertia();
    let moving = start;
    let last = performance.now();
    layerRef?.classList.add("bx--image-viewer__layer--interacting");

    /** @param {number} now */
    function step(now) {
      if (!natural) return stopInertia();
      const advance = inertiaStep(moving, Math.min(now - last, 50));
      last = now;
      const next = panBy(view, advance.dx, advance.dy, natural, frameSize);
      // An edge stops that axis.
      moving = {
        x: next.x === view.x ? 0 : advance.velocity.x,
        y: next.y === view.y ? 0 : advance.velocity.y,
      };
      commit(next);
      if (Math.hypot(moving.x, moving.y) < INERTIA_MIN_SPEED) {
        inertiaFrame = null;
        interact();
        return;
      }
      inertiaFrame = requestAnimationFrame(step);
    }
    inertiaFrame = requestAnimationFrame(step);
  }

  function stopInertia() {
    if (inertiaFrame !== null) cancelAnimationFrame(inertiaFrame);
    inertiaFrame = null;
  }

  // Pinch and taps: every pointer, through this action. `pointerDrag` takes
  // one pointer at a time, so it can't see the second finger.
  /**
   * @param {HTMLElement} node
   */
  function gestures(node) {
    /** @type {Map<number, { x: number; y: number }>} */
    const pointers = new Map();
    /** @type {null | { distance: number; view: import("../utils/image-zoom.js").View; midpoint: { x: number; y: number } }} */
    let pinch = null;
    /** @type {null | { id: number; x: number; y: number; time: number }} */
    let tap = null;
    /** @type {null | { x: number; y: number; time: number }} */
    let previousTap = null;
    let safariScale = 1;

    /** @param {PointerEvent} event */
    function handlePointerdown(event) {
      if (!natural || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }
      pointers.set(event.pointerId, toFramePoint(event));
      if (pointers.size === 1) {
        const point = toFramePoint(event);
        tap = {
          id: event.pointerId,
          x: point.x,
          y: point.y,
          time: event.timeStamp,
        };
      } else {
        tap = null;
        if (pointers.size === 2) beginPinch();
      }
    }

    function beginPinch() {
      const [a, b] = [...pointers.values()];
      stopInertia();
      stopAnimating();
      pinching = true;
      const { distance, midpoint } = pinchGeometry(a, b);
      pinch = { distance, view, midpoint };
      interact();
    }

    /** @param {PointerEvent} event */
    function handlePointermove(event) {
      const point = pointers.get(event.pointerId);
      if (!point) return;
      const next = toFramePoint(event);
      pointers.set(event.pointerId, next);
      if (tap && Math.hypot(next.x - tap.x, next.y - tap.y) > 6) tap = null;
      if (!pinch || !natural || pointers.size < 2) return;
      const [a, b] = [...pointers.values()];
      const { distance, midpoint } = pinchGeometry(a, b);
      if (!(pinch.distance > 0)) return;
      const target = Math.min(
        bounds.max,
        Math.max(bounds.min, pinch.view.scale * (distance / pinch.distance)),
      );
      // Keep the image point first under the midpoint under it as it moves.
      const ratio = target / pinch.view.scale;
      commit(
        clampView(
          {
            scale: target,
            x: midpoint.x - (pinch.midpoint.x - pinch.view.x) * ratio,
            y: midpoint.y - (pinch.midpoint.y - pinch.view.y) * ratio,
          },
          natural,
          frameSize,
        ),
      );
      interact();
    }

    /** @param {PointerEvent} event */
    function handlePointerup(event) {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      if (pinch && pointers.size < 2) {
        pinch = null;
        pinching = false;
      }
      if (pointers.size > 0 || !tap || tap.id !== event.pointerId) return;
      const point = { x: tap.x, y: tap.y, time: event.timeStamp };
      tap = null;
      if (event.type !== "pointerup") return;
      if (isDoubleTap(previousTap, point)) {
        previousTap = null;
        toggle({ x: point.x, y: point.y });
      } else {
        previousTap = point;
      }
    }

    /** @param {PointerEvent} event */
    function handlePointercancel(event) {
      tap = null;
      handlePointerup(event);
    }

    // `wheel` must be non-passive to stop the page from scrolling.
    /** @param {WheelEvent} event */
    function handleWheel(event) {
      if (!natural) return;
      if (wheel === "always" || event.ctrlKey) {
        event.preventDefault();
        stopAnimating();
        zoomBy(
          wheelFactor(event.deltaY, event.deltaMode, event.ctrlKey),
          toFramePoint(event),
        );
      } else if (isZoomed(view.scale, fit)) {
        event.preventDefault();
        pan(-event.deltaX, -event.deltaY);
        interact();
      }
    }

    // Safari on a Mac sends a trackpad pinch as gesture events, not wheel.
    // A touch pinch also fires them, but the pointers above already took it.
    /** @param {Event & { scale?: number }} event */
    function handleGesturestart(event) {
      if (pointers.size > 0) return;
      event.preventDefault();
      safariScale = view.scale;
    }

    /** @param {Event & { scale?: number; clientX?: number; clientY?: number }} event */
    function handleGesturechange(event) {
      if (pointers.size > 0 || !natural) return;
      event.preventDefault();
      zoomBy(
        (safariScale * (event.scale ?? 1)) / view.scale,
        toFramePoint({
          clientX: event.clientX ?? 0,
          clientY: event.clientY ?? 0,
        }),
      );
    }

    node.addEventListener("pointerdown", handlePointerdown);
    node.addEventListener("pointermove", handlePointermove);
    node.addEventListener("pointerup", handlePointerup);
    node.addEventListener("pointercancel", handlePointercancel);
    node.addEventListener("wheel", handleWheel, { passive: false });
    node.addEventListener("gesturestart", handleGesturestart);
    node.addEventListener("gesturechange", handleGesturechange);
    return {
      destroy() {
        node.removeEventListener("pointerdown", handlePointerdown);
        node.removeEventListener("pointermove", handlePointermove);
        node.removeEventListener("pointerup", handlePointerup);
        node.removeEventListener("pointercancel", handlePointercancel);
        node.removeEventListener("wheel", handleWheel);
        node.removeEventListener("gesturestart", handleGesturestart);
        node.removeEventListener("gesturechange", handleGesturechange);
      },
    };
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || !natural) return;
    const { key } = event;
    if (key === "+" || key === "=") {
      zoomIn();
    } else if (key === "-" || key === "_") {
      zoomOut();
    } else if (key === "0") {
      reset();
    } else if (key === "Enter") {
      toggle();
    } else if (
      isZoomed(view.scale, fit) &&
      (key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "ArrowUp" ||
        key === "ArrowDown")
    ) {
      // Arrow keys move the view, so the image moves the other way.
      const share = event.shiftKey ? KEY_PAN_SHARE * 4 : KEY_PAN_SHARE;
      const dx = key === "ArrowLeft" ? 1 : key === "ArrowRight" ? -1 : 0;
      const dy = key === "ArrowUp" ? 1 : key === "ArrowDown" ? -1 : 0;
      interact();
      pan(dx * frameSize.width * share, dy * frameSize.height * share);
    } else {
      return;
    }
    // Lets a container, such as `Lightbox`, tell a handled key from one it owns.
    event.preventDefault();
  }

  function measure() {
    const image = layerRef?.querySelector("img:not([aria-hidden])");
    if (
      image instanceof HTMLImageElement &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0
    ) {
      measured = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
    }
  }

  async function handleLoad() {
    await tick();
    measure();
    dispatch("load");
  }

  function retry() {
    loader?.loadImage();
  }

  onMount(() => {
    if (frameRef) {
      const rect = frameRef.getBoundingClientRect();
      frameSize = { width: rect.width, height: rect.height };
      stopObserving = observeResize(frameRef, (entry) => {
        const next = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };
        if (
          next.width !== frameSize.width ||
          next.height !== frameSize.height
        ) {
          frameSize = next;
        }
      });
    }

    return () => {
      stopObserving();
      stopInertia();
      for (const timer of [settleTimer, announceTimer, animateTimer]) {
        if (timer) clearTimeout(timer);
      }
    };
  });
</script>

<div
  bind:this={ref}
  {id}
  class:bx--image-viewer={true}
  class:bx--image-viewer--fill={ratio === undefined}
  class:bx--image-viewer--zoomed={zoomed}
  class:bx--image-viewer--ready={ready}
  {...wrapperProps}
>
  <AspectRatio ratio={ratio ?? "1x1"} fill>
    <!--
      A focusable `role="img"`: its children are presentational, so the zoom
      buttons sit outside it and the inner image has no alt text of its own.
      Once the image fails, the frame becomes a plain group so the message
      and the retry button can be reached.
    -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      bind:this={frameRef}
      class:bx--image-viewer__frame={true}
      class:bx--image-viewer__frame--zoomed={zoomed}
      role={error ? "group" : "img"}
      tabindex={error ? undefined : 0}
      aria-label={consumerLabelledby === undefined
        ? (consumerLabel ?? alt)
        : consumerLabel}
      aria-labelledby={consumerLabelledby}
      aria-roledescription={error ? undefined : roleDescriptionText}
      aria-describedby={joinDescribedBy(
        error ? undefined : `${id}-hint`,
        consumerDescribedby,
      )}
      aria-keyshortcuts={error ? undefined : "Plus Minus 0 Enter"}
      use:gestures
      use:pointerDrag={{
        enabled: natural !== null,
        onStart: handlePanStart,
        onMove: handlePanMove,
        onEnd: handlePanEnd,
      }}
      on:keydown={handleKeydown}
      on:keydown
      on:focus
      on:blur
    >
      <div
        bind:this={layerRef}
        class:bx--image-viewer__layer={true}
        style:width={natural ? `${natural.width}px` : undefined}
        style:height={natural ? `${natural.height}px` : undefined}
      >
        <ImageLoader
          bind:this={loader}
          bind:loaded
          bind:error
          {src}
          alt=""
          {fadeIn}
          decoding="async"
          draggable="false"
          on:load={handleLoad}
          on:error
        >
          <div slot="loading" class:bx--image-viewer__status={true}>
            <slot name="loading">
              <SkeletonPlaceholder width="100%" height="100%" />
            </slot>
          </div>
          <div
            slot="error"
            class:bx--image-viewer__status={true}
            class:bx--image-viewer__status--error={true}
          >
            <slot name="error" {retry}>
              <p class:bx--image-viewer__message={true}>{errorText}</p>
              <Button kind="tertiary" size="sm" on:click={retry}
                >{retryText}</Button
              >
            </slot>
          </div>
        </ImageLoader>
      </div>
    </div>
  </AspectRatio>
  {#if controls}
    <div
      class:bx--image-viewer__controls={true}
      role="group"
      aria-label={controlsText}
    >
      <Button
        kind="ghost"
        size="sm"
        icon={Subtract}
        iconDescription={zoomOutText}
        tooltipPosition="top"
        disabled={!ready || !zoomed}
        on:click={() => zoomOut()}
      />
      <Button
        kind="ghost"
        size="sm"
        class="bx--image-viewer__level"
        disabled={!ready}
        aria-label={zoomed ? fitText : actualSizeText}
        on:click={() => toggle()}><span dir="ltr">{percent}%</span></Button
      >
      <Button
        kind="ghost"
        size="sm"
        icon={Add}
        iconDescription={zoomInText}
        tooltipPosition="top"
        disabled={!ready || scale >= bounds.max}
        on:click={() => zoomIn()}
      />
    </div>
  {/if}
  <span id="{id}-hint" class:bx--visually-hidden={true}>{keyboardHintText}</span
  >
  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
</div>
