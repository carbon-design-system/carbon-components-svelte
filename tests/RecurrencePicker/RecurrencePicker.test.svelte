<script lang="ts">
  import RecurrencePicker from "carbon-components-svelte/RecurrencePicker/RecurrencePicker.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let fieldProps: Omit<ComponentProps<RecurrencePicker>, "value"> = {};
  export let onChange: (detail: unknown) => void = () => {};
</script>

<RecurrencePicker
  bind:value
  startDate={new Date(2026, 10, 3)}
  {...fieldProps}
  on:change={(e) => onChange(e.detail)}
/>
<p data-testid="bound">{value}</p>
