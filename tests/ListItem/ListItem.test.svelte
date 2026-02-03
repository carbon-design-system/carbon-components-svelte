<script lang="ts">
  import { ListItem } from "carbon-components-svelte";

  export let slotContent = "";
</script>

<ListItem
  on:click={() => console.log("click")}
  on:mouseover={() => console.log("mouseover")}
  on:mouseenter={() => console.log("mouseenter")}
  on:mouseleave={() => console.log("mouseleave")}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
  <slot />
</ListItem>
