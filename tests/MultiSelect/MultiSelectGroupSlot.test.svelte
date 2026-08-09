<svelte:options accessors />

<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let selectedIds: ComponentProps<MultiSelect>["selectedIds"] = [];
  export let open = true;
</script>

<MultiSelect labelText="Food" {items} {selectedIds} {open}>
  <svelte:fragment slot="group" let:group let:items={groupItems}>
    <span data-testid="group-{group}">
      {group}:
      {groupItems.filter((item) => item.checked).length}/{groupItems.length}
    </span>
  </svelte:fragment>
</MultiSelect>
