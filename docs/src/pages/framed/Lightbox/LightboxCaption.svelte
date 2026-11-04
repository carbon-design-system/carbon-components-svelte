<script>
  import { Button, Lightbox, Link } from "carbon-components-svelte";

  const commons = "https://upload.wikimedia.org/wikipedia/commons/thumb";

  const items = [
    {
      src: `${commons}/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg`,
      thumbnail: `${commons}/9/97/The_Earth_seen_from_Apollo_17.jpg/330px-The_Earth_seen_from_Apollo_17.jpg`,
      alt: "Earth from Apollo 17",
    },
    {
      src: `${commons}/e/e1/FullMoon2010.jpg/1280px-FullMoon2010.jpg`,
      thumbnail: `${commons}/e/e1/FullMoon2010.jpg/330px-FullMoon2010.jpg`,
      alt: "Full Moon",
    },
  ];

  // Each item's credit, by position.
  const credits = [
    {
      name: "NASA",
      page: "https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg",
    },
    {
      name: "Gregory H. Revera",
      page: "https://commons.wikimedia.org/wiki/File:FullMoon2010.jpg",
    },
  ];

  let open = false;
  let changes = [];
</script>

<Button on:click={() => (open = true)}>View with credits</Button>

<Lightbox
  bind:open
  {items}
  labelText="Mission photos"
  on:change={(event) => (changes = [...changes, event.detail.index + 1])}
>
  <svelte:fragment slot="caption" let:item let:index>
    {item.alt}. Credit: {credits[index].name}.
    <Link href={credits[index].page} target="_blank">Source</Link>
  </svelte:fragment>
</Lightbox>

<p>Images viewed: {changes.length ? changes.join(", ") : "none yet"}</p>
