<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";

  export let type: "single" | "multi" = "single";
</script>

<CodeSnippet {type} disabled code="npm install --save @carbon/icons" />
