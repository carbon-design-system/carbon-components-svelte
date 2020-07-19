<script>
  export let render = undefined;
  export let skeleton = false;

  import IconSkeleton from "./Icon.Skeleton.svelte";

  $: iconName = render.toString().split(" ")[1];
  $: size = parseInt(iconName.slice(-2), 10);
</script>

{#if skeleton}
  <IconSkeleton
    {size}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{:else}
  <svelte:component
    this={render}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{/if}
