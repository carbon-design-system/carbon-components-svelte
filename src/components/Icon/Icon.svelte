<script>
  let className = undefined;
  export { className as class };
  export let focusable = false;
  export let render = undefined;
  export let skeleton = false;
  export let style = undefined;
  export let tabindex = undefined;
  export let title = undefined;

  import IconSkeleton from './Icon.Skeleton.svelte';

  $: iconName = render.toString().split(' ')[1];
  $: size = parseInt(iconName.slice(-2), 10);
</script>

{#if skeleton}
  <IconSkeleton
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={className}
    {style}
    {size} />
{:else}
  <svelte:component
    this={render}
    aria-label={$$props['aria-label']}
    aria-labelledby={$$props['aria-labelledby']}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={className}
    {tabindex}
    {focusable}
    {style}
    {title} />
{/if}
