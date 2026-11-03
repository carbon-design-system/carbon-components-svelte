<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let transition: ComponentProps<Menu>["transition"] = undefined;
  export let direction: ComponentProps<Menu>["direction"] = "bottom";
  export let nested = false;
  export let onOutroEnd: () => void = () => {};
  export let onOutroStart: () => void = () => {};
  export let onIntroStart: () => void = () => {};
  export let onIntroEnd: () => void = () => {};

  let anchor: HTMLButtonElement;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu
  {anchor}
  {direction}
  {transition}
  bind:open
  labelText="Example menu"
  on:introstart={onIntroStart}
  on:introend={onIntroEnd}
  on:outrostart={onOutroStart}
  on:outroend={onOutroEnd}
>
  <MenuItem>First</MenuItem>
  {#if nested}
    <MenuItem labelText="More">
      <MenuItem>Child</MenuItem>
    </MenuItem>
  {/if}
</Menu>
