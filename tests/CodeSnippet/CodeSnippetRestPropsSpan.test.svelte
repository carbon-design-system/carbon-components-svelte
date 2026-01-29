<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const props: ComponentProps<CodeSnippet> = {
    type: "inline",
    hideCopyButton: true,
    code: "inline code",
    "data-testid": "snippet-rest-span",
  };
</script>

<CodeSnippet {...props} />
