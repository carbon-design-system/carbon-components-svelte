<script lang="ts">
  export let code = "";
  export let portalTooltip: boolean | undefined = undefined;

  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<CodeSnippet {code} type="inline" {copy} {portalTooltip} />
