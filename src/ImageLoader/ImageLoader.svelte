<script>
  /**
   * @event {null} load
   * @event {null} error
   */

  /**
   * Specify the image source
   */
  export let src = "";

  /**
   * Specify the image alt text
   */
  export let alt = "";

  /**
   * Specify the aspect ratio for the image wrapper
   * @type {"2x1" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2"}
   */
  export let ratio = undefined;

  /**
   * Set to `true` when `loaded` is `true` and `error` is false
   */
  export let loading = false;

  /**
   * Set to `true` when the image is loaded
   */
  export let loaded = false;

  /**
   * Set to `true` if an error occurs when loading the image
   */
  export let error = false;

  /**
   * Set to `true` to fade in the image on load
   * The duration uses the `fast-02` value following Carbon guidelines on motion
   */
  export let fadeIn = false;

  /**
   * Method invoked to load the image provided a `src` value
   * @type {(url?: string) => void}
   */
  export const loadImage = (url) => {
    if (image != null) image = null;
    loaded = false;
    error = false;
    image = new Image();
    image.src = url || src;
    image.onload = () => (loaded = true);
    image.onerror = () => (error = true);
  };

  import { onMount, createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import AspectRatio from "../AspectRatio/AspectRatio.svelte";

  const dispatch = createEventDispatcher();

  // "fast-02" duration (ms) from Carbon motion recommended for fading micro-interactions
  const fast02 = 110;

  let image = null;

  $: loading = !loaded && !error;
  $: if (src && typeof window !== "undefined") loadImage();
  $: if (loaded) dispatch("load");
  $: if (error) dispatch("error");

  onMount(() => {
    return () => (image = null);
  });
</script>

{#if ratio === undefined}
  {#if loading}
    <slot name="loading" />
  {/if}
  {#if loaded}
    <img
      {...$$restProps}
      style="width: 100%;{$$restProps.style}"
      src="{src}"
      alt="{alt}"
      transition:fade|local="{{ duration: fadeIn ? fast02 : 0 }}"
    />
  {/if}
  {#if error}
    <slot name="error" />
  {/if}
{:else}
  <AspectRatio ratio="{ratio}">
    {#if loading}
      <slot name="loading" />
    {/if}
    {#if loaded}
      <img
        {...$$restProps}
        style="width: 100%;{$$restProps.style}"
        src="{src}"
        alt="{alt}"
        transition:fade|local="{{ duration: fadeIn ? fast02 : 0 }}"
      />
    {/if}
    {#if error}
      <slot name="error" />
    {/if}
  </AspectRatio>
{/if}
