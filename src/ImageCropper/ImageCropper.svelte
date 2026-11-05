<script>
  /**
   * @restProps {div}
   * @event {import("../utils/image-crop-export.js").CropData} change - Fires once a crop settles: the end of a drag, a pinch or a wheel gesture, a key press, or a control. Not fired for a `value` set from outside.
   * @event {{ width: number; height: number; downscaled: boolean }} load - Fires when the image is decoded. `width` and `height` are the upright size, with the EXIF orientation applied.
   * @event {{ code: "load" | "unsupported"; message: string }} error - Fires when the image can't be loaded.
   */

  /**
   * @typedef {"label" | "instructions-image" | "instructions-box" | "aspect" | "orientation" | "rotate-left" | "rotate-right" | "flip-horizontal" | "flip-vertical" | "reset" | "zoom" | "straighten" | "handle" | "crop" | "loading" | "error-load" | "error-unsupported" | "undersized"} ImageCropperTextId
   * @typedef {{ label?: string; x?: number; y?: number; width?: number; height?: number; min?: string }} ImageCropperTextValues
   */

  /**
   * Specify the image: a URL, or a `File` or `Blob`. A `Blob` is read
   * through an object URL that the component revokes.
   * @type {string | Blob | undefined}
   */
  export let src = undefined;

  /**
   * Set how the crop is made.
   * `"image"` keeps the crop frame still and moves and zooms the image
   * under it, as avatar croppers do. `"box"` keeps the image still and
   * moves and resizes the crop box over it, as document croppers do.
   * @type {"image" | "box"}
   */
  export let mode = "image";

  /**
   * Set the aspect ratio of the crop as width over height, such as `16 / 9`,
   * or `null` for any ratio. In `"image"` mode the frame needs a ratio, and
   * `null` means `1`.
   * @type {number | null}
   */
  export let aspect = 1;

  /**
   * Show a group of aspect ratio presets. Each is `{ label, value }`, where
   * `value` is the ratio or `null` for free. In `"image"` mode a free preset
   * is left out. By default `"box"` mode offers Free, 1:1, 4:3 and 16:9, and
   * `"image"` mode shows none.
   * @type {ReadonlyArray<{ id?: string; label: string; value: number | null }> | undefined}
   */
  export let aspects = undefined;

  /**
   * Set the shape of the frame. `"circle"` masks the crop with a circle
   * and locks the ratio to 1. The exported image is still a rectangle:
   * round it with `border-radius`, as `UserAvatar` does.
   * @type {"rect" | "circle"}
   */
  export let shape = "rect";

  /**
   * The crop: a rect in source pixels, and the turn and flips it was made
   * after. `null` until an image loads. Set it to restore a saved crop.
   * The rect is in the bounds of the flipped and rotated image, so for a
   * `rotate` of 0 or 180 it is in the image's own pixels.
   * @type {import("../utils/image-crop-export.js").CropData | null}
   * @bindable writable
   */
  export let value = null;

  /**
   * Set the smallest width of the crop in source pixels. The crop can't be
   * resized or zoomed below it, so the output is never blurrier than this.
   * An image smaller than this can't meet it, and the crop takes all of it.
   */
  export let minWidth = 1;

  /** Set the smallest height of the crop in source pixels. */
  export let minHeight = 1;

  /**
   * Set how far the zoom slider and the wheel can magnify, as a multiple
   * of the zoom that just covers the frame.
   */
  export let maxZoom = 8;

  /**
   * Set the longest side, in pixels, of the bitmap the editor draws. A larger
   * image is downscaled once when it loads, so a 6000 by 4000 photo is held
   * as about 2048 by 1365. The export reads the original.
   */
  export let previewSize = 2048;

  /**
   * Set the `crossorigin` attribute used to load the image. A cross-origin
   * image taints the canvas unless its server sends CORS headers and this is
   * `"anonymous"`; `toBlob` then fails with a `"tainted"` error.
   * @type {"anonymous" | "use-credentials" | undefined}
   */
  export let crossorigin = undefined;

  /**
   * Show the rule-of-thirds grid while dragging (`"drag"`), always, or never.
   * @type {"drag" | "always" | "none"}
   */
  export let grid = "drag";

  /**
   * Set when the wheel zooms the image in `"image"` mode: with Ctrl held
   * (which a trackpad pinch sends), so a plain wheel scrolls the page, or on
   * every wheel event.
   * @type {"ctrl" | "always" | "none"}
   */
  export let wheel = "ctrl";

  /** Set to `false` to hide the aspect, rotate, flip, zoom and straighten controls */
  export let controls = true;

  /** Set to `true` to disable the crop and its controls */
  export let disabled = false;

  /**
   * Specify the accessible name of the crop area.
   * Use `aria-label` or `aria-labelledby` to replace it.
   */
  export let labelText = "Crop image";

  /**
   * Override the strings. The second argument holds the values to build
   * a string from: the handle's name, or the crop's size and position.
   * @type {(id: ImageCropperTextId, values?: ImageCropperTextValues) => string}
   */
  export let translateWithId = function translateWithId(id, values) {
    return defaultText(id, values);
  };

  /**
   * Specify the id of the root element. The ids inside derive from it.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Whether the image is `"empty"` (no `src`), `"loading"`, `"ready"` or
   * `"error"`.
   * @type {"empty" | "loading" | "ready" | "error"}
   * @bindable readonly
   */
  export let status = "empty";

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Cut the crop out of the image and encode it, with a canvas.
   * Rejects with an `ImageCropError` whose `code` is `"tainted"` for a
   * cross-origin image the canvas can't read, or `"export"`.
   * `type` is the MIME type (default `"image/png"`), `quality` is from 0 to 1,
   * `width` or `height` scales the output, and `background` fills under the
   * image (white for JPEG). The blob's `type` is what the browser wrote:
   * `image/png` where it can't encode the type asked for.
   * @param {Omit<import("../utils/image-crop-export.js").CropToBlobOptions, "crossOrigin">} [options]
   * @returns {Promise<Blob>}
   */
  export function toBlob(options = {}) {
    const data = status === "ready" && source ? getData() : null;
    if (!(data && source)) {
      return Promise.reject(
        new ImageCropError("export", "There is no image to crop."),
      );
    }
    return cropToBlob(source, data, { ...options, crossOrigin: crossorigin });
  }

  /**
   * The crop now, or `null` before an image loads.
   * @returns {import("../utils/image-crop-export.js").CropData | null}
   */
  export function getData() {
    if (!natural || !rect) return null;
    return {
      ...roundRect(natural, rotate, rect),
      rotate: Math.round(rotate * 100) / 100,
      flipX,
      flipY,
    };
  }

  /**
   * Turn the image by a number of degrees, clockwise when positive.
   * @param {number} degrees
   */
  export function rotateBy(degrees) {
    if (!isInteractive()) return;
    setRotation(rotate + degrees, Math.abs(degrees % 180) === 90);
    commit(rect, true);
  }

  /**
   * Mirror the image, as it appears on screen.
   * @param {"horizontal" | "vertical"} axis
   */
  export function flip(axis) {
    if (!isInteractive() || !natural || !rect) return;
    const bounds = rotatedSize(natural, rotate);
    if (axis === "horizontal") flipX = !flipX;
    else flipY = !flipY;
    // A mirror on screen turns the other way round in the image's own frame.
    rotate = normalizeAngle(-rotate);
    turn = normalizeAngle(-turn);
    commit(mirrorRect(bounds, rect, axis === "horizontal" ? "x" : "y"), true);
  }

  /**
   * Move focus to the crop area, once an image has loaded. Use it when the
   * cropper opens in a dialog, where the user just asked to crop.
   */
  export function focus() {
    if (ready && !disabled) stageRef?.focus();
  }

  /** Put the crop back to its first view: no turn, no flip, the largest crop. */
  export function reset() {
    if (!isInteractive() || !natural) return;
    rotate = 0;
    turn = 0;
    flipX = false;
    flipY = false;
    commit(startingRect(), true);
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Slider from "../Slider/Slider.svelte";
  import {
    ToggleButton,
    ToggleButtonGroup,
  } from "../ToggleButtonGroup/index.js";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import FlipHorizontal from "../icons/FlipHorizontal.svelte";
  import FlipVertical from "../icons/FlipVertical.svelte";
  import RotateClockwise from "../icons/RotateClockwise.svelte";
  import RotateCounterclockwise from "../icons/RotateCounterclockwise.svelte";
  import Undo from "../icons/Undo.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import {
    cropToBlob,
    drawPreview,
    ImageCropError,
    loadImageElement,
    looksLikeHeic,
  } from "../utils/image-crop-export.js";
  import {
    clamp,
    clampRect,
    fitFrame,
    fitView,
    frameView,
    initialRect,
    layerTransform,
    limitRect,
    maxCropSize,
    mirrorRect,
    normalizeAngle,
    rectToScreen,
    resizeRect,
    rotatedSize,
    rotateRect,
    roundRect,
    sameCrop,
    scaleRect,
    translateRect,
    zoomLimit,
    zoomOf,
  } from "../utils/image-crop.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  const generatedId = uniqueId("ccs--image-cropper-");

  /** How far a key press moves the crop, in screen pixels. */
  const KEY_STEP_PX = 8;
  /** The factor a `+` or `-` key zooms by. */
  const KEY_ZOOM = 1.1;
  /** The smallest a box can be dragged to on screen, so handles stay usable. */
  const MIN_BOX_PX = 32;
  /** Space between the frame and the stage's edge. */
  const FRAME_PADDING = 24;
  /** Space between the image and the stage's edge in `"box"` mode. */
  const BOX_PADDING = 24;
  /** How long `will-change` outlives the last gesture. */
  const SETTLE_MS = 160;
  /** How long to wait after the last key press before announcing the crop. */
  const ANNOUNCE_MS = 400;
  /** How long a wheel gesture rests before it counts as settled. */
  const WHEEL_SETTLE_MS = 160;
  /** The share of the largest crop a new box starts at. */
  const BOX_START_SHARE = 0.8;

  const HANDLES = /** @type {const} */ ([
    "nw",
    "n",
    "ne",
    "e",
    "se",
    "s",
    "sw",
    "w",
  ]);

  /** @type {Record<string, { x: number; y: number }>} */
  const ARROWS = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
  };

  const DEFAULT_ASPECTS = [
    { id: "free", label: "Free", value: null },
    { id: "1:1", label: "1:1", value: 1 },
    { id: "4:3", label: "4:3", value: 4 / 3 },
    { id: "16:9", label: "16:9", value: 16 / 9 },
  ];

  /** @type {Record<string, string>} */
  const HANDLE_NAMES = {
    n: "top",
    ne: "top right",
    e: "right",
    se: "bottom right",
    s: "bottom",
    sw: "bottom left",
    w: "left",
    nw: "top left",
  };

  /**
   * @param {ImageCropperTextId} textId
   * @param {ImageCropperTextValues} [values]
   * @returns {string}
   */
  function defaultText(textId, values = {}) {
    switch (textId) {
      case "label":
        return "Crop image";
      case "instructions-image":
        return "Arrow keys move the image. Shift and an arrow key change the size of the crop. Plus and minus zoom. Left and right square brackets turn the image.";
      case "instructions-box":
        return "Arrow keys move the crop box. Shift and an arrow key resize it. Plus and minus resize it in proportion. Left and right square brackets turn the image. Tab reaches the resize handles.";
      case "aspect":
        return "Aspect ratio";
      case "orientation":
        return "Orientation";
      case "rotate-left":
        return "Rotate left";
      case "rotate-right":
        return "Rotate right";
      case "flip-horizontal":
        return "Flip horizontally";
      case "flip-vertical":
        return "Flip vertically";
      case "reset":
        return "Reset";
      case "zoom":
        return "Zoom";
      case "straighten":
        return "Straighten";
      case "handle":
        return `Resize ${values.label ?? ""}`.trim();
      case "crop":
        return `Crop ${values.width} by ${values.height} pixels, ${values.x} from the left and ${values.y} from the top`;
      case "loading":
        return "Loading image";
      case "error-load":
        return "The image could not be loaded.";
      case "error-unsupported":
        return "This browser can't open HEIC photos. Use a JPEG, PNG or WebP image.";
      case "undersized":
        return `This image is smaller than the ${values.min} minimum.`;
      default:
        return "";
    }
  }

  /**
   * @param {ImageCropperTextId} textId
   * @param {ImageCropperTextValues} [values]
   * @returns {string}
   */
  function t(textId, values) {
    return translateWithId(textId, values) || defaultText(textId, values);
  }

  /** @type {null | HTMLDivElement} */
  let stageRef = null;
  /** @type {null | HTMLCanvasElement} */
  let canvasRef = null;
  /** @type {null | HTMLDivElement} */
  let frameRef = null;

  /** @type {null | { width: number; height: number }} */
  let natural = null;
  /**
   * What the export reads: the URL the image came from.
   * @type {string | null}
   */
  let source = null;
  /** @type {string | null} */
  let objectUrl = null;
  let loadToken = 0;
  let prevSrc = src;

  let rotate = 0;
  /**
   * The quarter turns inside `rotate`, in degrees. The straighten slider is
   * the rest, from -45 to 45, so a turn that lands on 45 doesn't jump the
   * slider to -45.
   */
  let turn = 0;
  let flipX = false;
  let flipY = false;
  /**
   * The crop in bounds space, unrounded.
   * @type {null | import("../utils/image-crop.js").Rect}
   */
  let rect = null;
  let stageSize = { width: 0, height: 0 };
  /**
   * Where the frame and the image are on screen.
   * @type {{ view: import("../utils/image-crop.js").View; frame: import("../utils/image-crop.js").Rect }}
   */
  let placement = {
    view: { scale: 1, x: 0, y: 0 },
    frame: { x: 0, y: 0, width: 0, height: 0 },
  };

  let errorCode = "";
  let announcement = "";
  let dragging = false;
  let active = false;
  let undersized = false;
  let zoomValue = 1;
  let straightenValue = 0;
  let maxZoomValue = 1;

  /**
   * The last crop reported, to tell a `value` from outside from our own.
   * @type {import("../utils/image-crop-export.js").CropData | null}
   */
  let lastData = null;
  /** @type {null | ReturnType<typeof setTimeout>} */
  let settleTimer = null;
  /** @type {null | ReturnType<typeof setTimeout>} */
  let announceTimer = null;
  /** @type {null | ReturnType<typeof setTimeout>} */
  let activeTimer = null;
  let stopObserving = () => {};

  $: ({
    ariaLabel: consumerLabel,
    ariaLabelledBy: consumerLabelledby,
    ariaDescribedBy: consumerDescribedby,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));
  $: ready = status === "ready";
  $: interactive = ready && !disabled;
  $: ratio = shape === "circle" ? 1 : aspect;
  $: frameRatio = ratio ?? (mode === "image" ? 1 : null);
  $: presets = (aspects ?? (mode === "box" ? DEFAULT_ASPECTS : [])).filter(
    (preset) => mode === "box" || preset.value !== null,
  );
  $: activePreset = presets.find((preset) =>
    preset.value === null
      ? ratio === null
      : ratio !== null && Math.abs(preset.value - ratio) < 1e-4,
  );
  $: baseId = id ?? generatedId;
  $: instructionsId = `${baseId}-instructions`;
  $: describedBy = joinDescribedBy(
    instructionsId,
    undersized ? `${baseId}-undersized` : undefined,
    consumerDescribedby,
  );
  $: loadSource(src);
  $: syncValue(value);
  $: relayout(mode, shape, aspect, stageSize, minWidth, minHeight, maxZoom);
  $: applyZoom(zoomValue);
  $: applyStraighten(straightenValue);

  /** @returns {boolean} */
  function isInteractive() {
    return interactive && natural !== null && rect !== null;
  }

  /**
   * @param {string | Blob | undefined} next
   */
  async function loadSource(next) {
    if (next === prevSrc && status !== "empty") return;
    prevSrc = next;
    loadToken += 1;
    const token = loadToken;
    release();
    natural = null;
    rect = null;
    lastData = null;
    errorCode = "";
    if (!next) {
      status = "empty";
      return;
    }
    if (typeof window === "undefined") {
      status = "loading";
      return;
    }
    status = "loading";
    const url = typeof next === "string" ? next : URL.createObjectURL(next);
    if (typeof next !== "string") objectUrl = url;
    try {
      const image = await loadImageElement(url, crossorigin);
      if (token !== loadToken) return;
      await tick();
      if (token !== loadToken || !canvasRef) return;
      const drawn = drawPreview(canvasRef, image, previewSize);
      source = url;
      natural = { width: drawn.width, height: drawn.height };
      rotate = 0;
      turn = 0;
      flipX = false;
      flipY = false;
      status = "ready";
      commit(startingRect(), false);
      if (value) {
        applyExternalValue(value);
      } else {
        lastData = getData();
        value = lastData;
      }
      // The stage is focusable once this has flushed, so a `load` handler
      // can call `focus()`.
      await tick();
      if (token !== loadToken) return;
      dispatch("load", {
        width: natural.width,
        height: natural.height,
        downscaled: drawn.scale < 1,
      });
    } catch {
      if (token !== loadToken) return;
      release();
      status = "error";
      errorCode = looksLikeHeic(next) ? "unsupported" : "load";
      dispatch("error", {
        code: errorCode,
        message: t(
          errorCode === "unsupported" ? "error-unsupported" : "error-load",
        ),
      });
    }
  }

  function release() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    source = null;
  }

  /** @returns {import("../utils/image-crop.js").Rect} */
  function startingRect() {
    const size = /** @type {{ width: number; height: number }} */ (natural);
    const full = initialRect(size, rotate, frameRatio);
    return mode === "box" ? scaleRect(full, BOX_START_SHARE) : full;
  }

  /**
   * The floors a crop is held above: the minimum output, the most the view
   * may magnify, and, for a box, a size the handles can still be grabbed at.
   */
  function minimums() {
    const size = /** @type {{ width: number; height: number }} */ (natural);
    let width = Math.max(minWidth, 1);
    let height = Math.max(minHeight, 1);
    if (mode === "box") {
      const scale = placement.view.scale || 1;
      width = Math.max(width, MIN_BOX_PX / scale);
      height = Math.max(height, MIN_BOX_PX / scale);
    }
    if (frameRatio) {
      width = Math.max(width, height * frameRatio);
      if (mode === "image") {
        width = Math.max(
          width,
          maxCropSize(size, rotate, frameRatio).width / maxZoom,
        );
      }
      height = width / frameRatio;
    }
    return { minWidth: width, minHeight: height };
  }

  /**
   * @param {import("../utils/image-crop.js").Rect} next
   * @returns {import("../utils/image-crop.js").Rect}
   */
  function constrain(next) {
    return clampRect(
      /** @type {{ width: number; height: number }} */ (natural),
      rotate,
      next,
      minimums(),
    );
  }

  /**
   * Take a new crop: store it, draw it, and mirror it to the controls.
   * @param {null | import("../utils/image-crop.js").Rect} next
   * @param {boolean} settle Report it as a settled change.
   */
  function commit(next, settle) {
    if (!natural || !next) return;
    rect = constrain(next);
    paint();
    updateControls();
    if (settle) settled();
  }

  function updateControls() {
    if (!natural || !rect) return;
    const size = natural;
    const ratioNow = rect.width / rect.height;
    const limit = zoomLimit(size, rotate, ratioNow, {
      maxZoom,
      minWidth,
      minHeight,
    });
    maxZoomValue = Math.max(1, Math.round(limit * 100) / 100);
    undersized =
      natural.width < minWidth ||
      natural.height < minHeight ||
      maxCropSize(size, rotate, ratioNow).width < minWidth - 1e-6;
    zoomValue = Math.min(
      maxZoomValue,
      Math.round(zoomOf(size, rotate, rect) * 100) / 100,
    );
    straightenValue = Math.round(normalizeAngle(rotate - turn) * 100) / 100;
  }

  /** Place the image and the frame for the current crop. */
  function paint() {
    if (!natural || !rect || !(stageSize.width > 0)) return;
    if (mode === "image") {
      const frame = fitFrame(stageSize, frameRatio ?? 1, FRAME_PADDING);
      placement = { view: frameView(frame, rect), frame };
    } else {
      const view = fitView(
        stageSize,
        rotatedSize(natural, rotate),
        BOX_PADDING,
      );
      placement = { view, frame: rectToScreen(rect, view) };
    }
    if (canvasRef) {
      canvasRef.style.transform = layerTransform(
        natural,
        rotate,
        flipX,
        flipY,
        placement.view,
      );
    }
    if (frameRef) {
      const { frame } = placement;
      frameRef.style.transform = `translate(${frame.x}px, ${frame.y}px)`;
      frameRef.style.width = `${frame.width}px`;
      frameRef.style.height = `${frame.height}px`;
    }
  }

  /**
   * Repaint after the stage, the mode or the frame's ratio changed. The
   * arguments only make the reactive statement depend on them.
   * @param {...unknown} _dependencies
   */
  function relayout(..._dependencies) {
    if (!natural || !rect) return;
    // A new ratio reshapes the crop around its center.
    if (frameRatio && Math.abs(rect.width / rect.height - frameRatio) > 1e-3) {
      const size = natural;
      const zoomNow = zoomOf(size, rotate, rect);
      const max = maxCropSize(size, rotate, frameRatio);
      const area = rect.width * rect.height;
      const width =
        mode === "image"
          ? max.width / zoomNow
          : Math.min(max.width, Math.sqrt(area * frameRatio));
      const height = width / frameRatio;
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      commit({ x: cx - width / 2, y: cy - height / 2, width, height }, true);
      return;
    }
    commit(rect, false);
  }

  /**
   * @param {number} next Degrees.
   * @param {boolean} quarter A quarter turn, which swaps a free box's sides.
   */
  function setRotation(next, quarter) {
    if (!natural || !rect) return;
    const to = normalizeAngle(next);
    if (to === rotate) return;
    if (Math.abs(normalizeAngle(to - turn)) > 45 + 1e-9) {
      turn = normalizeAngle(Math.round(to / 90) * 90);
    }
    const { minWidth: floorW, minHeight: floorH } = minimums();
    rect = rotateRect(natural, rotate, to, rect, {
      swap: quarter && mode === "box" && !frameRatio,
      minWidth: floorW,
      minHeight: floorH,
    });
    rotate = to;
  }

  /**
   * Take a crop set from outside, once it differs from what was last reported.
   * @param {import("../utils/image-crop-export.js").CropData | null} next
   */
  function syncValue(next) {
    if (!ready || !next || sameCrop(next, lastData)) return;
    applyExternalValue(next);
  }

  /**
   * @param {import("../utils/image-crop-export.js").CropData | null} next
   */
  function applyExternalValue(next) {
    if (!natural || !next) return;
    const numbers = [next.x, next.y, next.width, next.height, next.rotate];
    if (!numbers.every((n) => Number.isFinite(n))) return;
    rotate = normalizeAngle(next.rotate);
    turn = normalizeAngle(Math.round(rotate / 90) * 90);
    flipX = Boolean(next.flipX);
    flipY = Boolean(next.flipY);
    commit(
      { x: next.x, y: next.y, width: next.width, height: next.height },
      false,
    );
    lastData = getData();
  }

  /** @param {number} next */
  function applyZoom(next) {
    if (!isInteractive() || !rect || !natural) return;
    if (Math.abs(next - zoomOf(natural, rotate, rect)) < 0.005) return;
    const max = maxCropSize(natural, rotate, rect.width / rect.height);
    const width = max.width / Math.max(1, next);
    const height = max.height / Math.max(1, next);
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    commit({ x: cx - width / 2, y: cy - height / 2, width, height }, false);
    scheduleSettle();
  }

  /** @param {number} next */
  function applyStraighten(next) {
    if (!isInteractive()) return;
    const target = turn + next;
    if (Math.abs(normalizeAngle(target - rotate)) < 0.005) return;
    setRotation(target, false);
    commit(rect, false);
    scheduleSettle();
  }

  function scheduleSettle() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(settled, WHEEL_SETTLE_MS);
  }

  /** Report the crop: bind it, dispatch it, and announce it. */
  function settled() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = null;
    const data = getData();
    if (!data) return;
    lastData = data;
    value = data;
    dispatch("change", data);
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announcement = t("crop", {
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
      });
    }, ANNOUNCE_MS);
  }

  function markActive() {
    active = true;
    if (activeTimer) clearTimeout(activeTimer);
    activeTimer = setTimeout(() => {
      active = false;
    }, SETTLE_MS);
  }

  /** @param {string | undefined} presetId */
  function selectPreset(presetId) {
    const preset = presets.find((p) => (p.id ?? p.label) === presetId);
    if (preset) aspect = preset.value;
  }

  // Pointer gestures on the stage.

  /** @type {Map<number, { x: number; y: number }>} */
  const pointers = new Map();
  /** @type {null | { distance: number }} */
  let pinch = null;
  /** @type {null | DOMRect} */
  let stageBox = null;

  /** @param {PointerEvent} event */
  function onPointerDown(event) {
    if (!isInteractive() || !stageRef) return;
    if (
      event.target instanceof Element &&
      event.target.closest("[data-handle]")
    ) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stageBox = stageRef.getBoundingClientRect();
    const x = event.clientX - stageBox.left;
    const y = event.clientY - stageBox.top;
    if (mode === "box") {
      const { frame } = placement;
      const inside =
        x >= frame.x &&
        x <= frame.x + frame.width &&
        y >= frame.y &&
        y <= frame.y + frame.height;
      if (!inside || pointers.size > 0) return;
    }
    stageRef.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragging = true;
    markActive();
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
    }
  }

  /** @param {PointerEvent} event */
  function onPointerMove(event) {
    const previous = pointers.get(event.pointerId);
    if (!previous || !rect || !natural) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, next);
    markActive();
    const scale = placement.view.scale || 1;
    if (pointers.size === 1) {
      const dx = (next.x - previous.x) / scale;
      const dy = (next.y - previous.y) / scale;
      // The image follows the finger; the box follows it too.
      const sign = mode === "image" ? -1 : 1;
      commit(translateRect(rect, sign * dx, sign * dy), false);
    } else if (pointers.size === 2 && pinch && mode === "image") {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const box = stageBox ?? stageRef?.getBoundingClientRect();
      const anchor = {
        x: (mid.x - (box?.left ?? 0) - placement.view.x) / scale,
        y: (mid.y - (box?.top ?? 0) - placement.view.y) / scale,
      };
      // The midpoint travels half as far as the finger that moved.
      const midShift = {
        x: (next.x - previous.x) / 2,
        y: (next.y - previous.y) / 2,
      };
      const zoomed = scaleRect(rect, pinch.distance / distance, anchor);
      pinch = { distance };
      commit(
        translateRect(zoomed, -midShift.x / scale, -midShift.y / scale),
        false,
      );
    }
  }

  /** @param {PointerEvent} event */
  function onPointerEnd(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    pinch = null;
    if (pointers.size === 0) {
      dragging = false;
      stageBox = null;
      settled();
    }
  }

  /** @param {WheelEvent} event */
  function onWheel(event) {
    if (!isInteractive() || mode !== "image" || wheel === "none") return;
    if (wheel === "ctrl" && !event.ctrlKey) return;
    if (!rect || !stageRef) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    // A trackpad pinch sends small ctrl+wheel deltas; a wheel notch is 100.
    const factor = Math.exp(clamp(event.deltaY * unit, -200, 200) * 0.0022);
    const box = stageRef.getBoundingClientRect();
    const scale = placement.view.scale || 1;
    const anchor = {
      x: (event.clientX - box.left - placement.view.x) / scale,
      y: (event.clientY - box.top - placement.view.y) / scale,
    };
    markActive();
    commit(scaleRect(rect, factor, anchor), false);
    scheduleSettle();
  }

  // Keyboard.

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    if (!isInteractive() || !rect || event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const fromHandle = event.target !== stageRef;
    const arrow = ARROWS[event.key];
    let handled = true;
    if (arrow && !fromHandle) {
      if (event.shiftKey) resizeByKey(arrow);
      else moveByKey(arrow);
    } else if (event.key === "+" || event.key === "=") {
      commit(scaleRect(rect, 1 / KEY_ZOOM), true);
    } else if (event.key === "-" || event.key === "_") {
      commit(scaleRect(rect, KEY_ZOOM), true);
    } else if (event.key === "[") {
      rotateBy(-90);
    } else if (event.key === "]") {
      rotateBy(90);
    } else {
      handled = false;
    }
    if (handled) event.preventDefault();
  }

  /** @param {{ x: number; y: number }} arrow */
  function moveByKey(arrow) {
    if (!rect) return;
    const step = KEY_STEP_PX / (placement.view.scale || 1);
    const sign = mode === "image" ? -1 : 1;
    commit(
      translateRect(rect, sign * arrow.x * step, sign * arrow.y * step),
      true,
    );
  }

  /** @param {{ x: number; y: number }} arrow */
  function resizeByKey(arrow) {
    if (!rect) return;
    const step = (KEY_STEP_PX * 2) / (placement.view.scale || 1);
    const growing = arrow.x > 0 || arrow.y < 0;
    const delta = growing ? step : -step;
    if (mode === "box" && !frameRatio) {
      const dw = arrow.x === 0 ? 0 : delta;
      const dh = arrow.y === 0 ? 0 : delta;
      commit(
        {
          x: rect.x - dw / 2,
          y: rect.y - dh / 2,
          width: rect.width + dw,
          height: rect.height + dh,
        },
        true,
      );
    } else {
      commit(scaleRect(rect, (rect.width + delta) / rect.width), true);
    }
  }

  /**
   * The pointer drag of one resize handle.
   * @param {import("../utils/image-crop.js").Handle} handle
   */
  function handleDrag(handle) {
    return {
      enabled: interactive,
      /** @param {PointerEvent} event */
      onStart(event) {
        if (!rect) return false;
        dragStart = {
          x: event.clientX,
          y: event.clientY,
          rect: { ...rect },
        };
        dragging = true;
        markActive();
        return true;
      },
      /** @param {PointerEvent} event */
      onMove(event) {
        if (!dragStart || !rect || !natural) return;
        const scale = placement.view.scale || 1;
        const dx = (event.clientX - dragStart.x) / scale;
        const dy = (event.clientY - dragStart.y) / scale;
        const floor = minimums();
        const proposed = resizeRect(dragStart.rect, handle, dx, dy, {
          ratio: frameRatio,
          minWidth: floor.minWidth,
          minHeight: floor.minHeight,
        });
        markActive();
        commit(limitRect(natural, rotate, rect, proposed), false);
      },
      onEnd() {
        dragStart = null;
        dragging = false;
        settled();
      },
    };
  }

  /** @type {null | { x: number; y: number; rect: import("../utils/image-crop.js").Rect }} */
  let dragStart = null;

  /**
   * @param {KeyboardEvent} event
   * @param {import("../utils/image-crop.js").Handle} handle
   */
  function onHandleKeydown(event, handle) {
    const arrow = ARROWS[event.key];
    if (!arrow || !isInteractive() || !rect || !natural) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    const step =
      (KEY_STEP_PX * (event.shiftKey ? 10 : 1)) / (placement.view.scale || 1);
    const floor = minimums();
    const proposed = resizeRect(rect, handle, arrow.x * step, arrow.y * step, {
      ratio: frameRatio,
      minWidth: floor.minWidth,
      minHeight: floor.minHeight,
    });
    commit(limitRect(natural, rotate, rect, proposed), true);
  }

  onMount(() => {
    if (stageRef) {
      stageSize = {
        width: stageRef.clientWidth,
        height: stageRef.clientHeight,
      };
      stopObserving = observeResize(stageRef, (entry) => {
        const { width, height } = entry.contentRect;
        if (width !== stageSize.width || height !== stageSize.height) {
          stageSize = { width, height };
        }
      });
    }

    return () => {
      stopObserving();
      loadToken += 1;
      if (settleTimer) clearTimeout(settleTimer);
      if (announceTimer) clearTimeout(announceTimer);
      if (activeTimer) clearTimeout(activeTimer);
      release();
    };
  });
