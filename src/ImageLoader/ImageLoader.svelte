<script>
  /**
   * @event {null} load
   * @event {null} error
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
   * Specify the aspect ratio for the image wrapper.
   * @type {"2x1" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2" | undefined}
   */
  export let ratio = undefined;

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
   * The duration uses the `fast-02` value following Carbon guidelines on motion.
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
    const img = new Image();
    image = img;
    currentSrc = url || src;
    img.src = currentSrc;
    // Ignore a superseded image that settles after `src` has changed.
    img.onload = () => {
      if (image === img) loaded = true;
    };
    img.onerror = () => {
      if (image === img) error = true;
    };
  }

  import { createEventDispatcher, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";
  import { noop } from "../utils/noop.js";
  import { observeIntersection } from "../utils/shared-observer.js";

  const dispatch = createEventDispatcher();

  // "fast-02" duration (ms) from Carbon motion recommended for fading micro-interactions
  const fast02 = 110;

  let image = null;

  /** The URL being loaded and shown, which `loadImage(url)` can set apart from `src`. */
  let currentSrc = src;

  /** In `lazy` mode, an empty element where the image will be, to observe. */
  let sentinel = null;
  let nearViewport = false;
  let stopObserving = noop;

  // Once loading is allowed it stays allowed, so turning `lazy` on after
  // the image has loaded doesn't reload it.
  $: if (!lazy) nearViewport = true;
  $: deferLoad = lazy && !nearViewport;
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

{#if ratio === undefined}
  {#if deferLoad}
    <span bind:this={sentinel} style:display="block" aria-hidden="true"></span>
  {/if}
  {#if loading}
    <slot name="loading" />
  {/if}
  {#key currentSrc}
    {#if loaded}
      <img
        style:width="100%"
        {...$$restProps}
        src={currentSrc}
        {alt}
        transition:fade|local={{ duration: fadeIn ? fast02 : 0 }}
      />
    {/if}
  {/key}
  {#if error}
    <slot name="error" />
  {/if}
{:else}
  <AspectRatio {ratio}>
    {#if deferLoad}
      <span bind:this={sentinel} style:display="block" aria-hidden="true"
      ></span>
    {/if}
    {#if loading}
      <slot name="loading" />
    {/if}
    {#key currentSrc}
      {#if loaded}
        <img
          style:width="100%"
          {...$$restProps}
          src={currentSrc}
          {alt}
          transition:fade|local={{ duration: fadeIn ? fast02 : 0 }}
        />
      {/if}
    {/key}
    {#if error}
      <slot name="error" />
    {/if}
  </AspectRatio>
{/if}

<!--
  Server-rendered `<img>` for preload scanners and crawlers that read the raw
  HTML. It stays `display: none` (it never shows, even without JS); the
  visible `<img>` above takes over once the image has loaded. It is also in the
  first client render so hydration matches.

  It only carries `src`, `alt`, and `loading="lazy"` in lazy mode, so preload
  scanners skip it then. Forwarding `$$restProps` would duplicate
  attributes like `id` and `data-testid` with the visible `<img>`, and
  `srcset`/`crossorigin` could trigger a second request.
-->
{#if loading && src}
  <img
    style:display="none"
    aria-hidden="true"
    loading={lazy ? "lazy" : undefined}
    {src}
    {alt}
  />
{/if}
