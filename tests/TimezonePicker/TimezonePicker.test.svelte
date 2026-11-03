<script lang="ts">
  import TimezonePicker from "carbon-components-svelte/TimezonePicker/TimezonePicker.svelte";

  export let value = "";
  export let onChange: (detail: unknown) => void = () => {};
  export let onClear: () => void = () => {};
</script>

<TimezonePicker
  bind:value
  labelText="Time zone"
  {...$$restProps}
  on:change={(event) => onChange(event.detail)}
  on:clear={() => onClear()}
/>
<output data-testid="bound">{value}</output>
