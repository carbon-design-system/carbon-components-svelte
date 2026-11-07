<script>
  import { Highlight, Stack, TextInput } from "carbon-components-svelte";

  let query = "cafe";

  const items = [
    "Café au lait",
    "Crème brûlée and cafe noir",
    "İstanbul Cafe",
    "Straße 12",
    "No match in this one",
  ];
</script>

<Stack gap={5}>
  <TextInput labelText="Query" bind:value={query} />
  <ul>
    {#each items as item (item)}
      <li><Highlight text={item} {query} /></li>
    {/each}
  </ul>
</Stack>
