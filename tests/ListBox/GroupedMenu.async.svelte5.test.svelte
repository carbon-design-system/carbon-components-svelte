<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  export let menu: "ComboBox" | "Dropdown" | "MultiSelect";
  export let items: { id: string; text: string; group: string }[];
</script>

{#if menu === "ComboBox"}
  <ComboBox labelText="Region" typeahead open {items}>
    <svelte:fragment slot="group" let:group let:items={groupItems}>
      {`${group} (${groupItems.length})`}
    </svelte:fragment>
  </ComboBox>
{:else if menu === "Dropdown"}
  <Dropdown labelText="Region" open {items}>
    <svelte:fragment slot="group" let:group let:items={groupItems}>
      {`${group} (${groupItems.length})`}
    </svelte:fragment>
  </Dropdown>
{:else}
  <MultiSelect labelText="Region" filterable open {items}>
    <svelte:fragment slot="group" let:group let:items={groupItems}>
      {`${group} (${groupItems.length})`}
    </svelte:fragment>
  </MultiSelect>
{/if}
