<script lang="ts">
  import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";
  import type { ComponentProps } from "svelte";

  export let status: ComponentProps<ProgressBar>["status"] = "active";
  export let value: ComponentProps<ProgressBar>["value"] = 40;
  export let helperText = "";
  export let errorText = "Error";
  export let finishedText = "Complete";
</script>

<ProgressBar
  {status}
  {value}
  {helperText}
  {errorText}
  {finishedText}
  labelText="Progress"
/>
