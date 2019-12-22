<script>
  let className = undefined;
  export { className as class };
  export let skeleton = false;
  export let render = undefined;
  export let title = undefined;
  export let tabindex = undefined;
  export let focusable = false;
  export let style = undefined;

  import IconSkeleton from './Icon.Skeleton.svelte';

  const iconName = render.toString().split(' ')[1];
  const size = parseInt(iconName.slice(-2), 10);
</script>

{#if skeleton}
  <IconSkeleton
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    {size}
    class={className}
    {style} />
{:else}
  <svelte:component
    this={render}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    aria-label={$$props['aria-label']}
    aria-labelledby={$$props['aria-labelledby']}
    class={className}
    {tabindex}
    {focusable}
    {style}
    {title} />
{/if}
