<script lang="ts">
  import { MultiSelect } from "carbon-components-svelte";
  import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  const items: MultiSelectItem[] = [
    { id: "0", text: "Option 1" },
    { id: "1", text: "Option 2" },
  ];
</script>

<MultiSelect {items} labelText="Default label">
  <span slot="labelText">Custom label content</span>
</MultiSelect>
