<svelte:options accessors />

<script lang="ts">
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
  import SelectableTagGroup from "carbon-components-svelte/Tag/SelectableTagGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<SelectableTagGroup>["selected"] = [];
  export let selectionMode: ComponentProps<SelectableTagGroup>["selectionMode"] =
    undefined;
  export let required: ComponentProps<SelectableTagGroup>["required"] =
    undefined;
  export let size: ComponentProps<SelectableTagGroup>["size"] = undefined;
  export let disabled: ComponentProps<SelectableTagGroup>["disabled"] = false;
  export let legendText: ComponentProps<SelectableTagGroup>["legendText"] =
    "Status";
  export let id: ComponentProps<SelectableTagGroup>["id"] = undefined;
  export let closedSize: ComponentProps<SelectableTag>["size"] = undefined;
  export let draftDisabled = false;
  export let name: ComponentProps<SelectableTagGroup>["name"] = undefined;
  export let onChange = (_detail: readonly (string | number)[]) => {};
  export let onTagChange = (_detail: { selected: boolean }) => {};
</script>

<form data-testid="form">
  <SelectableTagGroup
    {id}
    {name}
    bind:selected
    {selectionMode}
    {required}
    {size}
    {disabled}
    {legendText}
    on:change={(e) => onChange(e.detail)}
  >
    <SelectableTag value="open" on:change={(e) => onTagChange(e.detail)}>
      Open
    </SelectableTag>
    <SelectableTag value="closed" size={closedSize}>Closed</SelectableTag>
    <SelectableTag id="draft" disabled={draftDisabled}>Draft</SelectableTag>
  </SelectableTagGroup>
  <button type="reset">Reset</button>
</form>

<output data-testid="selected">{JSON.stringify(selected)}</output>
