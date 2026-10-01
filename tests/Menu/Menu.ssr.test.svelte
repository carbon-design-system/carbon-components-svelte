<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";

  export let open = false;
</script>

<Menu {open} labelText="Actions">
  <MenuItem labelText="Copy" />
  <MenuItem labelText="Paste" />
</Menu>
