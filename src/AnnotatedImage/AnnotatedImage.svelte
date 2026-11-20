<script>
  /**
   * @typedef {Object} AnnotatedImagePin
   * @property {string | number} id - Unique within `pins`. Keys the pin and names its popover.
   * @property {number} x - Distance from the left edge, as a percentage of the image's width. Left stays left in RTL.
   * @property {number} y - Distance from the top edge, as a percentage of the image's height.
   * @property {string} label - Names the pin for screen readers, and its legend item. Also the default popover heading.
   * @property {string} [description] - The default popover body.
   * @property {string} [marker] - Text in the pin instead of its number, such as `"A"`.
   */

  /**
   * @typedef {Object} AnnotatedImageChange
   * @property {"add" | "move" | "remove"} action
   * @property {AnnotatedImagePin} pin - The pin that was added, moved or removed.
   * @property {AnnotatedImagePin[]} pins - The pins after the change.
   */

  /**
   * @restProps {div}
   * @event {AnnotatedImageChange} change - An `editable` image added, moved or removed a pin. `pins` already holds the change.
   * @slot {{ pin: AnnotatedImagePin; index: number }} - The popover content. Defaults to the pin's `label` and `description`.
   * @slot {{ pin: AnnotatedImagePin; index: number }} marker - What the pin shows instead of its number, such as an icon. Add the pin's `label` to the markup only if the icon alone would not name it: the label is always read.
   * @slot {{}} image - Replace the `<img>`, such as with an `ImageLoader`. It fills the image's box, so it should be as wide as the box and keep its own aspect ratio.
   */

  /**
   * Specify the image source.
   */
  export let src = "";

  /**
   * Specify the image alt text. It describes the image; each pin has its own `label`.
   */
  export let alt = "";

  /**
   * Specify the image's natural width in pixels. Together with `height`,
   * it sets the box's shape, so the box is the right size before the
   * image loads and the pins never shift.
   */
  export let width = 0;

  /**
   * Specify the image's natural height in pixels.
   */
  export let height = 0;

  /**
   * Specify the pins. Positions are percentages of the image, so they stay on
   * the same spot of the image at any size.
   * With `editable`, bind to it to receive the changes.
   * @bindable writable
   * @type {AnnotatedImagePin[]}
   */
  export let pins = [];

  /**
   * Specify the `id` of the pin whose popover is open, or `null` for none.
   * @bindable writable
   * @type {string | number | null}
   */
  export let openId = null;

  /**
   * Specify a box shape that differs from the image's, such as `"16x9"` or
   * any `"WxH"`, to crop the image to it. Pins stay on the same spot of the
   * image, and a pin outside the crop is hidden with the rest of the image.
   * Left unset, the box has the image's own shape and nothing is cropped.
   * @type {import("../AspectRatio/AspectRatio.svelte").AspectRatioProps["ratio"] | undefined}
   */
  export let ratio = undefined;

  /**
   * Specify how a cropped image fills the box (`ratio`): `"cover"` fills it
   * and crops the overflow, `"contain"` fits the whole image and leaves
   * space around it.
   * @type {"cover" | "contain"}
   */
  export let fit = "cover";

  /**
   * Specify which part of a cropped image stays in view, as percentages
   * of the image: `{ x: 0, y: 0 }` is the top left corner, and the default
   * `{ x: 50, y: 50 }` is the center. Like `object-position`.
   * @type {{ x: number; y: number }}
   */
  export let focalPoint = { x: 50, y: 50 };

  /**
   * Show a numbered list of the pins. Choosing an item opens the same popover
   * as its pin, so the content has two ways in. `"end"` puts it beside the
   * image (below it in a narrow container), and `"bottom"` below.
   * @type {false | "end" | "bottom"}
   */
  export let legend = false;

  /**
   * Specify how Tab and the arrow keys move between pins. `"tab"` makes every
   * pin a tab stop. `"roving"` makes the pins one tab stop, and the arrow keys
   * (Home and End too) move between them in the order of `pins`; in RTL, the
   * Left and Right arrows swap. `editable` always uses `"tab"`, since arrow
   * keys then move the pin.
   * @type {"tab" | "roving"}
   */
  export let keyboard = "tab";

  /**
   * Specify the pin size: `"sm"` is 24px, the smallest target WCAG allows,
   * and `"md"` is 32px.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Specify where the popover opens, against its pin. It moves to the other
   * side, or slides along it, where the window or a box around the image
   * would cut it off.
   * @type {import("../Popover/Popover.svelte").PopoverProps["align"]}
   */
  export let align = "bottom";

  /**
   * Set to `true` to let people place the pins. Clicking the image adds a pin
   * and dragging moves one. For the keyboard, an "Add pin" button adds one at the
   * center, the arrow keys move a focused pin (Shift moves further) and
   * Delete removes it. Changes arrive in the `change` event, and `pins`
   * holds them when it is bound.
   */
  export let editable = false;

  /**
   * Specify the name of the group of pins, and of the legend.
   */
  export let hotspotsLabel = "Hotspots";

  /**
   * Specify the text of the button that adds a pin in `editable` mode.
   */
  export let addPinText = "Add pin";

  /**
   * Specify the label of a pin added in `editable` mode.
   */
  export let newPinLabel = "New pin";

  /**
   * Specify how an `editable` pin is operated, which screen readers read
   * with the pin.
   */
  export let editInstructions =
    "Arrow keys move the pin, and Shift moves it further. Delete removes it.";

  /**
   * Specify an id for the component.
   * The id of a pin's popover derives from it.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the image's box, the element the pins are
   * positioned in.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";
  import Button from "../Button/Button.svelte";
  import Popover from "../Popover/Popover.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { MODAL_CONTEXT_KEY } from "../constants/context-keys.js";
  import Add from "../icons/Add.svelte";
  import {
    clampPercent,
    nudgePosition,
    pointToPercent,
  } from "../utils/annotated-image.js";
  import { dismiss } from "../utils/dismiss.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { noop } from "../utils/noop.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const insideModal = getContext(MODAL_CONTEXT_KEY);

  const PIN_SELECTOR = ".bx--annotated-image__pin";
  /** How far the pointer must travel before a press on a pin is a drag, in px. */
  const DRAG_THRESHOLD = 4;

  /** @type {null | HTMLButtonElement} */
  let addButton = null;
  /**
   * Each open popover, in place or in a portal, by pin id.
   * @type {Record<string, HTMLDivElement | null>}
   */
  const popoverRefs = {};
  let disconnectModalObserver = noop;

  // The pin that is the one tab stop in `keyboard="roving"`.
  /** @type {string | number | undefined} */
  let tabStopId;
  // The pin whose legend item is hovered or focused.
  /** @type {string | number | null} */
  let highlightId = null;
  // The pin being dragged, once the pointer has moved far enough.
  /** @type {null | { id: string | number, x: number, y: number, moved: boolean }} */
  let drag = null;
  // A drag ends with a click on the pin, which must not toggle its popover.
  let swallowClick = false;

  $: roving = keyboard === "roving" && !editable;
  $: if (!pins.some((pin) => pin.id === tabStopId)) tabStopId = pins[0]?.id;
  $: if (openId !== null && !pins.some((pin) => pin.id === openId)) {
    openId = null;
  }

  $: cropped = ratio !== undefined;
  $: aspect = width > 0 && height > 0 ? width / height : 16 / 9;
  $: boxRatio = ratio ?? naturalRatio(width, height);
  $: focalX = clampPercent(Number(focalPoint?.x ?? 50)) / 100;
  $: focalY = clampPercent(Number(focalPoint?.y ?? 50)) / 100;
  $: portalPopover = cropped || insideModal ? true : undefined;

  /**
   * The box shape that matches an image's natural size.
   * @param {number} naturalWidth
   * @param {number} naturalHeight
   */
  function naturalRatio(naturalWidth, naturalHeight) {
    return naturalWidth > 0 && naturalHeight > 0
      ? /** @type {`${number}x${number}`} */ (
          `${naturalWidth}x${naturalHeight}`
        )
      : "16x9";
  }

  /** @param {unknown} value */
  function percent(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0;
  }

  /** @param {string | number} pinId */
  function contentId(pinId) {
    return `${id}-pin-${pinId}-content`;
  }

  /** @param {string | number} pinId */
  function pinElement(pinId) {
    const pinButtons = /** @type {HTMLButtonElement[]} */ (
      Array.from(ref?.querySelectorAll(PIN_SELECTOR) ?? [])
    );
    return (
      pinButtons.find((button) => button.dataset.pinId === String(pinId)) ??
      null
    );
  }

  /** @param {string | number} pinId */
  function focusPin(pinId) {
    pinElement(pinId)?.focus();
  }

  /** @param {AnnotatedImagePin[]} next @param {"add" | "move" | "remove"} action @param {AnnotatedImagePin} pin */
  function commit(next, action, pin) {
    pins = next;
    dispatch("change", { action, pin, pins: next });
  }

  /** @param {AnnotatedImagePin} pin */
  function toggle(pin) {
    if (swallowClick) {
      swallowClick = false;
      return;
    }
    openId = openId === pin.id ? null : pin.id;
    // Safari doesn't focus a button on click. Focus is where Escape returns
    // to, and where the next Tab starts.
    focusPin(pin.id);
  }

  /** @param {AnnotatedImagePin} pin */
  function openFromLegend(pin) {
    openId = pin.id;
    focusPin(pin.id);
  }

  function close() {
    openId = null;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (openId === null || event.key !== "Escape") return;
    // Escape that cancels an IME composition is not a close.
    if (isImeComposition(event)) return;
    // A Modal around the image listens for Escape too.
    event.stopPropagation();
    const pinId = openId;
    close();
    focusPin(pinId);
  }

  // Safari doesn't focus a button on click, so after a mouse open the key
  // never reaches the handler above. Listen on `window` too. Escape leaves
  // focus where it is.
  /** @param {Event} event */
  function handleWindowKeydown(event) {
    const keyEvent = /** @type {KeyboardEvent} */ (event);
    if (
      openId !== null &&
      keyEvent.key === "Escape" &&
      !isImeComposition(keyEvent)
    ) {
      close();
    }
  }

  /** @param {Event} event */
  function handleOutsideClick(event) {
    if (openId === null) return;
    const anchor = pinElement(openId)?.parentElement;
    if (isOutsideClick(event, [anchor, popoverRefs[openId]])) close();
  }

  /**
   * Tab out of a pin (or its popover) closes the popover, as for Toggletip.
   * A `relatedTarget` of `null` keeps it open: it is how some browsers
   * report a click on the popover's non-focusable content.
   * @param {AnnotatedImagePin} pin
   * @param {FocusEvent} event
   */
  function handleFocusout(pin, event) {
    if (openId !== pin.id || event.relatedTarget === null) return;
    const anchor = pinElement(pin.id)?.parentElement;
    const target = /** @type {Node} */ (event.relatedTarget);
    if (!(anchor?.contains(target) || popoverRefs[pin.id]?.contains(target))) {
      close();
    }
  }

  // Close when an ancestor modal closes so the portalled popover does not
  // linger.
  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      insideModal && ref ? observeModalClose(ref, close) : noop;
  }

  /** @param {MouseEvent} event */
  function planePoint(event) {
    return pointToPercent(
      /** @type {HTMLElement} */ (ref).getBoundingClientRect(),
      event.clientX,
      event.clientY,
    );
  }

  /** @param {number} x @param {number} y */
  async function addPin(x, y) {
    const pin = {
      id: uniqueId("pin"),
      x,
      y,
      label: newPinLabel,
    };
    commit([...pins, pin], "add", pin);
    await tick();
    focusPin(pin.id);
  }

  /** @param {MouseEvent} event */
  function handlePlaneClick(event) {
    if (!editable) return;
    const target = /** @type {Element} */ (event.target);
    // A click on a pin or its popover is theirs. A click that only closes a
    // popover isn't a place to add one.
    if (target.closest(".bx--annotated-image__anchor") || openId !== null) {
      return;
    }
    const { x, y } = planePoint(event);
    addPin(x, y);
  }

  // Both are the same coordinates the pointer maps to, so a pin dropped
  // where it was grabbed doesn't jump.
  /**
   * @param {AnnotatedImagePin} pin
   * @param {PointerEvent} event
   */
  function startDrag(pin, event) {
    drag = { id: pin.id, x: event.clientX, y: event.clientY, moved: false };
    return true;
  }

  /** @param {PointerEvent} event */
  function moveDrag(event) {
    if (!drag) return;
    if (
      !drag.moved &&
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) <
        DRAG_THRESHOLD
    ) {
      return;
    }
    if (!drag.moved) {
      drag.moved = true;
      close();
    }
    const { x, y } = planePoint(event);
    const id = drag.id;
    pins = pins.map((pin) => (pin.id === id ? { ...pin, x, y } : pin));
  }

  function endDrag() {
    if (!drag) return;
    const { id: dragged, moved } = drag;
    drag = null;
    if (!moved) return;
    swallowClick = true;
    // The click that follows the release is the next event on the button. If
    // it doesn't come (the pointer was released elsewhere), don't hold the
    // flag for the next real click.
    setTimeout(() => (swallowClick = false));
    const pin = pins.find((item) => item.id === dragged);
    if (pin) dispatch("change", { action: "move", pin, pins });
  }

  /**
   * @param {AnnotatedImagePin} pin
   * @param {KeyboardEvent} event
   */
  function handlePinKeydown(pin, event) {
    if (!editable || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      removePin(pin);
      return;
    }
    const next = nudgePosition(pin, event.key, event.shiftKey);
    if (!next) return;
    event.preventDefault();
    const moved = { ...pin, ...next };
    commit(
      pins.map((item) => (item.id === pin.id ? moved : item)),
      "move",
      moved,
    );
  }

  /** @param {AnnotatedImagePin} pin */
  async function removePin(pin) {
    const index = pins.findIndex((item) => item.id === pin.id);
    commit(
      pins.filter((item) => item.id !== pin.id),
      "remove",
      pin,
    );
    await tick();
    const neighbor = pins[Math.max(0, index - 1)];
    if (neighbor) focusPin(neighbor.id);
    else addButton?.focus();
  }

  onMount(() => {
    return () => disconnectModalObserver();
  });
