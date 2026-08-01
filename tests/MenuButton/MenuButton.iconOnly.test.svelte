<script lang="ts">
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<MenuButton>["size"] = "md";
  export let disabled = false;

  const items = ["Cut", "Copy", "Paste"];
</script>

<MenuButton iconOnly labelText="Row actions" {size} {disabled}>
  {#each items as text}
    <MenuItem on:click={() => console.log("select", text)}>{text}</MenuItem>
  {/each}
</MenuButton>
