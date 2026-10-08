<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<ComboBox>["items"] = [];
  export let open = false;
  export let typeahead = false;
  export let filterMode: ComponentProps<ComboBox>["filterMode"] = "remove";
</script>

<ComboBox labelText="Region" {items} {typeahead} {filterMode} bind:open>
  <svelte:fragment slot="group" let:group let:items={groupItems}>
    {`${group} (${groupItems.length})`}
  </svelte:fragment>
</ComboBox>
