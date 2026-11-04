<script>
  import { Button, ImageViewer, Stack } from "carbon-components-svelte";

  let zoom = "fit";
  let zoomed = false;
</script>

<Stack gap={5}>
  <ImageViewer
    bind:zoom
    bind:zoomed
    ratio="16x9"
    src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg"
    alt="Photograph of Earth taken by the Apollo 17 crew"
  />
  <Stack orientation="horizontal" gap={3} align="center">
    <Button size="small" kind="tertiary" on:click={() => (zoom = "fit")}
      >Fit</Button
    >
    <Button size="small" kind="tertiary" on:click={() => (zoom = 1)}
      >100%</Button
    >
    <Button size="small" kind="tertiary" on:click={() => (zoom = 2)}
      >200%</Button
    >
    <span>
      Zoom: {zoom === "fit" ? "fit" : `${Math.round(zoom * 100)}%`}
      {zoomed ? "(panning enabled)" : ""}
    </span>
  </Stack>
</Stack>