</script>

<div
  bind:this={ref}
  {id}
  class:bx--image-cropper={true}
  class:bx--image-cropper--box={mode === "box"}
  class:bx--image-cropper--circle={shape === "circle"}
  class:bx--image-cropper--disabled={disabled}
  aria-busy={status === "loading" ? "true" : undefined}
  {...wrapperProps}
>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    bind:this={stageRef}
    class:bx--image-cropper__stage={true}
    class:bx--image-cropper__stage--dragging={dragging}
    class:bx--image-cropper__stage--active={active}
    class:bx--image-cropper__stage--grid={grid === "always"}
    class:bx--image-cropper__stage--no-grid={grid === "none"}
    class:bx--skeleton={status === "loading"}
    role="group"
    aria-roledescription="image cropper"
    aria-label={consumerLabelledby
      ? undefined
      : (consumerLabel ?? (labelText || t("label")))}
    aria-labelledby={consumerLabelledby}
    aria-describedby={describedBy}
    aria-disabled={disabled ? "true" : undefined}
    aria-keyshortcuts={ready
      ? "ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown + - [ ]"
      : undefined}
    tabindex={ready && !disabled ? 0 : undefined}
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerEnd}
    on:pointercancel={onPointerEnd}
    on:lostpointercapture={onPointerEnd}
    on:wheel|nonpassive={onWheel}
    on:keydown={onKeydown}
  >
    <canvas
      bind:this={canvasRef}
      class="bx--image-cropper__image"
      class:bx--image-cropper__image--hidden={!ready}
      aria-hidden="true"
      style:width={natural ? `${natural.width}px` : undefined}
      style:height={natural ? `${natural.height}px` : undefined}
    ></canvas>
    <div
      bind:this={frameRef}
      class="bx--image-cropper__frame"
      class:bx--image-cropper__frame--hidden={!ready}
      class:bx--image-cropper__frame--circle={shape === "circle"}
    >
      {#if ready}
        <span class="bx--image-cropper__grid" aria-hidden="true">
          <span class="bx--image-cropper__line bx--image-cropper__line--v1"
          ></span>
          <span class="bx--image-cropper__line bx--image-cropper__line--v2"
          ></span>
          <span class="bx--image-cropper__line bx--image-cropper__line--h1"
          ></span>
          <span class="bx--image-cropper__line bx--image-cropper__line--h2"
          ></span>
        </span>
        {#if mode === "box"}
          {#each HANDLES as handle (handle)}
            <button
              type="button"
              class="bx--image-cropper__handle bx--image-cropper__handle--{handle}"
              data-handle={handle}
              aria-roledescription="resize handle"
              aria-label={t("handle", { label: HANDLE_NAMES[handle] })}
              {disabled}
              use:pointerDrag={handleDrag(handle)}
              on:keydown={(event) => onHandleKeydown(event, handle)}
            ></button>
          {/each}
        {/if}
      {/if}
    </div>
    {#if status === "error"}
      <div class="bx--image-cropper__message" role="alert">
        <ErrorFilled size={20} class="bx--image-cropper__message-icon" />
        <p>
          {t(errorCode === "unsupported" ? "error-unsupported" : "error-load")}
        </p>
      </div>
    {/if}
    {#if status === "loading"}
      <span class="bx--visually-hidden">{t("loading")}</span>
    {/if}
  </div>

  <span id={instructionsId} class="bx--visually-hidden"
    >{t(mode === "box" ? "instructions-box" : "instructions-image")}</span
  >
  <div
    class="bx--visually-hidden"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
  {#if undersized}
    <p
      id="{baseId}-undersized"
      class="bx--image-cropper__helper bx--image-cropper__helper--error"
    >
      {t("undersized", { min: `${minWidth} × ${minHeight}` })}
    </p>
  {/if}

  {#if controls && ready}
    <div class="bx--image-cropper__controls">
      {#if presets.length > 0}
        <ToggleButtonGroup
          selectionMode="single"
          required
          size="sm"
          labelText={t("aspect")}
          selected={activePreset ? [activePreset.id ?? activePreset.label] : []}
          disabled={disabled || shape === "circle"}
          on:change={(event) => selectPreset(event.detail[0]?.toString())}
        >
          {#each presets as preset (preset.id ?? preset.label)}
            <ToggleButton value={preset.id ?? preset.label}
              >{preset.label}</ToggleButton
            >
          {/each}
        </ToggleButtonGroup>
      {/if}
      <div
        class="bx--image-cropper__actions"
        role="group"
        aria-label={t("orientation")}
      >
        <Button
          kind="ghost"
          size="sm"
          icon={RotateCounterclockwise}
          iconDescription={t("rotate-left")}
          tooltipAlign="top"
          {disabled}
          on:click={() => rotateBy(-90)}
        />
        <Button
          kind="ghost"
          size="sm"
          icon={RotateClockwise}
          iconDescription={t("rotate-right")}
          tooltipAlign="top"
          {disabled}
          on:click={() => rotateBy(90)}
        />
        <Button
          kind="ghost"
          size="sm"
          icon={FlipHorizontal}
          iconDescription={t("flip-horizontal")}
          tooltipAlign="top"
          {disabled}
          on:click={() => flip("horizontal")}
        />
        <Button
          kind="ghost"
          size="sm"
          icon={FlipVertical}
          iconDescription={t("flip-vertical")}
          tooltipAlign="top"
          {disabled}
          on:click={() => flip("vertical")}
        />
        <Button
          kind="ghost"
          size="sm"
          icon={Undo}
          iconDescription={t("reset")}
          tooltipAlign="top"
          {disabled}
          on:click={reset}
        />
      </div>
    </div>
    <div class="bx--image-cropper__sliders">
      <Slider
        labelText={t("zoom")}
        min={1}
        max={Math.max(maxZoomValue, 1.01)}
        step={0.01}
        bind:value={zoomValue}
        hideTextInput
        fullWidth
        formatValue={(zoom) => `${Math.round(zoom * 100)}%`}
        disabled={disabled || undersized || maxZoomValue <= 1}
      />
      <Slider
        labelText={t("straighten")}
        min={-45}
        max={45}
        step={1}
        bind:value={straightenValue}
        hideTextInput
        fullWidth
        formatValue={(degrees) => `${degrees}°`}
        {disabled}
      />
    </div>
  {/if}
</div>
