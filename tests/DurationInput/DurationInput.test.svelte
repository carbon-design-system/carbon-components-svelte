<script lang="ts">
  import DurationInput from "carbon-components-svelte/DurationInput/DurationInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: number | null = null;
  export let fieldProps: Omit<ComponentProps<DurationInput>, "value"> = {};
  export let onChange: (detail: unknown) => void = () => {};
</script>

<form data-testid="form">
  <DurationInput
    bind:value
    labelText="Duration"
    {...fieldProps}
    on:change={(e) => onChange(e.detail)}
  />
</form>
<p data-testid="bound">{String(value)}</p>
