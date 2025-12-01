<script lang="ts">
  import { ImageLoader, InlineLoading } from "carbon-components-svelte";
  import type ImageLoaderComponent from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";

  // Valid image URL for testing successful loads
  const validImageSrc =
    "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg";
  // Invalid image URL for testing error states
  const invalidImageSrc = "https://invalid-url/nonexistent.png";

  export let imageLoader: ImageLoaderComponent | undefined = undefined;
  export let onImageLoaderReady:
    | ((loader: ImageLoaderComponent) => void)
    | undefined = undefined;
  export let onload: ((event: Event) => void) | undefined = undefined;
  export let onerror: ((event: Event) => void) | undefined = undefined;

  $: if (imageLoader && onImageLoaderReady) {
    onImageLoaderReady(imageLoader);
  }
</script>

<!-- Default image loader -->
<div data-testid="default-loader">
  <ImageLoader src={validImageSrc} alt="IBM Logo" on:load={onload} on:error={onerror} />
</div>

<!-- Image loader with loading and error slots -->
<div data-testid="loader-with-slots">
  <ImageLoader src={validImageSrc} alt="IBM Logo with slots">
    <svelte:fragment slot="loading">
      <div data-testid="loading-state">
        <InlineLoading />
      </div>
    </svelte:fragment>
    <svelte:fragment slot="error">
      <div data-testid="error-state">An error occurred.</div>
    </svelte:fragment>
  </ImageLoader>
</div>

<!-- Image loader with aspect ratio -->
<div data-testid="loader-with-ratio">
  <ImageLoader
    ratio="16x9"
    src={validImageSrc}
    alt="IBM Logo with aspect ratio"
  />
</div>

<!-- Image loader with fade in effect -->
<div data-testid="loader-with-fade">
  <ImageLoader fadeIn src={validImageSrc} alt="IBM Logo with fade" />
</div>

<!-- Image loader with programmatic control -->
<div data-testid="programmatic-loader">
  <ImageLoader
    bind:this={imageLoader}
    src=""
    alt="Programmatically loaded image"
  />
</div>

<!-- Image loader that will trigger error state -->
<div data-testid="error-loader">
  <ImageLoader src={invalidImageSrc} alt="Error state image">
    <svelte:fragment slot="error">
      <div data-testid="error-message">Failed to load image</div>
    </svelte:fragment>
  </ImageLoader>
</div>
