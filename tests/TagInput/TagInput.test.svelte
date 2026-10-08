<script lang="ts">
  import TagInput from "carbon-components-svelte/TagInput/TagInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: string[] = [];
  export let config: Partial<ComponentProps<TagInput>> = {};
  export let cancelAdd = false;
  export let cancelRemove = false;
  export let onAdd: (detail: unknown) => void = () => {};
  export let onRemove: (detail: unknown) => void = () => {};
  export let onInvalid: (detail: unknown) => void = () => {};
  export let onChange: (detail: string[]) => void = () => {};
</script>

<form data-testid="form">
  <TagInput
    labelText="Topics"
    {...config}
    bind:value
    on:add={(e) => {
      onAdd(e.detail);
      if (cancelAdd) e.preventDefault();
    }}
    on:remove={(e) => {
      onRemove(e.detail);
      if (cancelRemove) e.preventDefault();
    }}
    on:invalid={(e) => onInvalid(e.detail)}
    on:change={(e) => onChange(e.detail)}
  />
</form>

<div data-testid="value">{JSON.stringify(value)}</div>
