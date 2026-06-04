<script lang="ts">
  import { CopyButton } from "carbon-components-svelte";

  export let copy: (text: string) => void | Promise<void>;

  let copyEventCount = 0;
</script>
Copy events: {copyEventCount}

<CopyButton
  text="text"
  iconDescription="Async double click"
  {copy}
  on:copy={() => {
    copyEventCount += 1;
  }}
/>
