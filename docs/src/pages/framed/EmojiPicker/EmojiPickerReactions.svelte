<script>
  import { EmojiPicker, Stack, Tag } from "carbon-components-svelte";

  // The picker reports each choice with its glyph in the chosen skin tone,
  // so the app keeps the glyphs it shows.
  let glyphs = { thumbs_up: "\u{1F44D}" };
  let values = ["thumbs_up"];

  function react({ detail }) {
    glyphs = { ...glyphs, [detail.id]: detail.emoji };
  }
</script>

<Stack orientation="horizontal" gap={3} align="center" wrap="wrap">
  {#each values as id (id)}
    <Tag type="gray" title={id}>{glyphs[id]}</Tag>
  {/each}
  <EmojiPicker
    variant="button"
    selectionMode="multiple"
    size="sm"
    labelText="Add reaction"
    searchLabelText="Search reactions"
    items={() => import("carbon-components-svelte/emoji-data")}
    bind:values
    on:select={react}
  />
</Stack>
