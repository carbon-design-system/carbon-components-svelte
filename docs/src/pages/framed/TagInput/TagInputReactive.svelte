<script>
  import { Stack, TagInput } from "carbon-components-svelte";

  let value = ["Svelte", "TypeScript"];
</script>

<Stack gap={5}>
  <TagInput bind:value labelText="Topics" placeholder="Add a topic" />
  <p>Bound value: {JSON.stringify(value)}</p>
</Stack>
