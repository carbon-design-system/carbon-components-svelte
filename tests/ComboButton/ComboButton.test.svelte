<script lang="ts">
  import ComboButton from "carbon-components-svelte/ComboButton/ComboButton.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let disabled: ComponentProps<ComboButton>["disabled"] = false;
  export let size: ComponentProps<ComboButton>["size"] = undefined;
  export let direction: ComponentProps<ComboButton>["direction"] = undefined;
  export let tooltipPosition: ComponentProps<ComboButton>["tooltipPosition"] =
    undefined;
  export let iconDescription: ComponentProps<ComboButton>["iconDescription"] =
    undefined;

  export let open = false;

  const items = ["Save as", "Save a copy"];
</script>

<ComboButton
  labelText="Save"
  {disabled}
  {size}
  {direction}
  {tooltipPosition}
  {iconDescription}
  bind:open
  on:click={() => console.log("click")}
  on:close={(e) => console.log("close", e.detail)}
>
  {#each items as text}
    <MenuItem on:click={() => console.log("select", text)}>{text}</MenuItem>
  {/each}
</ComboButton>
