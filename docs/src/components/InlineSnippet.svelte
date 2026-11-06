<script lang="ts">
  export let code = "";
  export let portalTooltip: boolean | undefined = undefined;

  import { CodeSnippet } from "carbon-components-svelte";
</script>

<CodeSnippet {code} type="inline" {portalTooltip} />
