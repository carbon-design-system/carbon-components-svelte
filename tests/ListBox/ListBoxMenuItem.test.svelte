<script lang="ts">
  import { ListBoxMenuItem } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let active: ComponentProps<ListBoxMenuItem>["active"] = false;
  export let highlighted: ComponentProps<ListBoxMenuItem>["highlighted"] = false;
  export let disabled: ComponentProps<ListBoxMenuItem>["disabled"] = false;
  export let slotContent = "";
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
</script>

<ListBoxMenuItem
  {active}
  {highlighted}
  {disabled}
  on:click={onclick}
  on:mouseenter={onmouseenter}
  on:mouseleave={onmouseleave}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBoxMenuItem>
