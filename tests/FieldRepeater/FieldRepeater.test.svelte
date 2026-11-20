<script lang="ts">
  import FieldRepeater from "carbon-components-svelte/FieldRepeater/FieldRepeater.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- strings or objects, by `objects`
  export let items: any[] = ["ada@example.com", "grace@example.com"];
  export let config: Partial<ComponentProps<FieldRepeater>> = {};
  export let objects = false;
  export let cancelRemove = false;
  export let onChange: (detail: unknown[]) => void = () => {};
  export let onMove: (detail: unknown) => void = () => {};
  export let onAdd: (detail: unknown) => void = () => {};
  export let onRemove: (detail: unknown) => void = () => {};
  let repeater: FieldRepeater;

  export function setItems(next: unknown[]) {
    items = next;
  }

  export function removeAt(index: number) {
    return repeater.removeAt(index);
  }
</script>

<form data-testid="form">
  <FieldRepeater
    bind:this={repeater}
    bind:items
    id="emails"
    name="emails"
    itemName="email"
    legendText="Emails"
    {...config}
    on:change={(e) => onChange(e.detail)}
    on:move={(e) => onMove(e.detail)}
    on:add={(e) => onAdd(e.detail)}
    on:remove={(e) => {
      onRemove(e.detail);
      if (cancelRemove) e.preventDefault();
    }}
    let:index
    let:label
    let:fieldName
    let:id
  >
    {#if objects}
      <TextInput
        id="{id}-email"
        name="{fieldName}[email]"
        labelText={label}
        bind:value={items[index].email}
      />
    {:else}
      <TextInput
        name={fieldName}
        id="{id}-email"
        labelText={label}
        bind:value={items[index]}
      />
    {/if}
  </FieldRepeater>
</form>

<output data-testid="value">{JSON.stringify(items)}</output>
