<script lang="ts">
  import { ListBoxMenuItem } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let active: ComponentProps<ListBoxMenuItem>["active"] = false;
  export let highlighted: ComponentProps<ListBoxMenuItem>["highlighted"] = false;
  export let disabled: ComponentProps<ListBoxMenuItem>["disabled"] = false;
  export let slotContent = "";
</script>

<ListBoxMenuItem
  {active}
  {highlighted}
  {disabled}
  on:click
  on:mouseenter
  on:mouseleave
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBoxMenuItem>
