<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let href = undefined;
  export let inline = false;
  export let style = undefined;

  import { cx } from '../../lib';
</script>

{#if disabled}
  <p
    aria-current={$$props['aria-current']}
    class={cx('--link', disabled && '--link--disabled', inline && '--link--inline', className)}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    {style}>
    <slot />
  </p>
{:else}
  <a
    aria-current={$$props['aria-current']}
    class={cx('--link', disabled && '--link--disabled', inline && '--link--inline', className)}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    {style}
    {href}>
    <slot />
  </a>
{/if}
