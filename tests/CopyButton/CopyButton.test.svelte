<script lang="ts">
  import { CopyButton } from "carbon-components-svelte";
</script>

<CopyButton
  text="text"
  iconDescription="Basic"
  on:copy={() => {
    console.log("copied");
  }}
/>

<CopyButton
  iconDescription="Custom feedback"
  text="text"
  feedback="Copied to clipboard"
  feedbackTimeout={0}
/>

<CopyButton
  text="Custom copy function"
  iconDescription="Custom copy function"
  copy={(text) => {
    console.log(`Custom copy: ${text}`);
  }}
/>
