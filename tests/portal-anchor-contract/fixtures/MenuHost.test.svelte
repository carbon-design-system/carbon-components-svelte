<script lang="ts">
  import ComboButton from "carbon-components-svelte/ComboButton/ComboButton.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";

  export let trigger: "menu-button" | "icon-only" | "combo-button" =
    "menu-button";
</script>

{#if trigger === "combo-button"}
  <ComboButton labelText="Save" open>
    <MenuItem labelText="Save as" />
  </ComboButton>
{:else}
  <MenuButton labelText="Actions" iconOnly={trigger === "icon-only"} open>
    <MenuItem labelText="Export as">
      <MenuItem labelText="PDF" />
    </MenuItem>
  </MenuButton>
{/if}
