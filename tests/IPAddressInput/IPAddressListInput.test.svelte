<script lang="ts">
  import IPAddressListInput from "carbon-components-svelte/IPAddressInput/IPAddressListInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: string[] = [];
  export let config: Partial<ComponentProps<IPAddressListInput>> = {};
  export let onInvalid: (detail: unknown) => void = () => {};

  let parsed: ComponentProps<IPAddressListInput>["parsed"] = [];
</script>

<form data-testid="form">
  <IPAddressListInput
    labelText="Sources"
    {...config}
    bind:value
    bind:parsed
    on:invalid={(e) => onInvalid(e.detail)}
  />
</form>

<div data-testid="value">{JSON.stringify(value)}</div>
<div data-testid="count">{parsed?.length ?? 0}</div>
