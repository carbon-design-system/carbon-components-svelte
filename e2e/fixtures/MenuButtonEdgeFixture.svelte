<script>
  import { MenuButton, MenuItem } from "carbon-components-svelte";
</script>

<div
  data-testid="edge"
  style="display: flex; justify-content: flex-end; padding: 1rem 0.25rem"
>
  <MenuButton size="sm" kind="tertiary" labelText="Export">
    <MenuItem labelText="As comma-separated values" />
    <MenuItem labelText="As a spreadsheet" />
  </MenuButton>
</div>

<div data-testid="middle" style="padding: 1rem 20rem">
  <MenuButton size="sm" kind="tertiary" labelText="Share">
    <MenuItem labelText="Copy a link to this page" />
    <MenuItem labelText="Email" />
  </MenuButton>
</div>
