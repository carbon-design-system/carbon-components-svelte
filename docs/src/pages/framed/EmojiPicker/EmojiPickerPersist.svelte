<script>
  import { Box, EmojiPicker, LocalStorage } from "carbon-components-svelte";

  // One key holds the skin tone, the recent emoji and how often each was used.
  let preferences = { skinTone: 0, recent: [], usage: {} };
  let value;
</script>

<LocalStorage key="emoji-picker-preferences" bind:value={preferences} />
<Box maxWidth="20rem">
  <EmojiPicker
    labelText="Status"
    items={() => import("carbon-components-svelte/emoji-data")}
    bind:value
    bind:skinTone={preferences.skinTone}
    bind:recent={preferences.recent}
    bind:usage={preferences.usage}
  />
</Box>
<p>Used: {JSON.stringify(preferences.usage)}</p>
