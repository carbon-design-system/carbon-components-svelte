<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const props: ComponentProps<CodeSnippet> = {
    type: "single",
    code: "single line",
    "data-testid": "snippet-rest-div",
  };
</script>

<CodeSnippet {...props} />
