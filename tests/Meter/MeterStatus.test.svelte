<script lang="ts">
  import Meter from "carbon-components-svelte/Meter/Meter.svelte";

  export let value = 10;
  export let status: "default" | "success" | "warning" | "error" | undefined =
    undefined;
  export let errorText: string | undefined = undefined;
  export let warningText: string | undefined = undefined;
  export let thresholds: { warning?: number; error?: number } | undefined =
    undefined;
</script>

<Meter
  labelText="Storage"
  {value}
  max={100}
  {status}
  {errorText}
  {warningText}
  {thresholds}
  locale="en-US"
  data-testid="status"
/>
