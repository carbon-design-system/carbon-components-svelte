<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";

  export let onclose: (trigger: string) => void = () => {};

  let open = false;
  let anchor: HTMLButtonElement | null = null;
</script>

<Button
  bind:ref={anchor}
  iconDescription="Actions"
  portalTooltip={false}
  on:click={() => (open = !open)}
>
  <span slot="icon">+</span>
</Button>

<Menu
  bind:open
  {anchor}
  aria-label="Actions menu"
  on:close={(event) => onclose(event.detail.trigger)}
>
  <MenuItem labelText="Rename" />
</Menu>
