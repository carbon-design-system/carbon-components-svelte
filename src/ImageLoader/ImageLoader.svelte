<script>
  /**
   * @typedef {{ srcset: string; type?: string; media?: string; sizes?: string }} ImageLoaderSource
   * @event {null} load
   * @event {null} error
   * @slot {{}} loading
   * @slot {{ retry: () => void }} error
   */

  /**
   * Specify the image source.
   */
  export let src = "";

  /**
   * Specify the image alt text.
   */
  export let alt = "";

  /**
   * Specify the aspect ratio for the image wrapper, which reserves the
   * image's space before it loads. Accepts one of the named ratios or any
   * positive `"WxH"` string, as `AspectRatio` does. Without it, `width` and
   * `height` attributes set the ratio instead.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2" | `${number}x${number}` | undefined}
   */
  export let ratio = undefined;

  /**
   * Specify the image candidates for the browser to choose from, such as
   * `"photo-480.jpg 480w, photo-960.jpg 960w"`. `src` is the fallback.
   * The preload and the shown image share these candidates, so the browser
   * downloads one file.
   * @type {string | undefined}
   */
  export let srcset = undefined;

  /**
   * Specify the width the image will have in the layout, as a `sizes`
   * attribute, such as `"(min-width: 800px) 50vw, 100vw"`. Used with
   * `srcset`. Avoid `"auto"`: the preload has no layout to measure.
   * @type {string | undefined}
   */
  export let sizes = undefined;

  /**
   * Specify `<source>` elements for art direction or format fallback, such
   * as AVIF and WebP ahead of `src`. The image renders inside a `<picture>`.
   * @type {ImageLoaderSource[] | undefined}
   */
  export let sources = undefined;

  /**
   * Specify how the image fills its box, as `object-fit`. Use `"cover"` with
   * `ratio` to crop an image of another shape to fill the box.
   * @type {"cover" | "contain" | "fill" | "none" | "scale-down" | undefined}
   */
  export let fit = undefined;

  /**
   * Specify which part of the image stays in view when it is cropped, as
   * `object-position`, such as `"30% 20%"`. Implies `fit="cover"`.
   * @type {string | undefined}
   */
  export let focalPoint = undefined;

  /**
   * Fill the image's box until it loads: `true` for a neutral skeleton
   * color, a CSS color for the image's dominant color, or an image URL
   * (such as a tiny `data:` URI) to show blurred. Needs `ratio`, or `width`
   * and `height`, to have a box to fill. It fades out with `fadeIn`.
   * @type {boolean | string | undefined}
   */
  export let placeholder = undefined;

  /**
   * Set to `true` while the image is loading: `src` is set and
   * neither `loaded` nor `error` is `true`.
   * @bindable readonly
   */
  export let loading = false;

  /**
   * Set to `true` when the image is loaded.
   * @bindable readonly
   */
  export let loaded = false;

  /**
   * Set to `true` if an error occurs when loading the image.
   * @bindable readonly
   */
  export let error = false;

  /**
   * Set to `true` to fade in the image on load.
   * The duration uses the `fast-02` value following Carbon guidelines on motion,
   * and is zero when the user prefers reduced motion.
   */
  export let fadeIn = false;

  /**
   * Set to `true` to start loading the image once it comes within
   * `rootMargin` of the viewport, instead of as soon as `src` is set.
   * Server-rendered markup then marks the image `loading="lazy"`.
   */
  export let lazy = false;

  /**
   * Specify how far outside the viewport counts as near with `lazy`, as a
   * CSS margin. The image starts loading before it scrolls into view, so it
   * is ready when it does.
   */
  export let rootMargin = "600px";

  /**
   * Method invoked to load the image provided a `src` value.
   * If no URL is provided, uses the component's `src` prop.
   * A URL other than `src` loads on its own, without `srcset` or `sources`.
   * @type {(url?: string) => void}
   * @example
   * ```svelte
   * <ImageLoader bind:this={loader} src="default.jpg" />
   * <button on:click={() => loader.loadImage("new-image.jpg")}>
   *   Load New Image
   * </button>
   * ```
   */
  export function loadImage(url) {
    if (image != null) image = null;
    loaded = false;
    error = false;
    currentSrc = url || src;
    const img = createPreloader(currentSrc);
    image = img;
    // Ignore a superseded image that settles after `src` has changed.
    img.onload = () => {
      if (image === img) loaded = true;
    };
    img.onerror = () => {
      if (image === img) error = true;
    };
    // An image the document already has settles without a `load` event, so
    // `loading` would flash true until a task later. Check once the browser
    // has resolved the source, before the next paint. It is a microtask, not
    // a synchronous check, so a `load` listener on this component is attached
    // by the time the event fires.
    queueMicrotask(() => {
      if (
        image === img &&
        !loaded &&
        !error &&
        img.complete &&
        img.naturalWidth > 0
      ) {
        loaded = true;
      }
    });
  }

  /**
   * Method invoked to load the image again after an error.
   * The `error` slot receives it as `retry`.
   * @type {() => void}
   */
  export function retry() {
    loadImage(currentSrc || src);
  }

  import { createEventDispatcher, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";
  import { parseAspectRatio } from "../utils/aspect-ratio.js";
  import { noop } from "../utils/noop.js";
  import { observeIntersection } from "../utils/shared-observer.js";
  import ImageLoaderFrame from "./ImageLoaderFrame.svelte";

  const dispatch = createEventDispatcher();

  // "fast-02" duration (ms) from Carbon motion recommended for fading micro-interactions
  const fast02 = 110;

  // Attributes that change which file downloads or how. The preload and the
  // server-rendered `<img>` carry them, so that every `<img>` for this
  // image asks for the same file the same way and the browser sends one request.
  const HINT_ATTRIBUTES = [
    "crossorigin",
    "referrerpolicy",
    "fetchpriority",
    "decoding",
  ];

  /** A `src` that is an image, not a color: a URL or data URI. */
  const IMAGE_URL = /^(data:|blob:|https?:\/\/|\/|\.\.?\/)/i;

  /** A CSS color with no way to end the declaration. */
  const SAFE_COLOR = /^[\w\s#%.,()/+*-]+$/;

  /** A CSS `object-position`, as keywords, lengths and percentages. */
  const SAFE_POSITION = /^[\w\s%.+-]+$/;

  /** @type {null | HTMLImageElement} */
  let image = null;

  /** The URL being loaded and shown, which `loadImage(url)` can set apart from `src`. */
  let currentSrc = src;

  /** In `lazy` mode, an empty element where the image will be, to observe. */
  /** @type {null | HTMLSpanElement} */
  let sentinel = null;
  let nearViewport = false;
  let stopObserving = noop;

  /**
   * @param {Record<string, any>} props
   * @returns {Record<string, any>}
   */
  function pickHints(props) {
    /** @type {Record<string, any>} */
    const picked = {};
    for (const name of HINT_ATTRIBUTES) {
      if (props[name] != null) picked[name] = props[name];
    }
    return picked;
  }

  /**
   * Build the image that downloads ahead of the shown one. It is configured
   * as the shown one is, inside a detached `<picture>` when there are
   * `sources`, so the browser resolves the same candidate for both.
   * @param {string} url
   * @returns {HTMLImageElement}
   */
  function createPreloader(url) {
    const own = url === src;
    /** @type {HTMLImageElement} */
    let img;
    if (own && sources && sources.length > 0) {
      const picture = document.createElement("picture");
      for (const definition of sources) {
        const source = document.createElement("source");
        source.srcset = definition.srcset;
        if (definition.type) source.type = definition.type;
        if (definition.media) source.media = definition.media;
        if (definition.sizes) source.sizes = definition.sizes;
        picture.appendChild(source);
      }
      img = new Image();
      picture.appendChild(img);
    } else {
      img = new Image();
    }
    // Attributes, not properties: `fetchPriority` is a property only in newer browsers.
    for (const name of HINT_ATTRIBUTES) {
      if (hints[name] != null) {
        img.setAttribute(name, hints[name] === true ? "" : hints[name]);
      }
    }
    // `srcset` and `sizes` first: `src` starts the request.
    if (own && sizes) img.sizes = sizes;
    if (own && srcset) img.srcset = srcset;
    img.src = url;
    return img;
  }

  /** @param {string} value */
  function cssUrl(value) {
    return `url("${value.replace(/[\\"\n\r\f]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `)}")`;
  }

  /**
   * @param {boolean | string | undefined} value
   * @returns {{ css: undefined | string; image: boolean }}
   */
  function resolvePlaceholder(value) {
    if (typeof value !== "string" || value === "") {
      return { css: undefined, image: false };
    }
    if (IMAGE_URL.test(value)) return { css: cssUrl(value), image: true };
    return {
      css: SAFE_COLOR.test(value) ? value : undefined,
      image: false,
    };
  }

  function fadeDuration() {
    if (!fadeIn) return 0;
    if (
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return 0;
    }
    return fast02;
  }

  // Once loading is allowed it stays allowed, so turning `lazy` on after
  // the image has loaded doesn't reload it.
  $: if (!lazy) nearViewport = true;
  $: deferLoad = lazy && !nearViewport;
  $: hints = pickHints($$restProps);
  $: if (!src) {
    loaded = false;
    error = false;
    currentSrc = "";
    image = null;
  }
  $: if (src && typeof window !== "undefined" && !deferLoad) loadImage();
  // Declared after the blocks above: Svelte 3/4 run reactive statements once
  // per flush in source order, and `loadImage()` resets `loaded`/`error`
  // inside a call, so an earlier `loading` would miss the reset.
  $: loading = !!currentSrc && !loaded && !error;

  // `srcset` and `sources` describe `src`, not a URL `loadImage(url)` chose.
  $: describesSrc = currentSrc === src;
  $: shownSrcset = describesSrc ? srcset : undefined;
  $: shownSizes = describesSrc ? sizes : undefined;
  $: shownSources =
    describesSrc && sources && sources.length > 0 ? sources : [];

  /** @type {typeof ratio} */
  let frameRatio;
  /** @type {{ ratio?: typeof ratio }} */
  let frameProps = {};

  /**
   * @param {unknown} width
   * @param {unknown} height
   * @returns {`${number}x${number}` | undefined}
   */
  function ratioFromAttributes(width, height) {
    const value = `${width}x${height}`;
    return parseAspectRatio(value)
      ? /** @type {`${number}x${number}`} */ (value)
      : undefined;
  }

  // The attributes give the ratio when `ratio` doesn't, so the box is
  // reserved before the image loads and the page doesn't shift.
  $: frameRatio =
    ratio ?? ratioFromAttributes($$restProps.width, $$restProps.height);
  $: frameProps = frameRatio === undefined ? {} : { ratio: frameRatio };

  $: objectPosition =
    focalPoint && SAFE_POSITION.test(focalPoint) ? focalPoint : undefined;
  $: objectFit = fit ?? (objectPosition ? "cover" : undefined);
  $: resolvedPlaceholder = resolvePlaceholder(placeholder);

  /**
   * @param {null | Element} element
   * @param {string} margin
   */
  function watchSentinel(element, margin) {
    stopObserving();
    stopObserving = noop;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      nearViewport = true;
      return;
    }
    stopObserving = observeIntersection(
      element,
      (entry) => {
        if (entry.isIntersecting) nearViewport = true;
      },
      { rootMargin: margin },
    );
  }

  $: watchSentinel(deferLoad ? sentinel : null, rootMargin);
  $: if (loaded) dispatch("load");
  $: if (error) dispatch("error");

  onMount(() => {
    return () => {
      stopObserving();
      image = null;
    };
  });
