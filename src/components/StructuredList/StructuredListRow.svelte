<script>
  let className = undefined;
  export { className as class };
  export let head = false;
  export let label = false;
  export let style = undefined;
  export let tabindex = '0';

  import { cx } from '../../lib';
</script>

{#if label}
  <label
    role="presentation"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    class={cx('--structured-list-row', head && '--structured-list-row--header-row', className)}
    for={$$props.for}
    {tabindex}
    {style}>
    <slot />
  </label>
{:else}
  <div
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--structured-list-row', head && '--structured-list-row--header-row', className)}
    {style}>
    <slot />
  </div>
{/if}
