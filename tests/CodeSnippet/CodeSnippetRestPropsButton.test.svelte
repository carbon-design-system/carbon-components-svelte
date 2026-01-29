<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const props: ComponentProps<CodeSnippet> = {
    type: "inline",
    code: "inline code",
    "data-testid": "snippet-rest-btn",
  };
</script>

<CodeSnippet {...props} />
