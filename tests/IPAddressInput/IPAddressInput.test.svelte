<script lang="ts">
  import IPAddressInput from "carbon-components-svelte/IPAddressInput/IPAddressInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let config: Partial<ComponentProps<IPAddressInput>> = {};
  export let onInput: (detail: unknown) => void = () => {};
  export let onChange: (detail: unknown) => void = () => {};

  let parsed: ComponentProps<IPAddressInput>["parsed"] = null;
  let valid = true;
</script>

<form data-testid="form">
  <IPAddressInput
    labelText="Address"
    {...config}
    bind:value
    bind:parsed
    bind:valid
    on:input={(e) => onInput(e.detail)}
    on:change={(e) => onChange(e.detail)}
  />
</form>

<div data-testid="value">{value}</div>
<div data-testid="valid">{valid}</div>
<div data-testid="parsed">{parsed ? parsed.text : ""}</div>
