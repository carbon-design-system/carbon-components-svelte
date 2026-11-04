<script>
  import { Button, Lightbox } from "carbon-components-svelte";

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
    {
      src: `${commons}/5/56/Mars_Valles_Marineris.jpeg/1280px-Mars_Valles_Marineris.jpeg`,
      thumbnail: `${commons}/5/56/Mars_Valles_Marineris.jpeg/330px-Mars_Valles_Marineris.jpeg`,
      alt: "Valles Marineris on Mars",
      caption: "Valles Marineris, Mars",
    },
  ];

  let open = false;
</script>

<Button on:click={() => (open = true)}>View mission photos</Button>

<Lightbox bind:open {items} labelText="Mission photos" />
