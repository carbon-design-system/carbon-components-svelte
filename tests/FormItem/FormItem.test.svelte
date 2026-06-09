<script lang="ts">
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";

  export let slotContent = "";
</script>

<FormItem
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
</FormItem>
