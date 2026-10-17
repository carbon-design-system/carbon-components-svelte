<script lang="ts">
  import type { ComponentType } from "svelte";

  export let component: ComponentType;
  export let fieldProps: Record<string, unknown> = {};
  export let value: unknown = "";
  export let onInput: () => void = () => {};
  export let onChange: () => void = () => {};
  export let onClear: () => void = () => {};
</script>

<form data-testid="form">
  <svelte:component
    this={component}
    bind:value
    name="field"
    {...fieldProps}
    on:input={onInput}
    on:change={onChange}
    on:clear={onClear}
  >
    <svelte:fragment slot="labelChildren">Field</svelte:fragment>
  </svelte:component>
</form>
<p data-testid="bound">{String(value)}</p>
