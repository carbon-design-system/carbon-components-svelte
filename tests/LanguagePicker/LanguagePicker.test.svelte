<script lang="ts">
  import LanguagePicker from "carbon-components-svelte/LanguagePicker/LanguagePicker.svelte";

  export let value = "";
  export let onChange: (detail: unknown) => void = () => {};
  export let onClear: () => void = () => {};
</script>

<LanguagePicker
  bind:value
  labelText="Language"
  {...$$restProps}
  on:change={(event) => onChange(event.detail)}
  on:clear={() => onClear()}
/>
<output data-testid="bound">{value}</output>
