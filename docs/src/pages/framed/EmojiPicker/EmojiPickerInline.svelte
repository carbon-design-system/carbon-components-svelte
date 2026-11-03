<script>
  import { Box, EmojiPicker } from "carbon-components-svelte";

  let value = "rocket";
</script>

<Box maxWidth="20rem">
  <EmojiPicker
    variant="inline"
    labelText="Team icon"
    items={() => import("carbon-components-svelte/emoji-data")}
    bind:value
  />
</Box>
<p>Chosen: {value}</p>
