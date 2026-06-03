<script lang="ts">
  import { CopyButton } from "carbon-components-svelte";

  export let copy: (text: string) => void;

  let copyEventCount = 0;
</script>
Copy events: {copyEventCount}

<CopyButton
  text="text"
  iconDescription="Copy"
  {copy}
  on:copy={() => {
    copyEventCount += 1;
  }}
/>
