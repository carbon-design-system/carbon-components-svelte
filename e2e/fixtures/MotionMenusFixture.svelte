<script>
  import {
    MenuButton,
    MenuItem,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";
</script>

<MenuButton labelText="Actions" menuTransition>
  <MenuItem>Cut</MenuItem>
  <MenuItem>Copy</MenuItem>
  <MenuItem labelText="Export as">
    <MenuItem>PDF</MenuItem>
    <MenuItem>PNG</MenuItem>
  </MenuItem>
</MenuButton>

<OverflowMenu iconDescription="Overflow actions" menuTransition>
  <OverflowMenuItem text="Action 1" />
  <OverflowMenuItem text="Action 2" />
</OverflowMenu>

<OverflowMenu iconDescription="Portal actions" portalMenu menuTransition>
  <OverflowMenuItem text="Action 1" />
  <OverflowMenuItem text="Action 2" />
</OverflowMenu>
