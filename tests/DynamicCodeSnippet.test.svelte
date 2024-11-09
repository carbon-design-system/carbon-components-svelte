<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";

  let toggled = false;

  $: length = toggled ? 20 : 10;
  $: code = Array.from({ length }, (_, i) => i + 1).join("\n");
</script>

<CodeSnippet type="multi" code="{code}" />
