<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let small = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

{#if href}
  <a
    role="button"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--skeleton', '--btn', small && '--btn--sm', className)}
    {style}
    {href}>
    {''}
  </a>
{:else}
  <div
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--skeleton', '--btn', small && '--btn--sm', className)}
    {style} />
{/if}
