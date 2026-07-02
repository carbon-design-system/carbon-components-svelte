<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let direction: ComponentProps<Menu>["direction"] = "bottom";
  export let disabledIndex: number | undefined = undefined;

  let anchor: HTMLButtonElement;
  let open = false;

  const items = ["First", "Second", "Third"];
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu
  {anchor}
  {direction}
  bind:open
  labelText="Example menu"
  on:open={(e) => console.log("open", e.detail)}
  on:close={(e) => console.log("close", e.detail)}
>
  {#each items as text, index}
    <MenuItem
      disabled={index === disabledIndex}
      on:click={() => console.log("click", text)}
    >
      {text}
    </MenuItem>
  {/each}
</Menu>
