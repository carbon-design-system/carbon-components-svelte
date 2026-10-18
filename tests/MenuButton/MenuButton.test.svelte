<script lang="ts">
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<MenuButton>["kind"] = "primary";
  export let size: ComponentProps<MenuButton>["size"] = "md";
  export let disabled = false;
  export let open = false;
  export let onMouseenter: (() => void) | undefined = undefined;
  export let onClose: ((detail: unknown) => void) | undefined = undefined;
  export let onSelect: ((text: string) => void) | undefined = undefined;

  const items = ["Cut", "Copy", "Paste"];
</script>

<MenuButton
  labelText="Actions"
  {kind}
  {size}
  {disabled}
  bind:open
  on:mouseenter={() => onMouseenter?.()}
  on:close={(e) => onClose?.(e.detail)}
>
  {#each items as text}
    <MenuItem on:click={() => onSelect?.(text)}>{text}</MenuItem>
  {/each}
</MenuButton>
