<script context="module">
  /** Debounce window (ms) for the keyboard resizeend dispatch. */
  export const DEBOUNCE_DELAY = 100;
</script>

<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @event {{ event: MouseEvent | KeyboardEvent }} resizestart - Fires once at the start of a resize interaction (mousedown, or each keydown, since a keyboard step is its own interaction). `delta` on the following `resize` events is cumulative from this point, not incremental since the last one. In controlled mode, capture your own baseline size here and add `delta` to that baseline, not to your latest state, or repeated `resize` events will compound.
   * @event {{ event: MouseEvent | KeyboardEvent; delta: number }} resize - Fires on every resize movement. Call `event.preventDefault()` to take over sizing yourself; the component then leaves its DOM siblings alone.
   * @event {{ event: MouseEvent | KeyboardEvent }} resizeend - Fires once when a resize interaction ends, debounced for keyboard.
   * @event {MouseEvent} dblclick - Fires on double-click. Call `event.preventDefault()` to suppress the default reset-to-initial-size behavior.
   */

  /**
   * Whether the handle resizes elements stacked above/below
   * (`"horizontal"`) or side by side (`"vertical"`).
   * @type {"horizontal" | "vertical"}
   */
  export let orientation;

  /** Handle thickness in px. */
  export let thickness = 4;

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import { debounce } from "../utils/debounce.js";

  const dispatch = createEventDispatcher();

  const NAVIGATION_KEYS = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
    "PageUp",
    "PageDown",
  ];

  let startPos = { x: 0, y: 0 };
  let sizes = {
    prevSiblingSize: { width: 0, height: 0 },
    nextSiblingSize: { width: 0, height: 0 },
  };
  let initialSizes = {
    prevSiblingSize: { width: 0, height: 0 },
    nextSiblingSize: { width: 0, height: 0 },
  };

  function getSize(el) {
    const rect = el?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }

  // Set this handle's own thickness and capture the siblings' starting
  // sizes for the double-click reset. Re-runs whenever orientation or
  // thickness change, matching upstream's own effect dependency array.
  $: if (ref) {
    ref.style[orientation === "horizontal" ? "blockSize" : "inlineSize"] =
      `${thickness / 16}rem`;
    initialSizes = {
      prevSiblingSize: getSize(ref.previousElementSibling),
      nextSiblingSize: getSize(ref.nextElementSibling),
    };
  }

  const debouncedResizeEnd = debounce((event) => {
    dispatch("resizeend", { event });
  }, DEBOUNCE_DELAY);

  function updateSizes(event, delta) {
    const shouldContinue = dispatch(
      "resize",
      { event, delta },
      { cancelable: true },
    );
    if (!shouldContinue) return;

    const prop = orientation === "horizontal" ? "height" : "width";
    const prevSibling = ref?.previousElementSibling;
    const nextSibling = ref?.nextElementSibling;

    if (prevSibling instanceof HTMLElement) {
      prevSibling.style[prop] = `${sizes.prevSiblingSize[prop] + delta}px`;
    }
    if (nextSibling instanceof HTMLElement) {
      nextSibling.style[prop] = `${sizes.nextSiblingSize[prop] - delta}px`;
    }
  }

  function handleMouseMove(event) {
    event.preventDefault();
    event.stopPropagation();
    const delta =
      orientation === "horizontal"
        ? event.clientY - startPos.y
        : event.clientX - startPos.x;
    updateSizes(event, delta);
  }

  function handleMouseUp(event) {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    dispatch("resizeend", { event });

    const prevSibling = ref?.previousElementSibling;
    const nextSibling = ref?.nextElementSibling;
    if (prevSibling instanceof HTMLElement) prevSibling.style.transition = "";
    if (nextSibling instanceof HTMLElement) nextSibling.style.transition = "";
  }

  function handleMouseDown(event) {
    if (event.button !== 0) return;

    const prevSibling = ref?.previousElementSibling;
    const nextSibling = ref?.nextElementSibling;
    if (prevSibling instanceof HTMLElement)
      prevSibling.style.transition = "none";
    if (nextSibling instanceof HTMLElement)
      nextSibling.style.transition = "none";

    startPos = { x: event.clientX, y: event.clientY };
    sizes = {
      prevSiblingSize: getSize(prevSibling),
      nextSiblingSize: getSize(nextSibling),
    };
    dispatch("resizestart", { event });

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleKeyDown(event) {
    if (!NAVIGATION_KEYS.includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();

    const isHorizontal = orientation === "horizontal";
    sizes = {
      prevSiblingSize: getSize(ref?.previousElementSibling),
      nextSiblingSize: getSize(ref?.nextElementSibling),
    };
    dispatch("resizestart", { event });

    const step = event.shiftKey ? 25 : 5;
    let delta = 0;

    switch (event.key) {
      case "ArrowUp":
        if (isHorizontal) delta = -step;
        break;
      case "ArrowDown":
        if (isHorizontal) delta = step;
        break;
      case "ArrowLeft":
        if (!isHorizontal) delta = -step;
        break;
      case "ArrowRight":
        if (!isHorizontal) delta = step;
        break;
      case "Home":
        delta = isHorizontal
          ? -sizes.prevSiblingSize.height
          : -sizes.prevSiblingSize.width;
        break;
      case "End":
        delta = isHorizontal
          ? sizes.nextSiblingSize.height
          : sizes.nextSiblingSize.width;
        break;
    }

    updateSizes(event, delta);
    debouncedResizeEnd(event);
  }

  function handleDoubleClick(event) {
    event.preventDefault();
    const shouldContinue = dispatch("dblclick", event, { cancelable: true });
    if (!shouldContinue) return;

    const prop = orientation === "horizontal" ? "height" : "width";
    const prevSibling = ref?.previousElementSibling;
    const nextSibling = ref?.nextElementSibling;

    if (prevSibling instanceof HTMLElement) {
      prevSibling.style[prop] = `${initialSizes.prevSiblingSize[prop]}px`;
    }
    if (nextSibling instanceof HTMLElement) {
      nextSibling.style[prop] = `${initialSizes.nextSiblingSize[prop]}px`;
    }
  }

  onMount(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  $: resizerClass = [
    "bx--resizer",
    `bx--resizer--${orientation}`,
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  bind:this={ref}
  {...$$restProps}
  class={resizerClass}
  role="separator"
  tabindex="0"
  aria-orientation={orientation}
  aria-live="assertive"
  data-component-name="Resizer"
  on:mousedown={handleMouseDown}
  on:dblclick={handleDoubleClick}
  on:keydown={handleKeyDown}
>
  <span class:bx--visually-hidden={true}>
    Use arrow keys to resize, hold Shift for larger steps. Double-click to
    reset.
  </span>
  <slot />
</div>
