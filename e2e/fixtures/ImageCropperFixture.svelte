<script>
  import { ImageCropper } from "carbon-components-svelte";
  import { makeImage, samplePixels } from "./test-image";

  // `?w=` and `?h=` size the picture, `?type=jpeg` and `?exif=6` write a
  // JPEG with an orientation, `?noise` makes it hard to decode, `?mode=box`, `?aspect=1.5` (or `free`),
  // `?shape=circle`, `?minw=` `?minh=`, `?grid=always`, `?wheel=always`,
  // `?controls=false` and `?disabled` set the props, `?broken` points at a
  // missing file, `?heic` hands over a HEIC file, and `?cross=URL` loads a
  // URL, with `crossorigin` unless `?nocors` is set. `?h100` is the stage height.
  const params = new URLSearchParams(location.search);
  const num = (name, fallback) =>
    params.has(name) ? Number(params.get(name)) : fallback;

  const mode = params.get("mode") ?? "image";
  const aspectParam = params.get("aspect");
  const aspect =
    aspectParam === "free" ? null : aspectParam ? Number(aspectParam) : 1;
  const shape = params.get("shape") ?? "rect";

  let src;
  let value = null;
  let status = "empty";
  let cropper;
  let loads = [];
  let changes = [];
  let errors = [];

  async function load() {
    if (params.has("broken")) {
      src = "/missing-image.png";
    } else if (params.has("heic")) {
      src = new File([new Uint8Array(64)], "photo.heic", {
        type: "image/heic",
      });
    } else if (params.has("cross")) {
      src = params.get("cross");
    } else {
      const blob = await makeImage({
        width: num("w", 600),
        height: num("h", 400),
        type: params.get("type") ?? undefined,
        noise: params.has("noise"),
        exif: params.has("exif") ? num("exif", 1) : undefined,
      });
      // Marks for a timing run: the file is ready, the editor is ready.
      performance.mark("cropper-src");
      src = blob;
    }
  }
  load();

  window.cropperTest = {
    toBlob: (options) => cropper.toBlob(options),
    getData: () => cropper.getData(),
    reset: () => cropper.reset(),
    rotateBy: (degrees) => cropper.rotateBy(degrees),
    flip: (axis) => cropper.flip(axis),
    setValue: (next) => {
      value = next;
    },
    // Export, then read pixels at fractional points of the result.
    exportPixels: async (options, points) => {
      const blob = await cropper.toBlob(options);
      return {
        type: blob.type,
        size: blob.size,
        ...(await samplePixels(blob, points)),
      };
    },
    exportError: async (options) => {
      try {
        await cropper.toBlob(options);
        return null;
      } catch (error) {
        return { name: error.name, code: error.code, message: error.message };
      }
    },
    makePng: async (width, height) => {
      const blob = await makeImage({ width, height });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let text = "";
      for (const byte of bytes) text += String.fromCharCode(byte);
      return btoa(text);
    },
  };
</script>

<div
  style="max-width: 640px; --ccs-image-cropper-height: {params.get('h100') ??
    '24rem'}"
>
  <ImageCropper
    bind:this={cropper}
    bind:value
    bind:status
    {src}
    {mode}
    {aspect}
    {shape}
    minWidth={num("minw", 1)}
    minHeight={num("minh", 1)}
    grid={params.get("grid") ?? "drag"}
    wheel={params.get("wheel") ?? "ctrl"}
    controls={params.get("controls") !== "false"}
    disabled={params.has("disabled")}
    crossorigin={params.has("cross") && !params.has("nocors")
      ? "anonymous"
      : undefined}
    on:load={(event) => {
      performance.mark("cropper-load");
      loads = [...loads, event.detail];
    }}
    on:change={(event) => (changes = [...changes, event.detail])}
    on:error={(event) => (errors = [...errors, event.detail])}
  />
</div>
<!-- What the tests read back; not part of what the sweep checks. -->
<div hidden>
  <p data-testid="status">{status}</p>
  <p data-testid="value">{JSON.stringify(value)}</p>
  <p data-testid="changes">{changes.length}</p>
  <p data-testid="loads">{JSON.stringify(loads)}</p>
  <p data-testid="errors">{JSON.stringify(errors)}</p>
</div>
