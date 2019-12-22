<script>
  let className = undefined;
  export { className as class };
  export let href = undefined;
  export let disabled = false;
  export let inline = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx(
    '--link',
    disabled && '--link--disabled',
    inline && '--link--inline',
    className
  );
</script>

{#if disabled}
  <p
    aria-current={$$props['aria-current']}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={_class}
    {style}>
    <slot />
  </p>
{:else}
  <a
    aria-current={$$props['aria-current']}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={_class}
    {style}
    {href}>
    <slot />
  </a>
{/if}
