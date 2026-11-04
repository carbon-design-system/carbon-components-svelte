<script>
  import { Lightbox } from "carbon-components-svelte";
  import { testImage } from "./test-image";

  // The lightbox-open page opens it on load, for the layout sweep.
  export let startOpen = false;

  // `?count=` sets the number of images, `?loop` wraps at the ends,
  // `?download` shows the download button, `?thumbs=false` hides the strip,
  // `?start=` opens on another image, and `?open` opens it on load.
  const params = new URLSearchParams(location.search);
  const count = Number(params.get("count") ?? 12);
  const sizes = [
    [2000, 1500],
    [1600, 2000],
    [2400, 1200],
    [1200, 1200],
  ];

  const items = Array.from({ length: count }, (_, i) => {
    const [width, height] = sizes[i % sizes.length];
    return {
      src: testImage(width, height, `Image ${i + 1}`, (i * 47) % 360),
      thumbnail: testImage(128, 96, `${i + 1}`, (i * 47) % 360),
      alt: `Picture ${i + 1}`,
      caption: `Caption for picture ${i + 1}`,
      width,
      height,
    };
  });

  let open = startOpen || params.has("open");
  let index = Number(params.get("start") ?? 0);
  let changes = [];
  let closes = [];
</script>

<main>
  <button
    type="button"
    data-testid="open-lightbox"
    on:click={() => (open = true)}
  >
    Open lightbox
  </button>
  <p data-testid="index">{index}</p>
  <p data-testid="changes">{changes.join(",")}</p>
  <p data-testid="closes">{closes.join(",")}</p>
</main>

<Lightbox
  bind:open
  bind:index
  {items}
  loop={params.has("loop")}
  downloadable={params.has("download")}
  thumbnails={params.get("thumbs") !== "false"}
  labelText="Product photos"
  on:change={(event) => (changes = [...changes, event.detail.index])}
  on:close={(event) => (closes = [...closes, event.detail.trigger])}
/>
