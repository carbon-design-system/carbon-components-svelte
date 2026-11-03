<script lang="ts">
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
  import type { ComponentProps } from "svelte";

  export let menuTransition: ComponentProps<MenuButton>["menuTransition"] =
    undefined;
  export let open = false;
</script>

<MenuButton labelText="Actions" {menuTransition} bind:open>
  <MenuItem>Cut</MenuItem>
  <MenuItem>Copy</MenuItem>
</MenuButton>
