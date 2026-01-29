<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";

  export let ariaLabel: string | undefined = undefined;
</script>

<CodeSnippet type="single" code="test" {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})} />
