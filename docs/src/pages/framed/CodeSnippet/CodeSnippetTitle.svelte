<script>
  import { CodeSnippet } from "carbon-components-svelte";

  const code = `<Button on:click={save}>Save</Button>`;
</script>

<CodeSnippet type="multi" title="src/routes/+page.svelte" {code} />
