<script lang="ts">
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<PasswordInput>["value"] = "";
  export let onInput: (event: Event) => void = () => {};
  export let onChange: (event: Event) => void = () => {};
</script>

<form data-testid="form">
  <PasswordInput
    bind:value
    name="pw"
    labelText="Password"
    on:input={onInput}
    on:change={onChange}
  />
</form>
<p data-testid="bound">{value}</p>
