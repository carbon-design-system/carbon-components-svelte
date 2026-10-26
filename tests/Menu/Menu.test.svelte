<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let direction: ComponentProps<Menu>["direction"] = "bottom";
  export let size: ComponentProps<Menu>["size"] = "sm";
  export let maxHeight: ComponentProps<Menu>["maxHeight"] = undefined;
  export let disabledIndex: number | undefined = undefined;
  export let allDisabled = false;
  export let moveFocusOnClick = false;
  export let onOpen: ((detail: unknown) => void) | undefined = undefined;
  export let onClose: ((detail: unknown) => void) | undefined = undefined;
  export let onItemClick: ((text: string) => void) | undefined = undefined;

  let anchor: HTMLButtonElement;
  let elsewhere: HTMLInputElement;
  let open = false;

  const items = ["First", "Second", "Third"];
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu
  {anchor}
  {direction}
  {size}
  {maxHeight}
  bind:open
  labelText="Example menu"
  on:open={(e) => onOpen?.(e.detail)}
  on:close={(e) => onClose?.(e.detail)}
>
  {#each items as text, index}
    <MenuItem
      disabled={allDisabled || index === disabledIndex}
      on:click={() => {
        onItemClick?.(text);
        if (moveFocusOnClick) elsewhere.focus();
      }}
    >
      {text}
    </MenuItem>
  {/each}
</Menu>

<input aria-label="Elsewhere" bind:this={elsewhere} />
