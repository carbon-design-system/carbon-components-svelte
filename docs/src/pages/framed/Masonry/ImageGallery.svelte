<script>
  import {
    AspectRatio,
    Box,
    ClickableTile,
    Masonry,
    Text,
  } from "carbon-components-svelte";

  const photos = [
    { title: "Harbor at dusk", ratio: "3x4", hue: 210 },
    { title: "Salt flats", ratio: "3x2", hue: 30 },
    { title: "Alpine ridge", ratio: "1x1", hue: 160 },
    { title: "Night market", ratio: "2x3", hue: 340 },
    { title: "Glacier lake", ratio: "16x9", hue: 190 },
    { title: "Terraced fields", ratio: "4x3", hue: 90 },
    { title: "Old town stairs", ratio: "3x4", hue: 20 },
    { title: "Coastal road", ratio: "3x2", hue: 230 },
    { title: "Rice paddies", ratio: "1x1", hue: 110 },
    { title: "Desert bloom", ratio: "2x3", hue: 300 },
    { title: "Canal houses", ratio: "4x3", hue: 0 },
    { title: "Pine forest", ratio: "16x9", hue: 140 },
  ];

  // Stand-in artwork, so the demo needs no image files. The aspect ratio
  // reserves each box before an image arrives, so a real photo that loads
  // late does not move the photos below it.
  const artwork = (hue) =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 55% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 60% 32%)"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/></svg>`,
    )}`;
</script>

<Masonry columnWidth="14rem" gap={5}>
  {#each photos as photo, i}
    <ClickableTile noPadding href="#photo-{i + 1}" aria-label={photo.title}>
      <AspectRatio ratio={photo.ratio} fill>
        <img src={artwork(photo.hue)} alt="" />
      </AspectRatio>
      <Box padding={4}>
        <Text type="body-compact-01">{photo.title}</Text>
      </Box>
    </ClickableTile>
  {/each}
</Masonry>
