<script>
  /**
   * @restProps {div}
   * @event {number} change
   * @slot {{}} before - Content for the "before" side, such as an `<img>`, chart, or map. Replaces `beforeSrc`. Static content only: the comparison takes the pointer input.
   * @slot {{}} after - Content for the "after" side. Replaces `afterSrc`.
   */

  /**
   * Specify how the two sides are compared: `"slider"` overlays them behind
   * a draggable divider, `"side-by-side"` shows them next to each other, and
   * `"toggle"` switches between them with a crossfade.
   * @type {"slider" | "side-by-side" | "toggle"}
   */
  export let mode = "slider";

  /**
   * Specify the axis of the comparison. A horizontal slider divides the
   * frame left to right and a vertical one top to bottom; side-by-side
   * puts the sides in a row or a column. Ignored by `"toggle"`.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /**
   * The share of the frame that shows the "before" side in `"slider"` mode,
   * from 0 to 100. "Before" sits at the inline start (the left in LTR, the
   * right in RTL), or at the top when `orientation` is `"vertical"`.
   * @bindable writable
   */
  export let value = 50;

  /**
   * The side `"toggle"` mode shows.
   * @type {"before" | "after"}
   * @bindable writable
   */
  export let selected = "before";

  /** Specify how far an arrow key moves the divider, in percent */
  export let step = 1;

  /** Specify how far Shift with an arrow key, or Page Up and Page Down, moves the divider, in percent */
  export let largeStep = 10;

  /**
   * Specify the aspect ratio of the frame, as `AspectRatio` takes it: a
   * named ratio, or any `"WxH"` pair such as `"1200x800"`. Both sides are
   * fit into this frame, so images of different sizes still line up.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2" | `${number}x${number}`}
   */
  export let ratio = "16x9";

  /**
   * Specify how an image fills the frame when its shape differs from it.
   * Applies to `beforeSrc` and `afterSrc`.
   * @type {"cover" | "contain" | "fill" | "none" | "scale-down"}
   */
  export let fit = "cover";

  /** Specify the "before" image source */
  export let beforeSrc = "";

  /** Specify the "before" image alt text. Defaults to `beforeLabel`. */
  export let beforeAlt = "";

  /** Specify the "after" image source */
  export let afterSrc = "";

  /** Specify the "after" image alt text. Defaults to `afterLabel`. */
  export let afterAlt = "";

  /** Specify the text that names the "before" side */
  export let beforeLabel = "Before";

  /** Specify the text that names the "after" side */
  export let afterLabel = "After";

  /**
   * Set to `true` to hide the visible side labels. Screen readers still hear
   * them in the divider's value text.
   */
  export let hideLabels = false;

  /**
   * Specify the accessible name of the whole comparison, such as
   * "Denoised photo".
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /**
   * Specify the accessible name of the divider (`"slider"` mode) or of the
   * switch (`"toggle"` mode). Defaults to "Comparison position" and
   * "Comparison view".
   * @type {string | undefined}
   */
  export let controlLabel = undefined;

  /**
   * Customize the divider's `aria-valuetext`. Receives the share of
   * "before" showing, from 0 to 100. Defaults to "Showing 40% of Before".
   * @type {((value: number) => string) | undefined}
   */
  export let formatValueText = undefined;

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";
  import ContentSwitcher from "../ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "../ContentSwitcher/Switch.svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** How far a touch moves before it is a drag and not a tap, in px. */
  const TAP_SLOP = 6;

  /** @type {null | HTMLDivElement} */
  let stage = null;
  /** @type {null | HTMLDivElement} */
  let divider = null;
  /**
   * Where a touch began, until it moves far enough to be a drag.
   * @type {null | { x: number; y: number }}
   */
  let touchOrigin = null;
  let touchDragged = false;
  let selectedIndex = 0;

  /** @param {unknown} number */
  function clamp(number) {
    const n = Number(number);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;
  }

  $: position = clamp(value);
  $: vertical = orientation === "vertical";
  $: valueText = formatValueText
    ? formatValueText(position)
    : `Showing ${Math.round(position)}% of ${beforeLabel}`;
  $: selectedIndex = selected === "after" ? 1 : 0;

  /** @param {number} next */
  function commit(next) {
    const clamped = Math.round(clamp(next) * 10) / 10;
    if (clamped === value) return;
    value = clamped;
    dispatch("change", clamped);
  }

  const isRtl = () => resolveLayoutDirection($layoutDirection, ref) === "rtl";

  /**
   * The share of the frame, from the start edge, under the pointer.
   * @param {PointerEvent} event
   */
  function pointerPosition(event) {
    const rect = /** @type {HTMLDivElement} */ (stage).getBoundingClientRect();
    const length = vertical ? rect.height : rect.width;
    if (!length) return position;
    let fraction = vertical
      ? (event.clientY - rect.top) / length
      : (event.clientX - rect.left) / length;
    if (!vertical && isRtl()) fraction = 1 - fraction;
    return fraction * 100;
  }

  /** @param {PointerEvent} event */
  function handleDragStart(event) {
    if (mode !== "slider") return false;
    if (event.pointerType === "touch") {
      // Don't jump yet: this may be the start of a vertical page scroll,
      // which `touch-action` hands to the browser and cancels.
      touchOrigin = { x: event.clientX, y: event.clientY };
      touchDragged = false;
      return true;
    }
    // Keep the press from starting a text selection or an image drag.
    event.preventDefault();
    divider?.focus({ preventScroll: true });
    commit(pointerPosition(event));
    return true;
  }

  /** @param {PointerEvent} event */
  function handleDragMove(event) {
    if (touchOrigin && !touchDragged) {
      const moved = vertical
        ? Math.abs(event.clientY - touchOrigin.y)
        : Math.abs(event.clientX - touchOrigin.x);
      if (moved < TAP_SLOP) return;
      touchDragged = true;
      divider?.focus({ preventScroll: true });
    }
    commit(pointerPosition(event));
  }

  /** @param {PointerEvent} [event] */
  function handleDragEnd(event) {
    if (event && touchOrigin && !touchDragged && event.type === "pointerup") {
      // A tap jumps the divider to the touch point.
      divider?.focus({ preventScroll: true });
      commit(pointerPosition(event));
    }
    touchOrigin = null;
    touchDragged = false;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    // Alt/Ctrl/Meta+Arrow belong to the browser (Alt/Cmd+Left is Back).
    if (hasModifierKey(event)) return;
    const distance = event.shiftKey ? largeStep : step;
    // An arrow moves the divider that way. The other axis's arrows are
    // aliases, so the keys a slider normally takes (Up grows the value)
    // still work.
    const inline = isRtl() ? -1 : 1;
    /** @type {Record<string, number>} */
    const direction = vertical
      ? { ArrowDown: 1, ArrowUp: -1, ArrowRight: 1, ArrowLeft: -1 }
      : {
          ArrowRight: inline,
          ArrowLeft: -inline,
          ArrowUp: 1,
          ArrowDown: -1,
        };
    let next;
    if (event.key in direction) {
      next = position + direction[event.key] * distance;
    } else if (event.key === "PageUp") {
      next = position + largeStep;
    } else if (event.key === "PageDown") {
      next = position - largeStep;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = 100;
    } else {
      return;
    }
    event.preventDefault();
    commit(next);
  }

  /** @param {CustomEvent<number>} event */
  function handleSwitch(event) {
    selected = event.detail === 1 ? "after" : "before";
  }
