<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";

  export let copy: (text: string) => void | Promise<void>;

  let copyEventCount = 0;
</script>
Copy events: {copyEventCount}

<CopyInput
  labelText="API token"
  value="secret-token-123"
  iconDescription="Async double click"
  {copy}
  on:copy={() => {
    copyEventCount += 1;
  }}
/>
