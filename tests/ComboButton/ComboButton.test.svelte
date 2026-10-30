<script lang="ts">
  import ComboButton from "carbon-components-svelte/ComboButton/ComboButton.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let disabled: ComponentProps<ComboButton>["disabled"] = false;
  export let loading: ComponentProps<ComboButton>["loading"] = false;
  export let loadingDescription: ComponentProps<ComboButton>["loadingDescription"] =
    undefined;
  export let size: ComponentProps<ComboButton>["size"] = undefined;
  export let direction: ComponentProps<ComboButton>["direction"] = undefined;
  export let intrinsicAlign: ComponentProps<ComboButton>["intrinsicAlign"] =
    undefined;
  export let tooltipPosition: ComponentProps<ComboButton>["tooltipPosition"] =
    undefined;
  export let tooltipAlignment: ComponentProps<ComboButton>["tooltipAlignment"] =
    undefined;
  export let tooltipAlign: ComponentProps<ComboButton>["tooltipAlign"] =
    undefined;
  export let iconDescription: ComponentProps<ComboButton>["iconDescription"] =
    undefined;

  export let open = false;
  /** Called with the name of each forwarded event, e.g. `click` or `click:trigger`. */
  export let onEvent: ((name: string) => void) | undefined = undefined;
  export let onClose: ((detail: unknown) => void) | undefined = undefined;
  export let onSelect: ((text: string) => void) | undefined = undefined;

  const items = ["Save as", "Save a copy"];
</script>

<ComboButton
  labelText="Save"
  {disabled}
  {loading}
  {loadingDescription}
  {size}
  {direction}
  {intrinsicAlign}
  {tooltipPosition}
  {tooltipAlignment}
  {tooltipAlign}
  {iconDescription}
  bind:open
  on:click={() => onEvent?.("click")}
  on:click:trigger={() => onEvent?.("click:trigger")}
  on:mousedown={() => onEvent?.("mousedown")}
  on:mousedown:trigger={() => onEvent?.("mousedown:trigger")}
  on:focus={() => onEvent?.("focus")}
  on:focus:trigger={() => onEvent?.("focus:trigger")}
  on:blur={() => onEvent?.("blur")}
  on:blur:trigger={() => onEvent?.("blur:trigger")}
  on:mouseover={() => onEvent?.("mouseover")}
  on:mouseover:trigger={() => onEvent?.("mouseover:trigger")}
  on:mouseenter={() => onEvent?.("mouseenter")}
  on:mouseenter:trigger={() => onEvent?.("mouseenter:trigger")}
  on:mouseleave={() => onEvent?.("mouseleave")}
  on:mouseleave:trigger={() => onEvent?.("mouseleave:trigger")}
  on:close={(e) => onClose?.(e.detail)}
>
  {#each items as text}
    <MenuItem on:click={() => onSelect?.(text)}>{text}</MenuItem>
  {/each}
</ComboButton>
