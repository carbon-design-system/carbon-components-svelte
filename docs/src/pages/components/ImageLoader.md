---
description: Image loaders load images with built-in loading and error states, aspect ratios, responsive sources, placeholders, and fade-in animations.
---

<script>
    import { Box, Button, ImageLoader, InlineLoading, Stack } from "carbon-components-svelte";

    let key = 0;

    const logo = "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg";
    const logo250 = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/250px-IBM_logo.svg.png";
    const logo500 = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/500px-IBM_logo.svg.png";

    const svg = (width, height, body) =>
      "data:image/svg+xml," + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`
      );

    // A 4:3 picture with its subject, the sun, in the top-left corner.
    const photo = svg(
      400,
      300,
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f62fe"/><stop offset="1" stop-color="#8a3ffc"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="80" cy="70" r="40" fill="#f1c21b"/>'
    );

    // A thumbnail of the logo, a few pixels across, to blur.
    const thumbnail = svg(
      4,
      2,
      '<rect width="4" height="2" fill="#ffffff"/><rect y="0" width="4" height="1" fill="#1f70c1"/><rect y="1" width="4" height="1" fill="#7aa7d9"/>'
    );

    let loading = false;
    let loaded = false;
    let imageError = false;
</script>

## Basic

Load an image with the default configuration. The component handles the loading
process automatically.

<ImageLoader src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" />

## Alt text

Set `alt` to provide alternative text for the image.

<ImageLoader alt="IBM logo" src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" />

## Aspect ratio

Maintain consistent image dimensions using aspect ratios. The component uses
[AspectRatio](/components/AspectRatio) to constrain the image.

Supported aspect ratios include `"2x1"`, `"2x3"`, `"16x9"`, `"4x3"`, `"1x1"`,
`"3x4"`, `"3x2"`, `"9x16"` and `"1x2"`.

<ImageLoader ratio="16x9" src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" />

### Custom ratio

Set `ratio` to any positive `"WxH"` string, as with [AspectRatio](/components/AspectRatio#custom-ratio).

<Box maxWidth="20rem">
  <ImageLoader ratio="21x9" src={logo} alt="IBM logo" />
</Box>

### Width and height

Set `width` and `height`, in pixels, as you would on an `<img>`. They set the ratio when `ratio` is not set, so the page reserves the image's space before it loads and doesn't shift. The image still fills the width of its parent.

<Box maxWidth="20rem">
  <ImageLoader width="400" height="300" src={photo} alt="Sun over a gradient" />
</Box>

## Fit and focal point

An image of a different shape from `ratio` is shown at its own proportions, from the top of the box. Set `fit` to `"cover"` to crop it to fill the box instead, or `"contain"` to show all of it inside the box. `fit` takes any `object-fit` value.

Set `focalPoint` to choose which part of a cropped image stays in view, as `object-position`, such as `"30% 20%"`. It implies `fit="cover"`. Here the sun is in the top-left corner:

<Stack orientation="horizontal" gap={5}>
  <Box width="9rem">
    <ImageLoader ratio="1x1" src={photo} alt="Sun over a gradient, no fit" />
  </Box>
  <Box width="9rem">
    <ImageLoader ratio="1x1" fit="cover" src={photo} alt="Sun over a gradient, cropped to the center" />
  </Box>
  <Box width="9rem">
    <ImageLoader ratio="1x1" focalPoint="0% 0%" src={photo} alt="Sun over a gradient, cropped to the top-left" />
  </Box>
</Stack>

## Lazy loading

ImageLoader starts loading as soon as `src` is set, so an image far down the page downloads with the page. Set `lazy` to wait until the image comes within `rootMargin` (600px by default) of the viewport. The server-rendered markup then marks the image `loading="lazy"`, so the browser's preload scanner skips it too.

Pair it with `ratio`, which reserves the image's space, so the page doesn't shift when it loads. Leave `lazy` off for images visible when the page opens, such as a hero image: they should load as early as possible.

Raise `rootMargin`, for example to `"1200px"`, if images still appear blank during fast scrolling. The margin grows the viewport only. Inside a scroll container, such as a modal body, an image starts loading as it scrolls into the container's view.

<ImageLoader lazy ratio="16x9" src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" />

## Responsive images

ImageLoader loads the image before it shows it. Everything that decides which file the browser downloads, `srcset`, `sizes`, `sources` and `crossorigin`, is applied to that preload as well as to the shown image, so the browser downloads one file.

### Resolution

Set `srcset` to the candidates the browser can choose from, and `sizes` to how wide the image is in your layout. `src` is the fallback for browsers that ignore `srcset`.

<Box maxWidth="15.625rem">
  <ImageLoader
    ratio="2x1"
    src={logo250}
    srcset="{logo250} 250w, {logo500} 500w"
    sizes="250px"
    alt="IBM logo"
  />
</Box>

### Format and art direction

Set `sources` to `<source>` elements, tried in order ahead of `src`. Give each a `type` to offer newer formats such as AVIF and WebP, or a `media` query to show a different image at a different size. The image renders inside a `<picture>`.

<Box maxWidth="20rem">
  <ImageLoader
    ratio="2x1"
    src={logo250}
    sources={[
      { srcset: logo500, media: "(min-width: 42rem)" },
      { srcset: logo250 },
    ]}
    alt="IBM logo"
  />
</Box>

```svelte
<ImageLoader
  src="photo.jpg"
  sources={[
    { srcset: "photo.avif", type: "image/avif" },
    { srcset: "photo.webp", type: "image/webp" },
  ]}
  alt="Harbor at dusk"
