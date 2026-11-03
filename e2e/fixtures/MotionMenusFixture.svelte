<script>
  import { MenuButton, MenuItem } from "carbon-components-svelte";
</script>

<MenuButton labelText="Actions" menuTransition>
  <MenuItem>Cut</MenuItem>
  <MenuItem>Copy</MenuItem>
  <MenuItem labelText="Export as">
    <MenuItem>PDF</MenuItem>
    <MenuItem>PNG</MenuItem>
  </MenuItem>
</MenuButton>
