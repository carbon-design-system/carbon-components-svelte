<script>
  import { ClickableTile, Lightbox, Stack } from "carbon-components-svelte";

  const commons = "https://upload.wikimedia.org/wikipedia/commons/thumb";

  const items = [
    {
      src: `${commons}/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg`,
      thumbnail: `${commons}/9/97/The_Earth_seen_from_Apollo_17.jpg/330px-The_Earth_seen_from_Apollo_17.jpg`,
      alt: "Earth from Apollo 17",
      caption: "Apollo 17, December 1972",
    },
    {
      src: `${commons}/e/e1/FullMoon2010.jpg/1280px-FullMoon2010.jpg`,
      thumbnail: `${commons}/e/e1/FullMoon2010.jpg/330px-FullMoon2010.jpg`,
      alt: "Full Moon",
      caption: "The full Moon, 2010",
    },
    {
      src: `${commons}/c/c7/Saturn_during_Equinox.jpg/1280px-Saturn_during_Equinox.jpg`,
      thumbnail: `${commons}/c/c7/Saturn_during_Equinox.jpg/330px-Saturn_during_Equinox.jpg`,
      alt: "Saturn at equinox",
      caption: "Saturn at equinox, imaged by Cassini",
    },
  ];

  let open = false;
  let index = 0;

  /** @param {number} next */
  function show(next) {
    index = next;
    open = true;
  }
</script>

<Stack orientation="horizontal" gap={5}>
  {#each items as item, position}
    <ClickableTile on:click={() => show(position)}>
      <img src={item.thumbnail} alt={item.alt} width="120" />
    </ClickableTile>
  {/each}
</Stack>

<Lightbox
  bind:open
  bind:index
  {items}
  loop
  downloadable
  labelText="Mission photos"
/>
