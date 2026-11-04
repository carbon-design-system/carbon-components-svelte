<script>
  /**
   * @typedef {object} LightboxItem
   * @property {string} src - The full-size image.
   * @property {string} [alt] - The alt text. It names the image, and the thumbnail when no `thumbnail` alt is set.
   * @property {string} [caption] - The text shown under the image.
   * @property {string} [thumbnail] - A small version of the image for the strip. Without it the strip loads `src`, which for a large image costs memory.
   * @property {string} [thumbnailSrcset] - A `srcset` for the thumbnail, for denser screens.
   * @property {number} [width] - The image's width in pixels, to lay it out before it loads.
   * @property {number} [height] - The image's height in pixels.
   * @property {string} [downloadHref] - The file the download button saves, instead of `src`.
   * @property {string} [downloadName] - The name the download button gives the file.
   *
   * @event {{ trigger: "escape-key" | "outside-click" | "close-button" | "programmatic" }} close
   * @event {null} open
   * @event {{ index: number; item: LightboxItem }} change - Dispatched when the shown image changes.
   * @restProps {div}
   * @slot {{ item: LightboxItem; index: number }} caption - Replaces the item's `caption`.
   */

  /**
   * Set to `true` to open the lightbox.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the images to show.
   * @type {ReadonlyArray<LightboxItem>}
   */
  export let items = [];

  /**
   * Specify the index of the shown image. It is clamped to the items.
   * @bindable writable
   */
  export let index = 0;

  /**
   * Set to `true` to continue from the last image to the first, and from the
   * first to the last. Otherwise the buttons disable at either end.
   */
  export let loop = false;

  /**
   * Specify how many images on each side of the shown one to load ahead, so
   * a step to the next is instant. Set to `0` to load only the shown one.
   */
  export let preload = 1;

  /** Set to `false` to hide the strip of thumbnails. */
  export let thumbnails = true;

  /** Set to `true` to show a button that saves the shown image. */
  export let downloadable = false;

  /** Set to `false` to hide the list of keys in the header. */
  export let showShortcuts = true;

  /**
   * Set an id for the top-level element.
   * The caption and thumbnail ids derive from it as `{id}-caption` and
   * `{id}-thumbnail-{index}`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * Specify the name of the dialog. Name the set of images, such as
   * "Product photos".
   */
  export let labelText = "Image gallery";

  /**
   * Specify the position text, such as "Image 3 of 12".
   * @type {(current: number, total: number) => string}
   */
  export let counterText = function counterText(current, total) {
    return `Image ${current} of ${total}`;
  };

  /** Specify the label of the previous-image button. */
  export let previousText = "Previous image";

  /** Specify the label of the next-image button. */
  export let nextText = "Next image";

  /** Specify the label of the download button. */
  export let downloadText = "Download image";

  /** Specify the label of the close button. */
  export let closeText = "Close";

  /** Specify the label of the strip of thumbnails. */
  export let thumbnailsText = "Thumbnails";

  /** Specify the label of the list of keys in the header. */
  export let shortcutsText = "Keyboard shortcuts";

  /**
   * Show the previous image.
   * @type {() => void}
   */
  export function previous() {
    go(index - 1);
  }

  /**
   * Show the next image.
   * @type {() => void}
   */
  export function next() {
    go(index + 1);
  }

  /**
   * Show the image at `target`, or the nearest one when it is out of range
   * and `loop` is off.
   * @type {(target: number) => void}
   */
  export function goTo(target) {
    go(target);
  }

  import { createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ComposedModal from "../ComposedModal/ComposedModal.svelte";
  import ModalHeader from "../ComposedModal/ModalHeader.svelte";
  import ImageViewer from "../ImageViewer/ImageViewer.svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import Download from "../icons/Download.svelte";
  import { getLayoutDirection, inlineKey } from "../utils/layout-direction.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | { zoomIn: () => void; zoomOut: () => void; reset: () => void; pan: (dx: number, dy: number) => void }} */
  let viewer = null;
  /** @type {null | HTMLDivElement} */
  let strip = null;
  let zoomed = false;
  let announcement = "";

  /** The images already requested, kept so a request isn't dropped early. */
  /** @type {Map<string, HTMLImageElement>} */
  let preloaded = new Map();
  let announcedIndex = index;

  $: total = items.length;
  $: current = Math.max(0, Math.min(index, total - 1));
  $: item = items[current];
  $: atStart = !loop && current <= 0;
  $: atEnd = !loop && current >= total - 1;
  $: neighbours = open ? neighbourSources(items, current, preload, loop) : [];
  $: preloadImages(neighbours);
  $: announce(open, current);
  $: if (!open) viewer?.reset();
  $: followInStrip(strip, open, current);

  /**
   * @param {ReadonlyArray<LightboxItem>} list
   * @param {number} from
   * @param {number} count
   * @param {boolean} wrap
   * @returns {string[]}
   */
  function neighbourSources(list, from, count, wrap) {
    /** @type {string[]} */
    const sources = [];
    for (let step = 1; step <= count; step++) {
      for (const target of [from + step, from - step]) {
        const position = wrap
          ? ((target % list.length) + list.length) % list.length
          : target;
        const neighbour = list[position];
        if (neighbour && position !== from) sources.push(neighbour.src);
      }
    }
    return sources;
  }

  /** @param {string[]} sources */
  function preloadImages(sources) {
    if (typeof Image === "undefined") return;
    const wanted = new Set(sources);
    for (const source of preloaded.keys()) {
      if (!wanted.has(source)) preloaded.delete(source);
    }
    for (const source of wanted) {
      if (preloaded.has(source)) continue;
      const image = new Image();
      image.decoding = "async";
      image.src = source;
      preloaded.set(source, image);
    }
  }

  /**
   * @param {boolean} isOpen
   * @param {number} position
   */
  function announce(isOpen, position) {
    const shown = items[position];
    // Opening is announced by the dialog itself, so only a change while
    // open is.
    if (isOpen && shown && position !== announcedIndex) {
      announcement = [counterText(position + 1, total), shown.caption]
        .filter(Boolean)
        .join(". ");
    } else if (!isOpen) {
      announcement = "";
    }
    announcedIndex = position;
  }

  /** @param {number} target */
  function go(target) {
    if (total === 0) return;
    const next = loop
      ? ((target % total) + total) % total
      : Math.max(0, Math.min(target, total - 1));
    if (next === current) return;
    index = next;
    dispatch("change", { index: next, item: items[next] });
  }

  /**
   * Scroll the strip, and only the strip, so the thumbnail is in its middle.
   * The strip scrolls along the inline axis, which `scrollIntoViewWithin`
   * does not handle. The offset is physical, so it holds in either direction.
   * @param {HTMLElement} node
   * @param {HTMLElement} option
   */
  function centerInStrip(node, option) {
    const from = option.getBoundingClientRect();
    const within = node.getBoundingClientRect();
    node.scrollLeft +=
      from.left + from.width / 2 - (within.left + within.width / 2);
  }

  /**
   * Keep the selected thumbnail in view, and the focus on it when the focus
   * is in the strip.
   * @param {null | HTMLDivElement} node
   * @param {boolean} isOpen
   * @param {number} position
   */
  async function followInStrip(node, isOpen, position) {
    if (!node || !isOpen) return;
    const focusInStrip = node.contains(document.activeElement);
    await tick();
    const option = node.querySelector('[aria-selected="true"]');
    if (!(option instanceof HTMLElement) || position !== current) return;
    centerInStrip(node, option);
    if (focusInStrip) option.focus({ preventScroll: true });
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target instanceof Element ? event.target : null;
    const inStrip = Boolean(target?.closest(".bx--lightbox__strip"));
    let handled = true;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown": {
        // A zoomed image pans, unless the strip has the focus: its arrows
        // always move through the images.
        if (zoomed && !inStrip) {
          const dx =
            event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
          const dy =
            event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
          viewer?.pan(dx * 120, dy * 120);
        } else {
          const key = inlineKey(event.key, $layoutDirection, ref);
          if (key === "ArrowRight" || key === "ArrowDown") go(current + 1);
          else if (key === "ArrowLeft" || key === "ArrowUp") go(current - 1);
          else handled = false;
        }
        break;
      }
      case "Home":
        go(0);
        break;
      case "End":
        go(total - 1);
        break;
      case "+":
      case "=":
        viewer?.zoomIn();
        break;
      case "-":
      case "_":
        viewer?.zoomOut();
        break;
      case "0":
        viewer?.reset();
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  }

  /**
   * @param {LightboxItem} thumb
   * @param {number} position
   */
  function thumbnailLabel(thumb, position) {
    return thumb.alt || counterText(position + 1, total);
  }

  /**
   * @param {HTMLElement} node
   */
  function stripScroll(node) {
    strip = /** @type {HTMLDivElement} */ (node);
    return {
      destroy() {
        strip = null;
      },
    };
  }

  /** @param {CustomEvent<{ trigger: "escape-key" | "outside-click" | "close-button" | "programmatic" }>} event */
  function handleClose(event) {
    preloaded = new Map();
    dispatch("close", event.detail);
  }