</script>

<div
  bind:this={ref}
  role="group"
  aria-label={labelText}
  class:bx--image-compare={true}
  class:bx--image-compare--slider={mode === "slider"}
  class:bx--image-compare--toggle={mode === "toggle"}
  class:bx--image-compare--side-by-side={mode === "side-by-side"}
  class:bx--image-compare--vertical={vertical}
  {...$$restProps}
>
  {#if mode === "side-by-side"}
    <div class="bx--image-compare__panels">
      <figure class="bx--image-compare__panel">
        <AspectRatio {ratio}>
          <slot name="before">
            {#if beforeSrc}
              <img
                class="bx--image-compare__image"
                style:object-fit={fit}
                src={beforeSrc}
                alt={beforeAlt || beforeLabel}
                draggable="false"
              />
            {/if}
          </slot>
        </AspectRatio>
        {#if !hideLabels}
          <figcaption class="bx--image-compare__caption">
            {beforeLabel}
          </figcaption>
        {/if}
      </figure>
      <figure class="bx--image-compare__panel">
        <AspectRatio {ratio}>
          <slot name="after">
            {#if afterSrc}
              <img
                class="bx--image-compare__image"
                style:object-fit={fit}
                src={afterSrc}
                alt={afterAlt || afterLabel}
                draggable="false"
              />
            {/if}
          </slot>
        </AspectRatio>
        {#if !hideLabels}
          <figcaption class="bx--image-compare__caption">
            {afterLabel}
          </figcaption>
        {/if}
      </figure>
    </div>
  {:else}
    <AspectRatio {ratio}>
      <div
        bind:this={stage}
        class:bx--image-compare__stage={true}
        style:--ccs-image-compare-position={position}
        use:pointerDrag={{
          enabled: mode === "slider",
          onStart: handleDragStart,
          onMove: handleDragMove,
          onEnd: handleDragEnd,
        }}
      >
        <div
          class:bx--image-compare__layer={true}
          class:bx--image-compare__layer--before={true}
          class:bx--image-compare__layer--off={mode === "toggle" &&
            selected === "after"}
          aria-hidden={mode === "toggle" && selected === "after"
            ? "true"
            : undefined}
        >
          <slot name="before">
            {#if beforeSrc}
              <img
                class="bx--image-compare__image"
                style:object-fit={fit}
                src={beforeSrc}
                alt={beforeAlt || beforeLabel}
                draggable="false"
              />
            {/if}
          </slot>
          {#if !hideLabels}
            <span
              class="bx--image-compare__label bx--image-compare__label--before"
            >
              {beforeLabel}
            </span>
          {/if}
        </div>
        <div
          class:bx--image-compare__layer={true}
          class:bx--image-compare__layer--after={true}
          aria-hidden={mode === "toggle" && selected === "before"
            ? "true"
            : undefined}
        >
          <slot name="after">
            {#if afterSrc}
              <img
                class="bx--image-compare__image"
                style:object-fit={fit}
                src={afterSrc}
                alt={afterAlt || afterLabel}
                draggable="false"
              />
            {/if}
          </slot>
          {#if !hideLabels}
            <span
              class="bx--image-compare__label bx--image-compare__label--after"
            >
              {afterLabel}
            </span>
          {/if}
        </div>
        {#if mode === "slider"}
          <div class="bx--image-compare__track">
            <div
              bind:this={divider}
              role="slider"
              tabindex="0"
              class="bx--image-compare__divider"
              aria-label={controlLabel ?? "Comparison position"}
              aria-orientation={vertical ? "vertical" : "horizontal"}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={position}
              aria-valuetext={valueText}
              on:keydown={handleKeydown}
            >
              <span class="bx--image-compare__handle" aria-hidden="true">
                <svg
                  class="bx--image-compare__handle-icon"
                  viewBox="0 0 16 16"
                  focusable="false"
                >
                  {#if vertical}
                    <path d="M8 2 11 6H5ZM8 14 5 10H11Z" />
                  {:else}
                    <path d="M2 8 6 5V11ZM14 8 10 11V5Z" />
                  {/if}
                </svg>
              </span>
            </div>
          </div>
        {/if}
      </div>
    </AspectRatio>
    {#if mode === "toggle"}
      <div class="bx--image-compare__switcher">
        <ContentSwitcher
          size="sm"
          autoWidth
          aria-label={controlLabel ?? "Comparison view"}
          bind:selectedIndex
          on:change={handleSwitch}
        >
          <Switch text={beforeLabel} />
          <Switch text={afterLabel} />
        </ContentSwitcher>
      </div>
    {/if}
  {/if}
</div>
