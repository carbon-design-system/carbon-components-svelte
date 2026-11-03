<script lang="ts">
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
  import type { ComponentProps } from "svelte";

  export let transition: ComponentProps<MenuButton>["transition"] = undefined;
  export let open = false;
  export let onOutroEnd: () => void = () => {};
</script>

<MenuButton labelText="Actions" {transition} bind:open on:outroend={onOutroEnd}>
  <MenuItem>Cut</MenuItem>
  <MenuItem>Copy</MenuItem>
</MenuButton>