</script>

<ComposedModal
  bind:open
  bind:ref
  {id}
  lazy
  containerClass="bx--lightbox"
  selectorPrimaryFocus=".bx--image-viewer__frame"
  aria-label={labelText}
  aria-roledescription="image gallery"
  {...$$restProps}
  on:close={handleClose}
  on:open
  on:keydown={handleKeydown}
>
  <ModalHeader iconDescription={closeText}>
    <div class:bx--lightbox__bar={true}>
      <span class:bx--lightbox__counter={true}
        >{#if item}{counterText(current + 1, total)}{/if}</span
      >
      {#if showShortcuts}
        <div
          class:bx--lightbox__shortcuts={true}
          role="group"
          aria-label={shortcutsText}
        >
          <Kbd shortcut="arrowleft" size="sm" /><Kbd
            shortcut="arrowright"
            size="sm"
          />
          <Kbd shortcut="+" size="sm" /><Kbd shortcut="-" size="sm" />
          <Kbd shortcut="0" size="sm" />
          <Kbd shortcut="escape" size="sm" />
        </div>
      {/if}
      {#if downloadable && item}
        <Button
          kind="ghost"
          size="sm"
          icon={Download}
          iconDescription={downloadText}
          href={item.downloadHref ?? item.src}
          download={item.downloadName ?? ""}
        />
      {/if}
    </div>
  </ModalHeader>
  <div class:bx--lightbox__stage={true}>
    {#if item}
      <ImageViewer
        bind:this={viewer}
        bind:zoomed
        src={item.src}
        alt={item.alt ?? ""}
        width={item.width}
        height={item.height}
        wheel="always"
      />
      {#if total > 1}
        <div
          class:bx--lightbox__nav={true}
          class:bx--lightbox__nav--previous={true}
        >
          <Button
            kind="ghost"
            icon={ChevronLeft}
            iconDescription={previousText}
            tooltipPosition="right"
            disabled={atStart}
            on:click={previous}
          />
        </div>
        <div
          class:bx--lightbox__nav={true}
          class:bx--lightbox__nav--next={true}
        >
          <Button
            kind="ghost"
            icon={ChevronRight}
            iconDescription={nextText}
            tooltipPosition="left"
            disabled={atEnd}
            on:click={next}
          />
        </div>
      {/if}
    {/if}
  </div>
  <div class:bx--lightbox__footer={true}>
    {#if item}
      <div class:bx--lightbox__caption={true} id="{id}-caption">
        <slot name="caption" {item} index={current}>{item.caption ?? ""}</slot>
      </div>
    {/if}
    {#if thumbnails && total > 1}
      <div
        class:bx--lightbox__strip={true}
        role="listbox"
        aria-orientation="horizontal"
        aria-label={thumbnailsText}
        use:stripScroll
      >
        {#each items as thumb, position (position)}
          <div
            id="{id}-thumbnail-{position}"
            class:bx--lightbox__thumbnail={true}
            role="option"
            tabindex={position === current ? 0 : -1}
            aria-selected={position === current}
            aria-label={thumbnailLabel(thumb, position)}
            on:click={() => go(position)}
            on:keydown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                go(position);
              }
            }}
          >
            <img
              src={thumb.thumbnail ?? thumb.src}
              srcset={thumb.thumbnailSrcset}
              sizes={thumb.thumbnailSrcset ? "64px" : undefined}
              alt=""
              width="64"
              height="48"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
</ComposedModal>