</script>

<!-- Pins are children of the image's box, so they scale and crop with it. -->
<div
  class:bx--annotated-image={true}
  class:bx--annotated-image--editable={editable}
  class:bx--annotated-image--legend-end={legend === "end"}
  class:bx--annotated-image--legend-bottom={legend === "bottom"}
  use:dismiss={{
    enabled: openId !== null,
    listeners: [
      { type: "click", handler: handleOutsideClick },
      { type: "keydown", handler: handleWindowKeydown },
    ],
  }}
  {id}
  {...$$restProps}
>
  {#if editable}
    <div class:bx--annotated-image__toolbar={true}>
      <Button
        bind:ref={addButton}
        kind="tertiary"
        size="sm"
        icon={Add}
        on:click={() => addPin(50, 50)}
      >
        {addPinText}
      </Button>
    </div>
  {/if}
  {#if editable}
    <span id="{id}-edit-instructions" class:bx--visually-hidden={true}
      >{editInstructions}</span
    >
  {/if}
  <div class:bx--annotated-image__body={true}>
    <div
      class:bx--annotated-image__media={true}
      style:max-inline-size={!cropped && width > 0 ? `${width}px` : undefined}
    >
      <AspectRatio ratio={boxRatio}>
        <div
          class:bx--annotated-image__frame={true}
          class:bx--annotated-image__frame--crop={cropped}
          class:bx--annotated-image__frame--cover={cropped && fit === "cover"}
          class:bx--annotated-image__frame--contain={cropped &&
            fit === "contain"}
          style:--ccs-annotated-image-aspect={cropped ? aspect : undefined}
          style:--ccs-annotated-image-focal-x={cropped ? focalX : undefined}
          style:--ccs-annotated-image-focal-y={cropped ? focalY : undefined}
        >
          <!-- Adding a pin by click has a keyboard path: the Add pin button. -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <div
            bind:this={ref}
            class:bx--annotated-image__plane={true}
            role="group"
            aria-label={hotspotsLabel}
            on:click={handlePlaneClick}
            on:keydown={handleKeydown}
            use:rovingFocus={{
              selector: PIN_SELECTOR,
              orientation: "both",
              wrap: true,
              focusOnMove: true,
              itemsOnly: true,
              rtl: () =>
                resolveLayoutDirection($layoutDirection, ref) === "rtl",
              // No items, no keys: `tab` mode leaves the arrows alone.
              getItems: () =>
                roving
                  ? /** @type {HTMLElement[]} */ (
                      Array.from(ref?.querySelectorAll(PIN_SELECTOR) ?? [])
                    )
                  : [],
              getActiveIndex: () =>
                Math.max(
                  0,
                  pins.findIndex((pin) => pin.id === tabStopId),
                ),
              onMove: (index) => {
                tabStopId = pins[index]?.id;
              },
            }}
          >
            <slot name="image">
              <img
                class:bx--annotated-image__img={true}
                {src}
                {alt}
                draggable="false"
              />
            </slot>
            {#each pins as pin, index (pin.id)}
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class:bx--annotated-image__anchor={true}
                class:bx--annotated-image__anchor--open={openId === pin.id}
                class:bx--annotated-image__anchor--sm={size === "sm"}
                class:bx--annotated-image__anchor--dragging={drag?.moved &&
                  drag.id === pin.id}
                style:left="{percent(pin.x)}%"
                style:top="{percent(pin.y)}%"
                on:focusout={(event) => handleFocusout(pin, event)}
              >
                <button
                  type="button"
                  class:bx--annotated-image__pin={true}
                  class:bx--annotated-image__pin--sm={size === "sm"}
                  class:bx--annotated-image__pin--open={openId === pin.id}
                  class:bx--annotated-image__pin--highlighted={highlightId ===
                    pin.id}
                  data-pin-id={pin.id}
                  tabindex={roving
                    ? tabStopId === pin.id
                      ? 0
                      : -1
                    : undefined}
                  aria-expanded={openId === pin.id}
                  aria-controls={openId === pin.id
                    ? contentId(pin.id)
                    : undefined}
                  aria-describedby={joinDescribedBy(
                    openId === pin.id ? contentId(pin.id) : undefined,
                    editable ? `${id}-edit-instructions` : undefined,
                  )}
                  on:click={() => toggle(pin)}
                  on:focus={() => (tabStopId = pin.id)}
                  on:keydown={(event) => handlePinKeydown(pin, event)}
                  use:pointerDrag={{
                    enabled: editable,
                    onStart: (event) => startDrag(pin, event),
                    onMove: moveDrag,
                    onEnd: endDrag,
                  }}
                >
                  <span class:bx--annotated-image__marker={true}>
                    <slot name="marker" {pin} {index}
                      >{pin.marker ?? index + 1}</slot
                    >
                  </span>
                  <!-- The label follows the number, so the name reads "1 Label". -->
                  <span class:bx--visually-hidden={true}>&nbsp;{pin.label}</span
                  >
                </button>
                <Popover
                  bind:ref={popoverRefs[pin.id]}
                  open={openId === pin.id}
                  {align}
                  {portalPopover}
                  id={contentId(pin.id)}
                  caret
                  highContrast
                  class="bx--toggletip-popover bx--annotated-image__popover"
                >
                  <!-- In a portal, the content is outside the anchor's listeners. -->
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <div
                    class:bx--toggletip-content={true}
                    on:keydown={handleKeydown}
                    on:focusout={(event) => handleFocusout(pin, event)}
                  >
                    <slot {pin} {index}>
                      <p class:bx--annotated-image__title={true}>{pin.label}</p>
                      {#if pin.description}<p>{pin.description}</p>{/if}
                    </slot>
                  </div>
                </Popover>
              </div>
            {/each}
          </div>
        </div>
      </AspectRatio>
    </div>
    {#if legend}
      <ol class:bx--annotated-image__legend={true} aria-label={hotspotsLabel}>
        {#each pins as pin, index (pin.id)}
          <li>
            <button
              type="button"
              class:bx--annotated-image__legend-item={true}
              class:bx--annotated-image__legend-item--open={openId === pin.id}
              on:click={() => openFromLegend(pin)}
              on:mouseenter={() => (highlightId = pin.id)}
              on:mouseleave={() => (highlightId = null)}
              on:focus={() => (highlightId = pin.id)}
              on:blur={() => (highlightId = null)}
            >
              <span class:bx--annotated-image__legend-marker={true}
                >{pin.marker ?? index + 1}</span
              >
              <span>{pin.label}</span>
            </button>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</div>
