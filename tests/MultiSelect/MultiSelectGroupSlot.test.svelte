<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let selectedIds: ComponentProps<MultiSelect>["selectedIds"] = [];
</script>

<MultiSelect labelText="Regions" {items} {selectedIds} open>
  <svelte:fragment slot="group" let:group let:items={groupItems}>
    {@const checkedCount = groupItems.filter((item) => item.checked).length}
    {`${group}: ${checkedCount} of ${groupItems.length}`}
  </svelte:fragment>
</MultiSelect>
