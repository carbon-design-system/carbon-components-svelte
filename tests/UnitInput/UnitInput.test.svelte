<script lang="ts">
  import UnitInput from "carbon-components-svelte/UnitInput/UnitInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: number | null = null;
  export let props: Partial<ComponentProps<UnitInput>> = {};
</script>

<form data-testid="form">
  <UnitInput labelText="Weight" unit="kg" {...props} bind:value />
</form>
<p data-testid="bound">{JSON.stringify(value)}</p>
<button type="button" on:click={() => (value = 7.25)}>Set</button>
