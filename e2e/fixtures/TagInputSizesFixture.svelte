<script>
  import { TagInput, TextInput } from "carbon-components-svelte";

  const sizes = ["xs", "sm", undefined, "xl"];
</script>

{#each sizes as size (size ?? "md")}
  <div data-size={size ?? "md"} style="width: 20rem">
    <TagInput {size} labelText="Topics" placeholder="Add a topic" />
    <TextInput {size} labelText="Name" placeholder="Name" />
  </div>
{/each}
