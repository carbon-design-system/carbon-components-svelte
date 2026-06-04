<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"];
  export let code: string;
  export let copy: (code: string) => void | Promise<void>;

  let copyEventCount = 0;
</script>
Copy events: {copyEventCount}

<CodeSnippet
  {type}
  {code}
  {copy}
  on:copy={() => {
    copyEventCount += 1;
  }}
/>
