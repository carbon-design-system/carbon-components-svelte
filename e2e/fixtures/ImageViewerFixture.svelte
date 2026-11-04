<script>
  import { ImageViewer } from "carbon-components-svelte";
  import { testImage } from "./test-image";

  // `?w=` and `?h=` size the picture, `?wheel=always` zooms on a plain wheel,
  // `?fit=false` leaves the frame to its parent's height, `?broken` points at
  // a missing file, and `?slow` holds the image back so the skeleton shows.
  const params = new URLSearchParams(location.search);
  const width = Number(params.get("w") ?? 2000);
  const height = Number(params.get("h") ?? 1500);
  const wheel = params.get("wheel") === "always" ? "always" : "ctrl";
  const ratio = params.get("fit") === "false" ? undefined : "4x3";

  let src = params.has("broken")
    ? "/missing-image.png"
    : params.has("slow")
      ? ""
      : testImage(width, height, `${width}x${height}`);
  let zoom = "fit";
  let zoomed = false;
  let changes = [];

  /** @param {string} next */
  window.setImageSrc = (next) => {
    src = next;
  };
</script>

<div style="max-width: 640px; height: 480px">
  <ImageViewer
    bind:zoom
    bind:zoomed
    {src}
    {ratio}
    {wheel}
    alt="Test picture"
    on:change={(event) => (changes = [...changes, event.detail])}
  />
</div>
<p data-testid="zoom">{zoom}</p>
<p data-testid="zoomed">{zoomed}</p>
<p data-testid="changes">{changes.length}</p>
<button type="button" data-testid="set-zoom" on:click={() => (zoom = 2)}
  >Zoom 2</button
>
