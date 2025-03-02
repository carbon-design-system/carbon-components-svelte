<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";

  let copyCount = 0;

  function handleCopy() {
    copyCount += 1;
  }
</script>

Copy events: {copyCount}

<CodeSnippet
  type="single"
  code="npm install --save @carbon/icons"
  on:copy={handleCopy}
/>
