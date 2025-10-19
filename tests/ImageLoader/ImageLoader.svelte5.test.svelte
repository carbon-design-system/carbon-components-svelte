<svelte:options accessors />

<script lang="ts">
  import { ImageLoader, InlineLoading } from "carbon-components-svelte";

  const validImageSrc =
    "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg";
  const invalidImageSrc = "https://invalid-url/nonexistent.png";

  export let imageLoader: ImageLoader;
  export let onload: ((e: Event) => void) | undefined = undefined;
  export let onerror: ((e: Event) => void) | undefined = undefined;
</script>

<div data-testid="default-loader">
  <ImageLoader src={validImageSrc} alt="IBM Logo" {onload} {onerror} />
</div>

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

<div data-testid="loader-with-ratio">
  <ImageLoader
    ratio="16x9"
    src={validImageSrc}
    alt="IBM Logo with aspect ratio"
  />
</div>

<div data-testid="loader-with-fade">
  <ImageLoader fadeIn src={validImageSrc} alt="IBM Logo with fade" />
</div>

<div data-testid="programmatic-loader">
  <ImageLoader
    bind:this={imageLoader}
    src=""
    alt="Programmatically loaded image"
  />
</div>

<div data-testid="error-loader">
  <ImageLoader src={invalidImageSrc} alt="Error state image" {onerror}>
    <svelte:fragment slot="error">
      <div data-testid="error-message">Failed to load image</div>
    </svelte:fragment>
  </ImageLoader>
</div>
