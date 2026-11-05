<script lang="ts">
  import Markdown from "carbon-components-svelte/Markdown/Markdown.svelte";

  export let source = "";
  export let streaming = false;
  export let highlight:
    | ((
        code: string,
        lang: string,
      ) => ReadonlyArray<{ type: string | null; text: string }> | undefined)
    | undefined = undefined;
  export let schemes: ReadonlyArray<string> | undefined = undefined;
</script>

<Markdown
  data-testid="md"
  {source}
  {streaming}
  {highlight}
  {...schemes ? { schemes } : {}}
/>