/>
```

### Loading priority

`fetchpriority="high"` and `decoding` apply to the preload, so set them on the image that is the largest paint of the page. `loading` is the component's own loading state, so it can't be `"lazy"`: use `lazy` instead.

## Placeholder

Set `placeholder` to fill the image's box until the image loads. It needs a box to fill, so set `ratio`, or `width` and `height`. The placeholder fades out with `fadeIn`, and cuts out otherwise. It is decorative, so it isn't read out.

<Button kind="ghost" on:click="{() => { key++;}}">Reload images</Button>

### Skeleton

Set `placeholder` to `true` for the skeleton color, which follows the theme.

<Box maxWidth="15.625rem">
  {#key key}<ImageLoader placeholder fadeIn ratio="2x1" src="{logo}?placeholder={key}" alt="IBM logo" />{/key}
</Box>

### Dominant color

Set `placeholder` to a CSS color, such as the image's dominant color from your build or CMS.

<Box maxWidth="15.625rem">
  {#key key}<ImageLoader placeholder="#8d8d8d" fadeIn ratio="2x1" src="{logo}?color={key}" alt="IBM logo" />{/key}
</Box>

### Blurred image

Set `placeholder` to the URL of a tiny version of the image, usually a data URI under a kilobyte, to show it blurred. A value that starts with `data:`, `blob:`, `http:`, `https:`, `/`, `./` or `../` is an image; anything else is a color.

<Box maxWidth="15.625rem">
  {#key key}<ImageLoader placeholder={thumbnail} fadeIn ratio="2x1" src="{logo}?blur={key}" alt="IBM logo" />{/key}
</Box>

## Fade in

Enable a smooth fade-in animation when the image loads successfully. The fade is skipped when the user prefers reduced motion.

<Button kind="ghost" on:click="{() => { key++;}}">Reload image</Button>
{#key key}<ImageLoader fadeIn ratio="16x9" src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" />{/key}

## Loading and error states

ImageLoader tracks its own loading, loaded, and error state internally. Customize
the UI shown at each stage, read the state directly, or listen for events.

### Slots

Customize the loading and error states using named slots.

<ImageLoader src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg">
    <svelte:fragment slot="loading">
        <InlineLoading />
    </svelte:fragment>
    <svelte:fragment slot="error">
        Unable to load company logo.
    </svelte:fragment>
</ImageLoader>

### Retry

The `error` slot receives a `retry` function that loads the image again, showing the loading state. Call `retry()` on the component for the same from outside the slot.

<ImageLoader src="https://invalid-url.invalid/nonexistent.png" alt="Missing image">
    <svelte:fragment slot="error" let:retry>
        <Stack gap={3}>
            <span>Unable to load the image.</span>
            <Button size="sm" kind="tertiary" on:click={retry}>Retry</Button>
        </Stack>
    </svelte:fragment>
</ImageLoader>

### Bindable state

Bind to `loading`, `loaded`, and `error` to read the image's state. All three
props are readonly outside the component and are set automatically as the
image loads.

<ImageLoader bind:loading bind:loaded bind:error={imageError} src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" />
<p>loading: {loading} · loaded: {loaded} · error: {imageError}</p>

### Events

Dispatches `load` when the image loads successfully, and `error` when it
fails to load.

<ImageLoader
  on:load={() => console.log("loaded")}
  on:error={() => console.log("error")}
  src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg"
/>

## Updating the image source

Change the image displayed by the same ImageLoader instance, either
imperatively or by reacting to a changing `src` value.

### Programmatic

Control image loading programmatically using component references.

<FileSource src="/framed/ImageLoader/ProgrammaticImageLoader" />

### Dynamic

Update the image source dynamically using the same image loader instance for
smooth transitions between images.

<FileSource src="/framed/ImageLoader/DynamicImageLoader" />

## Usage

| Do | Why |
| --- | --- |
| Set `ratio`, or `width` and `height`, on every image. | The box is reserved before the image loads, so the page doesn't shift. |
| Set `fit="cover"` and a `focalPoint` when one `ratio` serves images of different shapes. | Without `fit` an image of another shape leaves part of its box empty. |
| Set `sizes` to the width the image has in your layout. | The browser picks the smallest `srcset` candidate that covers that width, so a `sizes` that is too wide downloads more than the image needs. |
| Leave `lazy` off for the first image on the page. | The largest image should start downloading as early as possible. |
| Use a color or a tiny blurred image for `placeholder` on images that are slow to arrive. | It fills the box with something close to the image instead of an empty gap. |
