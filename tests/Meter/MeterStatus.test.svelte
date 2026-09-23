<script lang="ts">
  import Meter from "carbon-components-svelte/Meter/Meter.svelte";

  export let value = 10;
  export let status: "default" | "success" | "warning" | "error" | undefined =
    undefined;
  export let errorText: string | undefined = undefined;
</script>

<Meter
  labelText="Storage"
  {value}
  max={100}
  {status}
  {errorText}
  data-testid="status"
/>
