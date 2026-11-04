<script lang="ts">
  import Lightbox from "carbon-components-svelte/Lightbox/Lightbox.svelte";

  export let open = true;
  export let index = 0;
  export let loop = false;
  export let preload = 1;
  export let thumbnails = true;
  export let downloadable = false;
  export let count = 4;

  const items = Array.from({ length: count }, (_, i) => ({
    src: `/full-${i + 1}.jpg`,
    thumbnail: `/thumb-${i + 1}.jpg`,
    alt: `Picture ${i + 1}`,
    caption: `Caption ${i + 1}`,
    width: 2000,
    height: 1000,
  }));

  let changes: number[] = [];
  let closes: string[] = [];
</script>

<p data-testid="index">{index}</p>
<p data-testid="changes">{changes.join(",")}</p>
<p data-testid="closes">{closes.join(",")}</p>

<Lightbox
  bind:open
  bind:index
  {items}
  {loop}
  {preload}
  {thumbnails}
  {downloadable}
  labelText="Product photos"
  on:change={(event) => (changes = [...changes, event.detail.index])}
  on:close={(event) => (closes = [...closes, event.detail.trigger])}
>
  <svelte:fragment slot="caption" let:item let:index>
    {item.caption} ({index + 1})
  </svelte:fragment>
</Lightbox>
