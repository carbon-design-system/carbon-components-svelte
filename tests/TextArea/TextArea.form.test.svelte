<script lang="ts">
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<TextArea>["value"] = "";
  export let maxCount: ComponentProps<TextArea>["maxCount"] = undefined;
  export let grow: ComponentProps<TextArea>["grow"] = false;
  export let onInput: (event: Event) => void = () => {};
  export let onChange: (event: Event) => void = () => {};
</script>

<form data-testid="form">
  <TextArea
    bind:value
    name="bio"
    labelText="Bio"
    {maxCount}
    {grow}
    on:input={onInput}
    on:change={onChange}
  />
</form>
<p data-testid="bound">{value}</p>
