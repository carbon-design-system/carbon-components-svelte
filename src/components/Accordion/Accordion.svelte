<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;

  export let skeleton = false;
  export let count = 4;
  export let open = true;

  import { cx } from '../../lib';
  import AccordionSkeleton from './Accordion.Skeleton.svelte';
</script>

{#if skeleton}
  <AccordionSkeleton {count} {open} class={className} {style} />
{/if}

{#if !skeleton}
  <ul
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--accordion', className)}
    {style}>
    <slot />
  </ul>
{/if}
