<script lang="ts">
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
</script>

<MenuButton labelText="Actions">
  <svelte:fragment slot="labelChildren">
    <strong>Custom trigger content</strong>
  </svelte:fragment>
  <MenuItem>Cut</MenuItem>
</MenuButton>