</script>

<svelte:component
  this={frameRatio === undefined ? ImageLoaderFrame : AspectRatio}
  {...frameProps}
>
  {#if deferLoad}
    <span bind:this={sentinel} style:display="block" aria-hidden="true"></span>
  {/if}
  {#if placeholder && frameRatio !== undefined}
    <span
      class:bx--image-loader__placeholder={true}
      class:bx--image-loader__placeholder--image={resolvedPlaceholder.image}
      class:bx--image-loader__placeholder--fade={fadeIn}
      class:bx--image-loader__placeholder--done={loaded || error}
      style:--ccs-image-placeholder={resolvedPlaceholder.css}
      aria-hidden="true"
    ></span>
  {/if}
  {#if loading}
    <slot name="loading" />
  {/if}
  {#key currentSrc}
    <!-- Two sibling blocks, not one nested: a `local` transition plays only
         when the block that holds it is made or removed. -->
    {#if loaded && shownSources.length > 0}
      <picture>
        {#each shownSources as source (source)}
          <source
            srcset={source.srcset}
            type={source.type}
            media={source.media}
            sizes={source.sizes}
          />
        {/each}
        <img
          style:width="100%"
          style:--ccs-image-fit={objectFit}
          style:--ccs-image-position={objectPosition}
          {...$$restProps}
          class:bx--image-loader__img={true}
          class:bx--image-loader__img--fit={objectFit !== undefined}
          src={currentSrc}
          srcset={shownSrcset}
          sizes={shownSizes}
          {alt}
          transition:fade|local={{ duration: fadeDuration() }}
        />
      </picture>
    {/if}
    {#if loaded && shownSources.length === 0}
      <img
        style:width="100%"
        style:--ccs-image-fit={objectFit}
        style:--ccs-image-position={objectPosition}
        {...$$restProps}
        class:bx--image-loader__img={true}
        class:bx--image-loader__img--fit={objectFit !== undefined}
        src={currentSrc}
        srcset={shownSrcset}
        sizes={shownSizes}
        {alt}
        transition:fade|local={{ duration: fadeDuration() }}
      />
    {/if}
  {/key}
  {#if error}
    <slot name="error" {retry} />
  {/if}
</svelte:component>

<!--
  Server-rendered `<img>` for preload scanners and crawlers that read the raw
  HTML. It stays `display: none` (it never shows, even without JS); the
  visible `<img>` above takes over once the image has loaded. It is also in the
  first client render so hydration matches.

  It carries `src`, `alt`, the attributes that choose the file (`srcset`,
  `sizes`, `<source>`s, `crossorigin`, `referrerpolicy`, `fetchpriority`,
  `decoding`) and `loading="lazy"` in lazy mode, so preload scanners skip it
  then. The preload and the visible `<img>` choose the file the same way, so
  the browser sends one request. Other rest props stay off it: they would
  duplicate attributes like `id` and `data-testid` with the visible `<img>`.
-->
{#if loading && src}
  <picture style:display="none" aria-hidden="true">
    {#each shownSources as source (source)}
      <source
        srcset={source.srcset}
        type={source.type}
        media={source.media}
        sizes={source.sizes}
      />
    {/each}
    <img
      style:display="none"
      aria-hidden="true"
      loading={lazy ? "lazy" : undefined}
      {...hints}
      {src}
      srcset={shownSrcset}
      sizes={shownSizes}
      {alt}
    />
  </picture>
{/if}
