<script lang="ts">
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<TextInput>["value"] = "";
  export let type: "text" | "number" = "text";
  export let onInput: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <TextInput
    bind:value
    {type}
    name="user"
    labelText="User"
    on:input={onInput}
  />
</form>
<p data-testid="bound">{String(value)}</p>
