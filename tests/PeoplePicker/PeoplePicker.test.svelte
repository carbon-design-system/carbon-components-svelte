<script lang="ts">
  import PeoplePicker from "carbon-components-svelte/PeoplePicker/PeoplePicker.svelte";
  import type { ComponentProps } from "svelte";

  type Person = NonNullable<ComponentProps<PeoplePicker>["value"]>[number];

  export let value: Person[] = [];
  export let config: Partial<ComponentProps<PeoplePicker>> = {};
  export let cancelAdd = false;
  export let onAdd: (detail: unknown) => void = () => {};
  export let onRemove: (detail: unknown) => void = () => {};
  export let onInvalid: (detail: unknown) => void = () => {};
  export let onChange: (detail: Person[]) => void = () => {};
  export let onError: (detail: unknown) => void = () => {};
</script>

<form data-testid="form">
  <PeoplePicker
    labelText="Assignees"
    {...config}
    bind:value
    on:add={(e) => {
      onAdd(e.detail);
      if (cancelAdd) e.preventDefault();
    }}
    on:remove={(e) => onRemove(e.detail)}
    on:invalid={(e) => onInvalid(e.detail)}
    on:change={(e) => onChange(e.detail)}
    on:error={(e) => onError(e.detail)}
  />
</form>

<div data-testid="value">{JSON.stringify(value)}</div>
