<script lang="ts">
  import { ListBox } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<ListBox>["size"] = undefined;
  export let type: ComponentProps<ListBox>["type"] = "default";
  export let open: ComponentProps<ListBox>["open"] = false;
  export let light: ComponentProps<ListBox>["light"] = false;
  export let disabled: ComponentProps<ListBox>["disabled"] = false;
  export let invalid: ComponentProps<ListBox>["invalid"] = false;
  export let invalidText: ComponentProps<ListBox>["invalidText"] = "";
  export let warn: ComponentProps<ListBox>["warn"] = false;
  export let warnText: ComponentProps<ListBox>["warnText"] = "";
  export let slotContent = "";
  export let onkeydown: ((event: KeyboardEvent) => void) | undefined =
    undefined;
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<ListBox
  {size}
  {type}
  {open}
  {light}
  {disabled}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  on:keydown={onkeydown}
  on:click={onclick}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBox>
