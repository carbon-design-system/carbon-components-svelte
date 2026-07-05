<script lang="ts">
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<MenuButton>["kind"] = "primary";
  export let size: ComponentProps<MenuButton>["size"] = "md";
  export let disabled = false;
  export let open = false;

  const items = ["Cut", "Copy", "Paste"];
</script>

<MenuButton
  labelText="Actions"
  {kind}
  {size}
  {disabled}
  bind:open
  on:click={() => console.log("click")}
  on:mouseenter={() => console.log("mouseenter")}
  on:close={(e) => console.log("close", e.detail)}
>
  {#each items as text}
    <MenuItem on:click={() => console.log("select", text)}>{text}</MenuItem>
  {/each}
</MenuButton>
