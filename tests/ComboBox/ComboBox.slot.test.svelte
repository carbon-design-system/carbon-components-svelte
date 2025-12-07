<script lang="ts">
  import { ComboBox } from "carbon-components-svelte";
  import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  const items: ComboBoxItem[] = [
    { id: "0", text: "Option 1" },
    { id: "1", text: "Option 2" },
  ];
</script>

<ComboBox {items} labelText="Default label">
  <span slot="labelText">Custom label content</span>
</ComboBox>
