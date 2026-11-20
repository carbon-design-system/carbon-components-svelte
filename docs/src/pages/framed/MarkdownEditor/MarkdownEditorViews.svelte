<script>
  import { Button, MarkdownEditor, Stack } from "carbon-components-svelte";

  let value =
    "# Meeting notes\n\n- Ship the **beta**\n- Update the [roadmap](https://example.com)\n";
  let view = "write";
</script>

<Stack gap={5}>
  <MarkdownEditor labelText="Notes" bind:value bind:view />
  <Button
    kind="tertiary"
    on:click={() => (view = view === "write" ? "preview" : "write")}
  >
    Show {view === "write" ? "preview" : "editor"}
  </Button>
</Stack>
