<script lang="ts">
  import ComboButton from "carbon-components-svelte/ComboButton/ComboButton.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
</script>

<ComboButton labelText="Save">
  <svelte:fragment slot="labelChildren">
    <strong>Custom label content</strong>
  </svelte:fragment>
  <MenuItem>Save as</MenuItem>
</ComboButton>
